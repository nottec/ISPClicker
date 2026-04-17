"use strict";
document.body.style.userSelect = "none";
let enemies = [];
let maxEnemies = 1;

let gameState = {
  gold: 0,
  durability: 100
};

const enemyTypes = [
  { hp: 10, reward: 5,  color: "crimson",    gif: "Crimson.gif"    },
  { hp: 20, reward: 12, color: "darkorange", gif: "Darkorange.gif" },
  { hp: 40, reward: 25, color: "purple",     gif: "Purple.gif"     }
];

let upgrades = {
  clickDamage: 1,
  throwDamage: 1,
  maxThrowSpeed: 10,
  spawnCount: 1,
  wallDamage: 0,
  wallTickSpeed: 60
};

let spawnInterval = null;

const DAMAGE_SCALE = 0.2;
const MAX_DAMAGE_PER_HIT = 1000;

function n(v) {
  const x = parseFloat(v);
  return isNaN(x) ? 0 : x;
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.gold) gameState.gold = changes.gold.newValue;
  if (changes.durability) gameState.durability = changes.durability.newValue;
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "stateUpdate") {
    gameState.gold = msg.gold;
    gameState.durability = msg.durability;
    // Only restart upgrade systems if upgrades were actually included
    if (msg.upgrades) {
      applyUpgrades(msg.upgrades);
    }
  }
});

function applyUpgrades(u) {
  const prevWallTickSpeed = upgrades.wallTickSpeed;
  const prevSpawnCount = upgrades.spawnCount;

  upgrades.clickDamage    = 1 + (u[0]?.amount || 0);
  upgrades.throwDamage    = 1 + (u[1]?.amount || 0) * 0.5;
  upgrades.maxThrowSpeed  = 10 + (u[2]?.amount || 0) * 5;
  upgrades.spawnCount     = 1 + (u[3]?.amount || 0);
  upgrades.wallDamage     = 0 + (u[4]?.amount || 0);
  upgrades.wallTickSpeed  = Math.max(10, 60 - (u[5]?.amount || 0) * 5);

  maxEnemies = 1 + (u[3]?.amount || 0);

  // Only restart intervals when the relevant values actually changed
  if (upgrades.spawnCount !== prevSpawnCount) restartSpawning();
  if (upgrades.wallTickSpeed !== prevWallTickSpeed) restartWallTick();
}

/* =========================
   SPAWN SYSTEM
========================= */

function restartSpawning() {
  if (spawnInterval) clearInterval(spawnInterval);

  spawnInterval = setInterval(() => {
    for (let i = 0; i < upgrades.spawnCount; i++) {
      spawnEnemy();
    }
  }, 2000);
}

let wallTickInterval = null;

function restartWallTick() {
  if (wallTickInterval) clearInterval(wallTickInterval);

  const tickMs = Math.max(10, upgrades.wallTickSpeed) * (1000 / 60);

  wallTickInterval = setInterval(() => {
    enemies.forEach(enemy => {
      if (!enemy.isConnected) return; // guard against removed enemies

      const x = parseFloat(enemy.style.left);
      const y = parseFloat(enemy.style.top);
      const dragging = enemy.dataset.dragging === "true";

      const floor  = window.innerHeight - 62;
      const rightW = window.innerWidth  - 50;

      const onFloor = y >= floor - 1;
      const onLeft  = x <= 1;
      const onRight = x >= rightW - 1;

      if (!dragging) {
        const vx = Math.abs(Number(enemy.dataset.vx || 0));
        const vy = Math.abs(Number(enemy.dataset.vy || 0));
        if (vx >= REST_THRESH || vy >= REST_THRESH) return; // still moving, skip
      }
      // dragging = always tick if on boundary; not dragging = only if resting

      if (onFloor || onLeft || onRight) {
  applyFlatDamage(enemy, upgrades.wallDamage);
}
    });
  }, tickMs);
}

/* =========================
   DAMAGE POPUPS
========================= */
const _popupHost = document.createElement("div");
_popupHost.style.cssText =
  "position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;";

const _shadow = _popupHost.attachShadow({ mode: "closed" });

const _shadowStyle = document.createElement("style");
_shadowStyle.textContent = `
  .dmg {
    position: fixed;
    font: 700 14px/1 sans-serif;
    color: #ff4444;
    text-shadow: 0 1px 3px rgba(0,0,0,0.7);
    pointer-events: none;
    white-space: nowrap;
    animation: floatUp 0.8s ease-out forwards;
  }
  .gold {
    position: fixed;
    font: 700 13px/1 sans-serif;
    color: #ffd700;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    pointer-events: none;
    white-space: nowrap;
    animation: floatUp 1s ease-out forwards;
  }
  @keyframes floatUp {
    0%   { opacity: 1; transform: translateY(0) scale(1.2); }
    20%  { opacity: 1; transform: translateY(-8px) scale(1); }
    100% { opacity: 0; transform: translateY(-36px) scale(0.85); }
  }
`;

_shadow.appendChild(_shadowStyle);
_shadow.appendChild(document.createElement("div"));
document.documentElement.appendChild(_popupHost);

function showDamagePopup(x, y, amount) {
  const el = document.createElement("div");
  el.className = "dmg";
  el.textContent = "-" + Math.floor(amount);
  el.style.left = x + "px";
  el.style.top = y + "px";
  _shadow.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function showGoldPopup(x, y, amount) {
  const el = document.createElement("div");
  el.className = "gold";
  el.textContent = "+$" + amount;
  el.style.left = (x + 18) + "px"; // offset right so it doesn't overlap damage popup
  el.style.top  = (y - 16)  + "px"; // start slightly above damage number
  _shadow.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

/* =========================
   DAMAGE SYSTEM
========================= */
function applyImpactDamage(enemy, speed) {
  const damage = Math.min(
    MAX_DAMAGE_PER_HIT,
    Math.floor(speed * DAMAGE_SCALE)
  );

  if (damage <= 0) return;

  enemy.dataset.hp = Number(enemy.dataset.hp) - damage;

  const hpBar = enemy.querySelector(".hpbar");
  if (hpBar) {
    hpBar.style.width =
      Math.max((enemy.dataset.hp / enemy.dataset.maxhp) * 100, 0) + "%";
  }

  const ex = n(enemy.style.left) + 25 + (Math.random() * 16 - 8);
  const ey = n(enemy.style.top);
  showDamagePopup(ex, ey, damage);

  if (Number(enemy.dataset.hp) <= 0) {
  const reward = Number(enemy.dataset.reward || 5);
  
  // Show gold popup at enemy position before removing
  const ex = n(enemy.style.left) + 25;
  const ey = n(enemy.style.top);
  showGoldPopup(ex, ey, reward);

  enemy.remove();
  enemies = enemies.filter(e => e !== enemy);
  chrome.runtime.sendMessage({ action: "enemyKilled", reward });
}
}

/* =========================
   PHYSICS LOOP
========================= */
const GRAVITY = 0.8;
const FLOOR_BOUNCE = -0.6;
const WALL_BOUNCE = -0.45;
const FLOOR_DAMPING = 0.80;
const IMPACT_MIN = 7;
const REST_THRESH = 0.4;

function physicsLoop() {
  enemies.forEach(enemy => {
    const dragging = enemy.dataset.dragging === "true";

    let x  = n(enemy.style.left);
    let y  = n(enemy.style.top);
    let vx = Number(enemy.dataset.vx || 0);
    let vy = Number(enemy.dataset.vy || 0);

    const floor  = window.innerHeight - 60;
    const rightW = window.innerWidth - 50;

    if (dragging) return;

    vy += GRAVITY;
    x  += vx;
    y  += vy;

    if (y >= floor) {
      y = floor;

      const impact = Math.abs(vy);
      if (impact > IMPACT_MIN) {
        let dmg = impact * upgrades.throwDamage;

        const extra = Number(enemy.dataset.pendingThrowDamage || 0);
        dmg += extra;
        enemy.dataset.pendingThrowDamage = 0;

        applyImpactDamage(enemy, dmg);
      }

      vy *= FLOOR_BOUNCE;
      vx *= FLOOR_DAMPING;
    }

    if (x <= 0) {
      x = 0;
      const impact = Math.abs(vx);
      if (impact > IMPACT_MIN) {
        const extra = Number(enemy.dataset.pendingThrowDamage || 0);
        enemy.dataset.pendingThrowDamage = 0;
        applyImpactDamage(enemy, impact * upgrades.throwDamage + extra);
      }
      vx *= WALL_BOUNCE;
}

    if (x >= rightW) {
      x = rightW;
      const impact = Math.abs(vx);
      if (impact > IMPACT_MIN) {
        applyImpactDamage(enemy, impact * upgrades.throwDamage);
      }
      vx *= WALL_BOUNCE;
    }

    if (Math.abs(vx) < REST_THRESH) vx = 0;
    if (Math.abs(vy) < REST_THRESH) vy = 0;

    enemy.dataset.vx = vx;
    enemy.dataset.vy = vy;

    enemy.style.left = x + "px";
    enemy.style.top  = y + "px";
  });

  requestAnimationFrame(physicsLoop);
}

physicsLoop();

/* =========================
   SPAWN ENEMY
========================= */
function spawnEnemy() {
  if (enemies.length >= maxEnemies) return;

  const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

  const enemy = document.createElement("div");
  enemy.style.position = "fixed";
  enemy.style.width = "50px";
  enemy.style.height = "50px";
  enemy.style.left = Math.random() * (window.innerWidth - 50) + "px";
  enemy.style.top = (window.innerHeight - 70) + "px";
  enemy.style.zIndex = "2147483647";
  enemy.style.cursor = "pointer";
  const img = document.createElement("img");
img.src = chrome.runtime.getURL(type.gif);
img.style.cssText = "width:100%;height:100%;object-fit:contain;pointer-events:none;";
enemy.appendChild(img);

  enemy.dataset.vx = 0;
  enemy.dataset.vy = 0;
  enemy.dataset.dragging = "false";
  enemy.dataset.hp = type.hp;
  enemy.dataset.maxhp = type.hp;
  enemy.dataset.pendingThrowDamage = 0;
  enemy.dataset.reward = type.reward;

  const hpBar = document.createElement("div");
  hpBar.className = "hpbar";
  hpBar.style.cssText =
    "position:absolute;bottom:0;left:0;height:5px;width:100%;background:lime;";
  enemy.appendChild(hpBar);

  enemy.addEventListener("pointerdown", (e) => {
    enemy.setPointerCapture(e.pointerId);

    let startX = e.clientX;
    let startY = e.clientY;
    let lastX = e.clientX;
    let lastY = e.clientY;

    let vx = 0;
    let vy = 0;
    let moved = false;

    function move(ev) {
      if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) {
        moved = true;
        enemy.dataset.dragging = "true";
      }

      const cx = Math.max(0, Math.min(ev.clientX - 25, window.innerWidth - 50));
      const cy = Math.max(0, Math.min(ev.clientY - 25, window.innerHeight - 60));

      enemy.style.left = cx + "px";
      enemy.style.top = cy + "px";

      vx = ev.clientX - lastX;
      vy = ev.clientY - lastY;

      lastX = ev.clientX;
      lastY = ev.clientY;
    }

    function up(ev) {
      enemy.dataset.dragging = "false";

      const MAX_SPEED = 12;

      if (moved) {
        const rawSpeed  = Math.hypot(vx, vy);
        const throwScale = rawSpeed > 0
          ? Math.min(upgrades.maxThrowSpeed, rawSpeed * 8) / (rawSpeed * 8)
          : 1;

        const scaledVx = vx * 8 * throwScale;
        const scaledVy = vy * 8 * throwScale;

        enemy.dataset.vx = scaledVx;
        enemy.dataset.vy = scaledVy;

        // Pre-load throw damage bonus so physicsLoop can add it on wall/floor impact
        enemy.dataset.pendingThrowDamage = Math.hypot(scaledVx, scaledVy) * (upgrades.throwDamage - 1);
      } else {
        const rect = enemy.getBoundingClientRect();
        const dx = (rect.left + 25) - ev.clientX;
        const dy = (rect.top + 25) - ev.clientY;

        const dist = Math.hypot(dx, dy);
        let clickDamage = Math.max(6, dist * 0.3) + 2* upgrades.clickDamage;

        applyImpactDamage(enemy, clickDamage);
      }

      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      try { enemy.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  });

  document.body.appendChild(enemy);
  enemies.push(enemy);
}

function syncState() {
  chrome.runtime.sendMessage({ action: "getState" }, (response) => {
    if (!response) return;
    gameState.gold = response.gold;
    gameState.durability = response.durability;
    if (response.upgrades) {
      applyUpgrades(response.upgrades);
    }
  });
}

function applyGold(amount) {
  gameState.gold += amount;
}

function applyFlatDamage(enemy, damage) {
  if (!enemy.isConnected) return;
  if (damage <= 0) return;

  enemy.dataset.hp = Number(enemy.dataset.hp) - damage;

  const hpBar = enemy.querySelector(".hpbar");
  if (hpBar) {
    hpBar.style.width =
      Math.max((enemy.dataset.hp / enemy.dataset.maxhp) * 100, 0) + "%";
  }

  const ex = n(enemy.style.left) + 25 + (Math.random() * 16 - 8);
  const ey = n(enemy.style.top);
  showDamagePopup(ex, ey, damage);

  if (Number(enemy.dataset.hp) <= 0) {
    const reward = Number(enemy.dataset.reward || 5);
    showGoldPopup(n(enemy.style.left) + 25, n(enemy.style.top), reward);
    enemy.remove();
    enemies = enemies.filter(e => e !== enemy);
    chrome.runtime.sendMessage({ action: "enemyKilled", reward });
  }
}

restartSpawning();
syncState();
restartWallTick()

"use strict";

const upgradesList = [
  "Click Damage",
  "Throw Damage",
  "Max Throw Speed",
  "Enemy Spawn Count",
  "Wall Damage",
  "Wall Tick Speed"
];

function buildUpgradeUI(){
  const container = document.querySelector(".upgrades");
  container.innerHTML = "";

  upgradesList.forEach((name,i)=>{
    const btn = document.createElement("button");
    btn.id = "buy"+i;
    btn.onclick = () => buyUpgrade(i);

    const lvl = document.createElement("span");
    lvl.id = "lvl"+i;
    lvl.innerText = " Level 0";

    container.appendChild(btn);
    container.appendChild(lvl);
  });
}
buildUpgradeUI();

function loadInitialState(){
  chrome.storage.local.get(null, state=>{
    if (!state.gold) state.gold = 0;
    if (!state.durability) state.durability = 100;

    if (!state.upgrades){
      state.upgrades = [
        {name:"Click Damage", amount:0, baseCost:20},
        {name:"Throw Damage", amount:0, baseCost:40},
        {name:"Max Throw Speed", amount:0, baseCost:60},
        {name:"Enemy Spawn Count", amount:0, baseCost:80},
        {name:"Wall Damage", amount:0, baseCost:100},
        {name:"Wall Tick Speed", amount:0, baseCost:120}
      ];
    }

    window.gameState = state;
    updateUI();
  });
}
loadInitialState();

function updateUI(){
  const state = window.gameState;
  if (!state) return;

  document.getElementById("goldCount").innerText = Math.floor(state.gold);

  state.upgrades.forEach((u,i)=>{
    const cost = Math.floor(u.baseCost * Math.pow(1.15, u.amount));

    document.getElementById("buy"+i).innerText =
      `${upgradesList[i]} (${cost}g)`;

    document.getElementById("lvl"+i).innerText =
      ` Level ${u.amount}`;
  });
}

function applyUpgradesToContent(state){
  chrome.tabs.query({active:true, currentWindow:true}, tabs=>{
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, {
      action: "updateUpgrades",
      upgrades: state.upgrades
    });
  });
}

function buyUpgrade(i){
  chrome.runtime.sendMessage({action:"buyUpgrade", index:i}, state=>{
    window.gameState = state;
    applyUpgradesToContent(state);
    updateUI();
  });
}

document.getElementById("resetButton").onclick = () => {
  if (!confirm("Reset all progress?")) return;

  const defaultState = {
    gold: 0,
    upgrades: [
      { name: "Click Damage", amount: 0, baseCost: 20 },
      { name: "Throw Damage", amount: 0, baseCost: 40 },
      { name: "Max Throw Speed", amount: 0, baseCost: 60 },
      { name: "Enemy Spawn Count", amount: 0, baseCost: 80 },
      { name: "Wall Damage", amount: 0, baseCost: 100 },
      { name: "Wall Tick Speed", amount: 0, baseCost: 120 }
    ]
  };

  chrome.runtime.sendMessage({ action: "resetGame", state: defaultState }, () => {
    location.reload();
  });
};

setInterval(()=>{
  chrome.runtime.sendMessage({action:"getState"}, state=>{
    window.gameState = state;
    updateUI();
  });
}, 500);
"use strict";

let state = {
  gold: 0,
  upgrades: [
    { name: "Click Damage",       amount: 0, baseCost: 20  },
    { name: "Throw Damage",       amount: 0, baseCost: 40  },
    { name: "Max Throw Speed",    amount: 0, baseCost: 60  },
    { name: "Enemy Spawn Count",  amount: 0, baseCost: 80  },
    { name: "Wall Damage",        amount: 0, baseCost: 100 },
    { name: "Wall Tick Speed",    amount: 0, baseCost: 120 }
  ]
};

let stateLoaded = false;

chrome.storage.local.get(null, data => {
  if (data && Object.keys(data).length > 0) {
    state = { ...state, ...data };
    if (!Array.isArray(state.upgrades) || state.upgrades.length !== 6) {
      state.upgrades = [
        { name: "Click Damage",       amount: 0, baseCost: 20  },
        { name: "Throw Damage",       amount: 0, baseCost: 40  },
        { name: "Max Throw Speed",    amount: 0, baseCost: 60  },
        { name: "Enemy Spawn Count",  amount: 0, baseCost: 80  },
        { name: "Wall Damage",        amount: 0, baseCost: 100 },
        { name: "Wall Tick Speed",    amount: 0, baseCost: 120 }
      ];
    }
  } else {
    chrome.storage.local.set(state);
  }
  stateLoaded = true;
  broadcastToContentScripts();
});

function saveState() {
  chrome.storage.local.set(state);
}

// Push full state to all active content scripts so they stay in sync
function broadcastToContentScripts() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: "stateUpdate",
        gold: state.gold,
        upgrades: state.upgrades
      }).catch(() => {}); // ignore tabs with no content script
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // -------------------------
  // GET STATE
  // -------------------------
  if (msg.action === "getState") {
    if (!stateLoaded) {
      // Background still reading storage — wait for it
      const wait = setInterval(() => {
        if (stateLoaded) {
          clearInterval(wait);
          sendResponse({ gold: state.gold, upgrades: state.upgrades });
        }
      }, 20);
    } else {
      sendResponse({ gold: state.gold, upgrades: state.upgrades });
    }
    return true;
  }

  // -------------------------
  // RESET GAME
  // -------------------------
  if (msg.action === "resetGame") {
    state = msg.state;
    saveState();
    broadcastToContentScripts();
    sendResponse(state);
    return true;
  }

  // -------------------------
  // BUY UPGRADE
  // -------------------------
  if (msg.action === "buyUpgrade") {
    const i = msg.index;
    const u = state.upgrades[i];
    const cost = Math.floor(u.baseCost * Math.pow(1.15, u.amount));

    if (state.gold >= cost) {
      state.gold -= cost;
      u.amount++;
      saveState();
      broadcastToContentScripts();
    }

    sendResponse(state);
    return true;
  }

  // -------------------------
  // ENEMY KILLED
  // -------------------------
  if (msg.action === "enemyKilled") {
    state.gold += msg.reward;
    saveState();
    broadcastToContentScripts();
    sendResponse({ gold: state.gold });
    return true;
  }

});
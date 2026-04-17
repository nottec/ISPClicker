
console.log("popup loaded");
let sincelast = document.getElementById('passiveup')
//initialize
let count = 0;

let passivecount = 0;
let passiveCountTwo = 0;
let passiveCountThree = 0;

let increment = 1;
let incrementTwo = 0;
let incrementThree = 0;

let passiveCostOne = 500;
let incrementCostOne = 100;

let passiveCostTwo = 5000;
let incrementCostTwo = 1000;

let passiveCostThree = 50000;
let incrementCostThree = 10000;

let passive = false;
let passivePreviouslyTrue=false;

updateCount()





const port = chrome.runtime.connect({name: "popup"});

port.onMessage.addListener((message) => {
  
  if(message.type === "changeupdate"){
  document.getElementById("timer").innerText = message.data
  }
  else{
  //load it baybeeeeeee
  loadData();
  
  }
})
//normal click
document.getElementById("clickButton").addEventListener("click", function() {
  count=count+increment+incrementTwo+incrementThree;
  saveData();
  updateCount();
});

//reset game button
document.getElementById("resetButton").addEventListener("click", function() {
if(confirm("Are you sure?")){
  reset();
}
});
//======================================================================================================================
//----------------------------------------------------------------------------------------------------------------------
//increase 1 increment buy button
document.getElementById("increaseIncrementOneButton").addEventListener("click", function() {
  if(count>=incrementCostOne){
    buyIncrementOne();
  }
  saveData();
  updateCount();
});

//increase 1 increment buy process
function buyIncrementOne(){
  count=count-incrementCostOne
  increment++;
  incrementCostOne = 100+(100*(increment-1));
  saveData()
  updateCount()
}
//---------------------------------------------------------------------------------------------------------------------
//passive 1 buy button
document.getElementById("increasePassiveOneButton").addEventListener("click", function() {
  if(count>=passiveCostOne){
    buyPassiveOne();
  }
  saveData();
  updateCount();
});

//actual passive 1 buy process (also starts the passive counting)
function buyPassiveOne(){
  count=count-passiveCostOne;
  passivecount++;
  passiveCostOne = 500+(200*passivecount);
  passive=true;
  saveData()
  updateCount()
}
//---------------------------------------------------------------------------------------------------------------------
//increase 2 increment buy button
document.getElementById("increaseIncrementTwoButton").addEventListener("click", function() {
  if(count>=incrementCostTwo){
    buyIncrementTwo();
  }
  saveData();
  updateCount();
});

//increase 2 increment buy process
function buyIncrementTwo(){
  count=count-incrementCostTwo
  incrementTwo=incrementTwo+11;
  incrementCostTwo = 1000+(1000*(incrementTwo)/11);
  saveData()
  updateCount()
}
//---------------------------------------------------------------------------------------------------------------------
//passive 2 buy button
document.getElementById("increasePassiveTwoButton").addEventListener("click", function() {
  if(count>=passiveCostTwo){
    buyPassiveTwo();
  }
  saveData();
  updateCount();
});

//actual passive 2 buy process (also starts the passive counting)
function buyPassiveTwo(){
  count=count-passiveCostTwo;
  passiveCountTwo=passiveCountTwo+11;
  passiveCostTwo = 5000+(2000*(passiveCountTwo)/11);
  passive=true;
  saveData()
  updateCount()
}
//---------------------------------------------------------------------------------------------------------------------
//increase 3 increment buy button
document.getElementById("increaseIncrementThreeButton").addEventListener("click", function() {
  if(count>=incrementCostThree){
    buyIncrementThree();
  }
  saveData();
  updateCount();
});

//increase 3 increment buy process
function buyIncrementThree(){
  count=count-incrementCostThree
  incrementThree=incrementThree+111;
  incrementCostThree = 10000+(10000*(incrementThree)/111);
  saveData()
  updateCount()
}
//---------------------------------------------------------------------------------------------------------------------
//passive 3 buy button
document.getElementById("increasePassiveThreeButton").addEventListener("click", function() {
  if(count>=passiveCostThree){
    buyPassiveThree();
  }
  saveData();
  updateCount();
});

//actual passive 3 buy process (also starts the passive counting)
function buyPassiveThree(){
  count=count-passiveCostThree;
  passiveCountThree=passiveCountThree+111;
  passiveCostThree = 50000+(20000*(passiveCountThree)/111);
  passive=true;
  saveData()
  updateCount()
}
//---------------------------------------------------------------------------------------------------------------------
//=====================================================================================================================
//updates values for all count displays


function updateCount() {
  document.getElementById("clickCount").innerText = count;

  document.getElementById("passivecountone").innerText = passivecount;
  document.getElementById("increasePassiveOneButton").innerText = "Buy passive clicks: (" + passiveCostOne + ")";
  document.getElementById("increaseIncrementOneButton").innerText = "Buy click increase: (" + incrementCostOne + ")";
  document.getElementById("incrementcountone").innerText = increment-1;

  document.getElementById("passivecounttwo").innerText = passiveCountTwo/11;
  document.getElementById("increasePassiveTwoButton").innerText = "Buy passive clicks: (" + passiveCostTwo + ")";
  document.getElementById("increaseIncrementTwoButton").innerText = "Buy click increase: (" + incrementCostTwo + ")";
  document.getElementById("incrementcounttwo").innerText = incrementTwo/11;

  document.getElementById("passivecountthree").innerText = passiveCountThree/111;
  document.getElementById("increasePassiveThreeButton").innerText = "Buy passive clicks: (" + passiveCostThree + ")";
  document.getElementById("increaseIncrementThreeButton").innerText = "Buy click increase: (" + incrementCostThree + ")";
  document.getElementById("incrementcountthree").innerText = incrementThree/111;
  
  }
setInterval(updateCount, 1000);

setInterval(() => {
  if (passive) {
      count=count+passivecount+passiveCountTwo+passiveCountThree;    
      chrome.storage.local.set({
        count
      })
  }
  else{
    console.log("not constantly adding passivecount or storing")
  }
},1000
)


//saves numbers
function saveData() {
  chrome.storage.local.set({
    count,
    passivecount,
    passiveCountTwo,
    passiveCountThree,

    passiveCostOne,
    passiveCostTwo,
    passiveCostThree,

    incrementCostOne,
    incrementCostTwo,
    incrementCostThree,

    increment,
    incrementTwo,
    incrementThree,
    
    passive
  })
}

//function that loads numbers in when reopening extension
function loadData() {
  chrome.storage.local.get([
    'count',
    'passivecount',
    'passiveCountTwo',
    'passiveCountThree',
    'passiveCostOne',
    'passiveCostTwo',
    'passiveCostThree',
    'incrementCostOne',
    'incrementCostTwo',
    'incrementCostThree',
    'increment',
    'incrementTwo',
    'incrementThree',
    'passive',
    'newcount'
  ], (data) => {
    passivecount = data.passivecount ?? 0;
    passiveCountTwo = data.passiveCountTwo ?? 0;
    passiveCountThree = data.passiveCountThree ?? 0;
    passiveCostOne = data.passiveCostOne ?? 500;
    passiveCostTwo = data.passiveCostTwo ?? 5000;
    passiveCostThree = data.passiveCostThree ?? 50000;
    incrementCostOne = data.incrementCostOne ?? 100;
    incrementCostTwo = data.incrementCostTwo ?? 1000;
    incrementCostThree = data.incrementCostThree ?? 10000;
    increment = data.increment ?? 1;
    passive = data.passive ?? false;
    if(passive){
    count = data.newcount??data.count??0
    }
    else{
    count=data.count??0
    }
    updateCount();
    if(passivecount>0){
      passive=true;
    }
  })
  setTimeout(() =>{
  if(sincelast){
    if (passive==true&&sincelast.hasAttribute('hidden')){
      sincelast.removeAttribute('hidden');
      sincelast.classList.remove('fade-out');
      setTimeout(() =>{
        sincelast.classList.add('fade-out');
      },5000);
    }
  }
  },10);
}

//reset function
function reset() {
  count = 0;
  passivecount = 0;
  passiveCountTwo = 0;
  passiveCountThree = 0;
  increment = 1;
  incrementTwo = 0;
  incrementThree = 0;
  incrementCostOne = 100;
  passiveCostOne = 500;
  incrementCostTwo = 1000;
  incrementCostThree = 10000;
  passiveCostTwo = 5000;
  passiveCostThree = 50000;
  passive = false;
  newcount = 0;
  chrome.storage.local.set({
  startTime: Date.now()
  });
  document.getElementById("timer").innerText = 0;
  saveData();
  updateCount();
  sincelast.hidden = true;
}



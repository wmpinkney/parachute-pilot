// ====================================================
// Parachute Pilot DX  –  MENU / TITLE  MODULE
// ====================================================

// states: "menu", "help", "game", "birthday"
let currentScene = "menu";
let menuBalloon = {x:-50,y:200,vy:-0.3,active:false};
let confetti = [];
let helpVisible = false;

// --- basic palette for title ---
const titleColors = {
  skyTop:"#8fd3ff",
  skyBottom:"#ffffff",
  logo:"#7c4cff",
  shadow:"#3a2c60"
};

// simple text helper
function centerText(txt,y,size=20,color="#000"){
  ctx.fillStyle=color;
  ctx.font=`${size}px monospace`;
  let w=ctx.measureText(txt).width;
  ctx.fillText(txt,(480-w)/2,y);
}

// ====================================================
// TITLE DRAW
// ====================================================
function drawTitleBackground(){
  const grd = ctx.createLinearGradient(0,0,0,320);
  grd.addColorStop(0,titleColors.skyTop);
  grd.addColorStop(1,titleColors.skyBottom);
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,480,320);
  // drifting clouds
  for(let i=0;i<5;i++){
    ctx.fillStyle=`rgba(255,255,255,${0.4+Math.random()*0.4})`;
    let x=(frame*0.2+i*90)%600-120;
    let y=40+i*30+Math.sin(frame/50+i)*10;
    ctx.fillRect(x,y,40,10);
    ctx.fillRect(x+10,y-5,20,10);
  }
}

// ====================================================
// MENU UPDATE & DRAW
// ====================================================
function updateMenu(){
  if(currentScene!=="menu") return;
  frame++;
  // floating balloon logic
  if(!menuBalloon.active && Math.random()<0.002){
    menuBalloon={x:-20,y:260,vy:-0.3,active:true};
  }
  if(menuBalloon.active){
    menuBalloon.x+=0.5;
    menuBalloon.y+=menuBalloon.vy;
    if(menuBalloon.x>500||menuBalloon.y<40) menuBalloon.active=false;
  }
  // confetti update (birthday)
  for(let c of confetti){ c.y+=c.vy; c.x+=c.vx; c.vy+=0.02; }
  confetti=confetti.filter(c=>c.y<340);
}

function drawMenu(){
  if(currentScene!=="menu") return;
  drawTitleBackground();

  // title logo
  centerText("PARACHUTE PILOT",130,26,titleColors.shadow);
  centerText("PARACHUTE PILOT",128,26,titleColors.logo);

  // rotating parachute icon
  let swing=Math.sin(frame/30)*3;
  ctx.save();
  ctx.translate(240,90);
  ctx.rotate(swing*Math.PI/180);
  ctx.fillStyle="#ff6868";
  ctx.fillRect(-6,0,12,14);
  ctx.fillStyle="#ffe066";
  ctx.beginPath();
  ctx.moveTo(-12,-6); ctx.quadraticCurveTo(0,-14,12,-6); ctx.closePath(); ctx.fill();
  ctx.restore();

  // buttons
  const blink = Math.floor(frame/30)%2===0;
  if(blink) centerText("PRESS  SPACE  TO  START",210,16,"#000");
  centerText("[H] HELP   [S] SIERRA   [M] MUSIC",240,14,"#000");

  // music indicator
  ctx.fillText("♫ "+(musicEnabled?"ON":"OFF"),420,20);

  // draw balloon
  if(menuBalloon.active){
    ctx.fillStyle="#9b5de5";
    ctx.beginPath();
    ctx.ellipse(menuBalloon.x,menuBalloon.y,6,8,0,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle="#000";
    ctx.beginPath();
    ctx.moveTo(menuBalloon.x,menuBalloon.y+8);
    ctx.lineTo(menuBalloon.x,menuBalloon.y+14);
    ctx.stroke();
  }

  // draw confetti if any
  for(let c of confetti){
    ctx.fillStyle=c.color;
    ctx.fillRect(c.x,c.y,2,2);
  }

  // if help overlay visible
  if(helpVisible) drawHelpOverlay();
}

// ====================================================
// HELP OVERLAY
// ====================================================
function drawHelpOverlay(){
  ctx.fillStyle="rgba(255,255,255,0.9)";
  ctx.fillRect(60,40,360,240);
  ctx.fillStyle="#000";
  centerText("POWER-UP GUIDE",80,18,"#000");
  ctx.font="14px monospace";
  ctx.fillText("🟡 Feather Drift  - Slow fall (6s)",90,120);
  ctx.fillText("🟢 Weather Shield - Storm immunity (8s)",90,140);
  ctx.fillText("🔵 Wind Stabilizer- Calm winds (10s)",90,160);
  ctx.fillText("🎈 Purple Balloon - Surprise!",90,180);
  ctx.fillText("Press [H] again to close",150,240);
}

// ====================================================
// BIRTHDAY EVENT
// ====================================================
function triggerBirthday(){
  currentScene="birthday";
  confetti=[];
  for(let i=0;i<150;i++){
    confetti.push({
      x:Math.random()*480,
      y:Math.random()*320,
      vx:(Math.random()-0.5)*2,
      vy:(Math.random()-1)*3,
      color:`hsl(${Math.random()*360},80%,60%)`
    });
  }
  setTimeout(()=>{ currentScene="menu"; },4000);
  playTone(880,0.3,"triangle");
}

// ====================================================
// MENU INPUT HANDLER
// ====================================================
document.addEventListener("keydown",e=>{
  if(currentScene==="menu"){
    if(e.key===" "){ currentScene="game"; resetGame(); }
    else if(e.key.toLowerCase()==="h"){ helpVisible=!helpVisible; }
    else if(e.key.toLowerCase()==="s"){ currentScene="sierra"; resetGame(); }
    else if(e.key.toLowerCase()==="m"){ musicEnabled=!musicEnabled; }
  }
});

// ====================================================
// MAIN MENU LOOP INTEGRATION
// ====================================================
function masterLoop(){
  if(currentScene==="menu"||currentScene==="birthday"){
    updateMenu();
    drawMenu();
    requestAnimationFrame(masterLoop);
  } else {
    // hand off to game loop
    gameLoop();
  }
}

// start at menu
masterLoop();
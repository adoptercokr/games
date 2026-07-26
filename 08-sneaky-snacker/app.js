// Sound Engine (Real Audio Files)
const sounds = {
    munch: new Audio('assets/munch.mp3'),
    hide: new Audio('assets/hide.mp3'),
    alert: new Audio('assets/alert.mp3'),
    caught: new Audio('assets/caught.mp3'),
    caught2: new Audio('assets/caught2.mp3'),
    bgm: new Audio('assets/bgm.mp3') // You can replace this with your own music file
};

sounds.bgm.loop = true;
sounds.bgm.volume = 0.3;
sounds.munch.playbackRate = 1.8; // TTS 소리를 빠르게 해서 먹는 소리처럼 연출
sounds.hide.playbackRate = 1.5;

let bgmStarted = false;

function playSound(type) {
    if(type === 'bgm') {
        if(!bgmStarted) {
            sounds.bgm.play().catch(() => console.log('BGM is missing or blocked'));
            bgmStarted = true;
        }
        return;
    }
    if(sounds[type]) {
        const s = sounds[type].cloneNode();
        s.playbackRate = sounds[type].playbackRate || 1;
        s.play().catch(() => {});
    }
}

// Variables
const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen'), gameUi = document.getElementById('game-ui'), gameOverScreen = document.getElementById('game-over-screen'), clearScreen = document.getElementById('clear-screen');
const stealthMarker = document.getElementById('stealth-marker'), cookieContainer = document.getElementById('cookie-container'), timeVal = document.getElementById('time-val'), cautionBanner = document.getElementById('caution-banner');
const munchBtn = document.getElementById('munch-btn'), startBtn = document.getElementById('start-btn'), restartBtn = document.getElementById('restart-btn'), nextBtn = document.getElementById('next-level-btn');

let frames = 0, gameLoop, isPlaying = false, level = 1;
let stealth = 0, hunger = 100, time = 60;
let isMunching = false;
let lastMunchSoundFrame = 0;
let tState = 'WRITING', tTimer = 180;

const bg1Img = new Image(), bg2Img = new Image(), tWriteImg = new Image(), tLookImg = new Image(), sImg = new Image();
let imagesLoaded = 0;
bg1Img.onload = bg2Img.onload = tWriteImg.onload = tLookImg.onload = sImg.onload = () => imagesLoaded++;
bg1Img.src = 'assets/bg1.jpg'; bg2Img.src = 'assets/bg2.jpg'; tWriteImg.src = 'assets/teacher-1.png'; tLookImg.src = 'assets/teacher-2.png'; sImg.src = 'assets/character-1.png';

function resize() { if(!canvas.clientWidth) return; canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
window.addEventListener('resize', resize); resize();

function resetGame() {
    stealth = 0; hunger = 100; time = 60; frames = 0;
    tState = 'WRITING'; tTimer = 120;
    isMunching = false;
    updateMeters(); cautionBanner.classList.add('hidden');
}

function updateMeters() {
    stealthMarker.style.left = stealth + '%';
    stealthMarker.style.color = (stealth > 80 && frames % 10 < 5) ? '#e74c3c' : '#fff';
    cookieContainer.innerText = Array.from({length: 6}, (_, i) => i < Math.ceil((hunger/100)*6) ? '🍪' : '⚪').join('');
    timeVal.innerText = Math.ceil(time);
}

function gameOver(reason) {
    playSound(reason === 'CAUGHT' ? 'caught' : 'caught2');
    isPlaying = false; cancelAnimationFrame(gameLoop);
    gameUi.classList.add('hidden'); gameOverScreen.classList.remove('hidden');
    document.getElementById('game-over-title').innerText = reason === 'CAUGHT' ? '들켰다!' : '기절!';
    document.getElementById('game-over-desc').innerText = reason === 'CAUGHT' ? '선생님께 들켰습니다!' : '배가 고파서 쓰러졌습니다...';
}

function levelClear() {
    isPlaying = false; cancelAnimationFrame(gameLoop);
    gameUi.classList.add('hidden'); clearScreen.classList.remove('hidden');
    document.getElementById('unlocked-icon').innerText = ['🍪', '🍫', '🍟', '🍬', '🍩'][level % 5];
}

function aiLogic() {
    tTimer--;
    if(tTimer <= 0) {
        if(tState === 'WRITING') {
            if(Math.random() < 0.3 + (level*0.1)) {
                tState = 'SUSPICIOUS'; tTimer = 40 - Math.min(20, level * 5); 
                playSound('alert'); cautionBanner.classList.remove('hidden');
            } else tTimer = 100 - Math.min(50, level * 10); 
        } else if (tState === 'SUSPICIOUS') {
            tState = 'LOOKING'; tTimer = 80 + (level * 15); cautionBanner.classList.add('hidden');
        } else if (tState === 'LOOKING') {
            tState = 'WRITING'; tTimer = 120 - Math.min(60, level * 10);
        }
    }
}

function update() {
    if(!isPlaying) return;
    frames++;
    if(frames % 60 === 0) {
        time--; playSound('bgm');
        if(time <= 0) return levelClear();
    }
    
    aiLogic();
    // Increase hunger decay so they starve in ~20 seconds if they do nothing. 
    // They must eat to survive the 60s level!
    hunger -= 0.08 + (level * 0.01); 
    
    if(isMunching) {
        hunger += 0.4; if(hunger > 100) hunger = 100;
        
        if(frames - lastMunchSoundFrame >= 15) {
            playSound('munch');
            lastMunchSoundFrame = frames;
        }
        
        // Eating is the only illegal action
        if(tState === 'WRITING') stealth += 0.4;
        else if(tState === 'SUSPICIOUS') stealth += 2.0;
        else if(tState === 'LOOKING') stealth += 20.0; // Instant catch!
    } else {
        stealth -= 0.1; // Slow recovery when idle. Safe from teacher!
    }
    
    if(hunger <= 0) return gameOver('STARVED');
    
    stealth = Math.max(0, Math.min(100, stealth));
    if(stealth >= 100) return gameOver('CAUGHT');
    
    updateMeters(); draw();
    gameLoop = requestAnimationFrame(update);
}

function draw() {
    if (imagesLoaded < 5) return;
    
    // Background (Scale to Cover and Toggle)
    let currentBg = (Math.floor(frames / 30) % 2 === 0) ? bg1Img : bg2Img;
    let scale = Math.max(canvas.width / currentBg.width, canvas.height / currentBg.height);
    let bgW = currentBg.width * scale, bgH = currentBg.height * scale;
    let bgX = (canvas.width - bgW) / 2;
    ctx.drawImage(currentBg, bgX, 0, bgW, bgH);
    
    // Teacher (Positioned further to the right)
    let tW = canvas.width * 0.28, tH = tW * (tWriteImg.height / tWriteImg.width);
    let tX = canvas.width * 0.65, tY = canvas.height * 0.27; 
    
    if(tState === 'WRITING' || tState === 'SUSPICIOUS') {
        ctx.save(); ctx.translate(tX + tW/2, tY + tH/2);
        if(tState === 'WRITING' && Math.floor(frames/15)%2===0) ctx.scale(1, 1.02); // slight bobbing
        ctx.drawImage(tWriteImg, -tW/2, -tH/2, tW, tH);
        ctx.restore();
    } else {
        // Teacher Looking
        ctx.fillStyle = 'rgba(241, 196, 15, 0.4)';
        ctx.beginPath(); ctx.moveTo(tX + tW*0.2, tY + tH*0.2); 
        ctx.lineTo(-50, canvas.height); ctx.lineTo(canvas.width+50, canvas.height); ctx.fill();
        ctx.drawImage(tLookImg, tX, tY, tW, tH);
    }
    
    // Student (Eating character)
    let sW = canvas.width * 0.58, sH = sW * (sImg.height / sImg.width);
    let sX = canvas.width * 0.35; // Moved more to the right
    let baseSy = (canvas.height * 0.51) - 4; // Moved up exactly 4px
    
    ctx.save();
    if(isMunching) {
        ctx.translate(sX + sW/2, baseSy + sH/2);
        ctx.scale(1, Math.sin(frames * 0.5) * 0.02 + 1); // Munching bounce
        ctx.drawImage(sImg, -sW/2, -sH/2, sW, sH);
        
        // Crumbs & MUNCH bubble around the mouth area
        let mouthX = -sW * 0.1;
        let mouthY = -sH * 0.2;
        ctx.fillStyle = '#8B4513'; ctx.fillRect(mouthX + (Math.random()*40-20), mouthY + (Math.random()*40-20), 8, 8); // Dark brown
        ctx.fillStyle = '#CD853F'; ctx.fillRect(mouthX + (Math.random()*40-20), mouthY + (Math.random()*40-20), 6, 6); // Light brown
        ctx.fillStyle = '#5C4033'; ctx.fillRect(mouthX + (Math.random()*40-20), mouthY + (Math.random()*40-20), 5, 5); // Choco chip
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = 'bold 20px "Press Start 2P"';
        ctx.strokeText('와작!', mouthX - 30, mouthY - 40); ctx.fillText('와작!', mouthX - 30, mouthY - 40);
    }
    ctx.restore();
}

const addInputListeners = (btn, onStart, onEnd) => {
    const handleStart = (e) => { e.preventDefault(); btn.classList.add('active'); onStart(); };
    const handleEnd = (e) => { e.preventDefault(); btn.classList.remove('active'); onEnd(); };
    btn.addEventListener('touchstart', handleStart, {passive: false}); btn.addEventListener('touchend', handleEnd);
    btn.addEventListener('mousedown', handleStart); btn.addEventListener('mouseup', handleEnd); btn.addEventListener('mouseleave', handleEnd);
};

addInputListeners(munchBtn, () => { 
    if(isPlaying) { 
        playSound('bgm'); 
        isMunching = true; 
        playSound('munch'); 
        lastMunchSoundFrame = frames;
    } 
}, () => { isMunching = false; });

startBtn.addEventListener('click', () => { playSound('bgm'); startScreen.classList.add('hidden'); gameUi.classList.remove('hidden'); resize(); resetGame(); isPlaying = true; update(); });
restartBtn.addEventListener('click', () => { playSound('bgm'); gameOverScreen.classList.add('hidden'); gameUi.classList.remove('hidden'); resize(); resetGame(); isPlaying = true; update(); });
nextBtn.addEventListener('click', () => { playSound('bgm'); clearScreen.classList.add('hidden'); level++; document.getElementById('current-level-display').innerText = level; startScreen.classList.remove('hidden'); });

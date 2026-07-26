const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const meterFill = document.getElementById('meter-fill');
const meterBox = document.querySelector('.super-meter');
const superOverlay = document.getElementById('super-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Web Audio API for synthesized sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if(type === 'swat') { // Whoosh sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if(type === 'squish') { // Splat sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if(type === 'super') { // Thunder zap
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

// MP3 Buzz Sound
const buzzAudio = new Audio('buzz.mp3');
buzzAudio.loop = true;
buzzAudio.volume = 0.7; // Increased to 70%

// Game State
let isPlaying = false;
let score = 0;
let superMeter = 0;
const MAX_SUPER = 100;
const MAX_FLIES = 100; // Increased to 100 for a disgusting swarm!
let isSuperActive = false;
let frames = 0;

// Entities
let flies = [];
let particles = [];
let popups = [];

// Input
let ptrX = 0, ptrY = 0;
let isSwatting = false;
let swatTimer = 0;

function resize() {
    canvas.width = canvas.parentElement.clientWidth || 450;
    canvas.height = canvas.parentElement.clientHeight || 850;
}
window.addEventListener('resize', resize);
// Delay resize slightly on load to ensure DOM is fully rendered
setTimeout(resize, 100);
resize();

// ---------------- DRAWING FUNCTIONS (Pure Code!) ---------------- //

function drawFly(x, y, angle, isDead = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Legs
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(-15, -10);
    ctx.moveTo(0, 0);  ctx.lineTo(-15, 0);
    ctx.moveTo(5, 0);  ctx.lineTo(-15, 10);
    
    ctx.moveTo(-5, 0); ctx.lineTo(15, -10);
    ctx.moveTo(0, 0);  ctx.lineTo(15, 0);
    ctx.moveTo(5, 0);  ctx.lineTo(15, 10);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 15, 0, 0, Math.PI*2); ctx.fill();
    
    // Head
    ctx.beginPath(); ctx.arc(0, -15, 7, 0, Math.PI*2); ctx.fill();
    
    if(!isDead) {
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-3, -17, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -17, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-3, -18, 1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -18, 1, 0, Math.PI*2); ctx.fill();
        
        // Wings - Realistic Fast Flapping
        let flap = Math.sin((isPlaying ? frames : Date.now()*0.05) * 1.5); // Faster oscillation
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
        
        // Left Wing
        ctx.save();
        ctx.translate(-3, -5); // Pivot point near head/body
        ctx.rotate(-Math.PI/4 + flap * 0.4); 
        ctx.beginPath(); ctx.ellipse(-8, 0, 12, 4 + flap*1.5, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.restore();

        // Right Wing
        ctx.save();
        ctx.translate(3, -5); // Pivot point near head/body
        ctx.rotate(Math.PI/4 - flap * 0.4);
        ctx.beginPath(); ctx.ellipse(8, 0, 12, 4 + flap*1.5, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.restore();
    } else {
        // Dead Eyes
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-5, -19); ctx.lineTo(-1, -15); ctx.moveTo(-1, -19); ctx.lineTo(-5, -15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, -19); ctx.lineTo(1, -15); ctx.moveTo(1, -19); ctx.lineTo(5, -15); ctx.stroke();
    }
    
    ctx.restore();
}

function drawSwatter(x, y, swatting) {
    ctx.save();
    ctx.translate(x, y);
    
    // Rotate and slam if swatting
    if(swatting) {
        ctx.scale(1.2, 1.2);
        ctx.rotate(-0.3);
        // Action lines for impact
        ctx.beginPath(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.moveTo(-50, -100); ctx.lineTo(-70, -120);
        ctx.moveTo(0, -110); ctx.lineTo(0, -140);
        ctx.moveTo(50, -100); ctx.lineTo(70, -120);
        ctx.stroke();
    } else {
        // Idle floating
        ctx.rotate(Math.sin(Date.now() * 0.005) * 0.05);
    }

    // Handle
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, 0, 10, 150);
    
    // Hand grasping (optional comic touch)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 120, 20, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Swat Head
    ctx.fillStyle = '#fff';
    ctx.fillRect(-40, -80, 80, 80);
    ctx.strokeRect(-40, -80, 80, 80);
    
    // Grid Lines
    ctx.beginPath();
    for(let i=-30; i<=30; i+=10) {
        ctx.moveTo(i, -80); ctx.lineTo(i, 0);
        ctx.moveTo(-40, -40+i); ctx.lineTo(40, -40+i);
    }
    ctx.stroke();

    if(isSuperActive) {
        // Draw lightning on swatter
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-20, -60); ctx.lineTo(10, -40); ctx.lineTo(-10, -20); ctx.lineTo(20, 0);
        ctx.stroke();
    }
    
    ctx.restore();
}

// ---------------- GAME LOGIC ---------------- //

class Fly {
    constructor() {
        // Spawn inside the canvas
        this.x = 20 + Math.random() * (canvas.width - 40);
        this.y = 20 + Math.random() * (canvas.height - 40); // Use full height
        this.vx = (Math.random() * 8 - 4);
        this.vy = (Math.random() * 8 - 4);
        // Avoid zero velocity
        if(Math.abs(this.vx) < 1) this.vx = 2;
        if(Math.abs(this.vy) < 1) this.vy = 2;
        this.angle = Math.atan2(this.vy, this.vx) + Math.PI/2;
        this.alive = true;
    }
    
    update() {
        if(!this.alive) return; // Will be removed immediately
        
        // Erratic movement
        if(frames % 20 === 0) {
            this.vx += (Math.random() * 4 - 2);
            this.vy += (Math.random() * 4 - 2);
            
            // Limit speed
            let speed = Math.hypot(this.vx, this.vy);
            if(speed > 8) {
                this.vx = (this.vx / speed) * 8;
                this.vy = (this.vy / speed) * 8;
            }
            this.angle = Math.atan2(this.vy, this.vx) + Math.PI/2;
        }
        
        // Bounce off walls (prevent getting stuck)
        if((this.x < 10 && this.vx < 0) || (this.x > canvas.width - 10 && this.vx > 0)) this.vx *= -1;
        if((this.y < 10 && this.vy < 0) || (this.y > canvas.height - 10 && this.vy > 0)) this.vy *= -1; // Bounce top and bottom
        
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Splat {
    constructor(x, y, angle) {
        this.x = x; this.y = y; this.angle = angle;
        this.life = 2.0; // Stay on wall for 2 seconds
        this.dots = [];
        for(let i=0; i<10; i++) {
            this.dots.push({
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
                s: Math.random() * 6 + 2
            });
        }
    }
    update() {
        this.life -= 0.01;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        let alpha = Math.min(1, this.life * 2); // Fade out at the very end
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        
        // Flattened body
        ctx.fillRect(-15, -10, 30, 20);
        
        // Dead 'X' Eyes
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -5); ctx.lineTo(-4, 1);
        ctx.moveTo(-4, -5); ctx.lineTo(-10, 1);
        ctx.moveTo(10, -5); ctx.lineTo(4, 1);
        ctx.moveTo(4, -5); ctx.lineTo(10, 1);
        ctx.stroke();

        // Splat dots
        for(let d of this.dots) {
            ctx.fillRect(d.x, d.y, d.s, d.s);
        }
        
        ctx.restore();
    }
}

class Popup {
    constructor(x, y, text) {
        this.x = x; this.y = y; this.text = text;
        this.life = 1.0;
        this.angle = (Math.random() - 0.5) * 0.5;
    }
    update() { this.y -= 2; this.life -= 0.02; }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.font = '24px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.strokeText(this.text, 0, 0); ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

function spawnSplat(x, y, angle) {
    particles.push(new Splat(x, y, angle));
    popups.push(new Popup(x, y - 20, "SQUISH!"));
}

function updateGame() {
    if(!isPlaying) return;
    frames++;

    // Spawn flies - gets faster over time to create a swarm!
    let spawnRate = Math.max(10, 50 - Math.floor(frames / 60)); // Decreases by 1 every second down to 10
    if(frames % spawnRate === 0) flies.push(new Fly());

    // Update flies
    for(let i = flies.length - 1; i >= 0; i--) {
        flies[i].update();
        // Escape check removed, they just accumulate
        if(flies[i].y < -50 || flies[i].y > canvas.height + 50) {
            flies[i].alive = false; // Just flag them if they glitch out
        }
        
        if (!flies[i].alive) {
            flies.splice(i, 1); // Remove immediately to 'explode'
        }
    }

    // Check Game Over condition
    if (flies.length >= MAX_FLIES) {
        gameOver();
        return;
    }

    // Update buzz sound
    if (flies.length > 0 && isPlaying) {
        if(buzzAudio.paused) buzzAudio.play().catch(e => console.log('Audio wait'));
    } else {
        buzzAudio.pause();
    }

    // Update particles & popups
    particles = particles.filter(p => { p.update(); return p.life > 0; });
    popups = popups.filter(p => { p.update(); return p.life > 0; });

    // Swatter Animation
    if(swatTimer > 0) swatTimer--;

    // Super Activation
    if(isSuperActive && swatTimer === 0) {
        superOverlay.classList.add('hidden');
        isSuperActive = false;
        superMeter = 0;
        meterBox.classList.remove('meter-ready');
    }

    drawGame();
    requestAnimationFrame(updateGame);
}

function drawGame() {
    // Clear Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw brick pattern background (subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 2;
    for(let i=0; i<canvas.height; i+=40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
        for(let j=0; j<canvas.width; j+=80) {
            let offset = (i/40)%2===0 ? 0 : 40;
            ctx.beginPath(); ctx.moveTo(j+offset, i); ctx.lineTo(j+offset, i+40); ctx.stroke();
        }
    }

    // Dead flies on wall (splats)
    // For performance, we don't keep them forever, just draw active particles
    particles.forEach(p => p.draw(ctx));

    // Flies
    flies.forEach(f => drawFly(f.x, f.y, f.angle, !f.alive));

    // Popups
    popups.forEach(p => p.draw(ctx));

    // Swatter (Controlled by Mouse/Touch)
    drawSwatter(ptrX, ptrY, swatTimer > 0);
}

// ---------------- INTERACTION ---------------- //

function handleInput(x, y, isClick) {
    ptrX = x; ptrY = y;
    if(isClick && isPlaying && swatTimer === 0) {
        swatTimer = 10; // Swat animation duration
        
        if(superMeter >= MAX_SUPER) {
            // FIRE SUPER SWAT!
            playSound('super');
            isSuperActive = true;
            superOverlay.classList.remove('hidden');
            
            // Screen shake super massive
            canvas.style.transform = "scale(1.05) translate(20px, 20px)";
            setTimeout(() => canvas.style.transform = "scale(1) translate(-20px, -20px)", 50);
            setTimeout(() => canvas.style.transform = "translate(0, 0)", 100);

            // Kill all flies
            flies.forEach(f => {
                if(f.alive) {
                    f.alive = false;
                    score += 10;
                    spawnSplat(f.x, f.y, f.angle);
                }
            });
            updateHUD();
        } else {
            // Normal Swat Collision
            let hit = false;
            flies.forEach(f => {
                if(f.alive) {
                    // Swatter head is roughly -40 to +40 in X, -80 to 0 in Y
                    // Center of hit zone is around y - 40
                    let dist = Math.hypot(f.x - ptrX, f.y - (ptrY - 40));
                    if(dist < 50) {
                        f.alive = false;
                        hit = true;
                        score += 10;
                        superMeter = Math.min(MAX_SUPER, superMeter + 3); // Fills up much slower
                        spawnSplat(f.x, f.y, f.angle);
                    }
                }
            });
            if(hit) {
                playSound('squish');
                canvas.style.transform = "translate(5px, 5px)";
                setTimeout(() => canvas.style.transform = "translate(0, 0)", 50);
            } else {
                playSound('swat');
                popups.push(new Popup(ptrX, ptrY - 60, "MISS!"));
            }
            updateHUD();
        }
    }
}

function getPos(e, isTouch) {
    const rect = canvas.getBoundingClientRect();
    let cx = isTouch ? e.touches[0].clientX : e.clientX;
    let cy = isTouch ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
}

// Use document to catch events even if they drag outside slightly, or canvas
document.addEventListener('mousemove', e => { let p = getPos(e, false); handleInput(p.x, p.y, false); });
document.addEventListener('touchmove', e => { let p = getPos(e, true); handleInput(p.x, p.y, false); }, {passive: true});
document.addEventListener('mousedown', e => { let p = getPos(e, false); handleInput(p.x, p.y, true); });
document.addEventListener('touchstart', e => { let p = getPos(e, true); handleInput(p.x, p.y, true); }, {passive: true});

function updateHUD() {
    scoreEl.innerText = score.toString().padStart(3, '0');
    
    // Warning color if getting full
    if(flies.length >= MAX_FLIES - 10) livesEl.style.color = '#f00';
    else livesEl.style.color = '#000';
    
    livesEl.innerText = `FLIES: ${flies.length} / ${MAX_FLIES}`;
    meterFill.style.width = superMeter + '%';
    if(superMeter >= MAX_SUPER) meterBox.classList.add('meter-ready');
}

function startGame() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    buzzAudio.play().catch(e => {}); // Start MP3
    
    isPlaying = true;
    score = 0; superMeter = 0; frames = 0;
    flies = []; particles = []; popups = [];
    meterBox.classList.remove('meter-ready');
    updateHUD();
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    // Initial ptr position center
    ptrX = canvas.width / 2; ptrY = canvas.height * 0.8;
    
    // Spawn initial flies
    for(let i=0; i<3; i++) flies.push(new Fly());
    
    requestAnimationFrame(updateGame);
}

function gameOver() {
    isPlaying = false;
    buzzAudio.pause();
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score.toString().padStart(3, '0');
    
    let high = localStorage.getItem('flyswat_high') || 0;
    if(score > high) {
        high = score;
        localStorage.setItem('flyswat_high', high);
    }
    document.getElementById('high-score-val').innerText = high;
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Draw start screen idle background loop
function drawIdle() {
    if(isPlaying) return;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Floating fly
    drawFly(canvas.width/2 - 60, canvas.height/2, Math.sin(Date.now()*0.002)*0.2, false);
    // Swatter ready to strike
    drawSwatter(canvas.width/2 + 60, canvas.height/2 + 60, Math.sin(Date.now()*0.005) > 0.8);
    
    requestAnimationFrame(drawIdle);
}
drawIdle();

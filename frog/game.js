// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let score = 0;
let gameOver = false;
let flies = [];
let tongue = null;

// Perlin noise implementation
class PerlinNoise {
    constructor() {
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        this.permutation = this.permutation.concat(this.permutation);
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.permutation[X] + Y;
        const aa = this.permutation[a];
        const ab = this.permutation[a + 1];
        const b = this.permutation[X + 1] + Y;
        const ba = this.permutation[b];
        const bb = this.permutation[b + 1];

        return this.lerp(
            this.lerp(this.grad(this.permutation[aa], x, y),
                     this.grad(this.permutation[ba], x - 1, y), u),
            this.lerp(this.grad(this.permutation[ab], x, y - 1),
                     this.grad(this.permutation[bb], x - 1, y - 1), u),
            v
        );
    }
}

const perlin = new PerlinNoise();

// Frog object
const frog = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: '#2ecc71'
};

// Fly class
class Fly {
    constructor() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 200;
        this.x = frog.x + Math.cos(angle) * distance;
        this.y = frog.y + Math.sin(angle) * distance;

        // Ensure spawn position is within canvas bounds with margin
        const margin = 20;
        this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
        this.y = Math.max(margin, Math.min(canvas.height - margin, this.y));

        this.radius = 3;
        this.timeOffset = Math.random() * 1000;
    }

    update(time) {
        const noiseScale = 0.002;
        const speed = 0.5;

        const noiseX = perlin.noise((this.x + this.timeOffset) * noiseScale, time * noiseScale);
        const noiseY = perlin.noise((this.y + this.timeOffset + 1000) * noiseScale, time * noiseScale);

        this.x += noiseX * speed;
        this.y += noiseY * speed;

        // Keep flies on screen with margin and bounce effect
        const margin = 10;
        if (this.x < margin) this.x = margin;
        if (this.x > canvas.width - margin) this.x = canvas.width - margin;
        if (this.y < margin) this.y = margin;
        if (this.y > canvas.height - margin) this.y = canvas.height - margin;
    }

    draw() {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Tongue class
class Tongue {
    constructor(targetX, targetY) {
        this.startX = frog.x;
        this.startY = frog.y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.currentLength = 0;
        this.maxLength = Math.hypot(targetX - frog.x, targetY - frog.y);
        this.extending = true;
        this.speed = 15;
        this.width = 4;

        const angle = Math.atan2(targetY - frog.y, targetX - frog.x);
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
    }

    update() {
        if (this.extending) {
            this.currentLength += this.speed;
            if (this.currentLength >= this.maxLength) {
                this.extending = false;
            }
            // Check for fly collisions while extending
            this.checkFlyCollisions();
        } else {
            this.currentLength -= this.speed;
            if (this.currentLength <= 0) {
                return false; // Tongue is done
            }
        }
        return true; // Tongue is still active
    }

    checkFlyCollisions() {
        const tipX = this.startX + this.dx * this.currentLength;
        const tipY = this.startY + this.dy * this.currentLength;

        for (let i = flies.length - 1; i >= 0; i--) {
            const fly = flies[i];
            const dist = Math.hypot(tipX - fly.x, tipY - fly.y);
            if (dist < fly.radius + this.width) {
                flies.splice(i, 1);
                score++;
                updateScore();
            }
        }
    }

    draw() {
        const tipX = this.startX + this.dx * this.currentLength;
        const tipY = this.startY + this.dy * this.currentLength;

        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Tongue tip
        ctx.fillStyle = '#ff1493';
        ctx.beginPath();
        ctx.arc(tipX, tipY, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Spawn flies
function spawnFly() {
    if (flies.length < 50 && !gameOver) {
        flies.push(new Fly());
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('flyCount').textContent = flies.length;
}

// Check game over
function checkGameOver() {
    if (flies.length >= 50) {
        gameOver = true;
    }
}

// Mouse click handler
canvas.addEventListener('click', (e) => {
    if (gameOver) {
        // Restart game
        score = 0;
        flies = [];
        gameOver = false;
        tongue = null;
        updateScore();
        return;
    }

    if (!tongue) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        tongue = new Tongue(mouseX, mouseY);
    }
});

// Draw frog
function drawFrog() {
    // Body
    ctx.fillStyle = frog.color;
    ctx.beginPath();
    ctx.arc(frog.x, frog.y, frog.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(frog.x - 6, frog.y - 5, 5, 0, Math.PI * 2);
    ctx.arc(frog.x + 6, frog.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(frog.x - 6, frog.y - 5, 2, 0, Math.PI * 2);
    ctx.arc(frog.x + 6, frog.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = '24px Arial';
    ctx.fillText(`Score final: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Cliquez pour rejouer', canvas.width / 2, canvas.height / 2 + 50);
}

// Main game loop
let lastTime = 0;
function gameLoop(currentTime) {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        // Update flies
        flies.forEach(fly => fly.update(currentTime));

        // Update tongue
        if (tongue) {
            if (!tongue.update()) {
                tongue = null;
            }
        }

        // Draw flies
        flies.forEach(fly => fly.draw());

        // Draw frog
        drawFrog();

        // Draw tongue (on top)
        if (tongue) {
            tongue.draw();
        }

        // Check game over
        checkGameOver();
    } else {
        // Draw final state
        flies.forEach(fly => fly.draw());
        drawFrog();
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Spawn flies periodically
setInterval(spawnFly, 1500);

// Start game
updateScore();
requestAnimationFrame(gameLoop);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = (Math.random() - 0.5) * 8;
        this.gravity = 0.3;
        this.friction = 0.98;
        this.bounce = 0.8;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        const gradient = ctx.createRadialGradient(
            this.x - this.radius / 3,
            this.y - this.radius / 3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, this.color);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.dy += this.gravity;

        this.dx *= this.friction;
        this.dy *= this.friction;

        this.x += this.dx;
        this.y += this.dy;

        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx = -this.dx * this.bounce;
        }

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = -this.dx * this.bounce;
        }

        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.dy = -this.dy * this.bounce;

            if (Math.abs(this.dy) < 0.5) {
                this.dy = 0;
            }
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = -this.dy * this.bounce;
        }

        this.draw();
    }
}

const balls = [];

function getRandomColor() {
    const colors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#FFA07A',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

balls.push(new Ball(canvas.width / 2, 100, 30, getRandomColor()));

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const radius = 15 + Math.random() * 25;
    balls.push(new Ball(x, y, radius, getRandomColor()));
});

function animate() {
    ctx.fillStyle = 'rgba(26, 26, 46, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    balls.forEach(ball => {
        ball.update();
    });

    requestAnimationFrame(animate);
}

animate();

// Monster Hunter 2D - Jeu de tir
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// État du jeu
let gameState = 'playing'; // 'playing', 'gameover', 'shop'
let score = 0;
let money = 0;
let wave = 1;
let kills = 0;
let killsForNextWave = 5;

// Armes disponibles (pistolets + sabre)
const weapons = [
    { id: 0, name: 'Pistolet', damage: 25, maxAmmo: 12, reloadTime: 1500, price: 0, color: '#333', owned: true, type: 'gun' },
    { id: 1, name: 'Revolver', damage: 40, maxAmmo: 6, reloadTime: 2000, price: 150, color: '#8b4513', owned: false, type: 'gun' },
    { id: 2, name: 'SMG', damage: 15, maxAmmo: 30, reloadTime: 1200, price: 300, color: '#2f4f4f', owned: false, type: 'gun' },
    { id: 3, name: 'Shotgun', damage: 60, maxAmmo: 8, reloadTime: 2500, price: 500, color: '#654321', owned: false, type: 'gun' },
    { id: 4, name: 'Sabre', damage: 50, maxAmmo: 999, reloadTime: 0, price: 400, color: '#c0c0c0', owned: false, type: 'melee', range: 80 },
    { id: 5, name: 'Katana', damage: 75, maxAmmo: 999, reloadTime: 0, price: 800, color: '#e8e8e8', owned: false, type: 'melee', range: 100 },
    { id: 6, name: 'Laser', damage: 100, maxAmmo: 20, reloadTime: 1000, price: 1500, color: '#00ff00', owned: false, type: 'gun' }
];

let currentWeapon = 0;

// Animation d'attaque au sabre
let swordAttack = {
    active: false,
    angle: 0,
    startAngle: 0,
    progress: 0
};

// Joueur (fille)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 60,
    speed: 5,
    health: 100,
    maxHealth: 100,
    ammo: 12,
    maxAmmo: 12,
    reloading: false,
    reloadTime: 1500,
    damage: 25,
    direction: 1,
    isMoving: false,
    animFrame: 0
};

// Entrées
const keys = {};
let mouseX = 0;
let mouseY = 0;

// Projectiles et monstres
let bullets = [];
let monsters = [];
let particles = [];
let damageNumbers = [];
let moneyPopups = [];
let slashEffects = [];

// Types de monstres avec argent
const monsterTypes = {
    zombie: {
        width: 35,
        height: 50,
        speed: 1.5,
        health: 30,
        damage: 10,
        color: '#4a7c4e',
        points: 10,
        money: 5
    },
    demon: {
        width: 45,
        height: 55,
        speed: 2.5,
        health: 50,
        damage: 20,
        color: '#8b0000',
        points: 25,
        money: 15
    },
    ghost: {
        width: 40,
        height: 45,
        speed: 3,
        health: 20,
        damage: 15,
        color: '#b8b8dc',
        points: 15,
        money: 8
    },
    boss: {
        width: 80,
        height: 100,
        speed: 1,
        health: 200,
        damage: 35,
        color: '#4a0080',
        points: 100,
        money: 100
    }
};

// Événements clavier
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r' && !player.reloading && player.ammo < player.maxAmmo && gameState === 'playing') {
        if (weapons[currentWeapon].type === 'gun') {
            reload();
        }
    }
    if (e.key === ' ' && gameState === 'gameover') {
        restartGame();
    }
    if (e.key.toLowerCase() === 'b') {
        if (gameState === 'playing') {
            gameState = 'shop';
        } else if (gameState === 'shop') {
            gameState = 'playing';
        }
    }
    const num = parseInt(e.key);
    if (num >= 1 && num <= 7 && gameState === 'playing') {
        const weaponIndex = num - 1;
        if (weapons[weaponIndex] && weapons[weaponIndex].owned) {
            equipWeapon(weaponIndex);
        }
    }
    // Triche: touche U pour débloquer toutes les armes
    if (e.key.toLowerCase() === 'u') {
        unlockAllWeapons();
    }
});

// Fonction triche pour débloquer toutes les armes
function unlockAllWeapons() {
    weapons.forEach(weapon => {
        weapon.owned = true;
    });
    // Afficher un message
    createCheatMessage('TOUTES LES ARMES DÉBLOQUÉES!');
}

// Créer un message de triche
function createCheatMessage(text) {
    const cheatMsg = {
        text: text,
        life: 120,
        y: canvas.height / 2
    };
    if (!window.cheatMessages) window.cheatMessages = [];
    window.cheatMessages.push(cheatMsg);
}

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (gameState === 'playing') {
        attack();
    } else if (gameState === 'shop') {
        handleShopClick();
    }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Équiper une arme
function equipWeapon(index) {
    if (weapons[index].owned) {
        currentWeapon = index;
        const weapon = weapons[index];
        player.damage = weapon.damage;
        player.maxAmmo = weapon.maxAmmo;
        player.reloadTime = weapon.reloadTime;
        player.ammo = weapon.maxAmmo;
        player.reloading = false;
    }
}

// Gérer le clic dans la boutique
function handleShopClick() {
    const shopX = canvas.width / 2 - 250;
    const shopY = 80;

    weapons.forEach((weapon, index) => {
        const itemY = shopY + 50 + index * 60;
        const buttonX = shopX + 400;
        const buttonY = itemY;

        if (mouseX >= buttonX && mouseX <= buttonX + 80 &&
            mouseY >= buttonY && mouseY <= buttonY + 40) {

            if (!weapon.owned && money >= weapon.price) {
                money -= weapon.price;
                weapon.owned = true;
                equipWeapon(index);
            } else if (weapon.owned && currentWeapon !== index) {
                equipWeapon(index);
            }
        }
    });
}

// Attaquer (tir ou coup de sabre)
function attack() {
    const weapon = weapons[currentWeapon];

    if (weapon.type === 'melee') {
        // Attaque au sabre
        if (!swordAttack.active) {
            swordAttack.active = true;
            swordAttack.progress = 0;
            swordAttack.startAngle = Math.atan2(mouseY - player.y, mouseX - player.x);

            // Créer effet de slash
            slashEffects.push({
                x: player.x,
                y: player.y,
                angle: swordAttack.startAngle,
                life: 15,
                range: weapon.range,
                color: weapon.color
            });

            // Vérifier les monstres dans la zone d'attaque
            const attackAngle = swordAttack.startAngle;
            monsters.forEach((monster, i) => {
                const dx = monster.x - player.x;
                const dy = monster.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const monsterAngle = Math.atan2(dy, dx);

                // Vérifier si le monstre est dans la portée et l'angle d'attaque
                let angleDiff = monsterAngle - attackAngle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                if (dist < weapon.range + monster.width / 2 && Math.abs(angleDiff) < Math.PI / 3) {
                    monster.health -= player.damage;
                    createParticles(monster.x, monster.y, monster.color, 8);
                    createDamageNumber(monster.x, monster.y - monster.height / 2, player.damage);

                    if (monster.health <= 0) {
                        createParticles(monster.x, monster.y, monster.color, 15);
                        score += monster.points;
                        money += monster.money;
                        createMoneyPopup(monster.x, monster.y, monster.money);
                        kills++;
                        monsters.splice(i, 1);

                        if (kills >= killsForNextWave) {
                            wave++;
                            kills = 0;
                            killsForNextWave = Math.floor(5 + wave * 2);
                        }
                    }
                }
            });
        }
    } else {
        // Tir normal
        shoot();
    }
}

// Tirer
function shoot() {
    if (player.ammo <= 0 || player.reloading) {
        if (player.ammo <= 0 && !player.reloading) {
            reload();
        }
        return;
    }

    player.ammo--;

    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    const weapon = weapons[currentWeapon];

    if (weapon.name === 'Shotgun') {
        for (let i = -2; i <= 2; i++) {
            const spread = i * 0.15;
            bullets.push({
                x: player.x,
                y: player.y - 10,
                vx: Math.cos(angle + spread) * 12,
                vy: Math.sin(angle + spread) * 12,
                damage: player.damage / 3,
                color: '#ffcc00'
            });
        }
    } else if (weapon.name === 'Laser') {
        bullets.push({
            x: player.x,
            y: player.y - 10,
            vx: Math.cos(angle) * 25,
            vy: Math.sin(angle) * 25,
            damage: player.damage,
            color: '#00ff00'
        });
    } else {
        bullets.push({
            x: player.x,
            y: player.y - 10,
            vx: Math.cos(angle) * 15,
            vy: Math.sin(angle) * 15,
            damage: player.damage,
            color: '#ffcc00'
        });
    }

    createParticles(player.x + Math.cos(angle) * 20, player.y - 10, '#ffff00', 3);
}

// Recharger
function reload() {
    player.reloading = true;
    setTimeout(() => {
        player.ammo = player.maxAmmo;
        player.reloading = false;
    }, player.reloadTime);
}

// Créer des particules
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function createDamageNumber(x, y, damage) {
    damageNumbers.push({
        x: x,
        y: y,
        value: damage,
        life: 60,
        vy: -2
    });
}

function createMoneyPopup(x, y, amount) {
    moneyPopups.push({
        x: x,
        y: y,
        value: amount,
        life: 90,
        vy: -1.5
    });
}

function spawnMonster() {
    const types = ['zombie', 'ghost', 'demon'];
    if (wave >= 3 && Math.random() < 0.08) {
        types.push('boss');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const monsterDef = monsterTypes[type];

    let x, y;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: x = -50; y = Math.random() * canvas.height; break;
        case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = -50; break;
        case 3: x = Math.random() * canvas.width; y = canvas.height + 50; break;
    }

    const speedMultiplier = 1 + (wave - 1) * 0.08;
    const healthMultiplier = 1 + (wave - 1) * 0.15;

    monsters.push({
        x: x,
        y: y,
        width: monsterDef.width,
        height: monsterDef.height,
        speed: monsterDef.speed * speedMultiplier,
        health: monsterDef.health * healthMultiplier,
        maxHealth: monsterDef.health * healthMultiplier,
        damage: monsterDef.damage,
        color: monsterDef.color,
        points: monsterDef.points,
        money: monsterDef.money,
        type: type,
        animFrame: 0
    });
}

function updatePlayer() {
    player.isMoving = false;

    if (keys['arrowleft'] || keys['q'] || keys['a']) {
        player.x -= player.speed;
        player.direction = -1;
        player.isMoving = true;
    }
    if (keys['arrowright'] || keys['d']) {
        player.x += player.speed;
        player.direction = 1;
        player.isMoving = true;
    }
    if (keys['arrowup'] || keys['z'] || keys['w']) {
        player.y -= player.speed;
        player.isMoving = true;
    }
    if (keys['arrowdown'] || keys['s']) {
        player.y += player.speed;
        player.isMoving = true;
    }

    if (mouseX < player.x) {
        player.direction = -1;
    } else {
        player.direction = 1;
    }

    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

    if (player.isMoving) {
        player.animFrame += 0.2;
    }

    // Mettre à jour l'animation du sabre
    if (swordAttack.active) {
        swordAttack.progress += 0.15;
        if (swordAttack.progress >= 1) {
            swordAttack.active = false;
        }
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            return false;
        }

        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (bullet.x > monster.x - monster.width / 2 &&
                bullet.x < monster.x + monster.width / 2 &&
                bullet.y > monster.y - monster.height / 2 &&
                bullet.y < monster.y + monster.height / 2) {

                monster.health -= bullet.damage;
                createParticles(bullet.x, bullet.y, monster.color, 5);
                createDamageNumber(monster.x, monster.y - monster.height / 2, Math.round(bullet.damage));

                if (monster.health <= 0) {
                    createParticles(monster.x, monster.y, monster.color, 15);
                    score += monster.points;
                    money += monster.money;
                    createMoneyPopup(monster.x, monster.y, monster.money);
                    kills++;
                    monsters.splice(i, 1);

                    if (kills >= killsForNextWave) {
                        wave++;
                        kills = 0;
                        killsForNextWave = Math.floor(5 + wave * 2);
                    }
                }
                return false;
            }
        }
        return true;
    });
}

function updateMonsters() {
    monsters.forEach(monster => {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            monster.x += (dx / dist) * monster.speed;
            monster.y += (dy / dist) * monster.speed;
        }

        monster.animFrame += 0.15;

        if (Math.abs(monster.x - player.x) < (monster.width + player.width) / 2 &&
            Math.abs(monster.y - player.y) < (monster.height + player.height) / 2) {
            player.health -= monster.damage * 0.02;
            createParticles(player.x, player.y, '#ff0000', 2);
        }
    });

    if (player.health <= 0) {
        gameState = 'gameover';
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
        return p.life > 0;
    });

    damageNumbers = damageNumbers.filter(d => {
        d.y += d.vy;
        d.life--;
        return d.life > 0;
    });

    moneyPopups = moneyPopups.filter(m => {
        m.y += m.vy;
        m.life--;
        return m.life > 0;
    });

    slashEffects = slashEffects.filter(s => {
        s.life--;
        return s.life > 0;
    });
}

// Dessiner le joueur (fille)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    const bounce = player.isMoving ? Math.sin(player.animFrame) * 3 : 0;

    // Jambes (jupe)
    ctx.fillStyle = '#e91e63';
    const legOffset = player.isMoving ? Math.sin(player.animFrame) * 5 : 0;
    // Jupe
    ctx.beginPath();
    ctx.moveTo(-18, 5 + bounce);
    ctx.lineTo(18, 5 + bounce);
    ctx.lineTo(15, 25 + bounce);
    ctx.lineTo(-15, 25 + bounce);
    ctx.closePath();
    ctx.fill();

    // Jambes sous la jupe
    ctx.fillStyle = '#fcd9b6';
    ctx.fillRect(-10 + legOffset, 20, 8, 18);
    ctx.fillRect(2 - legOffset, 20, 8, 18);

    // Bottes
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(-12 + legOffset, 35, 10, 8);
    ctx.fillRect(2 - legOffset, 35, 10, 8);

    // Corps (haut)
    ctx.fillStyle = '#9c27b0';
    ctx.fillRect(-15, -20 + bounce, 30, 30);

    // Tête
    ctx.fillStyle = '#fcd9b6';
    ctx.beginPath();
    ctx.arc(0, -32 + bounce, 16, 0, Math.PI * 2);
    ctx.fill();

    // Cheveux longs
    ctx.fillStyle = '#5d4037';
    // Cheveux au-dessus
    ctx.beginPath();
    ctx.arc(0, -35 + bounce, 18, Math.PI, 0);
    ctx.fill();
    // Cheveux sur les côtés
    ctx.fillRect(-18, -35 + bounce, 8, 40);
    ctx.fillRect(10, -35 + bounce, 8, 40);
    // Frange
    ctx.beginPath();
    ctx.arc(0, -42 + bounce, 14, 0, Math.PI);
    ctx.fill();

    // Yeux
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.direction * 5 - 3, -34 + bounce, 2.5, 0, Math.PI * 2);
    ctx.arc(player.direction * 5 + 5, -34 + bounce, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Joues roses
    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.arc(-10, -28 + bounce, 4, 0, Math.PI * 2);
    ctx.arc(10, -28 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bras avec arme
    ctx.save();
    const armAngle = Math.atan2(mouseY - player.y, mouseX - player.x);

    // Animation du sabre
    let finalArmAngle = armAngle;
    if (swordAttack.active && weapons[currentWeapon].type === 'melee') {
        const swingOffset = Math.sin(swordAttack.progress * Math.PI) * 1.5;
        finalArmAngle = swordAttack.startAngle - 0.8 + swingOffset;
    }

    ctx.translate(player.direction * 10, -8 + bounce);
    ctx.rotate(finalArmAngle);

    // Bras
    ctx.fillStyle = '#fcd9b6';
    ctx.fillRect(0, -4, 22, 8);

    const weapon = weapons[currentWeapon];

    if (weapon.type === 'melee') {
        // Dessiner le sabre/katana
        // Poignée
        ctx.fillStyle = '#4a148c';
        ctx.fillRect(18, -4, 12, 8);

        // Garde
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(28, -8, 4, 16);

        // Lame
        ctx.fillStyle = weapon.color;
        ctx.beginPath();
        ctx.moveTo(32, -3);
        ctx.lineTo(32 + weapon.range * 0.6, -2);
        ctx.lineTo(32 + weapon.range * 0.7, 0);
        ctx.lineTo(32 + weapon.range * 0.6, 2);
        ctx.lineTo(32, 3);
        ctx.closePath();
        ctx.fill();

        // Reflet sur la lame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(35, -1);
        ctx.lineTo(32 + weapon.range * 0.5, -1);
        ctx.stroke();
    } else {
        // Pistolet
        ctx.fillStyle = weapon.color;
        ctx.fillRect(18, -6, 20, 12);
        ctx.fillRect(23, -10, 8, 6);
    }

    ctx.restore();
    ctx.restore();
}

// Dessiner les effets de slash
function drawSlashEffects() {
    slashEffects.forEach(slash => {
        ctx.save();
        ctx.translate(slash.x, slash.y);
        ctx.rotate(slash.angle);

        ctx.globalAlpha = slash.life / 15;
        ctx.strokeStyle = slash.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Arc de slash
        ctx.beginPath();
        ctx.arc(0, 0, slash.range * 0.7, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        // Lignes de slash
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(20, i * 8);
            ctx.lineTo(slash.range, i * 15);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    });
}

function drawMonster(monster) {
    ctx.save();
    ctx.translate(monster.x, monster.y);

    const bounce = Math.sin(monster.animFrame) * 3;
    const facing = monster.x < player.x ? 1 : -1;

    if (monster.type === 'zombie') {
        ctx.fillStyle = monster.color;
        ctx.fillRect(-15, -20 + bounce, 30, 40);

        ctx.fillStyle = '#5a8c5e';
        ctx.beginPath();
        ctx.arc(0, -28 + bounce, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(facing * 4, -30 + bounce, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = monster.color;
        ctx.fillRect(-30, -10 + bounce, 20, 8);
        ctx.fillRect(10, -10 + bounce, 20, 8);

    } else if (monster.type === 'demon') {
        ctx.fillStyle = monster.color;
        ctx.beginPath();
        ctx.moveTo(-20, 25);
        ctx.lineTo(0, -25 + bounce);
        ctx.lineTo(20, 25);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4a0000';
        ctx.beginPath();
        ctx.moveTo(-15, -20 + bounce);
        ctx.lineTo(-10, -40 + bounce);
        ctx.lineTo(-5, -20 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, -20 + bounce);
        ctx.lineTo(10, -40 + bounce);
        ctx.lineTo(15, -20 + bounce);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(-8, -10 + bounce, 4, 0, Math.PI * 2);
        ctx.arc(8, -10 + bounce, 4, 0, Math.PI * 2);
        ctx.fill();

    } else if (monster.type === 'ghost') {
        ctx.fillStyle = monster.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, -10 + bounce, 20, Math.PI, 0);
        ctx.lineTo(20, 20);
        for (let i = 0; i < 4; i++) {
            ctx.lineTo(15 - i * 10, 15 + (i % 2) * 10);
        }
        ctx.lineTo(-20, 20);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-8, -15 + bounce, 5, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(8, -15 + bounce, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (monster.type === 'boss') {
        ctx.fillStyle = monster.color;
        ctx.fillRect(-35, -40 + bounce, 70, 80);

        ctx.fillStyle = '#5a0090';
        ctx.beginPath();
        ctx.arc(0, -50 + bounce, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-15 + i * 15, -55 + bounce, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#2a0050';
        ctx.fillRect(-50, -20 + bounce, 20, 15);
        ctx.fillRect(30, -20 + bounce, 20, 15);
    }

    const healthPercent = monster.health / monster.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(-20, -monster.height / 2 - 15, 40, 6);
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-20, -monster.height / 2 - 15, 40 * healthPercent, 6);

    ctx.restore();
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color || '#ffcc00';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = bullet.color === '#00ff00' ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 200, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.vx * 2, bullet.y - bullet.vy * 2);
        ctx.stroke();
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    damageNumbers.forEach(d => {
        ctx.globalAlpha = d.life / 60;
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('-' + d.value, d.x, d.y);
    });

    moneyPopups.forEach(m => {
        ctx.globalAlpha = m.life / 90;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+$' + m.value, m.x, m.y);
    });
    ctx.globalAlpha = 1;
}

function drawUI() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 120);
    ctx.fillRect(canvas.width - 180, 10, 170, 80);

    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 180, 20);
    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(20, 20, 180 * healthPercent, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20, 20, 180, 20);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.health)} / ${player.maxHealth}`, 110, 35);

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`${weapons[currentWeapon].name}`, 20, 55);

    ctx.font = 'bold 16px Arial';
    const weapon = weapons[currentWeapon];
    if (weapon.type === 'melee') {
        ctx.fillStyle = '#e91e63';
        ctx.fillText('Clic: Attaquer', 20, 75);
    } else {
        ctx.fillStyle = player.reloading ? '#ffff00' : '#fff';
        const ammoText = player.reloading ? 'Recharge...' : `Munitions: ${player.ammo}/${player.maxAmmo}`;
        ctx.fillText(ammoText, 20, 75);
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`$${money}`, 20, 100);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 35);
    ctx.fillText(`Vague: ${wave}`, canvas.width - 20, 55);
    ctx.font = '14px Arial';
    ctx.fillText(`Kills: ${kills}/${killsForNextWave}`, canvas.width - 20, 75);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px Arial';
    ctx.fillText('B: Boutique | 1-7: Changer arme', canvas.width / 2, canvas.height - 20);

    // Viseur (différent pour sabre)
    if (weapon.type === 'melee') {
        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, weapon.range, 0, Math.PI * 2);
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Zone d'attaque
        const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, weapon.range, angle - Math.PI / 3, angle + Math.PI / 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(233, 30, 99, 0.2)';
        ctx.fill();
    } else {
        ctx.strokeStyle = weapon.color === '#00ff00' ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mouseX - 20, mouseY);
        ctx.lineTo(mouseX - 10, mouseY);
        ctx.moveTo(mouseX + 10, mouseY);
        ctx.lineTo(mouseX + 20, mouseY);
        ctx.moveTo(mouseX, mouseY - 20);
        ctx.lineTo(mouseX, mouseY - 10);
        ctx.moveTo(mouseX, mouseY + 10);
        ctx.lineTo(mouseX, mouseY + 20);
        ctx.stroke();
    }

    // Afficher les messages de triche
    if (window.cheatMessages) {
        window.cheatMessages = window.cheatMessages.filter(msg => {
            ctx.globalAlpha = msg.life / 120;
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(msg.text, canvas.width / 2, msg.y);
            msg.y -= 0.5;
            msg.life--;
            ctx.globalAlpha = 1;
            return msg.life > 0;
        });
    }
}

function drawShop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shopX = canvas.width / 2 - 250;
    const shopY = 80;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BOUTIQUE', canvas.width / 2, 55);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Argent: $${money}`, canvas.width / 2, shopY + 20);

    weapons.forEach((weapon, index) => {
        const itemY = shopY + 50 + index * 60;
        const isSelected = currentWeapon === index;
        const canBuy = money >= weapon.price;

        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(shopX, itemY, 500, 52);
        ctx.strokeStyle = isSelected ? '#ffd700' : '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(shopX, itemY, 500, 52);

        ctx.fillStyle = weapon.owned ? '#fff' : (canBuy ? '#aaa' : '#666');
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        const typeIcon = weapon.type === 'melee' ? '⚔️' : '🔫';
        ctx.fillText(`${index + 1}. ${typeIcon} ${weapon.name}`, shopX + 15, itemY + 22);

        ctx.font = '13px Arial';
        ctx.fillStyle = '#aaa';
        if (weapon.type === 'melee') {
            ctx.fillText(`Dégâts: ${weapon.damage} | Portée: ${weapon.range}px | Pas de recharge`, shopX + 15, itemY + 42);
        } else {
            ctx.fillText(`Dégâts: ${weapon.damage} | Munitions: ${weapon.maxAmmo} | Recharge: ${weapon.reloadTime / 1000}s`, shopX + 15, itemY + 42);
        }

        const buttonX = shopX + 400;
        const buttonY = itemY + 6;

        if (weapon.owned) {
            if (isSelected) {
                ctx.fillStyle = '#4a4';
                ctx.fillRect(buttonX, buttonY, 80, 40);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ÉQUIPÉ', buttonX + 40, buttonY + 26);
            } else {
                ctx.fillStyle = '#555';
                ctx.fillRect(buttonX, buttonY, 80, 40);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ÉQUIPER', buttonX + 40, buttonY + 26);
            }
        } else {
            ctx.fillStyle = canBuy ? '#c90' : '#444';
            ctx.fillRect(buttonX, buttonY, 80, 40);
            ctx.fillStyle = canBuy ? '#fff' : '#888';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${weapon.price}`, buttonX + 40, buttonY + 26);
        }
    });

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Cliquez pour acheter/équiper | Appuyez sur B pour fermer', canvas.width / 2, canvas.height - 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText(`Score final: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Vague atteinte: ${wave}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Argent total: $${money}`, canvas.width / 2, canvas.height / 2 + 90);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Appuyez sur ESPACE pour rejouer', canvas.width / 2, canvas.height / 2 + 140);
}

function restartGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.reloading = false;

    weapons.forEach((w, i) => {
        if (i > 0) w.owned = false;
    });
    currentWeapon = 0;
    equipWeapon(0);

    bullets = [];
    monsters = [];
    particles = [];
    damageNumbers = [];
    moneyPopups = [];
    slashEffects = [];

    swordAttack.active = false;

    score = 0;
    money = 0;
    wave = 1;
    kills = 0;
    killsForNextWave = 5;

    gameState = 'playing';
}

function drawBackground() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

let spawnTimer = 0;
function gameLoop() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    if (gameState === 'playing') {
        spawnTimer++;
        const spawnRate = Math.max(60, 180 - wave * 8);
        if (spawnTimer >= spawnRate) {
            spawnMonster();
            spawnTimer = 0;
        }

        updatePlayer();
        updateBullets();
        updateMonsters();
        updateParticles();
    }

    drawParticles();
    drawSlashEffects();
    monsters.forEach(drawMonster);
    drawPlayer();
    drawBullets();
    drawUI();

    if (gameState === 'shop') {
        drawShop();
    }

    if (gameState === 'gameover') {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

canvas.style.cursor = 'none';
gameLoop();

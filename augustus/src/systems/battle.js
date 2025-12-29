// ==========================================
// SYSTÈME DE BATAILLE (AVEC SOLDATS ANIMÉS)
// ==========================================

import { FACTIONS } from '../data/index.js';
import { distance } from '../utils/helpers.js';

// Nouveaux systèmes
import BattleSpriteManager from './battle-sprite-manager.js';
import SoldierManager from './soldier-manager.js';
import FormationSystem from './formation-system.js';
import CombatCalculator from './combat-calculator.js';
import ProjectileSystem from './projectile-system.js';
import CollisionSystem from './collision-system.js';
import BattleDebugManager from './battle-debug.js';

class BattleSystem {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;

        this.attacker = null;
        this.defender = null;
        this.attackerUnits = [];
        this.defenderUnits = [];

        this.selectedUnit = null;
        this.isPaused = false;
        this.speed = 1;
        this.isRunning = false;
        this.result = null;
        this.captured = 0;

        // Caméra pour zoom et déplacement
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };

        // Carte de bataille - grande carte pour les batailles épiques
        this.mapWidth = 4000;
        this.mapHeight = 2500;
        this.obstacles = [];
        this.isSiege = false;
        this.siegeCity = null;

        // Timing
        this.lastFrameTime = 0;

        // Nouveaux systèmes (initialisés dans start())
        this.battleSpriteManager = null;
        this.soldierManager = null;
        this.formationSystem = null;
        this.combatCalculator = null;
        this.projectileSystem = null;
        this.collisionSystem = null;
        this.debugManager = null;

        // Flag pour activer/désactiver le nouveau système
        this.useNewSystem = true;
    }

    /**
     * Démarre une bataille
     */
    async start(attacker, defender, siegeCity = null) {
        this.attacker = attacker;
        this.defender = defender;
        this.isPaused = false;
        this.speed = 1;
        this.isRunning = true;
        this.result = null;
        this.captured = 0;
        this.lastFrameTime = performance.now();

        // Configuration siège
        this.isSiege = siegeCity !== null;
        this.siegeCity = siegeCity;

        // Reset caméra
        this.camera = { x: 0, y: 0, zoom: 1 };

        this.canvas = document.getElementById('battleCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Événements souris
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Événement clavier pour le menu debug (F3)
        this.keyHandler = (e) => this.onKeyDown(e);
        window.addEventListener('keydown', this.keyHandler);

        // Initialiser les nouveaux systèmes
        if (this.useNewSystem) {
            await this.initializeSystems();
        }

        // Générer les obstacles
        this.generateTerrain();

        this.prepareUnits();
        this.updateUI();

        // Centrer la caméra
        this.centerCamera();

        this.game.screens.show('battleScreen');
        this.loop();
    }

    /**
     * Initialise les nouveaux systèmes de bataille
     */
    async initializeSystems() {
        // Gestionnaire de sprites
        this.battleSpriteManager = new BattleSpriteManager();
        await this.battleSpriteManager.initialize();

        // Système de formations
        this.formationSystem = new FormationSystem();

        // Gestionnaire de soldats
        this.soldierManager = new SoldierManager(this);

        // Calculateur de combat
        this.combatCalculator = new CombatCalculator(this);

        // Système de projectiles
        this.projectileSystem = new ProjectileSystem(this);

        // Système de collision
        this.collisionSystem = new CollisionSystem(this);

        // Système de debug
        this.debugManager = new BattleDebugManager(this);
    }

    /**
     * Centre la caméra sur le champ de bataille
     */
    centerCamera() {
        this.camera.x = (this.mapWidth - this.canvas.width) / 2;
        this.camera.y = (this.mapHeight - this.canvas.height) / 2;
    }

    /**
     * Génère le terrain de bataille
     */
    generateTerrain() {
        this.obstacles = [];

        if (this.isSiege && this.siegeCity) {
            this.generateSiegeTerrain();
        } else {
            this.generateFieldTerrain();
        }
    }

    /**
     * Génère un terrain de bataille en plein champ
     */
    generateFieldTerrain() {
        const numForests = 4 + Math.floor(Math.random() * 5);
        const numRivers = Math.random() > 0.5 ? 1 : 0;
        const numHills = 3 + Math.floor(Math.random() * 4);
        const numRocks = 4 + Math.floor(Math.random() * 5);

        // Forêts - beaucoup plus grandes
        for (let i = 0; i < numForests; i++) {
            this.obstacles.push({
                type: 'forest',
                x: 300 + Math.random() * (this.mapWidth - 600),
                y: 200 + Math.random() * (this.mapHeight - 400),
                width: 200 + Math.random() * 300,
                height: 150 + Math.random() * 200,
                speedModifier: 0.5,
                defenseBonus: 2,
                blocksMovement: false
            });
        }

        // Collines - plus grandes
        for (let i = 0; i < numHills; i++) {
            this.obstacles.push({
                type: 'hill',
                x: 250 + Math.random() * (this.mapWidth - 500),
                y: 150 + Math.random() * (this.mapHeight - 300),
                radius: 100 + Math.random() * 80,
                attackBonus: 2,
                defenseBonus: 1,
                blocksMovement: false
            });
        }

        // Rivière - plus large
        if (numRivers > 0) {
            const riverY = 400 + Math.random() * (this.mapHeight - 800);
            this.obstacles.push({
                type: 'river',
                x: 0,
                y: riverY,
                width: this.mapWidth,
                height: 80,
                speedModifier: 0.3,
                defenseBonus: -2,
                blocksMovement: false
            });

            // Pont pour traverser - plus grand
            this.obstacles.push({
                type: 'bridge',
                x: this.mapWidth / 2 - 80,
                y: riverY - 10,
                width: 160,
                height: 100,
                speedModifier: 1,
                blocksMovement: false
            });
        }

        // Rochers - plus gros
        for (let i = 0; i < numRocks; i++) {
            this.obstacles.push({
                type: 'rock',
                x: 200 + Math.random() * (this.mapWidth - 400),
                y: 100 + Math.random() * (this.mapHeight - 200),
                radius: 30 + Math.random() * 40,
                blocksMovement: true
            });
        }
    }

    /**
     * Génère un terrain de siège avec remparts et bâtiments
     */
    generateSiegeTerrain() {
        const city = this.siegeCity;
        const wallX = this.mapWidth * 0.65;

        // Remparts principaux
        const hasWalls = city.buildings?.includes('walls') || city.buildings?.includes('stone_walls');
        if (hasWalls) {
            const wallHeight = city.buildings.includes('stone_walls') ? 400 : 300;
            const wallY = (this.mapHeight - wallHeight) / 2;

            // Mur principal
            this.obstacles.push({
                type: 'wall',
                x: wallX,
                y: wallY,
                width: 30,
                height: wallHeight,
                blocksMovement: true,
                health: city.buildings.includes('stone_walls') ? 500 : 300,
                maxHealth: city.buildings.includes('stone_walls') ? 500 : 300
            });

            // Tours
            this.obstacles.push({
                type: 'tower',
                x: wallX - 15,
                y: wallY - 30,
                width: 60,
                height: 60,
                attackBonus: 3,
                blocksMovement: true
            });
            this.obstacles.push({
                type: 'tower',
                x: wallX - 15,
                y: wallY + wallHeight - 30,
                width: 60,
                height: 60,
                attackBonus: 3,
                blocksMovement: true
            });

            // Porte
            this.obstacles.push({
                type: 'gate',
                x: wallX,
                y: this.mapHeight / 2 - 30,
                width: 30,
                height: 60,
                blocksMovement: true,
                health: 200,
                maxHealth: 200
            });
        }

        // Bâtiments de la ville
        for (let i = 0; i < 5; i++) {
            this.obstacles.push({
                type: 'building',
                x: wallX + 80 + Math.random() * 200,
                y: 150 + Math.random() * (this.mapHeight - 300),
                width: 40 + Math.random() * 40,
                height: 40 + Math.random() * 40,
                blocksMovement: true,
                buildingType: ['🏛️', '🏠', '🏪', '⛪'][Math.floor(Math.random() * 4)]
            });
        }
    }

    /**
     * Redimensionne le canvas
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 120;
    }

    /**
     * Prépare les unités pour le combat
     */
    prepareUnits() {
        this.attackerUnits = this.positionUnits(this.attacker.units, 'attacker', false);
        this.defenderUnits = this.positionUnits(this.defender.units, 'defender', true);

        // Créer les soldats individuels si le nouveau système est actif
        if (this.useNewSystem && this.soldierManager && this.formationSystem) {
            for (const unit of this.attackerUnits) {
                unit.facing = 0; // Face à droite
                this.soldierManager.createSoldiersForUnit(unit, this.formationSystem);
            }
            for (const unit of this.defenderUnits) {
                unit.facing = Math.PI; // Face à gauche
                this.soldierManager.createSoldiersForUnit(unit, this.formationSystem);
            }
        }
    }

    /**
     * Positionne les unités sur le champ de bataille
     */
    positionUnits(units, side, mirror) {
        if (!units || units.length === 0) return [];

        const positioned = [];
        const height = this.mapHeight;
        const baseX = mirror ? this.mapWidth * 0.75 : this.mapWidth * 0.25;
        const centerY = height / 2;

        // Déterminer la faction selon le côté
        const faction = side === 'attacker' ? this.attacker.faction : this.defender.faction;

        // Séparer par type
        const infantry = units.filter(u => u.type === 'infantry');
        const cavalry = units.filter(u => u.type === 'cavalry');
        const ranged = units.filter(u => u.type === 'ranged' || u.type === 'skirmisher');
        const elephants = units.filter(u => u.type === 'elephant');
        const others = units.filter(u => !['infantry', 'cavalry', 'ranged', 'skirmisher', 'elephant'].includes(u.type));

        const allUnits = [...ranged, ...infantry, ...elephants, ...cavalry, ...others];
        const verticalSpacing = 120;
        const horizontalSpacing = 80;
        const dir = mirror ? 1 : -1;

        allUnits.forEach((unit, i) => {
            const col = Math.floor(i / 4);
            const row = i % 4;
            const startY = centerY - (Math.min(4, allUnits.length) - 1) * verticalSpacing / 2;

            positioned.push(this.createBattleUnit(unit,
                baseX + dir * col * horizontalSpacing,
                startY + row * verticalSpacing,
                side,
                faction
            ));
        });

        return positioned;
    }

    /**
     * Crée une unité de bataille avec ses propriétés
     */
    createBattleUnit(unit, x, y, side, faction) {
        return {
            ...unit,
            x: x,
            y: y,
            targetX: null,
            targetY: null,
            state: 'idle',
            side: side,
            faction: faction, // Faction de l'armée pour déterminer la formation
            target: null,
            cooldown: 0,
            facing: side === 'attacker' ? 0 : Math.PI,
            soldiers: [],
            deadBodies: [],
            isEngaged: false,
            engagedWith: null
        };
    }

    /**
     * Met à jour l'interface de bataille
     */
    updateUI() {
        const attackerInfo = document.getElementById('attackerInfo');
        const defenderInfo = document.getElementById('defenderInfo');
        const attackerFaction = FACTIONS[this.attacker.faction];
        const defenderFaction = FACTIONS[this.defender.faction];

        attackerInfo.innerHTML = `
            <div class="faction-name">${attackerFaction.icon} ${this.attacker.name}</div>
            <div class="unit-count">${this.attackerUnits.filter(u => u.currentMen > 0).length} unités</div>
        `;

        defenderInfo.innerHTML = `
            <div class="faction-name">${defenderFaction.icon} ${this.defender.name}</div>
            <div class="unit-count">${this.defenderUnits.filter(u => u.currentMen > 0).length} unités</div>
        `;

        // Cartes d'unités du joueur
        const unitCards = document.getElementById('unitCards');
        const playerUnits = this.attacker.faction === this.game.playerFaction ? this.attackerUnits : this.defenderUnits;

        unitCards.innerHTML = playerUnits.map((unit, i) => `
            <div class="unit-card ${this.selectedUnit === unit ? 'selected' : ''}" onclick="game.battle.selectUnit(${i})">
                <div class="unit-name">${unit.icon} ${unit.name}</div>
                <div class="unit-health">
                    <div class="unit-health-bar" style="width: ${(unit.currentMen / unit.men) * 100}%"></div>
                </div>
                <div style="font-size: 10px; color: #aaa;">${unit.currentMen}/${unit.men}</div>
            </div>
        `).join('');
    }

    /**
     * Sélectionne une unité
     */
    selectUnit(index) {
        const playerUnits = this.attacker.faction === this.game.playerFaction ? this.attackerUnits : this.defenderUnits;
        this.selectedUnit = playerUnits[index];
    }

    /**
     * Vérifie si un point est dans la formation d'une unité (basé sur les soldats)
     */
    isPointInUnitFormation(unit, x, y) {
        if (!unit.soldiers || unit.soldiers.length === 0) {
            // Fallback: utiliser la bounding box approximative
            const radius = this.formationSystem?.getFormationRadius(unit) || 40;
            return distance(unit.x, unit.y, x, y) < radius;
        }

        // Trouver le soldat le plus proche et vérifier la distance
        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) return false;

        // Calculer la bounding box des soldats vivants
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const soldier of aliveSoldiers) {
            minX = Math.min(minX, soldier.x);
            maxX = Math.max(maxX, soldier.x);
            minY = Math.min(minY, soldier.y);
            maxY = Math.max(maxY, soldier.y);
        }

        // Ajouter une marge de 15 pixels autour de la bounding box
        const margin = 15;
        return x >= minX - margin && x <= maxX + margin &&
               y >= minY - margin && y <= maxY + margin;
    }

    /**
     * Gère le clic sur le canvas
     */
    onClick(e) {
        if (this.isDragging) return;

        const worldPos = this.screenToWorld(e.clientX, e.clientY);

        // Vérifier si on clique sur une unité alliée pour la sélectionner (basé sur les soldats)
        const playerUnits = this.attacker.faction === this.game.playerFaction ? this.attackerUnits : this.defenderUnits;
        const clickedAlly = playerUnits.find(unit => {
            return this.isPointInUnitFormation(unit, worldPos.x, worldPos.y) && unit.currentMen > 0;
        });

        if (clickedAlly) {
            this.selectedUnit = clickedAlly;
            return;
        }

        if (!this.selectedUnit) return;

        // Vérifier si on clique sur un ennemi (basé sur les soldats)
        const enemyUnits = this.attacker.faction === this.game.playerFaction ? this.defenderUnits : this.attackerUnits;
        const clickedEnemy = enemyUnits.find(unit => {
            return this.isPointInUnitFormation(unit, worldPos.x, worldPos.y) && unit.currentMen > 0;
        });

        if (clickedEnemy) {
            this.selectedUnit.target = clickedEnemy;
            this.selectedUnit.state = 'attacking';
        } else {
            // Vérifier si la position est valide
            if (this.collisionSystem && !this.collisionSystem.canMoveTo(this.selectedUnit, worldPos.x, worldPos.y)) {
                this.game.notify('Position bloquée!', 'warning');
                return;
            }

            this.selectedUnit.targetX = worldPos.x;
            this.selectedUnit.targetY = worldPos.y;
            this.selectedUnit.state = 'moving';
        }
    }

    /**
     * Convertit coordonnées écran en monde
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.camera.zoom + this.camera.x,
            y: (screenY - 60) / this.camera.zoom + this.camera.y
        };
    }

    /**
     * Gestion des événements souris
     */
    onMouseDown(e) {
        if (e.button === 2 || e.button === 1) {
            this.isDragging = true;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }

    onMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;
            this.camera.x -= dx / this.camera.zoom;
            this.camera.y -= dy / this.camera.zoom;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        const oldZoom = this.camera.zoom;
        this.camera.zoom *= e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoom = Math.max(0.5, Math.min(2, this.camera.zoom));

        // Zoom vers le curseur
        const worldX = e.clientX / oldZoom + this.camera.x;
        const worldY = (e.clientY - 60) / oldZoom + this.camera.y;
        this.camera.x = worldX - e.clientX / this.camera.zoom;
        this.camera.y = worldY - (e.clientY - 60) / this.camera.zoom;
    }

    /**
     * Gestion des touches clavier
     */
    onKeyDown(e) {
        // F3 = Toggle menu debug
        if (e.key === 'F3') {
            e.preventDefault();
            this.debugManager?.toggleMenu();
        }
    }

    /**
     * Boucle principale de la bataille
     */
    loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        if (!this.isPaused) {
            this.update(deltaTime);

            // Nouveaux systèmes
            if (this.useNewSystem) {
                this.soldierManager?.updateAnimations(deltaTime * this.speed);
                this.projectileSystem?.updateProjectiles(deltaTime * this.speed);
                this.collisionSystem?.resolveOverlaps();
                this.soldierManager?.updateDeadBodies(deltaTime * this.speed);
                this.debugManager?.updateDamageNumbers(deltaTime * this.speed);
            }
        }

        this.render();
        this.updateUI();

        // Vérifier fin de bataille
        const attackerAlive = this.attackerUnits.filter(u => u.currentMen > 0).length;
        const defenderAlive = this.defenderUnits.filter(u => u.currentMen > 0).length;

        if (attackerAlive === 0 || defenderAlive === 0) {
            this.endBattle(attackerAlive > 0 ? 'attacker' : 'defender');
            return;
        }

        requestAnimationFrame(() => this.loop());
    }

    /**
     * Met à jour la logique de combat
     */
    update(deltaTime) {
        const allUnits = [...this.attackerUnits, ...this.defenderUnits];
        const dt = deltaTime / 16.67 * this.speed;

        allUnits.forEach(unit => {
            if (unit.currentMen <= 0) return;

            unit.cooldown = Math.max(0, unit.cooldown - dt);

            // IA automatique
            if (unit.state === 'idle') {
                const enemies = unit.side === 'attacker' ? this.defenderUnits : this.attackerUnits;
                const aliveEnemies = enemies.filter(e => e.currentMen > 0);

                if (aliveEnemies.length > 0) {
                    let closest = null;
                    let closestDist = Infinity;

                    aliveEnemies.forEach(enemy => {
                        const dist = distance(unit.x, unit.y, enemy.x, enemy.y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closest = enemy;
                        }
                    });

                    if (closest) {
                        unit.target = closest;
                        unit.state = 'attacking';
                    }
                }
            }

            // Mouvement
            if (unit.state === 'moving' && unit.targetX !== null) {
                const dx = unit.targetX - unit.x;
                const dy = unit.targetY - unit.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 10) {
                    const speed = (unit.stats.speed || 5) * 0.15 * dt;
                    unit.x += (dx / dist) * speed;
                    unit.y += (dy / dist) * speed;
                    unit.facing = Math.atan2(dy, dx);

                    // Mettre à jour les soldats
                    if (this.useNewSystem && this.soldierManager) {
                        this.soldierManager.updateSoldierTargetPositions(unit, this.formationSystem);
                    }
                } else {
                    unit.state = 'idle';
                    unit.targetX = null;
                    unit.targetY = null;
                }
            }

            // Attaque
            if (unit.state === 'attacking' && unit.target) {
                if (unit.target.currentMen <= 0) {
                    unit.target = null;
                    unit.state = 'idle';
                    return;
                }

                const dx = unit.target.x - unit.x;
                const dy = unit.target.y - unit.y;
                const dist = Math.hypot(dx, dy);

                // Vérifier si c'est une unité à distance
                const isRangedUnit = unit.type === 'ranged' || unit.type === 'skirmisher';

                // Pour le corps à corps: les formations doivent se toucher/chevaucher
                // Pour les unités à distance: rester à bonne portée
                const myRadius = this.formationSystem?.getFormationRadius(unit) || 40;
                const targetRadius = this.formationSystem?.getFormationRadius(unit.target) || 40;

                let engageDistance;
                if (isRangedUnit) {
                    // Unités à distance: rester à portée de tir
                    engageDistance = Math.min(unit.stats.range || 100, 100);
                } else {
                    // Corps à corps: les formations doivent se chevaucher pour que les soldats se touchent
                    // Distance = somme des rayons - chevauchement (20-30 pixels de chevauchement)
                    engageDistance = myRadius + targetRadius - 25;
                }

                const minRangedDistance = isRangedUnit ? 60 : 0;

                // Mettre à jour la direction
                unit.facing = Math.atan2(dy, dx);

                if (dist > engageDistance) {
                    // Trop loin, avancer
                    const speed = (unit.stats.speed || 5) * 0.15 * dt;
                    unit.x += (dx / dist) * speed;
                    unit.y += (dy / dist) * speed;

                    if (this.useNewSystem && this.soldierManager) {
                        this.soldierManager.updateSoldierTargetPositions(unit, this.formationSystem);
                    }
                } else if (isRangedUnit && dist < minRangedDistance) {
                    // Unité à distance trop proche, reculer!
                    const speed = (unit.stats.speed || 5) * 0.1 * dt;
                    unit.x -= (dx / dist) * speed;
                    unit.y -= (dy / dist) * speed;

                    if (this.useNewSystem && this.soldierManager) {
                        this.soldierManager.updateSoldierTargetPositions(unit, this.formationSystem);
                    }

                    // Peut quand même tirer en reculant
                    if (unit.cooldown <= 0) {
                        this.attack(unit, unit.target);
                        unit.cooldown = 60;
                    }
                } else {
                    // À bonne portée pour le combat
                    // Pour le corps à corps, continuer à avancer légèrement pour maintenir la pression
                    if (!isRangedUnit && dist > myRadius + targetRadius - 35) {
                        const speed = (unit.stats.speed || 5) * 0.05 * dt;
                        unit.x += (dx / dist) * speed;
                        unit.y += (dy / dist) * speed;

                        if (this.useNewSystem && this.soldierManager) {
                            this.soldierManager.updateSoldierTargetPositions(unit, this.formationSystem);
                        }
                    }

                    if (unit.cooldown <= 0) {
                        this.attack(unit, unit.target);
                        unit.cooldown = 60;
                    }
                }
            }
        });
    }

    /**
     * Effectue une attaque
     */
    attack(attacker, defender) {
        if (this.useNewSystem && this.combatCalculator) {
            // Nouveau système de combat
            const result = this.combatCalculator.calculateDamage(attacker, defender);

            // Gérer les réactions des soldats de bordure
            this.combatCalculator.handleBorderSoldierReaction(defender, attacker, result.attackDirection);

            // Appliquer les pertes
            const killedIndices = this.combatCalculator.distributeCasualties(defender, result.casualties);

            // Réorganiser la formation
            if (killedIndices.length > 0 && this.formationSystem) {
                this.formationSystem.repositionAfterCasualties(defender, killedIndices);
            }

            // Dégâts au moral
            defender.morale -= result.moraleDamage;

            // Déclencher animation d'attaque sur les soldats de front
            if (this.soldierManager) {
                this.soldierManager.triggerAttackAnimation(attacker, defender, 1);
            }

            // Tir à distance: créer des projectiles
            const isRanged = attacker.type === 'ranged' || attacker.type === 'skirmisher';
            if (isRanged && this.projectileSystem) {
                this.projectileSystem.createVolley(attacker, defender);
            }

            // Vérifier routing
            if (this.combatCalculator.shouldRout(defender)) {
                defender.state = 'routing';
            }
        } else {
            // Ancien système (fallback)
            const attackPower = attacker.stats.attack * (attacker.currentMen / attacker.men);
            const defensePower = defender.stats.defense + defender.stats.armor;
            const damage = Math.max(1, Math.floor((attackPower - defensePower * 0.5) * (0.8 + Math.random() * 0.4)));

            defender.currentMen = Math.max(0, defender.currentMen - damage);

            defender.morale -= damage * 0.5;
            if (defender.morale < 20 && Math.random() < 0.3) {
                defender.state = 'routing';
            }
        }
    }

    /**
     * Rendu de la bataille
     */
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Effacer le canvas
        ctx.fillStyle = '#4a6741';
        ctx.fillRect(0, 0, width, height);

        // Appliquer la transformation de caméra
        ctx.save();
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // Fond de la carte
        ctx.fillStyle = '#4a6741';
        ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

        // Herbe (moins de détails pour performance)
        ctx.fillStyle = '#3d5c3d';
        for (let x = 0; x < this.mapWidth; x += 100) {
            for (let y = 0; y < this.mapHeight; y += 100) {
                ctx.fillRect(x + Math.random() * 80, y + Math.random() * 80, 2, 6);
            }
        }

        // Bordures de la carte (zones hors limites)
        const borderWidth = 20;
        ctx.fillStyle = '#2a3a28';
        // Haut
        ctx.fillRect(0, 0, this.mapWidth, borderWidth);
        // Bas
        ctx.fillRect(0, this.mapHeight - borderWidth, this.mapWidth, borderWidth);
        // Gauche
        ctx.fillRect(0, 0, borderWidth, this.mapHeight);
        // Droite
        ctx.fillRect(this.mapWidth - borderWidth, 0, borderWidth, this.mapHeight);

        // Ligne de bordure plus visible
        ctx.strokeStyle = '#1a2a18';
        ctx.lineWidth = 3;
        ctx.strokeRect(borderWidth, borderWidth, this.mapWidth - borderWidth * 2, this.mapHeight - borderWidth * 2);

        // Dessiner les obstacles
        this.renderObstacles(ctx);

        // Dessiner les entités (triées par Y pour profondeur)
        this.renderEntities(ctx);

        // Rendu debug (dans le système de coordonnées monde)
        this.debugManager?.render(ctx);

        ctx.restore();

        // UI par-dessus (pas affectée par la caméra)
        this.renderUI(ctx, width, height);
    }

    /**
     * Rend toutes les entités triées par profondeur
     */
    renderEntities(ctx) {
        if (!this.useNewSystem) {
            this.renderUnitsLegacy(ctx);
            return;
        }

        // Collecter toutes les entités à rendre
        const renderables = [];
        const allUnits = [...this.attackerUnits, ...this.defenderUnits];

        for (const unit of allUnits) {
            if (unit.currentMen <= 0 && (!unit.deadBodies || unit.deadBodies.length === 0)) continue;

            // Ajouter les corps morts (avec un offset Y négatif pour être dessinés en arrière-plan)
            if (unit.deadBodies) {
                for (const body of unit.deadBodies) {
                    renderables.push({
                        type: 'body',
                        y: body.y - 1000, // Les corps sont toujours en arrière-plan
                        body: body,
                        unit: unit
                    });
                }
            }

            // Ajouter les soldats vivants
            if (unit.soldiers) {
                for (const soldier of unit.soldiers) {
                    if (!soldier.isAlive) continue;
                    renderables.push({
                        type: 'soldier',
                        y: soldier.y,
                        soldier: soldier,
                        unit: unit
                    });
                }
            }
        }

        // Ajouter les projectiles
        if (this.projectileSystem) {
            for (const proj of this.projectileSystem.projectiles) {
                renderables.push({
                    type: 'projectile',
                    y: proj.currentY - proj.currentZ,
                    projectile: proj
                });
            }
        }

        // Trier par Y (plus petit = plus loin = dessiner d'abord)
        renderables.sort((a, b) => a.y - b.y);

        // Dessiner ombres des projectiles d'abord
        if (this.projectileSystem) {
            this.projectileSystem.renderProjectileShadows(ctx);
        }

        // Dessiner dans l'ordre
        for (const item of renderables) {
            switch (item.type) {
                case 'body':
                    // Rendre un seul corps (pas tous les corps de l'unité)
                    this.soldierManager?.renderSingleDeadBody(ctx, item.body, 1);
                    break;
                case 'soldier':
                    this.renderSoldier(ctx, item.soldier, item.unit);
                    break;
                case 'projectile':
                    this.projectileSystem?.renderProjectile(ctx, item.projectile);
                    break;
            }
        }

        // Dessiner les overlays d'unités (sélection, barres de vie)
        this.renderUnitOverlays(ctx);
    }

    /**
     * Rend un soldat individuel
     * Si le mode fallback debug est activé, ne rien dessiner (géré par battle-debug.js)
     */
    renderSoldier(ctx, soldier, unit) {
        // Mode fallback debug: les ronds sont dessinés par battle-debug.js
        if (this.debugManager?.options.showFallbackMode) {
            return;
        }

        if (!this.battleSpriteManager || !this.battleSpriteManager.isReady()) {
            // Fallback auto: sprites non disponibles
            const faction = FACTIONS[unit.side === 'attacker' ? this.attacker.faction : this.defender.faction];
            ctx.fillStyle = faction.color;
            ctx.beginPath();
            ctx.arc(soldier.x, soldier.y, 3, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        const direction = soldier.overrideFacing !== null
            ? this.battleSpriteManager.angleToDirection(soldier.overrideFacing)
            : soldier.direction;

        const frame = this.battleSpriteManager.getFrame(
            unit.type || 'infantry',
            unit.side === 'attacker' ? this.attacker.faction : this.defender.faction,
            direction,
            soldier.animState,
            soldier.animTime,
            soldier.role || 'soldier'
        );

        if (!frame) return;

        const unitType = unit.type || 'infantry';
        const dimensions = this.battleSpriteManager.getDimensions(unitType);

        // Ratio d'aspect pour rendre les soldats plus hauts que larges
        const aspectRatio = this.getAspectRatio(unitType);
        // Échelle de rendu par type (cavalerie et éléphants plus grands)
        const renderScale = this.getRenderScale(unitType);

        const drawWidth = dimensions.width * renderScale;
        const drawHeight = dimensions.height * aspectRatio * renderScale;

        // Position de rendu (ancré vers le bas pour les pieds)
        const drawX = soldier.x - drawWidth / 2;
        const drawY = soldier.y - drawHeight + (dimensions.height * 0.4 * renderScale);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            frame.image,
            frame.sx, frame.sy, frame.sw, frame.sh,
            drawX, drawY,
            drawWidth,
            drawHeight
        );
    }

    /**
     * Obtient le ratio d'aspect pour un type d'unité
     */
    getAspectRatio(unitType) {
        const ratios = {
            infantry: 1.35,
            ranged: 1.35,
            skirmisher: 1.35,
            cavalry: 1.3,
            elephant: 1.2
        };
        return ratios[unitType] || 1.35;
    }

    /**
     * Obtient l'échelle de rendu pour un type d'unité
     * Les cavaliers et éléphants sont rendus plus grands
     */
    getRenderScale(unitType) {
        const scales = {
            infantry: 1.0,
            ranged: 1.0,
            skirmisher: 1.0,
            cavalry: 1.6,      // Cavalerie 60% plus grande
            elephant: 2.0      // Éléphants 2x plus grands
        };
        return scales[unitType] || 1.0;
    }

    /**
     * Calcule la bounding box d'une unité basée sur ses soldats
     */
    getUnitBoundingBox(unit) {
        if (!unit.soldiers || unit.soldiers.length === 0) {
            const radius = this.formationSystem?.getFormationRadius(unit) || 40;
            return {
                minX: unit.x - radius,
                maxX: unit.x + radius,
                minY: unit.y - radius,
                maxY: unit.y + radius,
                centerX: unit.x,
                centerY: unit.y,
                width: radius * 2,
                height: radius * 2
            };
        }

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) {
            return { minX: unit.x, maxX: unit.x, minY: unit.y, maxY: unit.y, centerX: unit.x, centerY: unit.y, width: 0, height: 0 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const soldier of aliveSoldiers) {
            minX = Math.min(minX, soldier.x);
            maxX = Math.max(maxX, soldier.x);
            minY = Math.min(minY, soldier.y);
            maxY = Math.max(maxY, soldier.y);
        }

        return {
            minX,
            maxX,
            minY,
            maxY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Rend les overlays des unités (sélection, barres de vie)
     */
    renderUnitOverlays(ctx) {
        const allUnits = [...this.attackerUnits, ...this.defenderUnits];

        for (const unit of allUnits) {
            if (unit.currentMen <= 0) continue;

            const isSelected = this.selectedUnit === unit;
            const faction = FACTIONS[unit.side === 'attacker' ? this.attacker.faction : this.defender.faction];
            const bbox = this.getUnitBoundingBox(unit);

            // Rectangle de sélection au lieu d'un cercle
            if (isSelected) {
                const padding = 8;
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    bbox.minX - padding,
                    bbox.minY - padding,
                    bbox.width + padding * 2,
                    bbox.height + padding * 2
                );
            }

            // Barre de vie de l'unité (positionnée sous la formation)
            const healthPercent = unit.currentMen / unit.men;
            const barWidth = Math.max(50, bbox.width);
            const barX = bbox.centerX - barWidth / 2;
            const barY = bbox.maxY + 8;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, 4);

            let healthColor = '#0f0';
            if (healthPercent <= 0.5) healthColor = '#ff0';
            if (healthPercent <= 0.25) healthColor = '#f00';
            ctx.fillStyle = healthColor;
            ctx.fillRect(barX, barY, barWidth * healthPercent, 4);

            // Nom de l'unité
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = faction.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(unit.name, bbox.centerX, barY + 14);
            ctx.fillText(unit.name, bbox.centerX, barY + 14);

            // Indicateur de fuite
            if (unit.state === 'routing') {
                ctx.font = '16px Arial';
                ctx.fillText('💨', bbox.maxX + 5, bbox.minY);
            }
        }
    }

    /**
     * Ancien système de rendu (fallback) - utilise des rectangles
     */
    renderUnitsLegacy(ctx) {
        [...this.attackerUnits, ...this.defenderUnits].forEach(unit => {
            if (unit.currentMen <= 0) return;

            const faction = FACTIONS[unit.side === 'attacker' ? this.attacker.faction : this.defender.faction];
            const isSelected = this.selectedUnit === unit;
            const size = 50; // Taille de la zone de l'unité

            // Rectangle de sélection
            if (isSelected) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.strokeRect(unit.x - size/2 - 5, unit.y - size/2 - 5, size + 10, size + 10);
            }

            // Rectangle de l'unité
            ctx.fillStyle = faction.color;
            ctx.fillRect(unit.x - size/2, unit.y - size/2, size, size);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(unit.x - size/2, unit.y - size/2, size, size);

            // Icône de l'unité
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(unit.icon, unit.x, unit.y);

            // Barre de vie
            const healthPercent = unit.currentMen / unit.men;
            ctx.fillStyle = '#333';
            ctx.fillRect(unit.x - size/2, unit.y + size/2 + 5, size, 6);
            let healthColor = '#0f0';
            if (healthPercent <= 0.5) healthColor = '#ff0';
            if (healthPercent <= 0.25) healthColor = '#f00';
            ctx.fillStyle = healthColor;
            ctx.fillRect(unit.x - size/2, unit.y + size/2 + 5, size * healthPercent, 6);

            // Nom de l'unité
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(unit.name, unit.x, unit.y + size/2 + 18);
            ctx.fillText(unit.name, unit.x, unit.y + size/2 + 18);

            // Indicateur de fuite
            if (unit.state === 'routing') {
                ctx.font = '16px Arial';
                ctx.fillText('💨', unit.x + size/2 + 5, unit.y - size/2);
            }
        });
    }

    /**
     * Dessine les obstacles
     */
    renderObstacles(ctx) {
        this.obstacles.forEach(obs => {
            switch (obs.type) {
                case 'forest':
                    // Fond de forêt
                    ctx.fillStyle = '#1a4d1a';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    // Arbres plus grands et mieux espacés
                    ctx.font = '36px Arial';
                    ctx.textAlign = 'center';
                    const treeSpacingX = 60;
                    const treeSpacingY = 55;
                    for (let i = 0; i < obs.width / treeSpacingX; i++) {
                        for (let j = 0; j < obs.height / treeSpacingY; j++) {
                            // Légère variation de position pour un aspect naturel
                            const offsetX = (j % 2) * 25;
                            const randX = Math.sin(i * 13 + j * 7) * 8;
                            const randY = Math.cos(i * 11 + j * 5) * 6;
                            ctx.fillText('🌲', obs.x + 30 + i * treeSpacingX + offsetX + randX, obs.y + 30 + j * treeSpacingY + randY);
                        }
                    }
                    break;

                case 'hill':
                    const gradient = ctx.createRadialGradient(obs.x, obs.y, 0, obs.x, obs.y, obs.radius);
                    gradient.addColorStop(0, '#9b8465');
                    gradient.addColorStop(0.7, '#7b6455');
                    gradient.addColorStop(1, '#5d4e37');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
                    ctx.fill();
                    // Contour pour mieux voir
                    ctx.strokeStyle = '#4a3d2a';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;

                case 'river':
                    // Rivière avec effet d'eau
                    ctx.fillStyle = '#2d5a7b';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    // Reflets
                    ctx.fillStyle = 'rgba(100, 180, 220, 0.3)';
                    for (let i = 0; i < obs.width; i += 100) {
                        ctx.fillRect(obs.x + i + 20, obs.y + obs.height * 0.3, 40, 3);
                        ctx.fillRect(obs.x + i + 50, obs.y + obs.height * 0.6, 30, 2);
                    }
                    // Berges
                    ctx.fillStyle = '#5d4e37';
                    ctx.fillRect(obs.x, obs.y - 5, obs.width, 8);
                    ctx.fillRect(obs.x, obs.y + obs.height - 3, obs.width, 8);
                    break;

                case 'bridge':
                    // Pont en bois plus détaillé
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    // Planches
                    ctx.strokeStyle = '#5d3a1a';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < obs.width; i += 20) {
                        ctx.beginPath();
                        ctx.moveTo(obs.x + i, obs.y);
                        ctx.lineTo(obs.x + i, obs.y + obs.height);
                        ctx.stroke();
                    }
                    // Garde-fous
                    ctx.fillStyle = '#6b4423';
                    ctx.fillRect(obs.x, obs.y, obs.width, 8);
                    ctx.fillRect(obs.x, obs.y + obs.height - 8, obs.width, 8);
                    break;

                case 'rock':
                    // Rocher avec dégradé
                    const rockGradient = ctx.createRadialGradient(
                        obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, 0,
                        obs.x, obs.y, obs.radius
                    );
                    rockGradient.addColorStop(0, '#888888');
                    rockGradient.addColorStop(1, '#555555');
                    ctx.fillStyle = rockGradient;
                    ctx.beginPath();
                    ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
                    ctx.fill();
                    // Contour
                    ctx.strokeStyle = '#3a3a3a';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;

                case 'wall':
                    const healthRatio = obs.health / obs.maxHealth;
                    ctx.fillStyle = healthRatio > 0.5 ? '#8b7355' : '#6b5344';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    break;

                case 'tower':
                    ctx.fillStyle = '#8b7355';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    ctx.font = '24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🏰', obs.x + obs.width/2, obs.y + obs.height/2 + 8);
                    break;

                case 'gate':
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    break;

                case 'building':
                    ctx.fillStyle = '#8b7355';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(obs.buildingType || '🏠', obs.x + obs.width/2, obs.y + obs.height/2 + 6);
                    break;
            }
        });
    }

    /**
     * Dessine l'UI par-dessus
     */
    renderUI(ctx, width, height) {
        if (this.isPaused) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, width, height);
            ctx.font = '48px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('⏸️ PAUSE', width / 2, height / 2);
        }

        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, 10, 20);

        if (this.useNewSystem && this.projectileSystem) {
            ctx.fillText(`Projectiles: ${this.projectileSystem.count}`, 10, 40);
        }

        if (this.isSiege) {
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`⚔️ SIÈGE DE ${this.siegeCity.name.toUpperCase()} ⚔️`, width / 2, 25);
        }

        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('Molette: Zoom | Clic droit: Déplacer', width - 10, 20);
    }

    /**
     * Met en pause / reprend
     */
    pause() {
        this.isPaused = !this.isPaused;
    }

    /**
     * Change la vitesse
     */
    speedUp() {
        this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : 1;
        this.game.notify(`Vitesse: x${this.speed}`, 'info');
    }

    /**
     * Bat en retraite
     */
    retreat() {
        if (this.attacker.faction === this.game.playerFaction) {
            this.endBattle('defender');
        } else {
            this.endBattle('attacker');
        }
    }

    /**
     * Termine la bataille
     */
    endBattle(winner) {
        this.isRunning = false;

        // Nettoyer les systèmes
        if (this.projectileSystem) {
            this.projectileSystem.clear();
        }
        if (this.debugManager) {
            this.debugManager.destroy();
        }
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
        }

        const playerWon = (winner === 'attacker' && this.attacker.faction === this.game.playerFaction) ||
                         (winner === 'defender' && this.defender.faction === this.game.playerFaction);

        this.result = playerWon ? 'victory' : 'defeat';

        const loserUnits = winner === 'attacker' ? this.defenderUnits : this.attackerUnits;
        this.captured = loserUnits.reduce((sum, u) => sum + Math.floor(u.currentMen * 0.3), 0);

        const winnerArmy = winner === 'attacker' ? this.attacker : this.defender;
        const loserArmy = winner === 'attacker' ? this.defender : this.attacker;
        const winnerUnits = winner === 'attacker' ? this.attackerUnits : this.defenderUnits;

        winnerArmy.units = winnerUnits.filter(u => u.currentMen > 0).map(u => ({
            ...u,
            experience: u.experience + 1,
            soldiers: undefined,
            deadBodies: undefined
        }));

        this.game.armyManager.removeArmy(loserArmy.id);

        if (this.isSiege && this.siegeCity) {
            if (winner === 'attacker') {
                this.game.armyManager.captureCity(this.siegeCity, this.attacker.faction);
            }
        }

        this.showResult();
    }

    /**
     * Affiche le résultat
     */
    showResult() {
        const resultTitle = document.getElementById('resultTitle');
        resultTitle.textContent = this.result === 'victory' ? 'VICTOIRE!' : 'DÉFAITE...';
        resultTitle.className = this.result;

        const resultStats = document.getElementById('resultStats');
        const attackerLosses = this.attacker.units.reduce((sum, u) => sum + u.men, 0) -
                              this.attackerUnits.reduce((sum, u) => sum + u.currentMen, 0);
        const defenderLosses = this.defender.units.reduce((sum, u) => sum + u.men, 0) -
                              this.defenderUnits.reduce((sum, u) => sum + u.currentMen, 0);

        resultStats.innerHTML = `
            <div class="result-stat">
                <div class="label">Pertes de l'attaquant</div>
                <div class="value">${attackerLosses}</div>
            </div>
            <div class="result-stat">
                <div class="label">Pertes du défenseur</div>
                <div class="value">${defenderLosses}</div>
            </div>
        `;

        const capturedOptions = document.getElementById('capturedOptions');
        if (this.result === 'victory' && this.captured > 0) {
            document.getElementById('capturedCount').textContent = this.captured;
            capturedOptions.classList.remove('hidden');
        } else {
            capturedOptions.classList.add('hidden');
        }

        this.game.screens.show('battleResult');
    }

    /**
     * Exécute les prisonniers
     */
    executePrisoners() {
        this.game.resources.politics -= 10;
        this.game.notify(`${this.captured} prisonniers exécutés. Politique: -10`, 'warning');
        document.getElementById('capturedOptions').classList.add('hidden');
    }

    /**
     * Réduit en esclavage
     */
    enslavePrisoners() {
        const gold = this.captured * 10;
        this.game.resources.gold += gold;
        this.game.notify(`${this.captured} prisonniers vendus comme esclaves. Or: +${gold}`, 'success');
        document.getElementById('capturedOptions').classList.add('hidden');
    }

    /**
     * Libère les prisonniers
     */
    releasePrisoners() {
        this.game.resources.politics += 5;
        this.game.notify(`${this.captured} prisonniers libérés. Politique: +5`, 'success');
        document.getElementById('capturedOptions').classList.add('hidden');
    }

    /**
     * Retourne à la campagne
     */
    returnToCampaign() {
        this.game.screens.show('campaignScreen');
        this.game.updateUI();
    }
}

export default BattleSystem;

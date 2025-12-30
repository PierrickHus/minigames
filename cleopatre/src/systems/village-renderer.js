// ==========================================
// RENDU DU VILLAGE
// ==========================================

import { BUILDINGS } from '../data/index.js';

class VillageRenderer {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('villageCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.tileSize = 60;
        this.gridWidth = 15;
        this.gridHeight = 10;

        // État de la vue
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedTile = null;
        this.hoveredTile = null;

        // Grille du village (null = vide, string = buildingId)
        this.grid = [];
        this.initGrid();

        // Animations
        this.animations = [];
        this.peasantPositions = [];

        this.setupCanvas();
        this.setupEvents();
    }

    /**
     * Initialise la grille vide
     */
    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = null;
            }
        }
    }

    /**
     * Configure le canvas
     */
    setupCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Redimensionne le canvas
     */
    resize() {
        const container = this.canvas.parentElement; // #villageArea
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Centrer la vue
        this.offsetX = (this.canvas.width - this.gridWidth * this.tileSize) / 2;
        this.offsetY = (this.canvas.height - this.gridHeight * this.tileSize) / 2;
    }

    /**
     * Configure les événements
     */
    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top - this.offsetY;

            const tileX = Math.floor(x / this.tileSize);
            const tileY = Math.floor(y / this.tileSize);

            if (tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight) {
                this.hoveredTile = { x: tileX, y: tileY };
            } else {
                this.hoveredTile = null;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredTile) {
                this.handleTileClick(this.hoveredTile.x, this.hoveredTile.y);
            } else {
                // Clic en dehors de la grille - fermer le panneau
                this.game.closeSidePanel();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredTile = null;
        });
    }

    /**
     * Gère le clic sur une tuile
     */
    handleTileClick(x, y) {
        const building = this.grid[y][x];

        if (building) {
            // Afficher les infos du bâtiment
            this.game.showBuildingInfo(building, x, y);
        } else {
            // Tuile vide - fermer le panneau d'info si ouvert
            this.game.closeSidePanel();
            this.selectedTile = { x, y };
        }
    }

    /**
     * Réserve une place pour un bâtiment en construction
     */
    placeBuilding(buildingId) {
        // Trouver une place libre
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] === null) {
                    // Marquer comme en construction (pas encore construit)
                    this.grid[y][x] = {
                        id: buildingId,
                        constructing: true
                    };

                    return { x, y };
                }
            }
        }
        return null;
    }

    /**
     * Finalise un bâtiment construit
     */
    finishBuilding(x, y) {
        if (this.grid[y] && this.grid[y][x]) {
            this.grid[y][x].constructing = false;
            this.grid[y][x].builtAt = Date.now();

            // Animation de construction terminée
            this.addAnimation({
                type: 'build',
                x: x,
                y: y,
                duration: 1000,
                startTime: Date.now()
            });
        }
    }

    /**
     * Ajoute une animation
     */
    addAnimation(animation) {
        this.animations.push(animation);
    }

    /**
     * Met à jour les animations
     */
    updateAnimations(deltaTime) {
        const now = Date.now();
        this.animations = this.animations.filter(anim => {
            return now - anim.startTime < anim.duration;
        });
    }

    /**
     * Met à jour les positions des paysans
     */
    updatePeasants() {
        const peasantCount = Math.min(this.game.state.availablePeasants, 20);

        // Ajuster le nombre de paysans visibles
        while (this.peasantPositions.length < peasantCount) {
            this.peasantPositions.push({
                x: Math.random() * this.gridWidth * this.tileSize,
                y: Math.random() * this.gridHeight * this.tileSize,
                targetX: Math.random() * this.gridWidth * this.tileSize,
                targetY: Math.random() * this.gridHeight * this.tileSize,
                gender: Math.random() > 0.5 ? 'male' : 'female'
            });
        }

        while (this.peasantPositions.length > peasantCount) {
            this.peasantPositions.pop();
        }

        // Déplacer les paysans
        this.peasantPositions.forEach(peasant => {
            const dx = peasant.targetX - peasant.x;
            const dy = peasant.targetY - peasant.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                // Nouvelle destination
                peasant.targetX = Math.random() * this.gridWidth * this.tileSize;
                peasant.targetY = Math.random() * this.gridHeight * this.tileSize;
            } else {
                peasant.x += (dx / dist) * 0.5;
                peasant.y += (dy / dist) * 0.5;
            }
        });
    }

    /**
     * Dessine le village
     */
    render() {
        const ctx = this.ctx;

        // Fond désert
        ctx.fillStyle = '#c2a668';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner le Nil en arrière-plan
        this.drawNile();

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);

        // Dessiner la grille
        this.drawGrid();

        // Dessiner les bâtiments
        this.drawBuildings();

        // Dessiner les paysans
        this.drawPeasants();

        // Dessiner les animations
        this.drawAnimations();

        // Dessiner le survol
        if (this.hoveredTile) {
            this.drawHover();
        }

        ctx.restore();

        // Dessiner les décorations
        this.drawDecorations();
    }

    /**
     * Dessine le Nil
     */
    drawNile() {
        const ctx = this.ctx;

        // Rivière en bas
        const riverY = this.canvas.height - 60;

        // Gradient pour l'eau
        const gradient = ctx.createLinearGradient(0, riverY, 0, this.canvas.height);
        gradient.addColorStop(0, '#4a90c2');
        gradient.addColorStop(1, '#2c5a8a');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, riverY, this.canvas.width, 60);

        // Vagues
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        const time = Date.now() / 1000;

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 10) {
                const y = riverY + 15 + i * 15 + Math.sin(x * 0.02 + time + i) * 3;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Roseaux
        ctx.fillStyle = '#4a7c4e';
        for (let x = 20; x < this.canvas.width; x += 80) {
            const height = 30 + Math.sin(x) * 10;
            ctx.fillRect(x, riverY - height, 3, height + 5);
            ctx.fillRect(x + 5, riverY - height + 5, 3, height);
            ctx.fillRect(x + 10, riverY - height + 10, 3, height - 5);
        }
    }

    /**
     * Dessine la grille
     */
    drawGrid() {
        const ctx = this.ctx;

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                // Fond de la tuile
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = 'rgba(210,180,120,0.3)';
                } else {
                    ctx.fillStyle = 'rgba(200,170,110,0.3)';
                }
                ctx.fillRect(px, py, this.tileSize, this.tileSize);

                // Bordure
                ctx.strokeStyle = 'rgba(139,115,85,0.3)';
                ctx.strokeRect(px, py, this.tileSize, this.tileSize);
            }
        }
    }

    /**
     * Dessine les bâtiments
     */
    drawBuildings() {
        const ctx = this.ctx;

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.grid[y][x];
                if (cell) {
                    const building = BUILDINGS[cell.id];
                    const px = x * this.tileSize;
                    const py = y * this.tileSize;

                    if (cell.constructing) {
                        // Bâtiment en construction
                        // Trouver la progression depuis l'état du jeu
                        const construction = this.game.state.constructions.find(c =>
                            c.position && c.position.x === x && c.position.y === y
                        );
                        const progress = construction ? construction.elapsed / construction.totalTime : 0;

                        // Fond en construction
                        ctx.fillStyle = 'rgba(255,215,0,0.3)';
                        ctx.fillRect(px, py, this.tileSize, this.tileSize);

                        // Barre de progression
                        ctx.fillStyle = '#333';
                        ctx.fillRect(px + 5, py + this.tileSize - 12, this.tileSize - 10, 8);
                        ctx.fillStyle = '#4ade80';
                        ctx.fillRect(px + 5, py + this.tileSize - 12, (this.tileSize - 10) * progress, 8);

                        // Icône semi-transparente
                        ctx.globalAlpha = 0.5;
                        ctx.font = '28px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(building.icon, px + this.tileSize / 2, py + this.tileSize / 2 - 5);
                        ctx.globalAlpha = 1;

                        // Icône de construction
                        ctx.font = '16px Arial';
                        ctx.fillText('🏗️', px + this.tileSize - 15, py + 15);
                    } else {
                        // Bâtiment terminé
                        // Ombre
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.fillRect(px + 5, py + 5, this.tileSize - 5, this.tileSize - 5);

                        // Fond du bâtiment
                        ctx.fillStyle = '#8b7355';
                        ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);

                        // Icône
                        ctx.font = '32px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(building.icon, px + this.tileSize / 2, py + this.tileSize / 2);
                    }
                }
            }
        }
    }

    /**
     * Dessine les paysans
     */
    drawPeasants() {
        const ctx = this.ctx;

        this.peasantPositions.forEach(peasant => {
            // Icône du paysan
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const icon = peasant.gender === 'male' ? '👨' : '👩';
            ctx.fillText(icon, peasant.x, peasant.y);
        });
    }

    /**
     * Dessine les animations
     */
    drawAnimations() {
        const ctx = this.ctx;
        const now = Date.now();

        this.animations.forEach(anim => {
            const progress = (now - anim.startTime) / anim.duration;

            if (anim.type === 'build') {
                const px = anim.x * this.tileSize + this.tileSize / 2;
                const py = anim.y * this.tileSize + this.tileSize / 2;

                // Effet de brillance
                ctx.beginPath();
                ctx.arc(px, py, (1 - progress) * 50, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,215,0,${0.5 * (1 - progress)})`;
                ctx.fill();
            }
        });
    }

    /**
     * Dessine le survol
     */
    drawHover() {
        const ctx = this.ctx;
        const { x, y } = this.hoveredTile;
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(px, py, this.tileSize, this.tileSize);

        // Si vide, afficher un indicateur
        if (!this.grid[y][x]) {
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
        }
    }

    /**
     * Dessine les décorations
     */
    drawDecorations() {
        const ctx = this.ctx;

        // Palmiers sur les côtés
        ctx.font = '40px Arial';
        ctx.fillText('🌴', 30, 150);
        ctx.fillText('🌴', this.canvas.width - 380, 200);
        ctx.fillText('🌴', 50, this.canvas.height - 120);

        // Soleil
        ctx.font = '50px Arial';
        ctx.fillText('☀️', this.canvas.width - 420, 60);
    }

    /**
     * Boucle de mise à jour
     */
    update(deltaTime) {
        this.updateAnimations(deltaTime);
        this.updatePeasants();
    }
}

export default VillageRenderer;

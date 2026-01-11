// ==========================================
// SYSTÈME D'INTERFACE UTILISATEUR SUR CANVAS
// Gère l'affichage des boutons et cartes d'unités directement sur le canvas
// ==========================================

/**
 * Gestionnaire de l'interface utilisateur overlay sur le canvas de bataille
 * Affiche les boutons d'action et les cartes d'unités directement sur le canvas
 */
class BattleUIOverlay {
    /**
     * Crée un nouveau gestionnaire d'interface overlay
     * @param {BattleSystem} battle - Référence au système de bataille
     */
    constructor(battle) {
        this.battle = battle;

        // Configuration des boutons d'action
        this.actionButtons = [];
        this.initializeActionButtons();

        // Configuration des cartes d'unités
        this.unitCardWidth = 120;
        this.unitCardHeight = 60;
        this.unitCardSpacing = 8;
        this.unitCardsStartX = 10;
        this.unitCardsY = null; // Sera calculé en fonction de la hauteur du canvas
        this.unitCardsPadding = 10; // Padding intérieur du conteneur
        this.unitCardsBottomMargin = 20; // Marge depuis le bas

        // État de l'interaction
        this.hoveredButton = null;
        this.hoveredUnitCard = null;
        this.isUnitCardsCollapsed = false;
        this.collapseButton = {
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            isHovered: false
        };

        // Bind des événements
        this.setupEventListeners();
    }

    /**
     * Initialise les boutons d'action
     * @returns {void}
     */
    initializeActionButtons() {
        const buttonWidth = 140;
        const buttonHeight = 45;
        const buttonSpacing = 10;
        const startX = null; // Sera calculé pour positionner en haut à droite
        const topMargin = 10;
        const rightMargin = 10;

        this.actionButtons = [
            {
                id: 'pause',
                label: '⏸️ Pause',
                x: startX,
                y: null, // Sera calculé
                width: buttonWidth,
                height: buttonHeight,
                action: () => this.battle.pause(),
                bgColor: '#4a4a6a',
                bgHoverColor: '#5a5a7a',
                borderColor: '#666',
                textColor: '#fff'
            },
            {
                id: 'speed',
                label: '⏩ Vitesse x1',
                x: startX,
                y: null,
                width: buttonWidth,
                height: buttonHeight,
                action: () => this.battle.speedUp(),
                bgColor: '#4a4a6a',
                bgHoverColor: '#5a5a7a',
                borderColor: '#666',
                textColor: '#fff'
            },
            {
                id: 'retreat',
                label: '🏃 Retraite',
                x: startX,
                y: null,
                width: buttonWidth,
                height: buttonHeight,
                action: () => this.battle.retreat(),
                bgColor: '#8b4513',
                bgHoverColor: '#a0522d',
                borderColor: '#c9a227',
                textColor: '#ffd700'
            }
        ];

        this.topMargin = topMargin;
        this.rightMargin = rightMargin;
        this.buttonWidth = buttonWidth;
        this.buttonHeight = buttonHeight;
        this.buttonSpacing = buttonSpacing;
    }

    /**
     * Met à jour les positions des boutons en fonction de la taille du canvas
     * @returns {void}
     */
    updateButtonPositions() {
        const canvas = this.battle.canvas;

        // Boutons en haut à droite, empilés verticalement
        const startX = canvas.width - this.buttonWidth - this.rightMargin;

        this.actionButtons.forEach((button, index) => {
            button.x = startX;
            button.y = this.topMargin + (index * (this.buttonHeight + this.buttonSpacing));
        });

        // Cartes d'unités en bas au centre
        const playerUnits = this.getPlayerUnits();
        if (playerUnits.length > 0) {
            const totalCardsWidth = playerUnits.length * (this.unitCardWidth + this.unitCardSpacing) - this.unitCardSpacing;
            const containerWidth = totalCardsWidth + this.unitCardsPadding * 2;
            const containerHeight = this.unitCardHeight + this.unitCardsPadding * 2;

            // Position du conteneur (centré)
            this.unitCardsContainerX = (canvas.width - containerWidth) / 2;
            this.unitCardsContainerY = canvas.height - containerHeight - this.unitCardsBottomMargin;
            this.unitCardsContainerWidth = containerWidth;
            this.unitCardsContainerHeight = containerHeight;

            // Position des cartes à l'intérieur du conteneur
            this.unitCardsStartX = this.unitCardsContainerX + this.unitCardsPadding;
            this.unitCardsY = this.unitCardsContainerY + this.unitCardsPadding;

            // Position du bouton collapse (à gauche du conteneur)
            this.collapseButton.x = this.unitCardsContainerX - this.collapseButton.width - 10;
            this.collapseButton.y = this.unitCardsContainerY + (containerHeight - this.collapseButton.height) / 2;
        }
    }

    /**
     * Configure les écouteurs d'événements pour l'interaction avec l'UI
     * @returns {void}
     */
    setupEventListeners() {
        // Les événements sont gérés via handleClick et handleMouseMove
        // appelés depuis le système de bataille principal
    }

    /**
     * Gère le clic sur l'interface overlay
     * @param {number} screenX - Coordonnée X de l'écran (canvas)
     * @param {number} screenY - Coordonnée Y de l'écran (canvas)
     * @returns {boolean} - True si un élément UI a été cliqué, false sinon
     */
    handleClick(screenX, screenY) {
        // Vérifier le bouton collapse
        if (this.isPointInRect(screenX, screenY, this.collapseButton)) {
            this.isUnitCardsCollapsed = !this.isUnitCardsCollapsed;
            return true;
        }

        // Si les cartes sont repliées, ne pas vérifier les autres interactions avec les cartes
        if (this.isUnitCardsCollapsed) {
            // Vérifier quand même les boutons d'action
            for (const button of this.actionButtons) {
                if (this.isPointInButton(screenX, screenY, button)) {
                    button.action();

                    // Mettre à jour le label du bouton de vitesse
                    if (button.id === 'speed') {
                        button.label = `⏩ Vitesse x${this.battle.speed}`;
                    }

                    return true;
                }
            }
            return false;
        }

        // Vérifier les boutons d'action
        for (const button of this.actionButtons) {
            if (this.isPointInButton(screenX, screenY, button)) {
                button.action();

                // Mettre à jour le label du bouton de vitesse
                if (button.id === 'speed') {
                    button.label = `⏩ Vitesse x${this.battle.speed}`;
                }

                return true;
            }
        }

        // Vérifier les cartes d'unités
        const playerUnits = this.getPlayerUnits();
        for (let i = 0; i < playerUnits.length; i++) {
            const cardBounds = this.getUnitCardBounds(i);
            if (this.isPointInRect(screenX, screenY, cardBounds)) {
                this.battle.selectUnit(i);
                return true;
            }
        }

        return false;
    }

    /**
     * Gère le mouvement de la souris sur l'interface overlay
     * @param {number} screenX - Coordonnée X de l'écran (canvas)
     * @param {number} screenY - Coordonnée Y de l'écran (canvas)
     * @returns {boolean} - True si la souris survole un élément UI, false sinon
     */
    handleMouseMove(screenX, screenY) {
        let hovering = false;

        // Vérifier le bouton collapse
        this.collapseButton.isHovered = this.isPointInRect(screenX, screenY, this.collapseButton);
        if (this.collapseButton.isHovered) {
            hovering = true;
        }

        // Vérifier les boutons
        this.hoveredButton = null;
        for (const button of this.actionButtons) {
            if (this.isPointInButton(screenX, screenY, button)) {
                this.hoveredButton = button;
                hovering = true;
                break;
            }
        }

        // Vérifier les cartes d'unités (seulement si non repliées)
        this.hoveredUnitCard = null;
        if (!this.isUnitCardsCollapsed) {
            const playerUnits = this.getPlayerUnits();
            for (let i = 0; i < playerUnits.length; i++) {
                const cardBounds = this.getUnitCardBounds(i);
                if (this.isPointInRect(screenX, screenY, cardBounds)) {
                    this.hoveredUnitCard = i;
                    hovering = true;
                    break;
                }
            }
        }

        return hovering;
    }

    /**
     * Vérifie si un point est dans un bouton
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {Object} button - Objet bouton
     * @returns {boolean}
     */
    isPointInButton(x, y, button) {
        return x >= button.x &&
               x <= button.x + button.width &&
               y >= button.y &&
               y <= button.y + button.height;
    }

    /**
     * Vérifie si un point est dans un rectangle
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @returns {boolean}
     */
    isPointInRect(x, y, rect) {
        return x >= rect.x &&
               x <= rect.x + rect.width &&
               y >= rect.y &&
               y <= rect.y + rect.height;
    }

    /**
     * Obtient les unités du joueur
     * @returns {Array} - Tableau des unités du joueur
     */
    getPlayerUnits() {
        return this.battle.attacker.faction === this.battle.game.playerFaction
            ? this.battle.attackerUnits
            : this.battle.defenderUnits;
    }

    /**
     * Calcule les dimensions d'une carte d'unité
     * @param {number} index - Index de l'unité
     * @returns {Object} - {x, y, width, height}
     */
    getUnitCardBounds(index) {
        return {
            x: this.unitCardsStartX + (index * (this.unitCardWidth + this.unitCardSpacing)),
            y: this.unitCardsY,
            width: this.unitCardWidth,
            height: this.unitCardHeight
        };
    }

    /**
     * Rend l'interface overlay sur le canvas
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @returns {void}
     */
    render(ctx) {
        // Mettre à jour les positions si nécessaire
        if (this.actionButtons[0].x === null) {
            this.updateButtonPositions();
        }

        // Rendre les cartes d'unités (avec conteneur)
        this.renderUnitCardsContainer(ctx);

        // Rendre les boutons d'action
        this.renderActionButtons(ctx);
    }

    /**
     * Rend les boutons d'action
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @returns {void}
     */
    renderActionButtons(ctx) {
        this.actionButtons.forEach(button => {
            const isHovered = this.hoveredButton === button;

            // Ombre portée
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            // Fond du bouton avec dégradé
            const gradient = ctx.createLinearGradient(
                button.x, button.y,
                button.x, button.y + button.height
            );
            gradient.addColorStop(0, isHovered ? button.bgHoverColor : button.bgColor);
            gradient.addColorStop(1, this.darkenColor(isHovered ? button.bgHoverColor : button.bgColor, 0.3));

            ctx.fillStyle = gradient;
            this.roundRect(ctx, button.x, button.y, button.width, button.height, 5, true, false);

            // Réinitialiser l'ombre
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Bordure
            ctx.strokeStyle = button.borderColor;
            ctx.lineWidth = 2;
            this.roundRect(ctx, button.x, button.y, button.width, button.height, 5, false, true);

            // Effet de survol
            if (isHovered) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                this.roundRect(ctx, button.x + 2, button.y + 2, button.width - 4, button.height - 4, 3, false, true);
            }

            // Texte
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = button.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
        });
    }

    /**
     * Rend le conteneur des cartes d'unités avec le bouton collapse
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @returns {void}
     */
    renderUnitCardsContainer(ctx) {
        const playerUnits = this.getPlayerUnits();
        if (playerUnits.length === 0) return;

        // Rendre le bouton collapse
        this.renderCollapseButton(ctx);

        // Si replié, ne dessiner que le conteneur réduit
        if (this.isUnitCardsCollapsed) {
            // Petit conteneur avec juste un indicateur
            const collapsedWidth = 80;
            const collapsedHeight = 40;
            const collapsedX = this.unitCardsContainerX + (this.unitCardsContainerWidth - collapsedWidth) / 2;
            const collapsedY = this.unitCardsContainerY + (this.unitCardsContainerHeight - collapsedHeight) / 2;

            // Ombre portée
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;

            // Fond du conteneur réduit
            const gradient = ctx.createLinearGradient(collapsedX, collapsedY, collapsedX, collapsedY + collapsedHeight);
            gradient.addColorStop(0, 'rgba(42, 42, 74, 0.95)');
            gradient.addColorStop(1, 'rgba(26, 26, 46, 0.95)');
            ctx.fillStyle = gradient;
            this.roundRect(ctx, collapsedX, collapsedY, collapsedWidth, collapsedHeight, 8, true, false);

            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Bordure
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            this.roundRect(ctx, collapsedX, collapsedY, collapsedWidth, collapsedHeight, 8, false, true);

            // Texte indicateur
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${playerUnits.length} unités`, collapsedX + collapsedWidth / 2, collapsedY + collapsedHeight / 2);

            return;
        }

        // Ombre portée pour le conteneur
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        // Fond du conteneur avec dégradé
        const gradient = ctx.createLinearGradient(
            this.unitCardsContainerX, this.unitCardsContainerY,
            this.unitCardsContainerX, this.unitCardsContainerY + this.unitCardsContainerHeight
        );
        gradient.addColorStop(0, 'rgba(42, 42, 74, 0.95)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0.95)');
        ctx.fillStyle = gradient;
        this.roundRect(ctx, this.unitCardsContainerX, this.unitCardsContainerY, this.unitCardsContainerWidth, this.unitCardsContainerHeight, 8, true, false);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Bordure du conteneur
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        this.roundRect(ctx, this.unitCardsContainerX, this.unitCardsContainerY, this.unitCardsContainerWidth, this.unitCardsContainerHeight, 8, false, true);

        // Ligne dorée en haut pour l'accent
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.unitCardsContainerX + 10, this.unitCardsContainerY + 3);
        ctx.lineTo(this.unitCardsContainerX + this.unitCardsContainerWidth - 10, this.unitCardsContainerY + 3);
        ctx.stroke();

        // Rendre les cartes d'unités
        this.renderUnitCards(ctx);
    }

    /**
     * Rend le bouton collapse
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @returns {void}
     */
    renderCollapseButton(ctx) {
        const btn = this.collapseButton;

        // Ombre portée
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;

        // Fond
        const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
        gradient.addColorStop(0, btn.isHovered ? '#5a5a7a' : '#4a4a6a');
        gradient.addColorStop(1, this.darkenColor(btn.isHovered ? '#5a5a7a' : '#4a4a6a', 0.3));
        ctx.fillStyle = gradient;
        this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 5, true, false);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Bordure
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 5, false, true);

        // Icône (flèche)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isUnitCardsCollapsed ? '◀' : '▶', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    /**
     * Rend les cartes d'unités individuelles
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @returns {void}
     */
    renderUnitCards(ctx) {
        const playerUnits = this.getPlayerUnits();

        playerUnits.forEach((unit, index) => {
            if (unit.currentMen <= 0) return;

            const bounds = this.getUnitCardBounds(index);
            const isSelected = this.battle.selectedUnit === unit;
            const isHovered = this.hoveredUnitCard === index;

            // Ombre portée pour améliorer la lisibilité
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            // Fond de la carte
            const gradient = ctx.createLinearGradient(
                bounds.x, bounds.y,
                bounds.x, bounds.y + bounds.height
            );
            gradient.addColorStop(0, isHovered ? '#4a4a6a' : '#3a3a5a');
            gradient.addColorStop(1, isHovered ? '#3a3a5a' : '#2a2a4a');

            ctx.fillStyle = gradient;
            this.roundRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 5, true, false);

            // Réinitialiser l'ombre pour les autres éléments
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Bordure (dorée si sélectionnée)
            ctx.strokeStyle = isSelected ? '#ffd700' : '#555';
            ctx.lineWidth = isSelected ? 3 : 2;
            this.roundRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 5, false, true);

            // Effet de sélection (glow)
            if (isSelected) {
                ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
                ctx.shadowBlur = 15;
                this.roundRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 5, false, true);
                ctx.shadowBlur = 0;
            }

            // Icône et nom de l'unité (texte plus petit)
            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Tronquer le nom si trop long
            const maxNameLength = 10;
            const displayName = unit.name.length > maxNameLength
                ? unit.name.substring(0, maxNameLength) + '...'
                : unit.name;
            ctx.fillText(`${unit.icon} ${displayName}`, bounds.x + 6, bounds.y + 6);

            // Barre de vie
            const healthBarX = bounds.x + 6;
            const healthBarY = bounds.y + 26;
            const healthBarWidth = bounds.width - 12;
            const healthBarHeight = 5;
            const healthPercent = unit.currentMen / unit.men;

            // Fond de la barre
            ctx.fillStyle = '#333';
            this.roundRect(ctx, healthBarX, healthBarY, healthBarWidth, healthBarHeight, 3, true, false);

            // Barre de santé colorée
            let healthColor = '#0f0';
            if (healthPercent <= 0.5) healthColor = '#ff0';
            if (healthPercent <= 0.25) healthColor = '#f00';

            ctx.fillStyle = healthColor;
            this.roundRect(ctx, healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight, 3, true, false);

            // Texte du nombre d'hommes (plus petit)
            ctx.font = '9px Arial';
            ctx.fillStyle = '#aaa';
            ctx.textAlign = 'center';
            ctx.fillText(`${unit.currentMen}/${unit.men}`, bounds.x + bounds.width / 2, bounds.y + bounds.height - 10);
        });
    }

    /**
     * Dessine un rectangle arrondi
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} width - Largeur
     * @param {number} height - Hauteur
     * @param {number} radius - Rayon des coins
     * @param {boolean} fill - Remplir le rectangle
     * @param {boolean} stroke - Dessiner le contour
     * @returns {void}
     */
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    /**
     * Assombrit une couleur hexadécimale
     * @param {string} color - Couleur hex (#rrggbb)
     * @param {number} factor - Facteur d'assombrissement (0-1)
     * @returns {string} - Couleur assombrie
     */
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    /**
     * Nettoie les ressources
     * @returns {void}
     */
    destroy() {
        this.actionButtons = [];
        this.hoveredButton = null;
        this.hoveredUnitCard = null;
    }
}

export default BattleUIOverlay;

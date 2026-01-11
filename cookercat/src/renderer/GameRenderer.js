/**
 * Gère le rendu du jeu sur le canvas
 * Dessine la cuisine, les ustensiles, les ingrédients et le personnage
 */

import { INGREDIENTS, UTENSILS } from '../data/ingredients.js';

class GameRenderer {
    /**
     * Crée une nouvelle instance du renderer
     * @param {HTMLCanvasElement} canvas - Le canvas sur lequel dessiner
     */
    constructor(canvas) {
        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;

        /** @type {CanvasRenderingContext2D} */
        this.ctx = canvas.getContext('2d');

        /** @type {number} */
        this.width = 0;

        /** @type {number} */
        this.height = 0;

        /** @type {Object} Zones cliquables */
        this.clickableAreas = {
            utensils: [],
            ingredients: []
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Redimensionne le canvas pour occuper tout l'espace disponible
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Efface le canvas
     */
    clear() {
        this.ctx.fillStyle = '#34495E';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Dessine la cuisine de base
     */
    drawKitchen() {
        const ctx = this.ctx;

        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, this.height - 150, this.width, 150);

        ctx.fillStyle = '#7F8C8D';
        ctx.fillRect(0, this.height - 200, this.width, 50);

        ctx.fillStyle = '#95A5A6';
        for (let i = 0; i < this.width; i += 100) {
            ctx.fillRect(i, this.height - 200, 90, 45);
        }
    }

    /**
     * Dessine les ustensiles de cuisine
     * @param {Array<string>} highlightedUtensils - Ustensiles à mettre en évidence
     */
    drawUtensils(highlightedUtensils = []) {
        const utensilsList = Object.entries(UTENSILS);
        const spacing = Math.min(150, this.width / (utensilsList.length + 1));
        const startY = this.height - 350;

        this.clickableAreas.utensils = [];

        utensilsList.forEach(([id, utensil], index) => {
            const x = spacing * (index + 1);
            const y = startY;
            const size = 60;

            const isHighlighted = highlightedUtensils.includes(id);

            if (isHighlighted) {
                this.ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
                this.ctx.fillRect(x - size/2 - 10, y - size/2 - 10, size + 20, size + 20);
            }

            this.ctx.font = `${size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(utensil.icon, x, y);

            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(utensil.name, x, y + 50);

            this.clickableAreas.utensils.push({
                id,
                x: x - size/2,
                y: y - size/2,
                width: size,
                height: size
            });
        });
    }

    /**
     * Dessine le frigo avec les ingrédients
     * @param {Array<string>} neededIngredients - Ingrédients nécessaires pour la recette
     * @param {Array<string>} collectedIngredients - Ingrédients déjà collectés
     */
    drawFridge(neededIngredients = [], collectedIngredients = []) {
        const fridgeX = 50;
        const fridgeY = 50;
        const fridgeWidth = 200;
        const fridgeHeight = 300;

        this.ctx.fillStyle = '#ECF0F1';
        this.ctx.fillRect(fridgeX, fridgeY, fridgeWidth, fridgeHeight);

        this.ctx.strokeStyle = '#34495E';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(fridgeX, fridgeY, fridgeWidth, fridgeHeight);

        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🧊 FRIGO', fridgeX + fridgeWidth/2, fridgeY + 25);

        const ingredientsList = Object.entries(INGREDIENTS);
        const cols = 3;
        const iconSize = 40;
        const padding = 10;
        const startY = fridgeY + 50;

        this.clickableAreas.ingredients = [];

        ingredientsList.forEach(([id, ingredient], index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = fridgeX + padding + col * (fridgeWidth - padding * 2) / cols + iconSize/2;
            const y = startY + row * (iconSize + padding);

            const isNeeded = neededIngredients.includes(id);
            const isCollected = collectedIngredients.includes(id);

            if (isNeeded && !isCollected) {
                this.ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
                this.ctx.fillRect(x - iconSize/2 - 5, y - iconSize/2 - 5, iconSize + 10, iconSize + 10);
            }

            this.ctx.globalAlpha = isCollected ? 0.3 : 1.0;

            this.ctx.font = `${iconSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ingredient.icon, x, y);

            this.ctx.globalAlpha = 1.0;

            if (isCollected) {
                this.ctx.font = '24px Arial';
                this.ctx.fillText('✓', x + iconSize/3, y - iconSize/3);
            }

            this.clickableAreas.ingredients.push({
                id,
                x: x - iconSize/2,
                y: y - iconSize/2,
                width: iconSize,
                height: iconSize
            });
        });
    }

    /**
     * Dessine le personnage du joueur
     * @param {string} gender - Genre du personnage ('male' ou 'female')
     */
    drawCharacter(gender = 'male') {
        const x = this.width / 2;
        const y = this.height - 100;
        const size = 80;

        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🐱', x, y);

        this.ctx.font = '30px Arial';
        this.ctx.fillText('👨‍🍳', x + size/3, y - size/3);
    }

    /**
     * Dessine un client en attente
     * @param {number} position - Position du client (0-2)
     */
    drawCustomer(position = 0) {
        const spacing = this.width / 4;
        const x = spacing * (position + 1) * 0.8 + this.width * 0.2;
        const y = 100;
        const size = 60;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x - size/2 - 10, y - size/2 - 10, size + 20, size + 80);

        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🐱', x, y);

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Client', x, y + 50);
    }

    /**
     * Rendu complet du jeu
     * @param {Object} gameState - État actuel du jeu
     */
    render(gameState) {
        this.clear();
        this.drawKitchen();

        const neededIngredients = gameState.currentOrder?.ingredients || [];
        const highlightedUtensil = gameState.currentOrder?.steps[gameState.currentStep]?.utensil;

        this.drawFridge(neededIngredients, gameState.collectedIngredients);
        this.drawUtensils(highlightedUtensil ? [highlightedUtensil] : []);
        this.drawCharacter(gameState.characterGender || 'male');
        this.drawCustomer(0);
    }

    /**
     * Obtient l'élément cliqué aux coordonnées données
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @returns {Object|null} Élément cliqué ou null
     */
    getClickedElement(x, y) {
        for (const ingredient of this.clickableAreas.ingredients) {
            if (x >= ingredient.x && x <= ingredient.x + ingredient.width &&
                y >= ingredient.y && y <= ingredient.y + ingredient.height) {
                return { type: 'ingredient', id: ingredient.id };
            }
        }

        for (const utensil of this.clickableAreas.utensils) {
            if (x >= utensil.x && x <= utensil.x + utensil.width &&
                y >= utensil.y && y <= utensil.y + utensil.height) {
                return { type: 'utensil', id: utensil.id };
            }
        }

        return null;
    }
}

export default GameRenderer;

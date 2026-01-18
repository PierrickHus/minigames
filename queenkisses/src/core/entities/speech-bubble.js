/**
 * Bulle de dialogue pour afficher les messages de la reine
 * Gère l'animation fade in/out
 */
export class SpeechBubble {
    constructor() {
        this.text = '';
        this.x = 0;
        this.y = 0;
        this.color = '#8b4513';
        this.active = false;
        this.alpha = 0;
        this.targetAlpha = 0;
        this.duration = 0;
        this.startTime = 0;
    }

    /**
     * Affiche une bulle de dialogue
     * @param {string} text - Texte à afficher
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {string} color - Couleur du texte
     * @param {number} duration - Durée d'affichage en ms
     */
    show(text, x, y, color = '#8b4513', duration = 2500) {
        this.text = text;
        this.x = x + 25;
        this.y = y;
        this.color = color;
        this.active = true;
        this.alpha = 0;
        this.targetAlpha = 1;
        this.duration = duration;
        this.startTime = Date.now();
    }

    /**
     * Met à jour l'état de la bulle
     */
    update() {
        if (!this.active) return;

        const elapsed = Date.now() - this.startTime;

        if (this.alpha < this.targetAlpha) {
            this.alpha = Math.min(this.targetAlpha, this.alpha + 0.1);
        }

        if (elapsed > this.duration - 500) {
            this.alpha = Math.max(0, this.alpha - 0.05);
        }

        if (elapsed > this.duration) {
            this.active = false;
            this.alpha = 0;
        }
    }

    /**
     * Met à jour la position de la bulle
     * @param {number} x - Nouvelle position X
     * @param {number} y - Nouvelle position Y
     */
    updatePosition(x, y) {
        if (this.active) {
            this.x = x + 25;
            this.y = y;
        }
    }
}

/**
 * Overlay rouge vignette lors de dégâts au joueur
 * L'opacité est proportionnelle aux dégâts reçus et s'estompe progressivement
 */
export class DamageOverlay {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this._element = document.getElementById('damageOverlay');
        this._currentOpacity = 0;
        this._targetOpacity = 0;

        eventBus.on('player-damaged', (data) => {
            // Opacité proportionnelle aux dégâts (max 0.7)
            const intensity = Math.min(data.damage / 50, 0.7);
            this._targetOpacity = Math.max(this._currentOpacity, intensity);
        });
    }

    /**
     * Met à jour le fondu de l'overlay
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (this._targetOpacity > this._currentOpacity) {
            this._currentOpacity = this._targetOpacity;
            this._targetOpacity = 0;
        } else if (this._currentOpacity > 0) {
            this._currentOpacity = Math.max(0, this._currentOpacity - deltaTime * 3);
        }

        const opacityStr = String(this._currentOpacity.toFixed(2));
        if (this._element.style.opacity !== opacityStr) {
            this._element.style.opacity = opacityStr;
        }
    }
}

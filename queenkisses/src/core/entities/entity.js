/**
 * Classe de base pour toutes les entités du jeu
 * Fournit les propriétés communes à toutes les entités (position)
 */
export class Entity {
    /**
     * Crée une nouvelle entité
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Met à jour l'entité
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame en ms
     */
    update(deltaTime) {
    }
}

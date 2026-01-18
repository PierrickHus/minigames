/**
 * Système de détection de collisions
 * Responsabilité unique: vérifier les collisions entre entités
 */

/**
 * Gestionnaire des collisions
 */
export class CollisionSystem {
    /**
     * Vérifie la collision entre le roi et un diamant
     * @param {King} king - Le roi
     * @param {Diamond} diamond - Le diamant
     * @returns {boolean} True si collision
     */
    checkKingDiamondCollision(king, diamond) {
        return king.x < diamond.x + diamond.width &&
               king.x + king.width > diamond.x &&
               king.y < diamond.y + diamond.height &&
               king.y + king.height > diamond.y;
    }

    /**
     * Vérifie la collision entre le roi et un projectile
     * Utilise la hitbox précise du roi (style Touhou)
     * @param {King} king - Le roi
     * @param {Projectile} projectile - Le projectile
     * @returns {boolean} True si collision
     */
    checkKingProjectileCollision(king, projectile) {
        const projectileCenterX = projectile.x + projectile.size / 2;
        const projectileCenterY = projectile.y + projectile.size / 2;
        return king.checkHitboxCollision(projectileCenterX, projectileCenterY);
    }

    /**
     * Vérifie la collision entre le roi et la reine
     * @param {King} king - Le roi
     * @param {Queen} queen - La reine
     * @returns {boolean} True si collision
     */
    checkKingQueenCollision(king, queen) {
        const queenWidth = queen.isDemon ? 70 : 50;
        const queenHeight = queen.isDemon ? 70 : 50;

        return king.x < queen.x + queenWidth &&
               king.x + king.width > queen.x &&
               king.y < queen.y + queenHeight &&
               king.y + king.height > queen.y;
    }

    /**
     * Filtre les projectiles hors écran
     * @param {Projectile[]} projectiles - Tableau de projectiles
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
     * @returns {Projectile[]} Projectiles toujours à l'écran
     */
    filterOffscreenProjectiles(projectiles, canvasWidth, canvasHeight) {
        return projectiles.filter(p => !p.isOffScreen(canvasWidth, canvasHeight));
    }

    /**
     * Trouve les diamants en collision avec le roi
     * @param {King} king - Le roi
     * @param {Diamond[]} diamonds - Tableau de diamants
     * @returns {Diamond[]} Diamants en collision
     */
    findCollidingDiamonds(king, diamonds) {
        return diamonds.filter(diamond => this.checkKingDiamondCollision(king, diamond));
    }

    /**
     * Trouve les projectiles en collision avec le roi
     * @param {King} king - Le roi
     * @param {Projectile[]} projectiles - Tableau de projectiles
     * @returns {Projectile[]} Projectiles en collision
     */
    findCollidingProjectiles(king, projectiles) {
        return projectiles.filter(projectile => this.checkKingProjectileCollision(king, projectile));
    }
}

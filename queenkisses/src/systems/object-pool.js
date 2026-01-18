/**
 * Système d'Object Pooling générique
 * Responsabilité: Réutiliser les objets au lieu de les créer/détruire constamment
 * Avantages:
 * - Réduit le garbage collection
 * - Améliore les performances (pas d'allocation mémoire répétée)
 * - Plus stable en termes de FPS
 */

/**
 * Pool d'objets générique
 * @template T
 */
export class ObjectPool {
    /**
     * Crée un nouveau pool d'objets
     * @param {Function} createFn - Fonction qui crée un nouvel objet
     * @param {Function} resetFn - Fonction qui réinitialise un objet
     * @param {number} initialSize - Taille initiale du pool
     * @param {number} maxSize - Taille maximale du pool
     */
    constructor(createFn, resetFn, initialSize = 50, maxSize = 500) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;

        // Pool d'objets disponibles
        this.available = [];

        // Objets actuellement utilisés
        this.inUse = new Set();

        // Statistiques
        this.stats = {
            created: 0,
            reused: 0,
            poolHits: 0,
            poolMisses: 0
        };

        // Pré-création d'objets
        this.preallocate(initialSize);
    }

    /**
     * Pré-alloue des objets dans le pool
     * @param {number} count - Nombre d'objets à pré-créer
     */
    preallocate(count) {
        for (let i = 0; i < count; i++) {
            const obj = this.createFn();
            this.available.push(obj);
            this.stats.created++;
        }
    }

    /**
     * Obtient un objet du pool
     * @param {...any} args - Arguments pour réinitialiser l'objet
     * @returns {T} Objet du pool
     */
    acquire(...args) {
        let obj;

        if (this.available.length > 0) {
            // Réutiliser un objet du pool
            obj = this.available.pop();
            this.stats.poolHits++;
            this.stats.reused++;
        } else if (this.inUse.size < this.maxSize) {
            // Créer un nouvel objet si sous la limite
            obj = this.createFn();
            this.stats.created++;
            this.stats.poolMisses++;
        } else {
            // Pool saturé - réutiliser le plus ancien
            const iterator = this.inUse.values();
            obj = iterator.next().value;
            this.inUse.delete(obj);
            this.stats.reused++;
        }

        // Réinitialiser l'objet avec les nouveaux paramètres
        this.resetFn(obj, ...args);

        // Marquer comme utilisé
        this.inUse.add(obj);

        return obj;
    }

    /**
     * Libère un objet et le retourne au pool
     * @param {T} obj - Objet à libérer
     */
    release(obj) {
        if (!this.inUse.has(obj)) {
            console.warn('Tentative de libération d\'un objet qui n\'est pas en cours d\'utilisation');
            return;
        }

        this.inUse.delete(obj);

        // Ne garder que jusqu'à maxSize objets dans le pool
        if (this.available.length < this.maxSize) {
            this.available.push(obj);
        }
    }

    /**
     * Libère plusieurs objets en une fois
     * @param {T[]} objects - Tableau d'objets à libérer
     */
    releaseMultiple(objects) {
        for (const obj of objects) {
            this.release(obj);
        }
    }

    /**
     * Vide complètement le pool
     */
    clear() {
        this.available = [];
        this.inUse.clear();
    }

    /**
     * Retourne les statistiques du pool
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            ...this.stats,
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size,
            hitRate: this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses) || 0
        };
    }

    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = {
            created: 0,
            reused: 0,
            poolHits: 0,
            poolMisses: 0
        };
    }
}

/**
 * Pool spécialisé pour les projectiles
 */
export class ProjectilePool extends ObjectPool {
    constructor(ProjectileClass, initialSize = 100, maxSize = 500) {
        super(
            // Fonction de création
            () => new ProjectileClass(0, 0, 0, 0, ''),

            // Fonction de réinitialisation
            (projectile, x, y, vx, vy, emoji, glow = null, size = 20) => {
                projectile.x = x;
                projectile.y = y;
                projectile.vx = vx;
                projectile.vy = vy;
                projectile.emoji = emoji;
                projectile.glow = glow;
                projectile.size = size;
                projectile.rotation = 0;
            },

            initialSize,
            maxSize
        );
    }

    /**
     * Crée un projectile avec les paramètres donnés
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} vx - Vélocité X
     * @param {number} vy - Vélocité Y
     * @param {string} emoji - Emoji du projectile
     * @param {Object} glow - Effet de glow
     * @param {number} size - Taille du projectile
     * @returns {Projectile} Projectile du pool
     */
    createProjectile(x, y, vx, vy, emoji, glow = null, size = 20) {
        return this.acquire(x, y, vx, vy, emoji, glow, size);
    }
}

/**
 * Gestionnaire global des pools d'objets
 * Singleton pour accès centralisé
 */
export class PoolManager {
    constructor() {
        if (PoolManager.instance) {
            return PoolManager.instance;
        }

        this.pools = new Map();
        PoolManager.instance = this;
    }

    /**
     * Enregistre un nouveau pool
     * @param {string} name - Nom du pool
     * @param {ObjectPool} pool - Instance du pool
     */
    registerPool(name, pool) {
        this.pools.set(name, pool);
    }

    /**
     * Récupère un pool par son nom
     * @param {string} name - Nom du pool
     * @returns {ObjectPool} Le pool demandé
     */
    getPool(name) {
        return this.pools.get(name);
    }

    /**
     * Obtient les statistiques de tous les pools
     * @returns {Object} Statistiques globales
     */
    getAllStats() {
        const stats = {};
        for (const [name, pool] of this.pools) {
            stats[name] = pool.getStats();
        }
        return stats;
    }

    /**
     * Réinitialise tous les pools
     */
    clearAll() {
        for (const pool of this.pools.values()) {
            pool.clear();
        }
    }

    /**
     * Réinitialise toutes les statistiques
     */
    resetAllStats() {
        for (const pool of this.pools.values()) {
            pool.resetStats();
        }
    }
}

// Export d'une instance singleton
export const poolManager = new PoolManager();

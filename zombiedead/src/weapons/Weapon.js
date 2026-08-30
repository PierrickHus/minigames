/**
 * Classe de base pour toutes les armes
 * Gère les munitions, le rechargement, le cooldown de tir et les statistiques
 */
export class Weapon {
    /**
     * @param {object} config
     * @param {string} config.name - Nom affiché de l'arme
     * @param {number} config.damage - Dégâts par balle
     * @param {number} config.fireRate - Tirs par seconde
     * @param {number} config.magSize - Taille du chargeur
     * @param {number} config.reserveAmmo - Munitions de réserve
     * @param {number} config.reloadTimeMs - Temps de rechargement en ms
     * @param {number} config.spread - Dispersion du tir
     * @param {boolean} [config.isAutomatic=false] - Tir automatique
     * @param {number} [config.pelletCount=1] - Nombre de projectiles par tir
     */
    constructor(config) {
        this.name = config.name;
        this.damage = config.damage;
        this.fireRate = config.fireRate;
        this.magSize = config.magSize;
        this.currentAmmo = config.magSize;
        this.reserveAmmo = config.reserveAmmo;
        this.reloadTimeMs = config.reloadTimeMs;
        this.spread = config.spread;
        this.isAutomatic = config.isAutomatic || false;
        this.pelletCount = config.pelletCount || 1;

        this._fireCooldown = 0;
        this._reloadTimer = 0;
        this.isReloading = false;
    }

    /**
     * Tente de tirer. Retourne true si le tir a eu lieu
     * @returns {boolean}
     */
    fire() {
        if (this._fireCooldown > 0 || this.isReloading || this.currentAmmo <= 0) {
            return false;
        }

        this.currentAmmo--;
        this._fireCooldown = 1 / this.fireRate;
        return true;
    }

    /** Lance le rechargement si possible */
    reload() {
        if (this.isReloading || this.currentAmmo === this.magSize || this.reserveAmmo <= 0) {
            return;
        }

        this.isReloading = true;
        this._reloadTimer = this.reloadTimeMs / 1000;
    }

    /**
     * Met à jour les timers internes
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (this._fireCooldown > 0) {
            this._fireCooldown -= deltaTime;
        }

        if (this.isReloading) {
            this._reloadTimer -= deltaTime;
            if (this._reloadTimer <= 0) {
                this._finishReload();
            }
        }
    }

    /** Termine le rechargement en transférant les munitions de la réserve */
    _finishReload() {
        const needed = this.magSize - this.currentAmmo;
        const transferred = Math.min(needed, this.reserveAmmo);
        this.currentAmmo += transferred;
        this.reserveAmmo -= transferred;
        this.isReloading = false;
    }
}

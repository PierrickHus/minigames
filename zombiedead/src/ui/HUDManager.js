import { WAVE_BANNER_DURATION_MS } from '../constants.js';

/**
 * Gestionnaire du HUD (Head-Up Display)
 * Met à jour les éléments DOM uniquement quand les valeurs changent
 * Respecte strictement la règle de performance DOM du CLAUDE.md
 */
export class HUDManager {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this._eventBus = eventBus;

        // Références aux éléments DOM (récupérées une seule fois)
        this._healthBarFill = document.getElementById('healthBarFill');
        this._healthText = document.getElementById('healthText');
        this._ammoCurrentMag = document.getElementById('ammoCurrentMag');
        this._ammoReserve = document.getElementById('ammoReserve');
        this._weaponName = document.getElementById('weaponName');
        this._waveNumber = document.getElementById('waveNumber');
        this._zombiesRemaining = document.getElementById('zombiesRemaining');
        this._scoreValue = document.getElementById('scoreValue');
        this._waveBanner = document.getElementById('waveBanner');
        this._waveBannerText = document.getElementById('waveBannerText');
        this._killFeed = document.getElementById('killFeed');

        // Cache des dernières valeurs affichées pour mise à jour conditionnelle
        this._lastHealth = -1;
        this._lastMaxHealth = -1;
        this._lastAmmoMag = -1;
        this._lastAmmoReserve = -1;
        this._lastWeaponName = '';
        this._lastWaveNumber = -1;
        this._lastZombiesRemaining = -1;
        this._lastScore = -1;

        this._bannerTimer = null;

        this._eventBus.on('wave-start', (data) => this._showWaveBanner(data.wave));
        this._eventBus.on('zombie-killed', (data) => this._addKillFeedEntry(data.type, data.isHeadshot));
        this._eventBus.on('limb-severed', (data) => this._addSeverFeedEntry(data.limbName));
        this._eventBus.on('headshot', () => this._showHeadshotBanner());
    }

    /**
     * Met à jour tous les éléments HUD si les valeurs ont changé
     * @param {import('../player/Player.js').Player} player
     * @param {import('../weapons/WeaponManager.js').WeaponManager} weaponManager
     * @param {import('../waves/WaveManager.js').WaveManager} waveManager
     */
    update(player, weaponManager, waveManager) {
        this._updateHealth(player.health, player.maxHealth);
        this._updateAmmo(weaponManager.currentWeapon);
        this._updateWeaponName(weaponManager.currentWeapon.name);
        this._updateWaveInfo(waveManager.currentWave, waveManager.zombiesRemaining);
        this._updateScore(player.score);
    }

    /**
     * @param {number} health
     * @param {number} maxHealth
     */
    _updateHealth(health, maxHealth) {
        if (this._lastHealth === health && this._lastMaxHealth === maxHealth) return;

        const percent = (health / maxHealth) * 100;
        const widthStr = `${percent}%`;
        if (this._healthBarFill.style.width !== widthStr) {
            this._healthBarFill.style.width = widthStr;
        }

        const healthStr = String(Math.ceil(health));
        if (this._healthText.textContent !== healthStr) {
            this._healthText.textContent = healthStr;
        }

        this._lastHealth = health;
        this._lastMaxHealth = maxHealth;
    }

    /**
     * @param {import('../weapons/Weapon.js').Weapon} weapon
     */
    _updateAmmo(weapon) {
        if (this._lastAmmoMag === weapon.currentAmmo && this._lastAmmoReserve === weapon.reserveAmmo) return;

        const magStr = String(weapon.currentAmmo);
        if (this._ammoCurrentMag.textContent !== magStr) {
            this._ammoCurrentMag.textContent = magStr;
        }

        const reserveStr = String(weapon.reserveAmmo);
        if (this._ammoReserve.textContent !== reserveStr) {
            this._ammoReserve.textContent = reserveStr;
        }

        this._lastAmmoMag = weapon.currentAmmo;
        this._lastAmmoReserve = weapon.reserveAmmo;
    }

    /**
     * @param {string} name
     */
    _updateWeaponName(name) {
        if (this._lastWeaponName === name) return;
        this._weaponName.textContent = name;
        this._lastWeaponName = name;
    }

    /**
     * @param {number} wave
     * @param {number} remaining
     */
    _updateWaveInfo(wave, remaining) {
        if (this._lastWaveNumber !== wave) {
            this._waveNumber.textContent = `Vague ${wave}`;
            this._lastWaveNumber = wave;
        }

        if (this._lastZombiesRemaining !== remaining) {
            this._zombiesRemaining.textContent = `${remaining} restants`;
            this._lastZombiesRemaining = remaining;
        }
    }

    /**
     * @param {number} score
     */
    _updateScore(score) {
        if (this._lastScore === score) return;
        this._scoreValue.textContent = String(score);
        this._lastScore = score;
    }

    /**
     * Affiche la bannière de début de vague
     * @param {number} wave
     */
    _showWaveBanner(wave) {
        this._waveBannerText.textContent = `Vague ${wave}`;

        if (this._waveBanner.classList.contains('hidden')) {
            this._waveBanner.classList.remove('hidden');
        }

        // Redémarrer l'animation en forçant un reflow
        this._waveBanner.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions -- force reflow pour relancer l'animation CSS
        this._waveBanner.getAnimations(); // Force reflow
        this._waveBanner.style.animation = '';

        if (this._bannerTimer) clearTimeout(this._bannerTimer);
        this._bannerTimer = setTimeout(() => {
            if (!this._waveBanner.classList.contains('hidden')) {
                this._waveBanner.classList.add('hidden');
            }
        }, WAVE_BANNER_DURATION_MS);
    }

    /**
     * Ajoute une entrée au kill feed avec le nom Zombicide du type
     * @param {string} type
     */
    /**
     * @param {string} type
     * @param {boolean} [isHeadshot=false]
     */
    _addKillFeedEntry(type, isHeadshot = false) {
        const typeNames = {
            walker: 'Walker', runner: 'Runner',
            fatty: 'Fatty', abomination: 'Abomination'
        };
        const prefix = isHeadshot ? 'HEADSHOT ' : '';
        this._addFeedEntry(`${prefix}${typeNames[type] || type} éliminé`, isHeadshot ? '#ff4444' : null);
    }

    /**
     * Affiche un message d'arrachement de membre dans le kill feed
     * @param {string} limbName
     */
    _addSeverFeedEntry(limbName) {
        const limbNames = {
            leftArm: 'Bras gauche', rightArm: 'Bras droit',
            leftLeg: 'Jambe gauche', rightLeg: 'Jambe droite',
            neck: 'Tête'
        };
        this._addFeedEntry(`${limbNames[limbName] || limbName} arraché !`, '#cc8800');
    }

    /** Affiche brièvement "HEADSHOT" au centre de l'écran */
    _showHeadshotBanner() {
        this._waveBannerText.textContent = 'HEADSHOT';
        if (this._waveBanner.classList.contains('hidden')) {
            this._waveBanner.classList.remove('hidden');
        }
        this._waveBanner.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions -- force reflow pour relancer l'animation CSS
        this._waveBanner.getAnimations();
        this._waveBanner.style.animation = '';

        if (this._bannerTimer) clearTimeout(this._bannerTimer);
        this._bannerTimer = setTimeout(() => {
            if (!this._waveBanner.classList.contains('hidden')) {
                this._waveBanner.classList.add('hidden');
            }
        }, 1000);
    }

    /**
     * Ajoute une entrée générique au kill feed
     * @param {string} text
     * @param {string|null} [color=null]
     */
    _addFeedEntry(text, color = null) {
        const entry = document.createElement('div');
        entry.className = 'kill-entry';
        entry.textContent = text;
        if (color) entry.style.color = color;
        this._killFeed.prepend(entry);

        setTimeout(() => entry.remove(), 3000);
        while (this._killFeed.children.length > 5) {
            this._killFeed.lastChild.remove();
        }
    }
}

import { Pistol } from './Pistol.js';
import { Shotgun } from './Shotgun.js';
import { AssaultRifle } from './AssaultRifle.js';
import { WeaponViewModel } from './WeaponViewModel.js';
import { WeaponRaycaster } from '../physics/Raycaster.js';

/**
 * Gestionnaire des armes du joueur
 * Gère l'inventaire, le changement d'arme, le tir et le rechargement
 */
export class WeaponManager {
    /**
     * @param {THREE.Camera} camera
     * @param {THREE.Scene} scene
     * @param {import('../core/EventBus.js').EventBus} eventBus
     * @param {import('../input/InputManager.js').InputManager} inputManager
     */
    constructor(camera, scene, eventBus, inputManager) {
        this._camera = camera;
        this._scene = scene;
        this._eventBus = eventBus;
        this._input = inputManager;
        this._raycaster = new WeaponRaycaster();

        this._viewModel = new WeaponViewModel(camera, scene);

        /** @type {import('./Weapon.js').Weapon[]} */
        this.weapons = [new Pistol(), new Shotgun(), new AssaultRifle()];
        this.currentIndex = 0;

        /** @type {THREE.Object3D[]} Meshes cibles PNJ pour le raycasting */
        this.targetMeshes = [];

        /** @type {THREE.Object3D[]} Meshes du décor pour les impacts */
        this.sceneMeshes = [];

        this._hasFiredThisClick = false;

        this._switchToWeapon(0);
    }

    /** @returns {import('./Weapon.js').Weapon} */
    get currentWeapon() {
        return this.weapons[this.currentIndex];
    }

    /**
     * Met à jour l'arme et vérifie les entrées de tir/rechargement
     * @param {number} deltaTime
     */
    update(deltaTime) {
        this.currentWeapon.update(deltaTime);
        this._handleInput();

        const mouseDelta = this._input.getMouseDelta();
        this._viewModel.update(deltaTime, mouseDelta);
    }

    /** Gère les entrées clavier/souris pour les armes */
    _handleInput() {
        if (!this._input.isPointerLocked) return;

        if (this._input.isKeyDown('Digit1')) this._switchToWeapon(0);
        if (this._input.isKeyDown('Digit2')) this._switchToWeapon(1);
        if (this._input.isKeyDown('Digit3')) this._switchToWeapon(2);

        if (this._input.isKeyDown('KeyR')) {
            this._reloadCurrentWeapon();
        }

        if (this._input.isMouseDown(0)) {
            if (this.currentWeapon.isAutomatic || !this._hasFiredThisClick) {
                this._fireCurrentWeapon();
                this._hasFiredThisClick = true;
            }
        } else {
            this._hasFiredThisClick = false;
        }
    }

    /**
     * Change l'arme active
     * @param {number} index
     */
    _switchToWeapon(index) {
        if (index === this.currentIndex && this._viewModel._currentModel) return;
        if (index < 0 || index >= this.weapons.length) return;

        this.currentIndex = index;
        const weapon = this.weapons[index];
        const model = weapon.createViewModel();
        this._viewModel.setModel(model);
    }

    /** Tente de tirer avec l'arme courante */
    _fireCurrentWeapon() {
        const weapon = this.currentWeapon;
        if (!weapon.fire()) return;

        this._viewModel.triggerRecoil();

        if (weapon.pelletCount > 1) {
            const results = this._raycaster.castMultipleShots(
                this._camera, this.targetMeshes, this.sceneMeshes, weapon.spread, weapon.pelletCount
            );
            for (const result of results) {
                this._processHit(result, weapon.damage);
            }
        } else {
            const result = this._raycaster.castShot(
                this._camera, this.targetMeshes, this.sceneMeshes, weapon.spread
            );
            this._processHit(result, weapon.damage);
        }

        this._eventBus.emit('weapon-fired', { weapon: weapon.name });
    }

    /**
     * Traite un résultat de raycast : émet l'événement approprié selon le type de cible
     * @param {{ hit: boolean, point: THREE.Vector3|null, normal: THREE.Vector3|null, object: THREE.Object3D|null, isEnemy: boolean }} result
     * @param {number} damage
     */
    _processHit(result, damage) {
        if (!result.hit) return;

        if (result.isEnemy) {
            this._eventBus.emit('weapon-hit', {
                object: result.object,
                point: result.point,
                damage
            });
            this._eventBus.emit('impact-enemy', {
                point: result.point,
                normal: result.normal,
                object: result.object
            });
        } else {
            this._eventBus.emit('impact-surface', {
                point: result.point,
                normal: result.normal
            });
        }
    }

    /** Lance le rechargement de l'arme courante */
    _reloadCurrentWeapon() {
        const weapon = this.currentWeapon;
        if (weapon.isReloading) return;
        weapon.reload();
        if (weapon.isReloading) {
            this._viewModel.triggerReload(weapon.reloadTimeMs);
            this._eventBus.emit('weapon-reload', { weapon: weapon.name });
        }
    }

    /** Libère les ressources */
    dispose() {
        this._viewModel.dispose();
    }
}

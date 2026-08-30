import { WORLD_SIZE } from '../constants.js';

const MINIMAP_SIZE = 160;
const MINIMAP_PADDING = 2;
const HALF_WORLD = WORLD_SIZE / 2;

/** Couleurs de la minimap */
const COLORS = {
    background: '#1A1510',
    border: '#4A3A2A',
    ground: '#2A2520',
    wall: '#6A5A4A',
    obstacle: '#5A5040',
    player: '#44CC44',
    playerFov: 'rgba(68, 204, 68, 0.08)',
    walker: '#CC4444',
    runner: '#CCAA22',
    fatty: '#AA44AA',
    abomination: '#FF2222'
};

/**
 * Minimap affichée en bas à droite au-dessus des munitions
 * Dessine sur un canvas 2D : obstacles statiques, joueur, direction, zombies
 * Met à jour uniquement quand les positions changent
 */
export class Minimap {
    constructor() {
        this._canvas = document.getElementById('minimapCanvas');
        this._ctx = this._canvas.getContext('2d');
        this._canvas.width = MINIMAP_SIZE;
        this._canvas.height = MINIMAP_SIZE;

        /** @type {Array<{ x: number, z: number, w: number, d: number }>} Obstacles pré-calculés */
        this._staticObjects = [];
        this._staticDrawn = false;

        // Canvas offscreen pour les éléments statiques (dessinés une seule fois)
        this._staticCanvas = document.createElement('canvas');
        this._staticCanvas.width = MINIMAP_SIZE;
        this._staticCanvas.height = MINIMAP_SIZE;
        this._staticCtx = this._staticCanvas.getContext('2d');
    }

    /**
     * Enregistre les colliders statiques pour les dessiner sur la minimap
     * @param {Array<{ min: { x: number, z: number }, max: { x: number, z: number } }>} colliders
     */
    setStaticColliders(colliders) {
        this._staticObjects = colliders.map(box => ({
            x: box.min.x,
            z: box.min.z,
            w: box.max.x - box.min.x,
            d: box.max.z - box.min.z
        }));
        this._staticDrawn = false;
    }

    /**
     * Dessine les éléments statiques une seule fois sur le canvas offscreen
     */
    _drawStatic() {
        const ctx = this._staticCtx;
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        ctx.fillStyle = COLORS.obstacle;
        for (const obj of this._staticObjects) {
            const rect = this._worldToMinimap(obj.x, obj.z, obj.w, obj.d);
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }

        this._staticDrawn = true;
    }

    /**
     * Met à jour la minimap avec les positions actuelles
     * @param {import('three').Vector3} playerPosition
     * @param {number} playerRotationY - Rotation Y du joueur (yaw)
     * @param {Array<{ position: import('three').Vector3, type: string, isAlive: boolean }>} zombies
     */
    update(playerPosition, playerRotationY, zombies) {
        if (!this._staticDrawn) {
            this._drawStatic();
        }

        const ctx = this._ctx;

        // Fond = copie du canvas statique
        ctx.drawImage(this._staticCanvas, 0, 0);

        // Bordure
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = MINIMAP_PADDING;
        ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        this._drawZombies(ctx, zombies);
        this._drawPlayer(ctx, playerPosition, playerRotationY);
    }

    /**
     * Dessine les zombies sur la minimap avec une couleur par type
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array<{ position: import('three').Vector3, type: string, isAlive: boolean }>} zombies
     */
    _drawZombies(ctx, zombies) {
        for (const zombie of zombies) {
            if (!zombie.isAlive) continue;

            const pos = this._worldToPoint(zombie.position.x, zombie.position.z);
            const color = COLORS[zombie.type] || COLORS.walker;
            const size = zombie.type === 'abomination' ? 4 : zombie.type === 'fatty' ? 3 : 2;

            ctx.fillStyle = color;
            ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
        }
    }

    /**
     * Dessine le joueur (triangle directionnel + cône de vision)
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('three').Vector3} playerPosition
     * @param {number} rotationY
     */
    _drawPlayer(ctx, playerPosition, rotationY) {
        const pos = this._worldToPoint(playerPosition.x, playerPosition.z);

        // Cône de vision
        const fovAngle = Math.PI / 4;
        const fovLength = 25;
        ctx.fillStyle = COLORS.playerFov;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.arc(pos.x, pos.y, fovLength, -rotationY - fovAngle / 2 - Math.PI / 2, -rotationY + fovAngle / 2 - Math.PI / 2);
        ctx.closePath();
        ctx.fill();

        // Triangle joueur orienté dans la direction du regard
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(-rotationY);

        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3, 4);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Convertit des coordonnées monde en coordonnées minimap (rectangle)
     * @param {number} worldX
     * @param {number} worldZ
     * @param {number} worldW
     * @param {number} worldD
     * @returns {{ x: number, y: number, w: number, h: number }}
     */
    _worldToMinimap(worldX, worldZ, worldW, worldD) {
        const scale = MINIMAP_SIZE / WORLD_SIZE;
        return {
            x: (worldX + HALF_WORLD) * scale,
            y: (worldZ + HALF_WORLD) * scale,
            w: Math.max(worldW * scale, 1),
            h: Math.max(worldD * scale, 1)
        };
    }

    /**
     * Convertit une position monde en point minimap
     * @param {number} worldX
     * @param {number} worldZ
     * @returns {{ x: number, y: number }}
     */
    _worldToPoint(worldX, worldZ) {
        const scale = MINIMAP_SIZE / WORLD_SIZE;
        return {
            x: (worldX + HALF_WORLD) * scale,
            y: (worldZ + HALF_WORLD) * scale
        };
    }
}

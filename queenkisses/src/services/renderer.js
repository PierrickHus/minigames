/**
 * Système de rendu Canvas optimisé pour le jeu
 * Gère tous les aspects visuels via Canvas 2D
 * Utilise l'accélération matérielle et optimisations de performance
 */

import { RENDERER_CONFIG } from '../data/config.js';

export class Renderer {
    /**
     * Initialise le système de rendu
     * @param {HTMLCanvasElement} canvas - Element canvas
     */
    constructor(canvas) {
        this.canvas = canvas;

        // Optimisations pour accélération matérielle
        this.ctx = canvas.getContext('2d', {
            alpha: RENDERER_CONFIG.ALPHA,
            desynchronized: true, // Permet le rendu asynchrone (meilleures performances)
            willReadFrequently: false // On ne lit pas les pixels souvent
        });

        this.width = 0;
        this.height = 0;

        // Cache pour les emojis pré-rendus
        this.emojiCache = new Map();

        // Effets visuels
        this.particles = [];
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Optimisation CSS pour accélération matérielle
        if (RENDERER_CONFIG.WILL_CHANGE) {
            this.canvas.style.willChange = 'transform';
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Redimensionne le canvas à la taille de la fenêtre
     */
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Pré-rend un emoji dans le cache
     * @param {string} emoji - L'emoji à pré-rendre
     * @param {number} size - Taille de l'emoji en pixels
     * @returns {HTMLCanvasElement} Canvas contenant l'emoji
     */
    cacheEmoji(emoji, size) {
        const key = `${emoji}_${size}`;

        if (this.emojiCache.has(key)) {
            return this.emojiCache.get(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.font = `${size}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);

        this.emojiCache.set(key, canvas);
        return canvas;
    }

    /**
     * Efface le canvas avec le fond approprié
     * @param {boolean} doomMode - Si le mode DOOM est actif
     */
    clear(doomMode = false) {
        const shake = this.screenShake;
        this.ctx.save();

        // Applique le screen shake
        if (shake.intensity > 0) {
            this.ctx.translate(shake.x, shake.y);
            shake.intensity *= 0.9;
            if (shake.intensity < 0.1) shake.intensity = 0;
        }

        if (doomMode) {
            // Fond DOOM rouge sombre
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1a0000');
            gradient.addColorStop(0.3, '#2d0a0a');
            gradient.addColorStop(0.6, '#3d1515');
            gradient.addColorStop(1, '#0a0505');
            this.ctx.fillStyle = gradient;
        } else {
            // Fond normal violet
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#150830');
            gradient.addColorStop(0.3, '#220e45');
            gradient.addColorStop(0.6, '#2d1560');
            gradient.addColorStop(1, '#0a1025');
            this.ctx.fillStyle = gradient;
        }

        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Dessine un emoji avec des effets
     * @param {string} emoji - L'emoji à dessiner
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} size - Taille de l'emoji
     * @param {Object} effects - Effets visuels optionnels
     */
    drawEmoji(emoji, x, y, size, effects = {}) {
        const cached = this.cacheEmoji(emoji, size);

        this.ctx.save();

        // Applique les effets
        if (effects.glow) {
            this.ctx.shadowColor = effects.glow.color || '#fff';
            this.ctx.shadowBlur = effects.glow.blur || 15;
        }

        if (effects.scale) {
            this.ctx.translate(x + size / 2, y + size / 2);
            this.ctx.scale(effects.scale, effects.scale);
            this.ctx.translate(-(x + size / 2), -(y + size / 2));
        }

        if (effects.rotation) {
            this.ctx.translate(x + size / 2, y + size / 2);
            this.ctx.rotate(effects.rotation);
            this.ctx.translate(-(x + size / 2), -(y + size / 2));
        }

        if (effects.alpha !== undefined) {
            this.ctx.globalAlpha = effects.alpha;
        }

        this.ctx.drawImage(cached, x, y);
        this.ctx.restore();
    }

    /**
     * Dessine le château au centre
     * @param {boolean} doomMode - Si le mode DOOM est actif
     */
    drawCastle(doomMode = false) {
        const x = this.width / 2 - 60;
        const y = this.height / 2 - 60;
        const effects = {};

        if (doomMode) {
            const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
            effects.glow = {
                color: `rgba(255, ${Math.floor(pulse * 100)}, 0, ${pulse})`,
                blur: 30 + pulse * 30
            };
        }

        this.drawEmoji('🏰', x, y, 120, effects);
    }

    /**
     * Dessine le roi avec sa hitbox
     * @param {Object} king - Objet roi avec position et état
     */
    drawKing(king) {
        const effects = {
            scale: king.moving ? 1.1 : 1.0
        };

        if (king.hit) {
            effects.glow = { color: '#ff0000', blur: 20 };
        }

        this.drawEmoji('👑', king.x, king.y, 50, effects);

        // Dessine la hitbox si visible
        if (king.showHitbox) {
            this.ctx.save();
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 8;
            this.ctx.strokeRect(
                king.hitboxX,
                king.hitboxY,
                king.hitboxSize,
                king.hitboxSize
            );
            this.ctx.restore();
        }
    }

    /**
     * Dessine la reine / démon
     * @param {Object} queen - Objet reine avec position et état
     */
    drawQueen(queen) {
        const emoji = queen.isDemon ? '👿' : '👸';
        const size = queen.isDemon ? 70 : 50;
        const effects = {};

        if (queen.isDemon) {
            const pulse = Math.sin(Date.now() / 250) * 0.5 + 0.5;
            effects.glow = {
                color: `rgba(255, ${Math.floor(pulse * 100)}, 0, 1)`,
                blur: 30 + pulse * 20
            };
            effects.scale = 1 + Math.sin(Date.now() / 500) * 0.1;
        } else if (queen.rage) {
            effects.glow = { color: '#ff69b4', blur: 15 };
        }

        if (queen.dashing) {
            // Effet de traînée pour le dash
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                this.drawEmoji(emoji, queen.x - i * 10, queen.y - i * 10, size, {});
            }
            this.ctx.restore();
        }

        this.drawEmoji(emoji, queen.x, queen.y, size, effects);
    }

    /**
     * Dessine un diamant avec animation
     * @param {Object} diamond - Objet diamant avec position
     */
    drawDiamond(diamond) {
        const rotation = Math.sin(Date.now() / 500 + diamond.id) * 0.2;
        const scale = 1 + Math.sin(Date.now() / 1000 + diamond.id) * 0.1;

        this.drawEmoji('💎', diamond.x, diamond.y, 35, {
            rotation,
            scale,
            glow: { color: '#00bfff', blur: 10 }
        });
    }

    /**
     * Dessine un projectile
     * @param {Object} projectile - Objet projectile
     */
    drawProjectile(projectile) {
        const size = projectile.size || 20;
        const effects = {};

        if (projectile.glow) {
            effects.glow = projectile.glow;
        }

        if (projectile.rotation !== undefined) {
            effects.rotation = projectile.rotation;
        }

        this.drawEmoji(projectile.emoji, projectile.x, projectile.y, size, effects);
    }

    /**
     * Dessine une bulle de dialogue
     * @param {Object} bubble - Objet bulle avec texte et position
     */
    drawSpeechBubble(bubble) {
        if (!bubble.active || bubble.alpha <= 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = bubble.alpha;

        // Mesure du texte
        this.ctx.font = '14px Arial, sans-serif';
        this.ctx.fontWeight = 'bold';
        const metrics = this.ctx.measureText(bubble.text);
        const textWidth = metrics.width;
        const padding = 15;
        const bubbleWidth = Math.min(textWidth + padding * 2, 150);
        const bubbleHeight = 40;
        const bubbleX = bubble.x - bubbleWidth / 2;
        const bubbleY = bubble.y - 60;

        // Bulle blanche
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
        this.ctx.fill();

        // Triangle pointant vers le personnage
        this.ctx.beginPath();
        this.ctx.moveTo(bubbleX + 20, bubbleY + bubbleHeight);
        this.ctx.lineTo(bubbleX + 30, bubbleY + bubbleHeight + 10);
        this.ctx.lineTo(bubbleX + 40, bubbleY + bubbleHeight);
        this.ctx.fill();

        // Texte
        this.ctx.fillStyle = bubble.color || '#8b4513';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(bubble.text, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2, bubbleWidth - padding);

        this.ctx.restore();
    }

    /**
     * Dessine une particule
     * @param {Object} particle - Objet particule
     */
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    /**
     * Crée une explosion de particules
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {string} color - Couleur des particules
     * @param {number} count - Nombre de particules
     */
    createParticleExplosion(x, y, color = '#ffd700', count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                alpha: 1,
                color,
                life: 1
            });
        }
    }

    /**
     * Met à jour et dessine les particules
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravité
            p.life -= 0.02;
            p.alpha = p.life;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.drawParticle(p);
        }
    }

    /**
     * Déclenche un tremblement d'écran
     * @param {number} intensity - Intensité du tremblement
     */
    shake(intensity = 10) {
        this.screenShake.intensity = intensity;
        this.screenShake.x = (Math.random() - 0.5) * intensity;
        this.screenShake.y = (Math.random() - 0.5) * intensity;
    }

    /**
     * Restaure la transformation après le clear
     */
    restore() {
        this.ctx.restore();
    }
}

// ==========================================
// SYSTÈME DE SPRITE DE CLÉOPÂTRE
// ==========================================
// Ce module gère le rendu animé du sprite de Cléopâtre dans le portrait.
// Fonctionnalités principales:
// - Rendu Canvas 2D avec style égyptien authentique
// - Animations multiples (idle, speaking, happy, angry, disappointed)
// - Système de phonèmes pour l'animation des lèvres
// - Changement d'humeur visuel (expressions faciales)
// - Effets visuels selon l'émotion (éclairs de colère, étoiles de joie)
// ==========================================

/**
 * Sprite animé de Cléopâtre dessiné en Canvas 2D
 * Gère les animations, les expressions faciales et les effets visuels
 */
class CleopatraSprite {
    /**
     * Crée une nouvelle instance du sprite de Cléopâtre
     * @param {HTMLElement} container - Élément DOM conteneur du canvas
     * @param {object} options - Options de configuration
     * @param {number} [options.width=80] - Largeur du canvas
     * @param {number} [options.height=100] - Hauteur du canvas
     * @param {number} [options.scale=1] - Facteur d'échelle du sprite
     * @param {boolean} [options.persistentEffects=false] - Si true, les effets (éclairs, étoiles) restent visibles
     */
    constructor(container, options = {}) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;

        // Dimensions du sprite (personnalisables)
        this.width = options.width || 80;
        this.height = options.height || 100;
        this.scale = options.scale || 1;

        // Mode effets persistants (pour écrans de fin)
        this.persistentEffects = options.persistentEffects || false;

        // État actuel
        this.currentMood = 'neutral';
        this.currentAnimation = 'idle1';
        this.animationFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 150;

        // Animation temporaire
        this.tempAnimation = null;
        this.tempAnimationTimer = 0;

        // Timer pour animations idle
        this.idleChangeTimer = 0;
        this.idleChangeInterval = 5000;

        this.idleAnimations = ['idle1', 'idle2', 'idle3', 'idle4'];

        this.animations = {
            idle1: { frames: 4, loop: true },
            idle2: { frames: 4, loop: true },
            idle3: { frames: 4, loop: true },
            idle4: { frames: 4, loop: true },
            speaking: { frames: 12, loop: true },
            happy: { frames: 6, loop: false },
            angry: { frames: 6, loop: false },
            thinking: { frames: 4, loop: true },
            disappointed: { frames: 6, loop: true }
        };

        // Séquence de phonèmes pour l'animation de parole
        // 0=fermé, 1=légèrement ouvert, 2=ouvert "o", 3=large "a", 4=étroit "i/e", 5=rond "ou"
        this.speakingSequence = [0, 2, 3, 1, 4, 2, 5, 3, 1, 4, 2, 0];

        // Palette de couleurs égyptienne
        this.colors = {
            // Peau - teint olive méditerranéen
            skin: '#c9a66b',
            skinLight: '#d4b07a',
            skinShadow: '#a8875a',

            // Cheveux/perruque noire
            hair: '#0a0a0a',
            hairStripe: '#1a1a2e',

            // Or égyptien
            gold: '#d4af37',
            goldLight: '#f4d03f',
            goldDark: '#b8860b',

            // Lapis-lazuli (bleu)
            lapis: '#26619c',
            lapisLight: '#3d7ab5',

            // Turquoise
            turquoise: '#40e0d0',

            // Rouge corail/cornaline
            coral: '#e74c3c',
            coralDark: '#c0392b',

            // Khôl noir
            kohl: '#0d0d0d',

            // Yeux
            eyeWhite: '#f5f5dc',
            iris: '#4a3728',

            // Lèvres - rouge terre
            lips: '#a0522d',
            lipsHighlight: '#cd853f',

            // Robe blanche/lin
            dress: '#f5f5dc',
            dressShade: '#e8e8d0',
            dressBorder: '#d4af37'
        };

        this.init();
    }

    /**
     * Initialise le canvas et lance la boucle d'animation
     */
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.className = 'cleopatra-sprite';
        this.canvas.style.display = 'block';
        this.ctx = this.canvas.getContext('2d');

        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.render();
        this.lastTime = performance.now();
        this.animate();
    }

    /**
     * Boucle d'animation principale (requestAnimationFrame)
     * Calcule le delta time et appelle update/render à chaque frame
     */
    animate() {
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    /**
     * Met à jour l'état de l'animation
     * Gère les timers de frame, les animations temporaires et le changement d'idle
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame (ms)
     */
    update(deltaTime) {
        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameDelay) {
            this.frameTimer = 0;
            this.nextFrame();
        }

        if (this.tempAnimation) {
            this.tempAnimationTimer -= deltaTime;
            if (this.tempAnimationTimer <= 0) {
                this.tempAnimation = null;
            }
        }

        if (!this.tempAnimation) {
            this.idleChangeTimer += deltaTime;
            if (this.idleChangeTimer >= this.idleChangeInterval) {
                this.idleChangeTimer = 0;
                this.changeIdleAnimation();
            }
        }
    }

    /**
     * Passe à la frame suivante de l'animation courante
     * Gère le bouclage et la fin des animations non-bouclées
     */
    nextFrame() {
        const animName = this.tempAnimation || this.currentAnimation;
        const anim = this.animations[animName];

        this.animationFrame++;

        if (this.animationFrame >= anim.frames) {
            // En mode persistentEffects, toujours boucler
            if (anim.loop || this.persistentEffects) {
                this.animationFrame = 0;
            } else {
                this.animationFrame = anim.frames - 1;
                if (this.tempAnimation) {
                    this.tempAnimation = null;
                }
            }
        }
    }

    /**
     * Change aléatoirement l'animation idle courante
     * Appelé périodiquement pour varier les poses de repos
     */
    changeIdleAnimation() {
        const newIdle = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
        if (newIdle !== this.currentAnimation) {
            this.currentAnimation = newIdle;
            this.animationFrame = 0;
        }
    }

    /**
     * Définit l'humeur du sprite selon une valeur numérique
     * Change l'expression faciale et les animations associées
     * @param {number} mood - Valeur d'humeur (0-100): ≤20=angry, ≤40=disappointed, ≥80=happy, sinon neutral
     */
    setMood(mood) {
        if (mood <= 20) {
            this.currentMood = 'angry';
        } else if (mood <= 40) {
            this.currentMood = 'disappointed';
        } else if (mood >= 80) {
            this.currentMood = 'happy';
        } else {
            this.currentMood = 'neutral';
        }
    }

    /**
     * Joue une animation temporaire pendant une durée spécifiée
     * L'animation reprend l'idle après expiration du timer
     * @param {string} animName - Nom de l'animation (idle1-4, speaking, happy, angry, thinking, disappointed)
     * @param {number} [duration=2000] - Durée en millisecondes
     */
    playAnimation(animName, duration = 2000) {
        if (this.animations[animName]) {
            this.tempAnimation = animName;
            this.tempAnimationTimer = duration;
            this.animationFrame = 0;
        }
    }

    /** Déclenche l'animation de parole (3 secondes) */
    speak() { this.playAnimation('speaking', 3000); }

    /** Déclenche l'animation de célébration (2.5 secondes) */
    celebrate() { this.playAnimation('happy', 2500); }

    /** Déclenche l'animation de colère (3 secondes) */
    rage() { this.playAnimation('angry', 3000); }

    /**
     * Effectue le rendu complet du sprite sur le canvas
     * Dessine tous les éléments dans l'ordre: corps, cou, collier, tête, perruque, coiffe, boucles d'oreilles, effets
     */
    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, this.width, this.height);

        const animName = this.tempAnimation || this.currentAnimation;
        const frame = this.animationFrame;

        const blinkFrame = (animName === 'idle4' && frame >= 2);

        ctx.save();

        // Appliquer le scale si différent de 1
        if (this.scale !== 1) {
            // Centrer le sprite mis à l'échelle dans le canvas
            const baseWidth = 80;
            const baseHeight = 100;
            const scaledWidth = baseWidth * this.scale;
            const scaledHeight = baseHeight * this.scale;
            const offsetX = (this.width - scaledWidth) / 2 + (scaledWidth / 2);
            const offsetY = (this.height - scaledHeight) / 2 + (52 * this.scale);

            ctx.translate(offsetX, offsetY);
            ctx.scale(this.scale, this.scale);
        } else {
            ctx.translate(this.width / 2, 52);
        }

        this.drawBody(ctx, animName, frame);
        this.drawNeck(ctx, animName, frame);
        this.drawCollar(ctx, animName, frame);
        this.drawHead(ctx, animName, frame, blinkFrame);
        this.drawWig(ctx, animName, frame);
        this.drawHeaddress(ctx, animName, frame);
        this.drawEarrings(ctx, animName, frame);
        this.drawMoodEffects(ctx, animName, frame);

        ctx.restore();
    }

    /**
     * Dessine le corps et la robe blanche égyptienne
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawBody(ctx, anim, frame) {
        const c = this.colors;

        // Robe blanche égyptienne
        ctx.fillStyle = c.dress;
        ctx.beginPath();
        ctx.moveTo(-25, 20);
        ctx.lineTo(-28, 48);
        ctx.lineTo(28, 48);
        ctx.lineTo(25, 20);
        ctx.closePath();
        ctx.fill();

        // Ombre de la robe
        ctx.fillStyle = c.dressShade;
        ctx.beginPath();
        ctx.moveTo(-5, 20);
        ctx.lineTo(-8, 48);
        ctx.lineTo(8, 48);
        ctx.lineTo(5, 20);
        ctx.closePath();
        ctx.fill();

        // Bretelles dorées
        ctx.strokeStyle = c.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, 20);
        ctx.lineTo(-12, 8);
        ctx.moveTo(18, 20);
        ctx.lineTo(12, 8);
        ctx.stroke();

        // Bordure dorée en bas
        ctx.fillStyle = c.gold;
        ctx.fillRect(-28, 44, 56, 4);
    }

    /**
     * Dessine le cou avec ombrages
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawNeck(ctx, anim, frame) {
        const c = this.colors;

        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.lineTo(-10, 18);
        ctx.lineTo(10, 18);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();

        // Ombre du cou
        ctx.fillStyle = c.skinShadow;
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(-8, 18);
        ctx.lineTo(8, 18);
        ctx.lineTo(6, 12);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Dessine le collier Ousekh (large collier égyptien traditionnel)
     * Composé de plusieurs rangées colorées avec perles et pendentif scarabée
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawCollar(ctx, anim, frame) {
        const c = this.colors;

        // Base du collier - plusieurs rangées
        const rows = [
            { y: 12, radius: 18, color: c.gold },
            { y: 15, radius: 20, color: c.lapis },
            { y: 18, radius: 22, color: c.turquoise },
            { y: 21, radius: 24, color: c.gold },
            { y: 24, radius: 26, color: c.coral }
        ];

        rows.forEach((row, i) => {
            ctx.fillStyle = row.color;
            ctx.beginPath();
            ctx.ellipse(0, row.y, row.radius, 4, 0, 0, Math.PI);
            ctx.fill();

            // Petits détails/perles
            if (i % 2 === 0) {
                ctx.fillStyle = c.goldLight;
                for (let x = -row.radius + 4; x < row.radius; x += 6) {
                    ctx.beginPath();
                    ctx.arc(x, row.y + 1, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Pendentif central - scarabée stylisé
        ctx.fillStyle = c.lapis;
        ctx.beginPath();
        ctx.ellipse(0, 28, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.goldLight;
        ctx.beginPath();
        ctx.arc(0, 28, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dessine la tête et le visage avec expressions
     * Applique un léger mouvement de tête selon l'animation
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     * @param {boolean} blink - Si true, dessine les yeux fermés (clignement)
     */
    drawHead(ctx, anim, frame, blink) {
        const c = this.colors;

        let headTilt = 0;
        if (anim === 'idle2') {
            headTilt = Math.sin(frame * Math.PI / 2) * 2;
        } else if (anim === 'speaking') {
            headTilt = Math.sin(frame * Math.PI) * 1.5;
        }

        ctx.save();
        ctx.rotate(headTilt * Math.PI / 180);

        // Visage - forme ovale allongée
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.ellipse(0, -12, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ombrage du visage
        ctx.fillStyle = c.skinShadow;
        ctx.beginPath();
        ctx.ellipse(-12, -8, 4, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(12, -8, 4, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Yeux
        this.drawEyes(ctx, anim, frame, blink);

        // Nez aquilin
        this.drawNose(ctx, anim, frame);

        // Bouche
        this.drawMouth(ctx, anim, frame);

        ctx.restore();
    }

    /**
     * Dessine les yeux avec maquillage khôl égyptien
     * Inclut le regard dynamique, les sourcils et l'eye-liner allongé
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     * @param {boolean} blink - Si true, yeux fermés
     */
    drawEyes(ctx, anim, frame, blink) {
        const c = this.colors;
        const eyeY = -15;
        const eyeSpacing = 8;

        let eyeHeight = blink ? 0.5 : 4;
        if (this.currentMood === 'angry' || anim === 'angry') {
            eyeHeight = blink ? 0.5 : 2.5;
        }

        let lookX = 0;
        let lookY = 0;
        if (anim === 'idle2') {
            lookX = Math.sin(frame * Math.PI / 2) * 1.5;
        } else if (anim === 'thinking') {
            // Regard vers le haut à droite (réflexion)
            lookX = 1.5;
            lookY = -1.5;
        } else if (this.currentMood === 'disappointed' || anim === 'disappointed') {
            // Regard vers le bas (déception)
            lookY = 1.5;
        }

        // Dessiner chaque oeil
        [-1, 1].forEach(side => {
            const ex = eyeSpacing * side;

            // Ombre à paupières turquoise/bleu
            ctx.fillStyle = c.lapisLight;
            ctx.beginPath();
            ctx.ellipse(ex, eyeY - 2, 7, 4, 0, Math.PI, 0);
            ctx.fill();

            // Khôl épais autour de l'oeil
            ctx.strokeStyle = c.kohl;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(ex, eyeY, 6, eyeHeight + 1, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Eye-liner allongé vers la tempe (style égyptien)
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(ex + 6 * side, eyeY);
            ctx.quadraticCurveTo(ex + 10 * side, eyeY - 2, ex + 14 * side, eyeY - 5);
            ctx.stroke();

            // Ligne sous l'oeil (khôl)
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ex - 5 * side, eyeY + 2);
            ctx.lineTo(ex + 8 * side, eyeY + 1);
            ctx.stroke();

            // Blanc de l'oeil
            ctx.fillStyle = c.eyeWhite;
            ctx.beginPath();
            ctx.ellipse(ex, eyeY, 5, eyeHeight, 0, 0, Math.PI * 2);
            ctx.fill();

            if (!blink) {
                // Iris brun
                ctx.fillStyle = c.iris;
                ctx.beginPath();
                ctx.arc(ex + lookX, eyeY + lookY, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Pupille
                ctx.fillStyle = c.kohl;
                ctx.beginPath();
                ctx.arc(ex + lookX, eyeY + lookY, 1.2, 0, Math.PI * 2);
                ctx.fill();

                // Reflet
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(ex + lookX - 0.5, eyeY + lookY - 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Sourcils arqués et marqués
        ctx.strokeStyle = c.kohl;
        ctx.lineWidth = 2;

        let browAngle = 0;
        if (this.currentMood === 'angry' || anim === 'angry') {
            browAngle = 10;
        } else if (this.currentMood === 'happy' || anim === 'happy') {
            browAngle = -5;
        }

        [-1, 1].forEach(side => {
            ctx.save();
            ctx.translate(eyeSpacing * side, eyeY - 8);
            ctx.rotate(browAngle * side * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.quadraticCurveTo(0, -2, 5, 0);
            ctx.stroke();
            ctx.restore();
        });
    }

    /**
     * Dessine le nez aquilin caractéristique
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawNose(ctx, anim, frame) {
        const c = this.colors;

        ctx.strokeStyle = c.skinShadow;
        ctx.lineWidth = 1.5;

        // Arête du nez
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(2, -4, 1, 0);
        ctx.stroke();

        // Narines
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(0, 2, 2, 0);
        ctx.stroke();
    }

    /**
     * Dessine la bouche avec différentes expressions selon l'humeur et l'animation
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawMouth(ctx, anim, frame) {
        const c = this.colors;
        const mouthY = 6;

        if (anim === 'speaking') {
            // Obtenir le phonème actuel de la séquence
            const phoneme = this.speakingSequence[frame % this.speakingSequence.length];
            this.drawSpeakingMouth(ctx, mouthY, phoneme);
        } else if (this.currentMood === 'happy' || anim === 'happy') {
            // Sourire élégant
            ctx.fillStyle = c.lips;
            ctx.beginPath();
            ctx.arc(0, mouthY - 1, 6, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.quadraticCurveTo(0, mouthY + 4, -6 * Math.cos(0.1 * Math.PI), mouthY - 1 + 6 * Math.sin(0.1 * Math.PI));
            ctx.fill();
        } else if (this.currentMood === 'angry' || anim === 'angry') {
            // Moue
            ctx.strokeStyle = c.lips;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, mouthY + 4, 5, 1.2 * Math.PI, 1.8 * Math.PI);
            ctx.stroke();
        } else if (this.currentMood === 'disappointed' || anim === 'disappointed') {
            // Moue de déception - lèvres tombantes
            ctx.fillStyle = c.lips;
            ctx.beginPath();
            ctx.moveTo(-6, mouthY);
            ctx.quadraticCurveTo(-3, mouthY + 3, 0, mouthY + 2);
            ctx.quadraticCurveTo(3, mouthY + 3, 6, mouthY);
            ctx.quadraticCurveTo(3, mouthY + 5, 0, mouthY + 4);
            ctx.quadraticCurveTo(-3, mouthY + 5, -6, mouthY);
            ctx.fill();

            // Coins de la bouche tombants
            ctx.strokeStyle = c.skinShadow;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-6, mouthY);
            ctx.lineTo(-7, mouthY + 2);
            ctx.moveTo(6, mouthY);
            ctx.lineTo(7, mouthY + 2);
            ctx.stroke();
        } else {
            // Neutre - lèvres fermées élégantes
            ctx.fillStyle = c.lips;
            ctx.beginPath();
            ctx.moveTo(-5, mouthY);
            ctx.quadraticCurveTo(-2, mouthY - 1.5, 0, mouthY - 1);
            ctx.quadraticCurveTo(2, mouthY - 1.5, 5, mouthY);
            ctx.quadraticCurveTo(2, mouthY + 2, 0, mouthY + 1.5);
            ctx.quadraticCurveTo(-2, mouthY + 2, -5, mouthY);
            ctx.fill();

            // Ligne de séparation
            ctx.strokeStyle = c.skinShadow;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-4, mouthY);
            ctx.quadraticCurveTo(0, mouthY + 0.5, 4, mouthY);
            ctx.stroke();
        }
    }

    /**
     * Dessine la bouche pendant l'animation de parole avec différents phonèmes
     * Simule la forme de la bouche pour différents sons (lip-sync basique)
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {number} mouthY - Position Y de la bouche
     * @param {number} phoneme - Index du phonème (0-5): 0=fermé, 1=légèrement ouvert, 2="o", 3="a", 4="i/e", 5="ou"
     */
    drawSpeakingMouth(ctx, mouthY, phoneme) {
        const c = this.colors;

        switch (phoneme) {
            case 0: // Fermé - lèvres pincées
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.moveTo(-4, mouthY);
                ctx.quadraticCurveTo(0, mouthY - 0.5, 4, mouthY);
                ctx.quadraticCurveTo(0, mouthY + 1, -4, mouthY);
                ctx.fill();
                break;

            case 1: // Légèrement ouvert - "m/b/p"
                // Lèvre supérieure
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.moveTo(-5, mouthY - 1);
                ctx.quadraticCurveTo(0, mouthY - 2, 5, mouthY - 1);
                ctx.quadraticCurveTo(0, mouthY, -5, mouthY - 1);
                ctx.fill();

                // Petite ouverture
                ctx.fillStyle = '#3a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, mouthY + 0.5, 3, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Lèvre inférieure
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.moveTo(-4, mouthY + 1);
                ctx.quadraticCurveTo(0, mouthY + 3, 4, mouthY + 1);
                ctx.quadraticCurveTo(0, mouthY + 1.5, -4, mouthY + 1);
                ctx.fill();
                break;

            case 2: // Ouvert rond - "o"
                // Lèvres formant un O
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.ellipse(0, mouthY, 5, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Intérieur bouche
                ctx.fillStyle = '#3a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, mouthY, 3.5, 3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Langue visible
                ctx.fillStyle = '#8b4040';
                ctx.beginPath();
                ctx.ellipse(0, mouthY + 1.5, 2, 1.2, 0, 0, Math.PI);
                ctx.fill();
                break;

            case 3: // Large ouvert - "a"
                // Lèvres ouvertes largement
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.moveTo(-6, mouthY - 2);
                ctx.quadraticCurveTo(0, mouthY - 3, 6, mouthY - 2);
                ctx.lineTo(6, mouthY + 2);
                ctx.quadraticCurveTo(0, mouthY + 5, -6, mouthY + 2);
                ctx.closePath();
                ctx.fill();

                // Intérieur bouche
                ctx.fillStyle = '#3a1a1a';
                ctx.beginPath();
                ctx.moveTo(-4, mouthY - 1);
                ctx.quadraticCurveTo(0, mouthY - 2, 4, mouthY - 1);
                ctx.lineTo(4, mouthY + 1);
                ctx.quadraticCurveTo(0, mouthY + 4, -4, mouthY + 1);
                ctx.closePath();
                ctx.fill();

                // Langue
                ctx.fillStyle = '#8b4040';
                ctx.beginPath();
                ctx.ellipse(0, mouthY + 2, 2.5, 1.5, 0, 0, Math.PI);
                ctx.fill();

                // Dents supérieures
                ctx.fillStyle = '#f5f5f0';
                ctx.fillRect(-3, mouthY - 1, 6, 2);
                break;

            case 4: // Étroit horizontal - "i/e"
                // Lèvres étirées horizontalement
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.moveTo(-7, mouthY - 0.5);
                ctx.quadraticCurveTo(0, mouthY - 1.5, 7, mouthY - 0.5);
                ctx.quadraticCurveTo(0, mouthY + 2.5, -7, mouthY - 0.5);
                ctx.fill();

                // Ouverture étroite
                ctx.fillStyle = '#3a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, mouthY + 0.3, 5, 1.2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Dents visibles
                ctx.fillStyle = '#f5f5f0';
                ctx.fillRect(-4, mouthY - 0.3, 8, 1);
                break;

            case 5: // Rond petit - "ou/u"
                // Petites lèvres arrondies
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.ellipse(0, mouthY, 4, 3.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Petite ouverture ronde
                ctx.fillStyle = '#3a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, mouthY, 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Fallback - bouche neutre
                ctx.fillStyle = c.lips;
                ctx.beginPath();
                ctx.ellipse(0, mouthY, 4, 2, 0, 0, Math.PI * 2);
                ctx.fill();
        }

        // Reflet sur la lèvre inférieure (pour tous les phonèmes sauf fermé)
        if (phoneme > 0) {
            ctx.fillStyle = c.lipsHighlight;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 2, 2, 0.8, 0, 0, Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Dessine la perruque égyptienne noire avec stries dorées
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawWig(ctx, anim, frame) {
        const c = this.colors;

        // Perruque noire avec stries
        ctx.fillStyle = c.hair;

        // Partie supérieure arrondie
        ctx.beginPath();
        ctx.arc(0, -20, 22, Math.PI, 0);
        ctx.fill();

        // Côtés de la perruque - tombant sur les épaules
        // Côté gauche
        ctx.beginPath();
        ctx.moveTo(-22, -20);
        ctx.quadraticCurveTo(-26, -5, -24, 15);
        ctx.lineTo(-20, 15);
        ctx.quadraticCurveTo(-20, -5, -18, -15);
        ctx.closePath();
        ctx.fill();

        // Côté droit
        ctx.beginPath();
        ctx.moveTo(22, -20);
        ctx.quadraticCurveTo(26, -5, 24, 15);
        ctx.lineTo(20, 15);
        ctx.quadraticCurveTo(20, -5, 18, -15);
        ctx.closePath();
        ctx.fill();

        // Stries dorées sur la perruque
        ctx.strokeStyle = c.goldDark;
        ctx.lineWidth = 0.8;

        // Stries gauche
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-22 + i * 1.5, -15);
            ctx.quadraticCurveTo(-24 + i * 1.5, 0, -22 + i * 1.5, 12);
            ctx.stroke();
        }

        // Stries droite
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(22 - i * 1.5, -15);
            ctx.quadraticCurveTo(24 - i * 1.5, 0, 22 - i * 1.5, 12);
            ctx.stroke();
        }

        // Frange droite
        ctx.fillStyle = c.hair;
        ctx.beginPath();
        ctx.moveTo(-16, -32);
        ctx.lineTo(16, -32);
        ctx.lineTo(16, -25);
        ctx.quadraticCurveTo(0, -22, -16, -25);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Dessine la coiffe royale avec uraeus (cobra) et disque solaire
     * Inclut le diadème doré et les décorations en lapis-lazuli
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawHeaddress(ctx, anim, frame) {
        const c = this.colors;

        let crownOffset = 0;
        if (anim === 'idle3') {
            crownOffset = Math.sin(frame * Math.PI / 2) * 1;
        }

        ctx.save();
        ctx.translate(0, crownOffset);

        // Bandeau doré (diadème)
        ctx.fillStyle = c.gold;
        ctx.fillRect(-20, -35, 40, 6);

        // Décoration du bandeau
        ctx.fillStyle = c.lapis;
        for (let x = -16; x <= 16; x += 8) {
            ctx.beginPath();
            ctx.rect(x - 2, -34, 4, 4);
            ctx.fill();
        }

        // Détails or sur le bandeau
        ctx.fillStyle = c.goldLight;
        ctx.fillRect(-20, -35, 40, 1.5);
        ctx.fillRect(-20, -30.5, 40, 1.5);

        // Uraeus (cobra royal) au centre
        ctx.fillStyle = c.gold;

        // Corps du cobra
        ctx.beginPath();
        ctx.moveTo(-3, -35);
        ctx.quadraticCurveTo(-4, -42, -2, -48);
        ctx.quadraticCurveTo(0, -52, 2, -48);
        ctx.quadraticCurveTo(4, -42, 3, -35);
        ctx.closePath();
        ctx.fill();

        // Capuchon du cobra
        ctx.beginPath();
        ctx.moveTo(-6, -48);
        ctx.quadraticCurveTo(-8, -52, -5, -55);
        ctx.quadraticCurveTo(0, -58, 5, -55);
        ctx.quadraticCurveTo(8, -52, 6, -48);
        ctx.quadraticCurveTo(0, -46, -6, -48);
        ctx.fill();

        // Yeux du cobra (rubis)
        ctx.fillStyle = c.coral;
        ctx.beginPath();
        ctx.arc(-2, -52, 1.2, 0, Math.PI * 2);
        ctx.arc(2, -52, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Disque solaire au-dessus du cobra
        ctx.fillStyle = c.coral;
        ctx.beginPath();
        ctx.arc(0, -60, 5, 0, Math.PI * 2);
        ctx.fill();

        // Contour doré du disque
        ctx.strokeStyle = c.gold;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Plumes/cornes stylisées de chaque côté
        ctx.fillStyle = c.gold;

        // Gauche
        ctx.beginPath();
        ctx.moveTo(-8, -55);
        ctx.quadraticCurveTo(-15, -58, -12, -48);
        ctx.quadraticCurveTo(-10, -50, -8, -48);
        ctx.closePath();
        ctx.fill();

        // Droite
        ctx.beginPath();
        ctx.moveTo(8, -55);
        ctx.quadraticCurveTo(15, -58, 12, -48);
        ctx.quadraticCurveTo(10, -50, 8, -48);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Dessine les boucles d'oreilles pendantes en lapis-lazuli et or
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawEarrings(ctx, anim, frame) {
        const c = this.colors;

        [-1, 1].forEach(side => {
            const x = 22 * side;

            // Attache dorée
            ctx.fillStyle = c.gold;
            ctx.beginPath();
            ctx.arc(x, -5, 3, 0, Math.PI * 2);
            ctx.fill();

            // Pendentif en goutte (lapis-lazuli)
            ctx.fillStyle = c.lapis;
            ctx.beginPath();
            ctx.moveTo(x, -2);
            ctx.quadraticCurveTo(x - 4 * side, 5, x, 10);
            ctx.quadraticCurveTo(x + 4 * side, 5, x, -2);
            ctx.fill();

            // Bordure or
            ctx.strokeStyle = c.gold;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Petit rubis en bas
            ctx.fillStyle = c.coral;
            ctx.beginPath();
            ctx.arc(x, 8, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Dessine les effets visuels selon l'humeur (éclairs de colère, étoiles de joie, blush)
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} anim - Animation courante
     * @param {number} frame - Frame courante
     */
    drawMoodEffects(ctx, anim, frame) {
        const c = this.colors;

        // En mode persistentEffects, les effets sont toujours visibles
        const showEffects = this.persistentEffects || frame < 4;

        if (anim === 'angry' && showEffects) {
            // Éclairs de colère
            ctx.strokeStyle = c.coral;
            ctx.lineWidth = 2;

            const positions = [[-28, -45], [28, -45]];
            positions.forEach((pos, i) => {
                ctx.save();
                ctx.translate(pos[0], pos[1]);
                ctx.rotate((frame * 20 + i * 45) * Math.PI / 180);

                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(0, 6);
                ctx.moveTo(-4, -3);
                ctx.lineTo(4, 3);
                ctx.moveTo(-4, 3);
                ctx.lineTo(4, -3);
                ctx.stroke();

                ctx.restore();
            });
        }

        if (anim === 'happy' && showEffects) {
            // Étoiles dorées de joie
            ctx.fillStyle = c.gold;
            const positions = [[-30, -50], [30, -50], [-35, -30], [35, -30]];

            positions.forEach((pos, i) => {
                if ((frame + i) % 2 === 0) {
                    this.drawStar(ctx, pos[0], pos[1], 4, 4, 2);
                }
            });
        }

        // Blush quand contente
        if (this.currentMood === 'happy' || anim === 'happy') {
            ctx.fillStyle = 'rgba(205, 92, 92, 0.25)';
            ctx.beginPath();
            ctx.ellipse(-10, -8, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(10, -8, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Dessine une étoile à plusieurs branches
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {number} x - Position X du centre
     * @param {number} y - Position Y du centre
     * @param {number} points - Nombre de branches
     * @param {number} outer - Rayon externe (pointes)
     * @param {number} inner - Rayon interne (creux)
     */
    drawStar(ctx, x, y, points, outer, inner) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outer : inner;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

export default CleopatraSprite;

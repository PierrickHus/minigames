import * as THREE from 'three';
import {
    WORLD_SIZE, WALL_HEIGHT, WALL_THICKNESS,
    GROUND_SIDEWALK_COLOR,
    WALL_BRICK_COLOR, WALL_CONCRETE_COLOR,
    BUILDING_DARK_COLOR, BUILDING_LIGHT_COLOR,
    RUST_COLOR, CAR_COLORS, BARRICADE_WOOD_COLOR, BLOOD_GROUND_COLOR,
    BUILDING_COUNT, CAR_COUNT, BARRICADE_COUNT, STREETLIGHT_COUNT, DEBRIS_COUNT,
    STREETLIGHT_COLOR, STREETLIGHT_INTENSITY, STREETLIGHT_DISTANCE, STREETLIGHT_FLICKER_CHANCE
} from '../constants.js';

const SAFE_ZONE_RADIUS = 6;

/**
 * Constructeur de niveau post-apocalyptique
 * Ambiance The Walking Dead : rue dévastée, bâtiments en ruine,
 * voitures abandonnées, barricades de fortune, lampadaires brisés
 */
export class LevelBuilder {
    /**
     * Construit le niveau et retourne les colliders statiques
     * @param {THREE.Scene} scene
     * @returns {THREE.Box3[]}
     */
    static build(scene) {
        const colliders = [];
        const halfSize = WORLD_SIZE / 2;

        LevelBuilder._createGround(scene);
        LevelBuilder._createPerimeterWalls(scene, colliders, halfSize);
        LevelBuilder._createBuildings(scene, colliders, halfSize);
        LevelBuilder._createAbandonedCars(scene, colliders, halfSize);
        LevelBuilder._createBarricades(scene, colliders, halfSize);
        LevelBuilder._createStreetLights(scene, halfSize);
        LevelBuilder._createDebris(scene);
        LevelBuilder._createBloodStains(scene);

        return colliders;
    }

    /**
     * Crée le sol : route asphaltée avec trottoirs et marquages
     * @param {THREE.Scene} scene
     */
    static _createGround(scene) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Asphalte craquelé
        ctx.fillStyle = '#3A3A3A';
        ctx.fillRect(0, 0, 512, 512);

        // Variations de gris pour simuler l'usure
        for (let i = 0; i < 1500; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const shade = Math.floor(35 + Math.random() * 30);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            ctx.fillRect(x, y, Math.random() * 4 + 1, Math.random() * 4 + 1);
        }

        // Fissures dans l'asphalte
        ctx.strokeStyle = '#2A2A2A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            let x = Math.random() * 512;
            let y = Math.random() * 512;
            ctx.moveTo(x, y);
            for (let j = 0; j < 6; j++) {
                x += (Math.random() - 0.5) * 80;
                y += (Math.random() - 0.5) * 80;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Ligne jaune centrale (route)
        ctx.strokeStyle = '#8A8040';
        ctx.lineWidth = 3;
        ctx.setLineDash([30, 20]);
        ctx.beginPath();
        ctx.moveTo(256, 0);
        ctx.lineTo(256, 512);
        ctx.stroke();
        ctx.setLineDash([]);

        // Taches de rouille et d'huile
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 5 + Math.random() * 15;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, 'rgba(40, 25, 15, 0.6)');
            gradient.addColorStop(1, 'rgba(40, 25, 15, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
            new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, metalness: 0.05 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Trottoirs surélevés le long des bords
        LevelBuilder._createSidewalks(scene);
    }

    /**
     * Crée les trottoirs surélevés sur les côtés de la route
     * @param {THREE.Scene} scene
     */
    static _createSidewalks(scene) {
        const sidewalkMat = new THREE.MeshStandardMaterial({
            color: GROUND_SIDEWALK_COLOR, roughness: 0.85
        });
        const halfSize = WORLD_SIZE / 2;
        const sidewalkWidth = 3;
        const sidewalkHeight = 0.15;

        const configs = [
            { x: -halfSize + sidewalkWidth / 2, z: 0, w: sidewalkWidth, d: WORLD_SIZE },
            { x: halfSize - sidewalkWidth / 2, z: 0, w: sidewalkWidth, d: WORLD_SIZE },
            { x: 0, z: -halfSize + sidewalkWidth / 2, w: WORLD_SIZE, d: sidewalkWidth },
            { x: 0, z: halfSize - sidewalkWidth / 2, w: WORLD_SIZE, d: sidewalkWidth }
        ];

        for (const cfg of configs) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(cfg.w, sidewalkHeight, cfg.d),
                sidewalkMat
            );
            mesh.position.set(cfg.x, sidewalkHeight / 2, cfg.z);
            mesh.receiveShadow = true;
            scene.add(mesh);
        }
    }

    /**
     * Murs d'enceinte en briques/béton (façade de bâtiments fermant la zone)
     * @param {THREE.Scene} scene
     * @param {THREE.Box3[]} colliders
     * @param {number} halfSize
     */
    static _createPerimeterWalls(scene, colliders, halfSize) {
        const brickMat = new THREE.MeshStandardMaterial({ color: WALL_BRICK_COLOR, roughness: 0.9 });
        const concreteMat = new THREE.MeshStandardMaterial({ color: WALL_CONCRETE_COLOR, roughness: 0.85 });

        const wallConfigs = [
            { w: WORLD_SIZE, h: WALL_HEIGHT, d: WALL_THICKNESS, x: 0, z: -halfSize, mat: brickMat },
            { w: WORLD_SIZE, h: WALL_HEIGHT, d: WALL_THICKNESS, x: 0, z: halfSize, mat: concreteMat },
            { w: WALL_THICKNESS, h: WALL_HEIGHT, d: WORLD_SIZE, x: -halfSize, z: 0, mat: brickMat },
            { w: WALL_THICKNESS, h: WALL_HEIGHT, d: WORLD_SIZE, x: halfSize, z: 0, mat: concreteMat }
        ];

        for (const cfg of wallConfigs) {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), cfg.mat);
            wall.position.set(cfg.x, cfg.h / 2, cfg.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            colliders.push(new THREE.Box3().setFromObject(wall));
        }
    }

    /**
     * Bâtiments en ruine le long des bords
     * Structures éventrées avec fenêtres cassées, style TWD
     * @param {THREE.Scene} scene
     * @param {THREE.Box3[]} colliders
     * @param {number} halfSize
     */
    static _createBuildings(scene, colliders, halfSize) {
        const margin = 5;
        const positions = LevelBuilder._generateSafePositions(
            BUILDING_COUNT, halfSize, margin, SAFE_ZONE_RADIUS, 6
        );

        for (const pos of positions) {
            const width = 4 + Math.random() * 5;
            const depth = 4 + Math.random() * 4;
            const height = 3 + Math.random() * 5;
            const isDamaged = Math.random() > 0.3;
            const color = Math.random() > 0.5 ? BUILDING_DARK_COLOR : BUILDING_LIGHT_COLOR;

            const building = LevelBuilder._createBuilding(width, height, depth, color, isDamaged);
            building.position.set(pos.x, 0, pos.z);
            building.rotation.y = Math.floor(Math.random() * 4) * Math.PI / 2;
            scene.add(building);

            const box = new THREE.Box3().setFromObject(building);
            colliders.push(box);
        }
    }

    /**
     * Construit un bâtiment individuel avec détails architecturaux
     * @param {number} width
     * @param {number} height
     * @param {number} depth
     * @param {number} color
     * @param {boolean} isDamaged - Si true, ajoute des dégâts visibles
     * @returns {THREE.Group}
     */
    static _createBuilding(width, height, depth, color, isDamaged) {
        const group = new THREE.Group();
        const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });

        // Corps principal
        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Fenêtres (trous sombres simulant des ouvertures brisées)
        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x1A1A2A, roughness: 0.5, metalness: 0.3
        });
        const windowRows = Math.floor(height / 1.5);
        const windowCols = Math.floor(width / 1.8);

        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                // Certaines fenêtres manquent sur les bâtiments endommagés
                if (isDamaged && Math.random() > 0.6) continue;

                const wx = -width / 2 + 0.9 + col * 1.8;
                const wy = 1.2 + row * 1.5;
                const window = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.8, 0.05),
                    windowMat
                );
                window.position.set(wx, wy, -depth / 2 - 0.02);
                group.add(window);
            }
        }

        // Dégâts : morceau de mur arraché en haut
        if (isDamaged) {
            const damageW = width * (0.2 + Math.random() * 0.3);
            const damageH = height * (0.1 + Math.random() * 0.2);
            const damageMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 1 });
            const damage = new THREE.Mesh(
                new THREE.BoxGeometry(damageW, damageH, depth * 0.3),
                damageMat
            );
            damage.position.set(
                (Math.random() - 0.5) * width * 0.4,
                height - damageH / 2,
                (Math.random() - 0.5) * depth * 0.3
            );
            group.add(damage);
        }

        return group;
    }

    /**
     * Voitures abandonnées sur la route
     * Carcasses rouillées et vitres brisées, icône TWD
     * @param {THREE.Scene} scene
     * @param {THREE.Box3[]} colliders
     * @param {number} halfSize
     */
    static _createAbandonedCars(scene, colliders, halfSize) {
        const positions = LevelBuilder._generateSafePositions(
            CAR_COUNT, halfSize, 4, SAFE_ZONE_RADIUS, 4
        );

        for (const pos of positions) {
            const carColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
            const car = LevelBuilder._createCar(carColor);
            car.position.set(pos.x, 0, pos.z);
            car.rotation.y = Math.random() * Math.PI * 2;
            scene.add(car);

            const box = new THREE.Box3().setFromObject(car);
            colliders.push(box);
        }
    }

    /**
     * Construit une carcasse de voiture
     * @param {number} color
     * @returns {THREE.Group}
     */
    static _createCar(color) {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({
            color, roughness: 0.7, metalness: 0.4
        });
        const rustMat = new THREE.MeshStandardMaterial({
            color: RUST_COLOR, roughness: 0.95, metalness: 0.2
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x334455, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.4
        });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.9 });

        // Carrosserie inférieure
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 4), bodyMat);
        chassis.position.y = 0.5;
        chassis.castShadow = true;
        group.add(chassis);

        // Habitacle (toit)
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.2), bodyMat);
        cabin.position.set(0, 1.05, -0.2);
        cabin.castShadow = true;
        group.add(cabin);

        // Taches de rouille aléatoires
        const rustCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rustCount; i++) {
            const rust = new THREE.Mesh(
                new THREE.BoxGeometry(0.4 + Math.random() * 0.5, 0.3, 0.02),
                rustMat
            );
            rust.position.set(
                (Math.random() - 0.5) * 1.5,
                0.3 + Math.random() * 0.5,
                (Math.random() > 0.5 ? 1 : -1) * 2.01
            );
            group.add(rust);
        }

        // Vitres (partiellement brisées)
        const windows = [
            { x: 0, y: 1.05, z: -1.31, w: 1.5, h: 0.4 },
            { x: 0, y: 1.05, z: 0.91, w: 1.5, h: 0.4 },
        ];

        for (const w of windows) {
            if (Math.random() > 0.4) {
                const glass = new THREE.Mesh(
                    new THREE.BoxGeometry(w.w, w.h, 0.02),
                    glassMat
                );
                glass.position.set(w.x, w.y, w.z);
                group.add(glass);
            }
        }

        // Roues
        const wheelPositions = [
            { x: -0.9, z: -1.3 }, { x: 0.9, z: -1.3 },
            { x: -0.9, z: 1.3 }, { x: 0.9, z: 1.3 }
        ];
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        for (const wp of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeo, tireMat);
            wheel.position.set(wp.x, 0.3, wp.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            group.add(wheel);
        }

        // Légère inclinaison aléatoire (pneu crevé)
        if (Math.random() > 0.5) {
            group.rotation.z = (Math.random() - 0.5) * 0.08;
        }

        return group;
    }

    /**
     * Barricades de fortune (planches, palettes, tôle)
     * Éléments typiques de survie post-apocalyptique
     * @param {THREE.Scene} scene
     * @param {THREE.Box3[]} colliders
     * @param {number} halfSize
     */
    static _createBarricades(scene, colliders, halfSize) {
        const positions = LevelBuilder._generateSafePositions(
            BARRICADE_COUNT, halfSize, 3, SAFE_ZONE_RADIUS, 4
        );

        for (const pos of positions) {
            const barricade = LevelBuilder._createBarricade();
            barricade.position.set(pos.x, 0, pos.z);
            barricade.rotation.y = Math.random() * Math.PI;
            scene.add(barricade);

            const box = new THREE.Box3().setFromObject(barricade);
            colliders.push(box);
        }
    }

    /**
     * Construit une barricade composée de planches et tôle empilées
     * @returns {THREE.Group}
     */
    static _createBarricade() {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: BARRICADE_WOOD_COLOR, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x5A5A5A, roughness: 0.7, metalness: 0.5 });

        // Planches horizontales empilées
        const plankCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < plankCount; i++) {
            const plank = new THREE.Mesh(
                new THREE.BoxGeometry(2 + Math.random(), 0.15, 0.08),
                woodMat
            );
            plank.position.set(
                (Math.random() - 0.5) * 0.3,
                0.3 + i * 0.35,
                (Math.random() - 0.5) * 0.1
            );
            plank.rotation.z = (Math.random() - 0.5) * 0.1;
            plank.castShadow = true;
            group.add(plank);
        }

        // Poteaux verticaux
        for (let side = -1; side <= 1; side += 2) {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 1.5, 0.1),
                woodMat
            );
            post.position.set(side * 0.9, 0.75, 0);
            post.castShadow = true;
            group.add(post);
        }

        // Tôle ondulée optionnelle
        if (Math.random() > 0.5) {
            const sheet = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 0.03),
                metalMat
            );
            sheet.position.set(0.2, 0.8, 0.06);
            sheet.rotation.z = (Math.random() - 0.5) * 0.15;
            sheet.castShadow = true;
            group.add(sheet);
        }

        return group;
    }

    /**
     * Lampadaires de rue, certains fonctionnels, d'autres brisés
     * Éclairage orangé typique des scènes nocturnes TWD
     * @param {THREE.Scene} scene
     * @param {number} halfSize
     */
    static _createStreetLights(scene, halfSize) {
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.6, metalness: 0.7 });
        const spacing = WORLD_SIZE / (STREETLIGHT_COUNT / 2);

        for (let i = 0; i < STREETLIGHT_COUNT; i++) {
            const side = i < STREETLIGHT_COUNT / 2 ? -1 : 1;
            const index = i % (STREETLIGHT_COUNT / 2);
            const z = -halfSize + spacing * (index + 0.5);
            const x = side * (halfSize - 2);

            const group = new THREE.Group();

            // Poteau
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.08, 4, 6),
                metalMat
            );
            pole.position.y = 2;
            pole.castShadow = true;
            group.add(pole);

            // Bras horizontal
            const arm = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.05, 0.05),
                metalMat
            );
            arm.position.set(side * -0.5, 3.9, 0);
            group.add(arm);

            // Luminaire
            const lampMat = new THREE.MeshStandardMaterial({
                color: STREETLIGHT_COLOR,
                emissive: STREETLIGHT_COLOR,
                emissiveIntensity: 0.3
            });
            const lamp = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.1, 0.3),
                lampMat
            );
            lamp.position.set(side * -1, 3.85, 0);
            group.add(lamp);

            // Lumière ponctuelle (certaines fonctionnent encore)
            const isWorking = Math.random() > STREETLIGHT_FLICKER_CHANCE;
            if (isWorking) {
                const light = new THREE.PointLight(
                    STREETLIGHT_COLOR, STREETLIGHT_INTENSITY, STREETLIGHT_DISTANCE
                );
                light.position.set(side * -1, 3.8, 0);
                light.castShadow = false;
                group.add(light);
            }

            group.position.set(x, 0, z);
            scene.add(group);
        }
    }

    /**
     * Débris au sol : gravats, briques, morceaux de tôle
     * Détails qui remplissent la scène post-apocalyptique
     * @param {THREE.Scene} scene
     */
    static _createDebris(scene) {
        const debrisMats = [
            new THREE.MeshStandardMaterial({ color: 0x6A5A4A, roughness: 0.95 }),
            new THREE.MeshStandardMaterial({ color: 0x7A6050, roughness: 0.9 }),
            new THREE.MeshStandardMaterial({ color: 0x5A5A5A, roughness: 0.85, metalness: 0.3 }),
        ];
        for (let i = 0; i < DEBRIS_COUNT; i++) {
            const x = (Math.random() - 0.5) * (WORLD_SIZE - 6);
            const z = (Math.random() - 0.5) * (WORLD_SIZE - 6);

            if (Math.hypot(x, z) < SAFE_ZONE_RADIUS) continue;

            const mat = debrisMats[Math.floor(Math.random() * debrisMats.length)];
            const w = 0.2 + Math.random() * 0.6;
            const h = 0.1 + Math.random() * 0.3;
            const d = 0.2 + Math.random() * 0.6;

            const debris = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            debris.position.set(x, h / 2, z);
            debris.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI,
                Math.random() * 0.3
            );
            debris.castShadow = true;
            debris.receiveShadow = true;
            scene.add(debris);
        }
    }

    /**
     * Taches de sang au sol pour l'ambiance horrifique
     * @param {THREE.Scene} scene
     */
    static _createBloodStains(scene) {
        const bloodMat = new THREE.MeshStandardMaterial({
            color: BLOOD_GROUND_COLOR, roughness: 1, transparent: true, opacity: 0.6
        });
        const stainCount = 6;

        for (let i = 0; i < stainCount; i++) {
            const x = (Math.random() - 0.5) * (WORLD_SIZE - 8);
            const z = (Math.random() - 0.5) * (WORLD_SIZE - 8);
            const size = 0.5 + Math.random() * 1.5;

            const stain = new THREE.Mesh(
                new THREE.CircleGeometry(size, 8),
                bloodMat
            );
            stain.rotation.x = -Math.PI / 2;
            stain.position.set(x, 0.01, z);
            scene.add(stain);
        }
    }

    /**
     * Génère des positions aléatoires qui respectent la zone de sécurité du joueur
     * et maintiennent une distance minimale entre elles
     * @param {number} count
     * @param {number} halfSize
     * @param {number} margin
     * @param {number} safeZone - Rayon de la zone de spawn joueur à éviter
     * @param {number} minSpacing - Distance minimale entre les positions
     * @returns {Array<{ x: number, z: number }>}
     */
    static _generateSafePositions(count, halfSize, margin, safeZone, minSpacing) {
        const positions = [];
        let attempts = 0;
        const maxAttempts = count * 20;

        while (positions.length < count && attempts < maxAttempts) {
            attempts++;
            const x = (Math.random() - 0.5) * (WORLD_SIZE - margin * 2);
            const z = (Math.random() - 0.5) * (WORLD_SIZE - margin * 2);

            if (Math.hypot(x, z) < safeZone) continue;

            const tooClose = positions.some(p => {
                return Math.hypot(p.x - x, p.z - z) < minSpacing;
            });
            if (tooClose) continue;

            positions.push({ x, z });
        }

        return positions;
    }
}

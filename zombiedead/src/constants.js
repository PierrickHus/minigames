/**
 * Constantes globales du jeu ZombieDead
 * Inspiré de Zombicide (gameplay vagues/loot) et The Walking Dead (ambiance post-apo)
 * Toutes les valeurs de configuration et d'équilibrage sont centralisées ici
 */

// === Joueur ===
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_SPEED = 8;
export const PLAYER_SPRINT_SPEED = 14;
export const PLAYER_HEIGHT = 1.7;
export const PLAYER_RADIUS = 0.4;
export const PLAYER_HEAD_BOB_SPEED = 12;
export const PLAYER_HEAD_BOB_AMPLITUDE = 0.04;
export const PLAYER_DAMAGE_SHAKE_INTENSITY = 0.15;
export const PLAYER_DAMAGE_SHAKE_DURATION_MS = 200;

// === Zombies - Types Zombicide ===
// Walker : zombie de base, traînant et lent comme dans Zombicide/TWD
export const ZOMBIE_WALKER_SPEED = 0.5;
export const ZOMBIE_WALKER_HEALTH = 50;
// Runner : seul type un peu rapide, apparaît plus tard
export const ZOMBIE_RUNNER_SPEED = 2;
export const ZOMBIE_RUNNER_HEALTH = 25;
// Fatty : gros zombie endurant, très lent (Zombicide)
export const ZOMBIE_FATTY_SPEED = 0.3;
export const ZOMBIE_FATTY_HEALTH = 150;
// Abomination : boss massif quasi-invulnérable, marche à peine (Zombicide)
export const ZOMBIE_ABOMINATION_SPEED = 0.2;
export const ZOMBIE_ABOMINATION_HEALTH = 400;

export const ZOMBIE_ATTACK_DAMAGE = 15;
export const ZOMBIE_FATTY_ATTACK_DAMAGE = 25;
export const ZOMBIE_ABOMINATION_ATTACK_DAMAGE = 50;
export const ZOMBIE_ATTACK_RANGE = 1.8;
export const ZOMBIE_ATTACK_COOLDOWN_MS = 1000;
/** Durée de l'animation de frappe du zombie en ms (le dégât arrive à mi-animation) */
export const ZOMBIE_ATTACK_WINDUP_MS = 400;
/** Durée totale de l'animation d'attaque en ms */
export const ZOMBIE_ATTACK_ANIM_DURATION_MS = 700;

// === Esquive joueur ===
export const DODGE_SPEED = 16;
export const DODGE_DURATION_MS = 250;
export const DODGE_COOLDOWN_MS = 800;
/** Pendant l'esquive, le rayon de collision du joueur est réduit pour se faufiler */
export const DODGE_COLLISION_RADIUS_MULTIPLIER = 0.4;
export const ZOMBIE_DETECTION_RANGE = 100;
export const ZOMBIE_BODY_WIDTH = 0.5;
export const ZOMBIE_BODY_HEIGHT = 1.6;
export const ZOMBIE_COLLISION_RADIUS = 0.4;
export const ZOMBIE_FATTY_COLLISION_RADIUS = 0.7;
export const ZOMBIE_ABOMINATION_COLLISION_RADIUS = 0.9;

// === Membres détachables ===
// HP par membre avant arrachement (par type de zombie)
export const LIMB_HP_WALKER = { arm: 20, leg: 25, neck: 30 };
export const LIMB_HP_RUNNER = { arm: 15, leg: 20, neck: 20 };
export const LIMB_HP_FATTY = { arm: 40, leg: 50, neck: 60 };
export const LIMB_HP_ABOMINATION = { arm: 80, leg: 100, neck: 120 };

// Multiplicateur de dégâts par zone
export const HEADSHOT_DAMAGE_MULTIPLIER = 2;
export const LIMB_DAMAGE_MULTIPLIER = 1;
export const TORSO_DAMAGE_MULTIPLIER = 1;

// Multiplicateurs de vitesse selon les jambes restantes
export const SPEED_MULTIPLIER_ONE_LEG = 0.4;
export const SPEED_MULTIPLIER_NO_LEGS = 0.15;
// Hauteur du zombie quand il rampe (position Y du mesh)
export const CRAWL_HEIGHT = 0.2;
export const LIMP_HEIGHT = -0.2;

// Multiplicateurs de dégâts d'attaque selon les bras restants
export const ATTACK_MULTIPLIER_ONE_ARM = 0.6;
export const ATTACK_MULTIPLIER_NO_ARMS = 0.3;
// Portée de morsure (sans bras)
export const BITE_ATTACK_RANGE = 1.2;

// Durée avant qu'un membre arraché disparaisse du sol
export const SEVERED_LIMB_LIFETIME_MS = 8000;
// Moignon sanglant
export const STUMP_COLOR = 0x6B0000;

// Points Zombicide-style
export const ZOMBIE_SCORE_WALKER = 100;
export const ZOMBIE_SCORE_RUNNER = 150;
export const ZOMBIE_SCORE_FATTY = 250;
export const ZOMBIE_SCORE_ABOMINATION = 500;
export const ZOMBIE_DEATH_FADE_DURATION_MS = 2000;

// === Couleurs zombies Walking Dead ===
export const ZOMBIE_SKIN_DECAY_GREEN = 0x6B7B4F;
export const ZOMBIE_SKIN_PALE = 0x9B9B7A;
export const ZOMBIE_SKIN_DARK_DECAY = 0x4A5A3A;
export const ZOMBIE_BLOOD_STAIN = 0x8B0000;
export const ZOMBIE_CLOTHES_RAGS = 0x5C5040;
export const ZOMBIE_CLOTHES_HOSPITAL = 0x9BAFAF;
export const ZOMBIE_CLOTHES_OFFICE = 0x3A3A4A;
export const ZOMBIE_CLOTHES_WORKER = 0x7A6030;

// === Armes - Pistolet ===
export const PISTOL_DAMAGE = 25;
export const PISTOL_FIRE_RATE = 3;
export const PISTOL_MAG_SIZE = 12;
export const PISTOL_RESERVE_AMMO = 60;
export const PISTOL_RELOAD_TIME_MS = 1500;
export const PISTOL_SPREAD = 0.02;

// === Armes - Fusil à pompe ===
export const SHOTGUN_DAMAGE = 15;
export const SHOTGUN_PELLET_COUNT = 8;
export const SHOTGUN_FIRE_RATE = 1;
export const SHOTGUN_MAG_SIZE = 6;
export const SHOTGUN_RESERVE_AMMO = 30;
export const SHOTGUN_RELOAD_TIME_MS = 2500;
export const SHOTGUN_SPREAD = 0.1;

// === Armes - Fusil d'assaut ===
export const RIFLE_DAMAGE = 18;
export const RIFLE_FIRE_RATE = 10;
export const RIFLE_MAG_SIZE = 30;
export const RIFLE_RESERVE_AMMO = 120;
export const RIFLE_RELOAD_TIME_MS = 2000;
export const RIFLE_SPREAD = 0.04;

// === Armes - Viewmodel ===
export const WEAPON_SWAY_AMOUNT = 0.002;
export const WEAPON_RECOIL_AMOUNT = 0.05;
export const WEAPON_RECOIL_RECOVERY_SPEED = 8;

// === Vagues (progression Zombicide) ===
export const WAVE_BASE_COUNT = 6;
export const WAVE_SCALING_FACTOR = 4;
export const WAVE_REST_DURATION_MS = 5000;
export const WAVE_RUNNER_START_WAVE = 2;
export const WAVE_FATTY_START_WAVE = 4;
export const WAVE_ABOMINATION_START_WAVE = 7;
export const WAVE_RUNNER_RATIO = 0.25;
export const WAVE_FATTY_RATIO = 0.15;
export const WAVE_ABOMINATION_RATIO = 0.05;
export const WAVE_SPAWN_INTERVAL_MS = 800;
export const WAVE_BANNER_DURATION_MS = 2000;

// === Monde post-apocalyptique ===
export const WORLD_SIZE = 80;
export const WALL_HEIGHT = 4;
export const WALL_THICKNESS = 0.5;

// Couleurs urbaines désolées style TWD
export const GROUND_ASPHALT_COLOR = 0x3A3A3A;
export const GROUND_SIDEWALK_COLOR = 0x6A6A6A;
export const WALL_BRICK_COLOR = 0x7A5040;
export const WALL_CONCRETE_COLOR = 0x6A6A6A;
export const BUILDING_DARK_COLOR = 0x4A4040;
export const BUILDING_LIGHT_COLOR = 0x6A6050;
export const RUST_COLOR = 0x8B4513;
export const CAR_COLORS = [0x8B0000, 0x2F4F4F, 0x4A4A4A, 0x6B6B5A, 0x3A3A5A];
export const BARRICADE_WOOD_COLOR = 0x8B7355;
export const BLOOD_GROUND_COLOR = 0x4A0000;

// Décor
export const BUILDING_COUNT = 14;
export const CAR_COUNT = 10;
export const BARRICADE_COUNT = 8;
export const STREETLIGHT_COUNT = 12;
export const DEBRIS_COUNT = 25;

// === Spawn ===
export const SPAWN_MIN_DISTANCE_FROM_PLAYER = 15;
export const SPAWN_EDGE_MARGIN = 2;

// === Physique ===
export const GRAVITY = 20;
export const GROUND_LEVEL = 0;

// Masse des entités (influence la bousculade)
export const PLAYER_MASS = 80;
export const ZOMBIE_WALKER_MASS = 60;
export const ZOMBIE_RUNNER_MASS = 50;
export const ZOMBIE_FATTY_MASS = 150;
export const ZOMBIE_ABOMINATION_MASS = 300;

// Force de poussée quand les entités se chevauchent
export const PUSH_FORCE = 8;
// Force de poussée du joueur en sprint sur les zombies
export const SPRINT_PUSH_MULTIPLIER = 2.5;

// === Effets ===
export const PARTICLE_POOL_SIZE = 500;
export const BLOOD_PARTICLE_COUNT = 15;
export const BLOOD_PARTICLE_SPEED = 4;
export const BLOOD_PARTICLE_LIFE_MS = 600;
export const BLOOD_PARTICLE_SIZE = 0.15;
export const MUZZLE_FLASH_DURATION_MS = 50;
export const MUZZLE_FLASH_INTENSITY = 2;

// Impacts de balles
export const IMPACT_SPARK_COUNT = 6;
export const IMPACT_SPARK_SPEED = 3;
export const IMPACT_SPARK_LIFE_MS = 300;
export const IMPACT_SPARK_SIZE = 0.08;
export const IMPACT_DECAL_SIZE = 0.15;
export const IMPACT_DECAL_LIFETIME_MS = 15000;
export const IMPACT_MAX_DECALS = 50;

// === Audio ===
export const AUDIO_MASTER_VOLUME = 0.5;
export const AUDIO_SFX_VOLUME = 0.7;
export const AUDIO_MUSIC_VOLUME = 0.3;

// === Éclairage crépusculaire Walking Dead ===
export const AMBIENT_LIGHT_COLOR = 0x8A7D6A;
export const AMBIENT_LIGHT_INTENSITY = 0.8;
export const DIRECTIONAL_LIGHT_COLOR = 0xFFCC88;
export const DIRECTIONAL_LIGHT_INTENSITY = 1.2;
export const FOG_COLOR = 0x3A3025;
export const FOG_NEAR = 40;
export const FOG_FAR = 90;

// Lampadaires (lumière orangée)
export const STREETLIGHT_COLOR = 0xFFBB55;
export const STREETLIGHT_INTENSITY = 2.5;
export const STREETLIGHT_DISTANCE = 15;
export const STREETLIGHT_FLICKER_CHANCE = 0.2;

// === Rendu ===
export const MAX_DELTA_TIME = 0.1;
export const FIXED_TIMESTEP = 1 / 60;

// ==========================================
// DONNÉES DES BÂTIMENTS
// ==========================================

const BUILDINGS = {
    // ========== GOUVERNEMENT ==========
    governor_palace: {
        id: 'governor_palace',
        name: 'Palais du Gouverneur',
        category: 'government',
        icon: '🏛️',
        cost: 0,
        turns: 0,
        effects: { order: 10, politics: 5 },
        description: 'Centre administratif de la ville',
        upgrades: ['governor_palace_2'],
        prerequisite: null
    },
    governor_palace_2: {
        id: 'governor_palace_2',
        name: 'Grand Palais',
        category: 'government',
        icon: '🏛️',
        cost: 2000,
        turns: 4,
        effects: { order: 20, politics: 15, income: 100 },
        description: 'Palais agrandi avec plus d\'autorité',
        upgrades: ['governor_palace_3'],
        prerequisite: 'governor_palace'
    },
    governor_palace_3: {
        id: 'governor_palace_3',
        name: 'Palais Impérial',
        category: 'government',
        icon: '🏛️',
        cost: 5000,
        turns: 6,
        effects: { order: 35, politics: 30, income: 250 },
        description: 'Le summum du pouvoir local',
        upgrades: [],
        prerequisite: 'governor_palace_2'
    },

    // ========== AGRICULTURE ==========
    farm: {
        id: 'farm',
        name: 'Ferme',
        category: 'food',
        icon: '🌾',
        cost: 500,
        turns: 2,
        effects: { food: 50, populationGrowth: 1 },
        description: 'Production de nourriture de base',
        upgrades: ['large_farm'],
        prerequisite: null,
        workers: 50
    },
    large_farm: {
        id: 'large_farm',
        name: 'Grande Ferme',
        category: 'food',
        icon: '🌾',
        cost: 1200,
        turns: 3,
        effects: { food: 120, populationGrowth: 2 },
        description: 'Production agricole augmentée',
        upgrades: ['latifundium'],
        prerequisite: 'farm',
        workers: 100
    },
    latifundium: {
        id: 'latifundium',
        name: 'Latifundium',
        category: 'food',
        icon: '🌾',
        cost: 3000,
        turns: 4,
        effects: { food: 250, populationGrowth: 3 },
        description: 'Immense exploitation agricole',
        upgrades: [],
        prerequisite: 'large_farm',
        workers: 200
    },

    // ========== ÉCONOMIE ==========
    market: {
        id: 'market',
        name: 'Marché',
        category: 'economy',
        icon: '🏪',
        cost: 800,
        turns: 2,
        effects: { income: 150, trade: 10 },
        description: 'Commerce local',
        upgrades: ['forum'],
        prerequisite: null
    },
    forum: {
        id: 'forum',
        name: 'Forum',
        category: 'economy',
        icon: '🏛️',
        cost: 2000,
        turns: 4,
        effects: { income: 350, trade: 25, politics: 10 },
        description: 'Centre commercial et politique',
        upgrades: ['grand_forum'],
        prerequisite: 'market'
    },
    grand_forum: {
        id: 'grand_forum',
        name: 'Grand Forum',
        category: 'economy',
        icon: '🏛️',
        cost: 4500,
        turns: 5,
        effects: { income: 600, trade: 50, politics: 25 },
        description: 'Coeur économique de la région',
        upgrades: [],
        prerequisite: 'forum'
    },
    mine: {
        id: 'mine',
        name: 'Mine',
        category: 'economy',
        icon: '⛏️',
        cost: 1000,
        turns: 3,
        effects: { income: 200, iron: 20 },
        description: 'Extraction de minerai',
        upgrades: ['deep_mine'],
        prerequisite: null,
        workers: 75
    },
    deep_mine: {
        id: 'deep_mine',
        name: 'Mine Profonde',
        category: 'economy',
        icon: '⛏️',
        cost: 2500,
        turns: 4,
        effects: { income: 450, iron: 50 },
        description: 'Extraction intensive',
        upgrades: [],
        prerequisite: 'mine',
        workers: 150
    },
    pottery: {
        id: 'pottery',
        name: 'Poterie',
        category: 'economy',
        icon: '🏺',
        cost: 600,
        turns: 2,
        effects: { income: 100, trade: 5 },
        description: 'Artisanat et commerce',
        upgrades: [],
        prerequisite: null,
        workers: 30
    },
    port: {
        id: 'port',
        name: 'Port',
        category: 'economy',
        icon: '⚓',
        cost: 1500,
        turns: 3,
        effects: { income: 200, trade: 30, navalCapacity: 3 },
        description: 'Commerce maritime',
        upgrades: ['grand_port'],
        prerequisite: null,
        coastal: true
    },
    grand_port: {
        id: 'grand_port',
        name: 'Grand Port',
        category: 'economy',
        icon: '⚓',
        cost: 4000,
        turns: 5,
        effects: { income: 500, trade: 60, navalCapacity: 6 },
        description: 'Hub commercial maritime',
        upgrades: [],
        prerequisite: 'port',
        coastal: true
    },

    // ========== SANTÉ ==========
    well: {
        id: 'well',
        name: 'Puits',
        category: 'health',
        icon: '💧',
        cost: 300,
        turns: 1,
        effects: { health: 10, populationGrowth: 0.5 },
        description: 'Accès à l\'eau potable',
        upgrades: ['aqueduct'],
        prerequisite: null
    },
    aqueduct: {
        id: 'aqueduct',
        name: 'Aqueduc',
        category: 'health',
        icon: '🌊',
        cost: 2000,
        turns: 4,
        effects: { health: 30, populationGrowth: 2 },
        description: 'Système d\'approvisionnement en eau',
        upgrades: [],
        prerequisite: 'well'
    },
    baths: {
        id: 'baths',
        name: 'Thermes',
        category: 'health',
        icon: '🛁',
        cost: 1500,
        turns: 3,
        effects: { health: 20, happiness: 15, order: 5 },
        description: 'Hygiène et détente',
        upgrades: ['grand_baths'],
        prerequisite: 'aqueduct'
    },
    grand_baths: {
        id: 'grand_baths',
        name: 'Grands Thermes',
        category: 'health',
        icon: '🛁',
        cost: 4000,
        turns: 5,
        effects: { health: 40, happiness: 30, order: 10 },
        description: 'Complexe thermal luxueux',
        upgrades: [],
        prerequisite: 'baths'
    },

    // ========== CULTURE ==========
    temple: {
        id: 'temple',
        name: 'Temple',
        category: 'culture',
        icon: '⛪',
        cost: 1000,
        turns: 3,
        effects: { happiness: 15, order: 10 },
        description: 'Lieu de culte',
        upgrades: ['grand_temple'],
        prerequisite: null
    },
    grand_temple: {
        id: 'grand_temple',
        name: 'Grand Temple',
        category: 'culture',
        icon: '⛪',
        cost: 3500,
        turns: 5,
        effects: { happiness: 35, order: 25, politics: 10 },
        description: 'Monument religieux majeur',
        upgrades: [],
        prerequisite: 'temple'
    },
    arena: {
        id: 'arena',
        name: 'Arène',
        category: 'culture',
        icon: '🏟️',
        cost: 2000,
        turns: 4,
        effects: { happiness: 25, order: 15 },
        description: 'Spectacles de gladiateurs',
        upgrades: ['colosseum'],
        prerequisite: null
    },
    colosseum: {
        id: 'colosseum',
        name: 'Colisée',
        category: 'culture',
        icon: '🏟️',
        cost: 8000,
        turns: 8,
        effects: { happiness: 60, order: 40, politics: 20 },
        description: 'Le plus grand amphithéâtre',
        upgrades: [],
        prerequisite: 'arena'
    },

    // ========== MILITAIRE ==========
    barracks: {
        id: 'barracks',
        name: 'Caserne',
        category: 'military',
        icon: '🏕️',
        cost: 800,
        turns: 2,
        effects: { recruitSpeed: 1 },
        description: 'Entraînement de base des soldats',
        upgrades: ['training_ground'],
        prerequisite: null,
        unlocksUnits: ['hastati', 'velites']
    },
    training_ground: {
        id: 'training_ground',
        name: 'Champ d\'Entraînement',
        category: 'military',
        icon: '⚔️',
        cost: 2000,
        turns: 3,
        effects: { recruitSpeed: 2, experienceBonus: 1 },
        description: 'Formation avancée des troupes',
        upgrades: ['military_academy'],
        prerequisite: 'barracks',
        unlocksUnits: ['principes', 'equites']
    },
    military_academy: {
        id: 'military_academy',
        name: 'Académie Militaire',
        category: 'military',
        icon: '🏛️',
        cost: 5000,
        turns: 5,
        effects: { recruitSpeed: 3, experienceBonus: 2 },
        description: 'Elite militaire romaine',
        upgrades: [],
        prerequisite: 'training_ground',
        unlocksUnits: ['triarii', 'praetorians']
    },
    stables: {
        id: 'stables',
        name: 'Écuries',
        category: 'military',
        icon: '🐴',
        cost: 1500,
        turns: 3,
        effects: {},
        description: 'Élevage et entraînement de chevaux',
        upgrades: ['cavalry_barracks'],
        prerequisite: null,
        unlocksUnits: ['equites']
    },
    cavalry_barracks: {
        id: 'cavalry_barracks',
        name: 'Caserne de Cavalerie',
        category: 'military',
        icon: '🐴',
        cost: 3500,
        turns: 4,
        effects: { cavalryBonus: 1 },
        description: 'Cavalerie d\'élite',
        upgrades: [],
        prerequisite: 'stables',
        unlocksUnits: ['legionary_cavalry', 'cataphracts']
    },
    blacksmith: {
        id: 'blacksmith',
        name: 'Forge',
        category: 'military',
        icon: '⚒️',
        cost: 1200,
        turns: 3,
        effects: { weaponQuality: 1, armorQuality: 1 },
        description: 'Améliore l\'équipement des soldats',
        upgrades: ['armory'],
        prerequisite: 'mine'
    },
    armory: {
        id: 'armory',
        name: 'Arsenal',
        category: 'military',
        icon: '⚒️',
        cost: 3000,
        turns: 4,
        effects: { weaponQuality: 2, armorQuality: 2 },
        description: 'Production d\'armes de qualité',
        upgrades: [],
        prerequisite: 'blacksmith'
    },

    // ========== DÉFENSE ==========
    walls: {
        id: 'walls',
        name: 'Palissade',
        category: 'defense',
        icon: '🧱',
        cost: 600,
        turns: 2,
        effects: { defense: 20 },
        description: 'Défense basique en bois',
        upgrades: ['stone_walls'],
        prerequisite: null
    },
    stone_walls: {
        id: 'stone_walls',
        name: 'Murailles de Pierre',
        category: 'defense',
        icon: '🏰',
        cost: 2500,
        turns: 4,
        effects: { defense: 50 },
        description: 'Fortifications solides',
        upgrades: ['epic_walls'],
        prerequisite: 'walls'
    },
    epic_walls: {
        id: 'epic_walls',
        name: 'Grande Muraille',
        category: 'defense',
        icon: '🏰',
        cost: 6000,
        turns: 6,
        effects: { defense: 100, towers: true },
        description: 'Fortifications imprenables',
        upgrades: [],
        prerequisite: 'stone_walls'
    }
};

export default BUILDINGS;

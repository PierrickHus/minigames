// ==========================================
// DONNÉES DES BÂTIMENTS
// ==========================================

// Définition des tiers
const TIER_NAMES = {
    1: 'Début de partie',
    2: 'Milieu de partie',
    3: 'Fin de partie'
};

const BUILDINGS = {
    // ==========================================
    // TIER 1 - DÉBUT DE PARTIE
    // ==========================================

    hut: {
        id: 'hut',
        name: 'Hutte',
        icon: '🛖',
        tier: 1,
        description: 'Abri simple et rapide à construire - 10 habitants',
        cost: {
            money: 40,
            wood: 5,
            dirt: 10
        },
        buildTime: 15,
        effects: {
            population: 10,
            peasants: 1
        },
        reward: 60,
        maxCount: 100
    },

    house: {
        id: 'house',
        name: 'Maison',
        icon: '🏠',
        tier: 1,
        description: 'Abrite 20 habitants et fournit 2 paysans',
        cost: {
            money: 100,
            wood: 10,
            clay: 5
        },
        buildTime: 30,
        effects: {
            population: 20,
            peasants: 2
        },
        reward: 150,
        maxCount: 50
    },

    well: {
        id: 'well',
        name: 'Puits',
        icon: '🪣',
        tier: 1,
        description: 'Fournit 10 eau par minute',
        cost: {
            money: 80,
            stone: 15,
            dirt: 10
        },
        buildTime: 20,
        effects: {
            waterPerMinute: 10
        },
        reward: 100,
        maxCount: 10
    },

    field: {
        id: 'field',
        name: 'Champ',
        icon: '🌾',
        tier: 1,
        description: 'Produit 5 nourriture par minute',
        cost: {
            money: 50,
            dirt: 20,
            water: 10
        },
        buildTime: 25,
        effects: {
            foodPerMinute: 5
        },
        reward: 80,
        maxCount: 20
    },

    farm: {
        id: 'farm',
        name: 'Ferme',
        icon: '🏡',
        tier: 1,
        description: 'Produit 10 nourriture/min et abrite 15 habitants',
        cost: {
            money: 120,
            wood: 15,
            dirt: 20,
            water: 5
        },
        buildTime: 35,
        effects: {
            population: 15,
            peasants: 1,
            foodPerMinute: 10
        },
        reward: 180,
        maxCount: 30
    },

    cistern: {
        id: 'cistern',
        name: 'Citerne',
        icon: '🏺',
        tier: 1,
        description: 'Grande réserve d\'eau - 20 eau/min',
        cost: {
            money: 100,
            stone: 20,
            clay: 15
        },
        buildTime: 30,
        effects: {
            waterPerMinute: 20
        },
        reward: 130,
        maxCount: 15
    },

    granary: {
        id: 'granary',
        name: 'Grenier',
        icon: '🏪',
        tier: 1,
        description: 'Stocke la nourriture et réduit les pertes',
        cost: {
            money: 150,
            wood: 20,
            clay: 10
        },
        buildTime: 40,
        effects: {
            foodStorage: 500
        },
        reward: 200,
        maxCount: 5
    },

    workshop: {
        id: 'workshop',
        name: 'Atelier',
        icon: '🔨',
        tier: 1,
        description: 'Produit 2 bois et 2 pierre par minute',
        cost: {
            money: 180,
            wood: 20,
            stone: 15
        },
        buildTime: 40,
        effects: {
            woodPerMinute: 2,
            stonePerMinute: 2
        },
        reward: 220,
        maxCount: 10
    },

    aviary: {
        id: 'aviary',
        name: 'Volière',
        icon: '🕊️',
        tier: 1,
        description: 'Produit 1 🕊️/3min (max 1). Nécessaire pour les messages à César.',
        cost: {
            money: 150,
            wood: 20,
            clay: 10
        },
        buildTime: 35,
        effects: {
            enableMessages: true,
            birdsPerMinute: 2
        },
        reward: 200,
        maxCount: 3
    },

    bakery: {
        id: 'bakery',
        name: 'Boulangerie',
        icon: '🥖',
        tier: 1,
        description: 'Transforme le blé en pain - +15 nourriture/min',
        cost: {
            money: 200,
            wood: 25,
            clay: 15,
            stone: 10
        },
        buildTime: 45,
        effects: {
            foodPerMinute: 15
        },
        reward: 250,
        maxCount: 5
    },

    // ==========================================
    // TIER 2 - MILIEU DE PARTIE
    // ==========================================

    inn: {
        id: 'inn',
        name: 'Auberge',
        icon: '🍺',
        tier: 2,
        description: 'Attire les voyageurs - 20 habitants et bonus croissance',
        cost: {
            money: 150,
            wood: 25,
            clay: 10
        },
        buildTime: 35,
        effects: {
            population: 20,
            growthBonus: true
        },
        reward: 200,
        maxCount: 20
    },

    market: {
        id: 'market',
        name: 'Marché',
        icon: '🏬',
        tier: 2,
        description: 'Génère 20 argent par minute et attire 10 habitants',
        cost: {
            money: 300,
            wood: 30,
            stone: 20,
            clay: 15
        },
        buildTime: 60,
        effects: {
            moneyPerMinute: 20,
            population: 10
        },
        reward: 400,
        maxCount: 5
    },

    quarry: {
        id: 'quarry',
        name: 'Carrière',
        icon: '⛏️',
        tier: 2,
        description: 'Extrait automatiquement 3 pierre par minute',
        cost: {
            money: 250,
            wood: 15,
            dirt: 30
        },
        buildTime: 50,
        effects: {
            stonePerMinute: 3
        },
        reward: 300,
        maxCount: 3
    },

    lumbermill: {
        id: 'lumbermill',
        name: 'Scierie',
        icon: '🪚',
        tier: 2,
        description: 'Produit automatiquement 3 bois par minute',
        cost: {
            money: 200,
            stone: 20,
            wood: 10
        },
        buildTime: 45,
        effects: {
            woodPerMinute: 3
        },
        reward: 250,
        maxCount: 3
    },

    obelisk: {
        id: 'obelisk',
        name: 'Obélisque',
        icon: '🗿',
        tier: 2,
        description: 'Symbole de prestige - Attire 30 habitants',
        cost: {
            money: 400,
            stone: 80,
            sand: 40
        },
        buildTime: 70,
        effects: {
            population: 30
        },
        reward: 500,
        maxCount: 4
    },

    barracks: {
        id: 'barracks',
        name: 'Caserne',
        icon: '⚔️',
        tier: 2,
        description: 'Protège le village et attire 25 habitants',
        cost: {
            money: 350,
            wood: 40,
            stone: 30
        },
        buildTime: 55,
        effects: {
            population: 25,
            protection: true
        },
        reward: 450,
        maxCount: 2
    },

    temple: {
        id: 'temple',
        name: 'Temple',
        icon: '🏛️',
        tier: 2,
        description: 'Attire 50 habitants et plaît beaucoup à Cléopâtre',
        cost: {
            money: 500,
            stone: 50,
            sand: 30,
            clay: 20
        },
        buildTime: 90,
        effects: {
            population: 50,
            cleopatraBonus: true
        },
        reward: 700,
        maxCount: 3
    },

    villa: {
        id: 'villa',
        name: 'Villa',
        icon: '🏘️',
        tier: 2,
        description: 'Résidence luxueuse - 60 habitants et 3 paysans',
        cost: {
            money: 500,
            wood: 40,
            stone: 35,
            clay: 25
        },
        buildTime: 75,
        effects: {
            population: 60,
            peasants: 3
        },
        reward: 650,
        maxCount: 30
    },

    baths: {
        id: 'baths',
        name: 'Thermes',
        icon: '🛁',
        tier: 2,
        description: 'Bains publics - 45 habitants et boost croissance',
        cost: {
            money: 400,
            stone: 50,
            clay: 30,
            water: 20
        },
        buildTime: 65,
        effects: {
            population: 45,
            growthBonus: true
        },
        reward: 550,
        maxCount: 10
    },

    library: {
        id: 'library',
        name: 'Bibliothèque',
        icon: '📚',
        tier: 2,
        description: 'Centre du savoir - 35 habitants, plaît à Cléopâtre',
        cost: {
            money: 350,
            wood: 30,
            stone: 25,
            sand: 15
        },
        buildTime: 55,
        effects: {
            population: 35,
            cleopatraBonus: true
        },
        reward: 500,
        maxCount: 5
    },

    harbor: {
        id: 'harbor',
        name: 'Port',
        icon: '⚓',
        tier: 2,
        description: 'Commerce maritime - 80 habitants et 30 argent/min',
        cost: {
            money: 600,
            wood: 60,
            stone: 40,
            sand: 30
        },
        buildTime: 90,
        effects: {
            population: 80,
            moneyPerMinute: 30
        },
        reward: 800,
        maxCount: 5
    },

    gardens: {
        id: 'gardens',
        name: 'Jardins suspendus',
        icon: '🌳',
        tier: 2,
        description: 'Merveille verte - 50 habitants et forte croissance naturelle',
        cost: {
            money: 450,
            wood: 20,
            dirt: 50,
            water: 30
        },
        buildTime: 70,
        effects: {
            population: 50,
            growthBonus: true,
            foodPerMinute: 5
        },
        reward: 600,
        maxCount: 10
    },

    // ==========================================
    // TIER 3 - FIN DE PARTIE
    // ==========================================

    pyramid: {
        id: 'pyramid',
        name: 'Pyramide',
        icon: '🔺',
        tier: 3,
        description: 'Monument majeur - Attire 200 habitants. Très long à construire.',
        cost: {
            money: 2000,
            stone: 200,
            sand: 150,
            clay: 100
        },
        buildTime: 300,
        effects: {
            population: 200,
            cleopatraBonus: true
        },
        reward: 3000,
        maxCount: 1
    },

    palace: {
        id: 'palace',
        name: 'Palais Royal',
        icon: '👑',
        tier: 3,
        description: 'Résidence de la noblesse - 500 habitants !',
        cost: {
            money: 5000,
            wood: 100,
            stone: 200,
            sand: 150,
            clay: 100
        },
        buildTime: 300,
        effects: {
            population: 500,
            peasants: 10,
            cleopatraBonus: true
        },
        reward: 8000,
        maxCount: 3
    },

    coliseum: {
        id: 'coliseum',
        name: 'Colisée',
        icon: '🏟️',
        tier: 3,
        description: 'Arène de divertissement - 350 habitants',
        cost: {
            money: 3500,
            stone: 180,
            sand: 120,
            clay: 80
        },
        buildTime: 240,
        effects: {
            population: 350,
            moneyPerMinute: 25
        },
        reward: 5000,
        maxCount: 2
    },

    sphinx: {
        id: 'sphinx',
        name: 'Sphinx',
        icon: '🦁',
        tier: 3,
        description: 'Monument mystique - 400 habitants, impressionne Cléopâtre',
        cost: {
            money: 4000,
            stone: 250,
            sand: 200
        },
        buildTime: 280,
        effects: {
            population: 400,
            cleopatraBonus: true
        },
        reward: 6000,
        maxCount: 1
    },

    academy: {
        id: 'academy',
        name: 'Académie',
        icon: '🎓',
        tier: 3,
        description: 'Centre d\'éducation avancée - 250 habitants et 5 paysans',
        cost: {
            money: 2500,
            wood: 80,
            stone: 100,
            clay: 60
        },
        buildTime: 180,
        effects: {
            population: 250,
            peasants: 5,
            cleopatraBonus: true
        },
        reward: 4000,
        maxCount: 3
    },

    grand_temple: {
        id: 'grand_temple',
        name: 'Grand Temple',
        icon: '⛩️',
        tier: 3,
        description: 'Temple majestueux dédié aux dieux - 300 habitants',
        cost: {
            money: 3000,
            stone: 150,
            sand: 100,
            clay: 70
        },
        buildTime: 200,
        effects: {
            population: 300,
            cleopatraBonus: true
        },
        reward: 5500,
        maxCount: 2
    }
};

export default BUILDINGS;
export { TIER_NAMES };

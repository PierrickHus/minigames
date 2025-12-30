// ==========================================
// DONNÉES DES BÂTIMENTS
// ==========================================

const BUILDINGS = {
    house: {
        id: 'house',
        name: 'Maison',
        icon: '🏠',
        description: 'Abrite 20 habitants et fournit 2 paysans',
        cost: {
            money: 100,
            wood: 10,
            clay: 5
        },
        buildTime: 30, // secondes
        effects: {
            population: 20,
            peasants: 2
        },
        reward: 150, // récompense de Cléopâtre
        maxCount: 50
    },

    well: {
        id: 'well',
        name: 'Puits',
        icon: '🪣',
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

    granary: {
        id: 'granary',
        name: 'Grenier',
        icon: '🏪',
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

    field: {
        id: 'field',
        name: 'Champ',
        icon: '🌾',
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

    market: {
        id: 'market',
        name: 'Marché',
        icon: '🏬',
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

    temple: {
        id: 'temple',
        name: 'Temple',
        icon: '🏛️',
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

    pyramid: {
        id: 'pyramid',
        name: 'Pyramide',
        icon: '🔺',
        description: 'Monument majeur - Attire 200 habitants. Très long à construire.',
        cost: {
            money: 2000,
            stone: 200,
            sand: 150,
            clay: 100
        },
        buildTime: 300, // 5 minutes
        effects: {
            population: 200,
            cleopatraBonus: true
        },
        reward: 3000,
        maxCount: 1
    },

    bakery: {
        id: 'bakery',
        name: 'Boulangerie',
        icon: '🥖',
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

    quarry: {
        id: 'quarry',
        name: 'Carrière',
        icon: '⛏️',
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

    aviary: {
        id: 'aviary',
        name: 'Volière',
        icon: '🕊️',
        description: 'Permet d\'envoyer des messages à César',
        cost: {
            money: 150,
            wood: 20,
            clay: 10
        },
        buildTime: 35,
        effects: {
            enableMessages: true
        },
        reward: 200,
        maxCount: 1
    },

    obelisk: {
        id: 'obelisk',
        name: 'Obélisque',
        icon: '🗿',
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
    }
};

export default BUILDINGS;

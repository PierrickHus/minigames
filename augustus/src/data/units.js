// ==========================================
// DONNÉES DES UNITÉS
// ==========================================

const UNIT_TYPES = {
    // ========== INFANTERIE ROMAINE ==========
    velites: {
        id: 'velites',
        name: 'Vélites',
        icon: '🏃',
        type: 'skirmisher',
        faction: 'roman',
        cost: 150,
        upkeep: 50,
        recruitTime: 1,
        men: 40,
        stats: {
            attack: 5,
            defense: 3,
            armor: 1,
            morale: 40,
            speed: 8,
            range: 120 // Portée de javelot
        },
        abilities: ['javelin', 'skirmish'],
        description: 'Tirailleurs légers',
        populationCost: 40
    },
    hastati: {
        id: 'hastati',
        name: 'Hastati',
        icon: '🛡️',
        type: 'infantry',
        faction: 'roman',
        cost: 250,
        upkeep: 80,
        recruitTime: 1,
        men: 60,
        stats: {
            attack: 8,
            defense: 6,
            armor: 3,
            morale: 50,
            speed: 5,
            range: 0
        },
        abilities: ['pilum', 'testudo'],
        description: 'Infanterie légère romaine',
        populationCost: 60
    },
    principes: {
        id: 'principes',
        name: 'Principes',
        icon: '⚔️',
        type: 'infantry',
        faction: 'roman',
        cost: 400,
        upkeep: 120,
        recruitTime: 2,
        men: 60,
        stats: {
            attack: 12,
            defense: 8,
            armor: 5,
            morale: 65,
            speed: 5,
            range: 0
        },
        abilities: ['pilum', 'testudo'],
        description: 'Infanterie lourde romaine',
        populationCost: 60
    },
    triarii: {
        id: 'triarii',
        name: 'Triarii',
        icon: '🔱',
        type: 'infantry',
        faction: 'roman',
        cost: 600,
        upkeep: 180,
        recruitTime: 2,
        men: 40,
        stats: {
            attack: 10,
            defense: 12,
            armor: 7,
            morale: 80,
            speed: 4,
            range: 0
        },
        abilities: ['spear_wall', 'hold_the_line'],
        description: 'Vétérans à la lance',
        populationCost: 40
    },
    praetorians: {
        id: 'praetorians',
        name: 'Prétoriens',
        icon: '👑',
        type: 'infantry',
        faction: 'roman',
        cost: 1000,
        upkeep: 300,
        recruitTime: 3,
        men: 40,
        stats: {
            attack: 15,
            defense: 14,
            armor: 9,
            morale: 95,
            speed: 5,
            range: 0
        },
        abilities: ['pilum', 'testudo', 'elite'],
        description: 'Garde d\'élite',
        populationCost: 40
    },

    // ========== CAVALERIE ROMAINE ==========
    equites: {
        id: 'equites',
        name: 'Équites',
        icon: '🐴',
        type: 'cavalry',
        faction: 'roman',
        cost: 450,
        upkeep: 150,
        recruitTime: 2,
        men: 30,
        stats: {
            attack: 10,
            defense: 5,
            armor: 4,
            morale: 60,
            speed: 12,
            charge: 8
        },
        abilities: ['charge', 'pursuit'],
        description: 'Cavalerie légère romaine',
        populationCost: 30
    },
    legionary_cavalry: {
        id: 'legionary_cavalry',
        name: 'Cavalerie Légionnaire',
        icon: '🏇',
        type: 'cavalry',
        faction: 'roman',
        cost: 700,
        upkeep: 220,
        recruitTime: 2,
        men: 30,
        stats: {
            attack: 14,
            defense: 8,
            armor: 6,
            morale: 75,
            speed: 11,
            charge: 12
        },
        abilities: ['charge', 'wedge'],
        description: 'Cavalerie lourde',
        populationCost: 30
    },

    // ========== UNITÉS GAULOISES ==========
    gallic_warriors: {
        id: 'gallic_warriors',
        name: 'Guerriers Gaulois',
        icon: '⚔️',
        type: 'infantry',
        faction: 'gauls',
        cost: 200,
        upkeep: 60,
        recruitTime: 1,
        men: 80,
        stats: {
            attack: 9,
            defense: 4,
            armor: 2,
            morale: 55,
            speed: 6,
            range: 0
        },
        abilities: ['warcry', 'berserk'],
        description: 'Fantassins féroces',
        populationCost: 80
    },
    gallic_nobles: {
        id: 'gallic_nobles',
        name: 'Nobles Gaulois',
        icon: '🐴',
        type: 'cavalry',
        faction: 'gauls',
        cost: 500,
        upkeep: 170,
        recruitTime: 2,
        men: 30,
        stats: {
            attack: 12,
            defense: 6,
            armor: 5,
            morale: 70,
            speed: 13,
            charge: 10
        },
        abilities: ['charge', 'warcry'],
        description: 'Cavalerie noble gauloise',
        populationCost: 30
    },

    // ========== UNITÉS CARTHAGINOISES ==========
    carthage_infantry: {
        id: 'carthage_infantry',
        name: 'Infanterie Punique',
        icon: '🛡️',
        type: 'infantry',
        faction: 'carthage',
        cost: 280,
        upkeep: 90,
        recruitTime: 1,
        men: 60,
        stats: {
            attack: 7,
            defense: 7,
            armor: 4,
            morale: 55,
            speed: 5,
            range: 0
        },
        abilities: [],
        description: 'Infanterie de base carthaginoise',
        populationCost: 60
    },
    war_elephants: {
        id: 'war_elephants',
        name: 'Éléphants de Guerre',
        icon: '🐘',
        type: 'elephant',
        faction: 'carthage',
        cost: 1500,
        upkeep: 400,
        recruitTime: 4,
        men: 12,
        stats: {
            attack: 25,
            defense: 15,
            armor: 10,
            morale: 70,
            speed: 6,
            charge: 20
        },
        abilities: ['terror', 'trample', 'rampage'],
        description: 'Terreur du champ de bataille',
        populationCost: 12
    },

    // ========== UNITÉS MACÉDONIENNES ==========
    hoplites: {
        id: 'hoplites',
        name: 'Hoplites',
        icon: '🏛️',
        type: 'infantry',
        faction: 'macedon',
        cost: 350,
        upkeep: 100,
        recruitTime: 2,
        men: 50,
        stats: {
            attack: 8,
            defense: 12,
            armor: 6,
            morale: 70,
            speed: 4,
            range: 0
        },
        abilities: ['phalanx', 'hold_the_line'],
        description: 'Infanterie lourde grecque',
        populationCost: 50
    },
    phalangites: {
        id: 'phalangites',
        name: 'Phalangites',
        icon: '🔱',
        type: 'infantry',
        faction: 'macedon',
        cost: 500,
        upkeep: 150,
        recruitTime: 2,
        men: 60,
        stats: {
            attack: 10,
            defense: 14,
            armor: 5,
            morale: 75,
            speed: 3,
            range: 0
        },
        abilities: ['phalanx', 'pike_wall'],
        description: 'Élite macédonienne',
        populationCost: 60
    },

    // ========== UNITÉS MAURES ==========
    numidian_cavalry: {
        id: 'numidian_cavalry',
        name: 'Cavalerie Numide',
        icon: '🐴',
        type: 'cavalry',
        faction: 'mauretania',
        cost: 350,
        upkeep: 100,
        recruitTime: 1,
        men: 40,
        stats: {
            attack: 7,
            defense: 3,
            armor: 1,
            morale: 55,
            speed: 15,
            charge: 5,
            range: 20
        },
        abilities: ['javelin', 'skirmish', 'desert_warfare'],
        description: 'Cavalerie légère rapide',
        populationCost: 40
    }
};

export default UNIT_TYPES;

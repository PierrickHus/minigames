// ==========================================
// DONNÉES DES FACTIONS
// ==========================================

const FACTIONS = {
    julii: {
        id: 'julii',
        name: 'Maison des Julii',
        icon: '🦅',
        color: '#c41e3a',
        description: 'Famille ambitieuse de Rome',
        playable: true,
        isRoman: true,
        startCity: 'roma',
        bonuses: { military: 1.1, politics: 1.1 }
    },
    brutii: {
        id: 'brutii',
        name: 'Maison des Brutii',
        icon: '🐗',
        color: '#2e7d32',
        description: 'Gardiens de l\'Est',
        playable: false,
        isRoman: true,
        startCity: 'tarentum',
        bonuses: { naval: 1.2, trade: 1.1 }
    },
    scipii: {
        id: 'scipii',
        name: 'Maison des Scipii',
        icon: '🦁',
        color: '#1565c0',
        description: 'Conquérants de l\'Afrique',
        playable: false,
        isRoman: true,
        startCity: 'capua',
        bonuses: { siege: 1.2, slaves: 1.1 }
    },
    senate: {
        id: 'senate',
        name: 'Sénat de Rome',
        icon: '🏛️',
        color: '#9c27b0',
        description: 'Le pouvoir politique de Rome',
        playable: false,
        isRoman: true,
        startCity: null,
        bonuses: { politics: 1.5 }
    },
    gauls: {
        id: 'gauls',
        name: 'Tribus Gauloises',
        icon: '⚔️',
        color: '#ff9800',
        description: 'Guerriers féroces du Nord',
        playable: false,
        isRoman: false,
        startCity: 'lugdunum',
        bonuses: { infantry: 1.2, morale: 1.1 }
    },
    carthage: {
        id: 'carthage',
        name: 'Empire Carthaginois',
        icon: '🐘',
        color: '#6d4c41',
        description: 'Rivaux historiques de Rome',
        playable: false,
        isRoman: false,
        startCity: 'carthago',
        bonuses: { naval: 1.3, trade: 1.2, elephants: true }
    },
    macedon: {
        id: 'macedon',
        name: 'Royaume de Macédoine',
        icon: '🌟',
        color: '#ffd700',
        description: 'Héritiers d\'Alexandre',
        playable: false,
        isRoman: false,
        startCity: 'thessalonica',
        bonuses: { phalanx: 1.3, cavalry: 1.1 }
    },
    pontus: {
        id: 'pontus',
        name: 'Royaume du Pont',
        icon: '🏔️',
        color: '#00695c',
        description: 'Puissance de l\'Est',
        playable: false,
        isRoman: false,
        startCity: 'sinope',
        bonuses: { chariots: true, archers: 1.2 }
    },
    mauretania: {
        id: 'mauretania',
        name: 'Royaume Maure',
        icon: '🏜️',
        color: '#795548',
        description: 'Cavaliers du désert',
        playable: false,
        isRoman: false,
        startCity: 'tingis',
        bonuses: { cavalry: 1.3, desert: 1.2 }
    },
    rebels: {
        id: 'rebels',
        name: 'Rebelles',
        icon: '🔥',
        color: '#616161',
        description: 'Cités indépendantes',
        playable: false,
        isRoman: false,
        startCity: null,
        bonuses: {}
    }
};

export default FACTIONS;

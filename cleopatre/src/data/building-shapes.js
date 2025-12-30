// ==========================================
// FORMES ET TAILLES DES BÂTIMENTS
// ==========================================

// Chaque bâtiment peut avoir plusieurs formes possibles
// shape: tableau 2D où 1 = occupé, 0 = vide
// Les formes sont définies comme des tableaux de lignes [y][x]

const BUILDING_SHAPES = {
    // ==========================================
    // TIER 1 - PETITS BÂTIMENTS
    // ==========================================

    hut: {
        placement: 'periphery', // En périphérie
        shapes: [
            { width: 1, height: 1, shape: [[1]] },
        ]
    },

    house: {
        placement: 'near_well', // Près des puits
        shapes: [
            { width: 1, height: 1, shape: [[1]] },
            { width: 2, height: 1, shape: [[1, 1]] },
        ]
    },

    well: {
        placement: 'center', // Au centre pour attirer les maisons
        shapes: [
            { width: 1, height: 1, shape: [[1]] },
        ]
    },

    field: {
        placement: 'periphery', // En périphérie
        shapes: [
            { width: 2, height: 1, shape: [[1, 1]] },
            { width: 1, height: 2, shape: [[1], [1]] },
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
        ]
    },

    farm: {
        placement: 'periphery', // En périphérie
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
            { width: 3, height: 2, shape: [[1, 1, 1], [1, 1, 0]] },
        ]
    },

    cistern: {
        placement: 'near_well', // Près des puits
        shapes: [
            { width: 1, height: 1, shape: [[1]] },
            { width: 2, height: 1, shape: [[1, 1]] },
        ]
    },

    granary: {
        placement: 'near_farm', // Près des fermes
        shapes: [
            { width: 2, height: 1, shape: [[1, 1]] },
            { width: 1, height: 2, shape: [[1], [1]] },
        ]
    },

    workshop: {
        placement: 'anywhere',
        shapes: [
            { width: 2, height: 1, shape: [[1, 1]] },
            { width: 1, height: 2, shape: [[1], [1]] },
        ]
    },

    aviary: {
        placement: 'anywhere',
        shapes: [
            { width: 1, height: 1, shape: [[1]] },
        ]
    },

    bakery: {
        placement: 'near_market', // Près des marchés
        shapes: [
            { width: 2, height: 1, shape: [[1, 1]] },
            { width: 1, height: 2, shape: [[1], [1]] },
        ]
    },

    // ==========================================
    // TIER 2 - BÂTIMENTS MOYENS
    // ==========================================

    inn: {
        placement: 'near_house', // Près des maisons
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
        ]
    },

    market: {
        placement: 'center_houses', // Au centre des hameaux
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
            { width: 3, height: 2, shape: [[1, 1, 1], [1, 1, 1]] },
        ]
    },

    quarry: {
        placement: 'periphery',
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 0]] },
            { width: 2, height: 2, shape: [[1, 1], [0, 1]] },
        ]
    },

    lumbermill: {
        placement: 'periphery',
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 0]] },
            { width: 3, height: 1, shape: [[1, 1, 1]] },
        ]
    },

    obelisk: {
        placement: 'center', // Visible au centre
        shapes: [
            { width: 1, height: 2, shape: [[1], [1]] },
        ]
    },

    barracks: {
        placement: 'periphery', // Protection en périphérie
        shapes: [
            { width: 3, height: 2, shape: [[1, 1, 1], [1, 1, 1]] },
            { width: 2, height: 3, shape: [[1, 1], [1, 1], [1, 1]] },
        ]
    },

    temple: {
        placement: 'center',
        shapes: [
            { width: 2, height: 3, shape: [[0, 1], [1, 1], [1, 1]] },
            { width: 3, height: 2, shape: [[1, 1, 1], [0, 1, 0]] },
        ]
    },

    villa: {
        placement: 'near_house',
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
            { width: 3, height: 2, shape: [[1, 1, 1], [1, 1, 0]] },
        ]
    },

    baths: {
        placement: 'near_well',
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
            { width: 3, height: 2, shape: [[0, 1, 0], [1, 1, 1]] },
        ]
    },

    library: {
        placement: 'center',
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
        ]
    },

    harbor: {
        placement: 'near_water', // Près de l'eau (en bas)
        shapes: [
            { width: 3, height: 2, shape: [[1, 1, 1], [1, 1, 1]] },
            { width: 4, height: 2, shape: [[1, 1, 1, 1], [1, 1, 1, 0]] },
        ]
    },

    gardens: {
        placement: 'anywhere',
        shapes: [
            { width: 2, height: 2, shape: [[1, 1], [1, 1]] },
            { width: 3, height: 2, shape: [[1, 1, 1], [0, 1, 0]] },
        ]
    },

    // ==========================================
    // TIER 3 - GRANDS MONUMENTS
    // ==========================================

    pyramid: {
        placement: 'center',
        shapes: [
            // Forme pyramidale
            { width: 4, height: 4, shape: [
                [0, 1, 1, 0],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [0, 1, 1, 0]
            ]},
        ]
    },

    palace: {
        placement: 'center',
        shapes: [
            { width: 4, height: 3, shape: [
                [0, 1, 1, 0],
                [1, 1, 1, 1],
                [1, 1, 1, 1]
            ]},
            { width: 3, height: 4, shape: [
                [0, 1, 0],
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ]},
        ]
    },

    coliseum: {
        placement: 'center',
        shapes: [
            // Forme ovale/circulaire
            { width: 4, height: 3, shape: [
                [0, 1, 1, 0],
                [1, 1, 1, 1],
                [0, 1, 1, 0]
            ]},
        ]
    },

    sphinx: {
        placement: 'center',
        shapes: [
            { width: 3, height: 2, shape: [[1, 1, 1], [0, 1, 1]] },
        ]
    },

    academy: {
        placement: 'center',
        shapes: [
            { width: 3, height: 2, shape: [[1, 1, 1], [1, 1, 1]] },
            { width: 2, height: 3, shape: [[1, 1], [1, 1], [1, 1]] },
        ]
    },

    grand_temple: {
        placement: 'center',
        shapes: [
            { width: 3, height: 3, shape: [
                [0, 1, 0],
                [1, 1, 1],
                [1, 1, 1]
            ]},
        ]
    }
};

// Zones de placement sur la grille
const PLACEMENT_ZONES = {
    // La grille est divisée en zones
    // 0-20% = périphérie haute
    // 20-80% = zone centrale
    // 80-100% = zone près de l'eau (en bas)

    periphery: {
        description: "En bordure de la grille",
        preferY: [0, 0.25, 0.75, 1], // Haut ou côtés
        preferX: [0, 0.2, 0.8, 1]
    },
    center: {
        description: "Au centre du village",
        preferY: [0.3, 0.7],
        preferX: [0.3, 0.7]
    },
    near_water: {
        description: "Près du Nil",
        preferY: [0.7, 1], // En bas
        preferX: [0, 1]
    },
    center_houses: {
        description: "Au milieu des habitations",
        preferY: [0.25, 0.75],
        preferX: [0.25, 0.75]
    }
};

export { BUILDING_SHAPES, PLACEMENT_ZONES };

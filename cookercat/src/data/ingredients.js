/**
 * Définition des ingrédients disponibles dans le jeu
 */

export const INGREDIENTS = {
    // Légumes
    salade: { name: 'Salade', icon: '🥬', category: 'vegetable' },
    champignon: { name: 'Champignon', icon: '🍄', category: 'vegetable' },
    tomate: { name: 'Tomate', icon: '🍅', category: 'vegetable' },
    pomme_de_terre: { name: 'Pomme de terre', icon: '🥔', category: 'vegetable' },
    poivron: { name: 'Poivron', icon: '🫑', category: 'vegetable' },
    haricots_verts: { name: 'Haricots verts', icon: '🫛', category: 'vegetable' },
    oignon: { name: 'Oignon', icon: '🧅', category: 'vegetable' },
    carotte: { name: 'Carotte', icon: '🥕', category: 'vegetable' },

    // Épices
    curry: { name: 'Curry', icon: '🌶️', category: 'spice' },
    piment: { name: 'Piment', icon: '🌶️', category: 'spice' },
    sel: { name: 'Sel', icon: '🧂', category: 'spice' },
    poivre: { name: 'Poivre', icon: '⚫', category: 'spice' },

    // Produits laitiers
    oeuf: { name: 'Œuf', icon: '🥚', category: 'dairy' },
    lait: { name: 'Lait', icon: '🥛', category: 'dairy' },
    fromage: { name: 'Fromage', icon: '🧀', category: 'dairy' },
    beurre: { name: 'Beurre', icon: '🧈', category: 'dairy' },

    // Autres
    miel: { name: 'Miel', icon: '🍯', category: 'other' },
    fond_de_tarte: { name: 'Fond de tarte', icon: '🥧', category: 'other' },
    pain: { name: 'Pain', icon: '🍞', category: 'other' },
    riz: { name: 'Riz', icon: '🍚', category: 'other' },
    pates: { name: 'Pâtes', icon: '🍝', category: 'other' },
    viande: { name: 'Viande', icon: '🥩', category: 'protein' },
    poisson: { name: 'Poisson', icon: '🐟', category: 'protein' },
};

/**
 * Définition des ustensiles de cuisine
 */
export const UTENSILS = {
    four: { name: 'Four', icon: '🔥', duration: 180 },
    microonde: { name: 'Micro-ondes', icon: '📡', duration: 60 },
    batteur: { name: 'Batteur', icon: '🥄', duration: 30 },
    poele: { name: 'Poêle', icon: '🍳', duration: 120 },
    casserole: { name: 'Casserole', icon: '🍲', duration: 150 },
    couteau: { name: 'Couteau', icon: '🔪', duration: 20 },
    assiette: { name: 'Assiette', icon: '🍽️', duration: 5 },
};

export default { INGREDIENTS, UTENSILS };

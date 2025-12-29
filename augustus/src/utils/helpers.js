// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Calcule la distance entre deux points
 */
export function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Génère un ID unique
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp une valeur entre min et max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num) {
    return num.toLocaleString('fr-FR');
}

/**
 * Mélange un tableau (Fisher-Yates)
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Choisit un élément aléatoire dans un tableau
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Génère un nombre aléatoire entre min et max (inclus)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Lerp (interpolation linéaire)
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

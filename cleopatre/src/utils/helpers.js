// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
// Ce module contient des fonctions utilitaires réutilisables
// dans l'ensemble de la codebase pour éviter la duplication.
// ==========================================

/**
 * Formate un temps en secondes en format lisible
 * @param {number} seconds - Temps en secondes à formater
 * @returns {string} Temps formaté (ex: "1h30m", "2m45s", "30s")
 */
export function formatTime(seconds) {
    const s = Math.ceil(seconds);
    if (s >= 3600) {
        const hours = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    if (s >= 60) {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
    }
    return `${s}s`;
}

/**
 * Formate un temps en format MM:SS
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté (ex: "1:30", "0:05")
 */
export function formatTimeMMSS(seconds) {
    const s = Math.floor(Math.max(0, seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calcule un coût avec scaling logarithmique
 * @param {number} baseCost - Coût de base
 * @param {number} currentCount - Nombre d'éléments déjà possédés
 * @param {number} factor - Facteur de multiplication (ex: 1.15 pour +15%)
 * @returns {number} Coût calculé arrondi au supérieur
 */
export function calculateScaledCost(baseCost, currentCount, factor = 1.15) {
    return Math.ceil(baseCost * Math.pow(factor, currentCount));
}

/**
 * Clamp une valeur entre un minimum et un maximum
 * @param {number} value - Valeur à limiter
 * @param {number} min - Valeur minimum
 * @param {number} max - Valeur maximum
 * @returns {number} Valeur limitée
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Génère un nombre aléatoire entre min et max (inclus)
 * @param {number} min - Valeur minimum
 * @param {number} max - Valeur maximum
 * @returns {number} Nombre entier aléatoire
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sélectionne un élément aléatoire dans un tableau
 * @template T
 * @param {T[]} array - Tableau source
 * @returns {T|undefined} Élément aléatoire ou undefined si vide
 */
export function randomChoice(array) {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Mélange un tableau (Fisher-Yates shuffle)
 * @template T
 * @param {T[]} array - Tableau à mélanger
 * @returns {T[]} Nouveau tableau mélangé
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
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en millisecondes
 * @returns {Function} Fonction debouncée
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle une fonction
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Intervalle minimum entre les appels (ms)
 * @returns {Function} Fonction throttlée
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Met à jour un élément DOM uniquement si la valeur a changé
 * @param {HTMLElement|null} element - Élément à mettre à jour
 * @param {string} newValue - Nouvelle valeur textContent
 * @returns {boolean} true si la valeur a été mise à jour
 */
export function updateTextIfChanged(element, newValue) {
    if (element && element.textContent !== newValue) {
        element.textContent = newValue;
        return true;
    }
    return false;
}

/**
 * Met à jour un style DOM uniquement si la valeur a changé
 * @param {HTMLElement|null} element - Élément à mettre à jour
 * @param {string} property - Propriété CSS (ex: 'width', 'display')
 * @param {string} newValue - Nouvelle valeur
 * @returns {boolean} true si la valeur a été mise à jour
 */
export function updateStyleIfChanged(element, property, newValue) {
    if (element && element.style[property] !== newValue) {
        element.style[property] = newValue;
        return true;
    }
    return false;
}

/**
 * Toggle une classe CSS uniquement si nécessaire
 * @param {HTMLElement|null} element - Élément cible
 * @param {string} className - Nom de la classe
 * @param {boolean} condition - Condition pour ajouter la classe
 * @returns {boolean} true si un changement a été effectué
 */
export function toggleClassIfNeeded(element, className, condition) {
    if (!element) return false;
    const hasClass = element.classList.contains(className);
    if (hasClass !== condition) {
        element.classList.toggle(className, condition);
        return true;
    }
    return false;
}

/**
 * Crée un cache d'éléments DOM par ID
 * @param {string[]} ids - Liste des IDs à mettre en cache
 * @returns {Object<string, HTMLElement|null>} Cache des éléments
 */
export function createDOMCache(ids) {
    const cache = {};
    for (const id of ids) {
        cache[id] = document.getElementById(id);
    }
    return cache;
}

/**
 * Formate un nombre avec séparateur de milliers
 * @param {number} num - Nombre à formater
 * @returns {string} Nombre formaté
 */
export function formatNumber(num) {
    return Math.floor(num).toLocaleString('fr-FR');
}

/**
 * Vérifie si un objet est vide
 * @param {Object} obj - Objet à vérifier
 * @returns {boolean} true si l'objet est vide
 */
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Deep clone un objet (pour les objets simples)
 * @template T
 * @param {T} obj - Objet à cloner
 * @returns {T} Clone de l'objet
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Attend un délai en millisecondes (pour async/await)
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse un temps au format "Xh Ym Zs" en secondes
 * @param {string} timeStr - Chaîne de temps (ex: "1h30m", "2m45s")
 * @returns {number} Temps en secondes
 */
export function parseTimeString(timeStr) {
    const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/;
    const match = timeStr.match(regex);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseFloat(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

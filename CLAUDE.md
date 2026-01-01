# Règles de développement pour Claude

## Performance DOM

**IMPORTANT : Ne JAMAIS rafraîchir le DOM à chaque frame.**

Toujours utiliser une approche de mise à jour conditionnelle :
- Calculer d'abord les nouvelles valeurs
- Comparer avec les valeurs actuelles du DOM
- Ne mettre à jour que si les valeurs ont changé

### Exemple correct :
```javascript
// Calculer la nouvelle valeur
const newValue = calculateValue();

// Mettre à jour UNIQUEMENT si la valeur a changé
if (element.textContent !== newValue) {
    element.textContent = newValue;
}
```

### Exemple incorrect :
```javascript
// NE PAS faire ça - met à jour le DOM à chaque frame
element.textContent = calculateValue();
element.innerHTML = `<span>${value}</span>`;
```

### Pour les éléments avec innerHTML :
- Éviter de reconstruire le HTML à chaque frame
- Créer les éléments une fois, puis mettre à jour leurs propriétés individuellement
- Utiliser des références aux sous-éléments plutôt que de reconstruire tout le contenu

### Pour les styles :
```javascript
// Correct
if (element.style.display !== 'none') {
    element.style.display = 'none';
}

// Incorrect
element.style.display = 'none'; // À chaque frame
```

## Documentation du code

**IMPORTANT : Toujours documenter les classes, méthodes et parties sensibles/complexes du code.**

### Classes et méthodes :
- Utiliser JSDoc pour documenter toutes les classes et leurs méthodes
- Décrire le rôle de la classe/méthode
- Documenter les paramètres avec `@param` et leur type
- Documenter la valeur de retour avec `@returns`

### Exemple :
```javascript
/**
 * Gestionnaire des panneaux d'interface utilisateur
 * Gère l'affichage et l'interaction avec les différents panneaux du jeu
 */
class PanelManager {
    /**
     * Met à jour la barre de ressources en bas de l'écran
     * Affiche le stock, le coût de collecte et la progression des collectes en cours
     * @param {boolean} forceUpdate - Force la mise à jour même si les valeurs n'ont pas changé
     * @returns {void}
     */
    updateResourcesBar(forceUpdate = false) {
        // ...
    }
}
```

### Code sensible/complexe :
- Ajouter des commentaires explicatifs pour les algorithmes complexes
- Expliquer le "pourquoi" et pas seulement le "quoi"
- Documenter les cas limites et les comportements non évidents
- Indiquer les dépendances entre systèmes

### Commentaires inutiles à éviter :
**NE JAMAIS ajouter de commentaires qui décrivent l'évidence ou les changements d'état.**

```javascript
// MAUVAIS - commentaires inutiles
let health = 100; // Initialisation de la santé
health = 80; // Diminution de la valeur
count++; // Incrémentation du compteur
const name = "Jean"; // Définition du nom

// BON - pas de commentaire pour du code évident
let health = 100;
health = 80;
count++;
const name = "Jean";

// BON - commentaire utile expliquant le "pourquoi"
// Réduire la santé de 20% car le joueur a été touché par un projectile empoisonné
health = 80;
```

Les commentaires doivent expliquer :
- Le **pourquoi** (intention, contexte business)
- Les **cas limites** non évidents
- Les **workarounds** ou hacks temporaires
- Les **dépendances** entre systèmes

Les commentaires ne doivent PAS :
- Répéter ce que le code fait déjà clairement
- Décrire des changements de valeur évidents
- Paraphraser le nom des variables/fonctions

## Principes SOLID et Clean Code

**IMPORTANT : Toujours respecter les principes SOLID et de Clean Code.**

### Principes SOLID :

1. **S - Single Responsibility Principle (SRP)**
   - Une classe/fonction ne doit avoir qu'une seule raison de changer
   - Séparer les responsabilités en modules distincts

2. **O - Open/Closed Principle (OCP)**
   - Ouvert à l'extension, fermé à la modification
   - Utiliser l'héritage et la composition plutôt que modifier le code existant

3. **L - Liskov Substitution Principle (LSP)**
   - Les sous-classes doivent pouvoir remplacer leurs classes parentes

4. **I - Interface Segregation Principle (ISP)**
   - Préférer plusieurs petites interfaces à une seule grosse

5. **D - Dependency Inversion Principle (DIP)**
   - Dépendre des abstractions, pas des implémentations concrètes

### Clean Code :

1. **Nommage explicite**
   - Noms de variables/fonctions descriptifs et significatifs
   - Éviter les abréviations obscures

2. **Fonctions courtes**
   - Une fonction = une tâche
   - Maximum ~20 lignes par fonction (idéalement)
   - Extraire les sous-fonctions pour la lisibilité

3. **DRY (Don't Repeat Yourself)**
   - Éviter la duplication de code
   - Extraire le code commun en fonctions/classes réutilisables

4. **KISS (Keep It Simple, Stupid)**
   - Préférer les solutions simples
   - Éviter la sur-ingénierie

5. **Éviter les magic numbers**
   - Utiliser des constantes nommées
   - Centraliser les valeurs de configuration

### Exemple :
```javascript
// MAUVAIS - magic number, nom obscur
function calc(x) {
    return x * 1.15;
}

// BON - constante nommée, nom explicite
const COST_SCALING_FACTOR = 1.15;

function calculateScaledCost(baseCost) {
    return baseCost * COST_SCALING_FACTOR;
}
```

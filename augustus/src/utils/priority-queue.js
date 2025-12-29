// ==========================================
// FILE DE PRIORITÉ POUR PATHFINDING A*
// ==========================================

/**
 * Implémentation d'une file de priorité min-heap
 * Utilisée par l'algorithme A* pour maintenir les noeuds à explorer
 */
class PriorityQueue {
    constructor() {
        this.heap = [];
        this.indices = new Map(); // Pour vérifier rapidement si un élément existe
    }

    /**
     * Retourne la taille de la file
     */
    get size() {
        return this.heap.length;
    }

    /**
     * Vérifie si la file est vide
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Vérifie si un élément existe dans la file
     * @param {string} key - Clé unique de l'élément
     */
    contains(key) {
        return this.indices.has(key);
    }

    /**
     * Ajoute un élément à la file
     * @param {Object} item - Élément à ajouter (doit avoir x et y)
     * @param {number} priority - Priorité (plus bas = plus prioritaire)
     */
    enqueue(item, priority) {
        const key = `${item.x},${item.y}`;
        const node = { item, priority, key };

        if (this.indices.has(key)) {
            // Si l'élément existe déjà, mettre à jour sa priorité si meilleure
            const existingIndex = this.indices.get(key);
            if (priority < this.heap[existingIndex].priority) {
                this.heap[existingIndex].priority = priority;
                this.heap[existingIndex].item = item;
                this._bubbleUp(existingIndex);
            }
            return;
        }

        this.heap.push(node);
        this.indices.set(key, this.heap.length - 1);
        this._bubbleUp(this.heap.length - 1);
    }

    /**
     * Retire et retourne l'élément avec la plus haute priorité (plus bas score)
     * @returns {Object} L'élément retiré
     */
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const min = this.heap[0];
        const end = this.heap.pop();
        this.indices.delete(min.key);

        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.indices.set(end.key, 0);
            this._sinkDown(0);
        }

        return min.item;
    }

    /**
     * Retourne l'élément avec la plus haute priorité sans le retirer
     */
    peek() {
        return this.isEmpty() ? null : this.heap[0].item;
    }

    /**
     * Vide la file
     */
    clear() {
        this.heap = [];
        this.indices.clear();
    }

    /**
     * Fait remonter un élément dans le heap (après insertion)
     * @private
     */
    _bubbleUp(index) {
        const node = this.heap[index];

        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];

            if (node.priority >= parent.priority) {
                break;
            }

            // Échanger avec le parent
            this.heap[index] = parent;
            this.indices.set(parent.key, index);
            index = parentIndex;
        }

        this.heap[index] = node;
        this.indices.set(node.key, index);
    }

    /**
     * Fait descendre un élément dans le heap (après extraction)
     * @private
     */
    _sinkDown(index) {
        const length = this.heap.length;
        const node = this.heap[index];

        while (true) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let swapIndex = null;

            if (leftChildIndex < length) {
                const leftChild = this.heap[leftChildIndex];
                if (leftChild.priority < node.priority) {
                    swapIndex = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                const rightChild = this.heap[rightChildIndex];
                if (
                    (swapIndex === null && rightChild.priority < node.priority) ||
                    (swapIndex !== null && rightChild.priority < this.heap[swapIndex].priority)
                ) {
                    swapIndex = rightChildIndex;
                }
            }

            if (swapIndex === null) {
                break;
            }

            // Échanger avec l'enfant le plus petit
            const swapNode = this.heap[swapIndex];
            this.heap[index] = swapNode;
            this.indices.set(swapNode.key, index);
            index = swapIndex;
        }

        this.heap[index] = node;
        this.indices.set(node.key, index);
    }
}

export default PriorityQueue;

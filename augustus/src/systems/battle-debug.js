// ==========================================
// SYSTÈME DE DEBUG POUR LES BATAILLES
// Touche F3 pour ouvrir le menu
// Options sauvegardées dans localStorage
// ==========================================

const STORAGE_KEY = 'augustus_battle_debug';

/**
 * Options de debug par défaut
 */
const DEFAULT_DEBUG_OPTIONS = {
    enabled: false,
    showSoldierHP: false,
    showSoldierDirection: false,
    showFormationDirection: false,
    showFallbackMode: false,
    showSoldierState: false,
    showFormationState: false,
    showDamageNumbers: false,
    showCollisionRadius: false,
    showFormationGrid: false
};

/**
 * Gestionnaire de debug pour les batailles
 */
class BattleDebugManager {
    constructor(battle) {
        this.battle = battle;
        this.options = { ...DEFAULT_DEBUG_OPTIONS };
        this.damageNumbers = []; // Affichage temporaire des dégâts
        this.menuElement = null;

        this.loadFromStorage();
    }

    /**
     * Charge les options depuis le localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.options = { ...DEFAULT_DEBUG_OPTIONS, ...parsed };
            }
        } catch (e) {
            console.warn('Impossible de charger les options de debug:', e);
        }
    }

    /**
     * Sauvegarde les options dans le localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.options));
        } catch (e) {
            console.warn('Impossible de sauvegarder les options de debug:', e);
        }
    }

    /**
     * Active/désactive une option
     */
    toggleOption(optionName) {
        if (optionName in this.options) {
            this.options[optionName] = !this.options[optionName];
            this.saveToStorage();
            this.updateMenu();
        }
    }

    /**
     * Crée ou met à jour le menu de debug
     */
    createMenu() {
        if (this.menuElement) {
            this.menuElement.remove();
        }

        const menu = document.createElement('div');
        menu.id = 'battleDebugMenu';
        menu.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #555;
            border-radius: 8px;
            padding: 10px;
            color: #fff;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            min-width: 220px;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #555;
        `;
        header.innerHTML = `
            <span style="font-weight: bold; font-size: 14px;">🔧 Debug Battle</span>
            <button id="debugCloseBtn" style="
                background: #500;
                border: none;
                color: #fff;
                width: 20px;
                height: 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">✕</button>
        `;
        menu.appendChild(header);

        // Options
        const optionsConfig = [
            { key: 'enabled', label: '⚡ Debug activé', section: 'main' },
            { key: 'showSoldierHP', label: '❤️ Vie soldats', section: 'soldiers' },
            { key: 'showSoldierDirection', label: '➡️ Direction soldats', section: 'soldiers' },
            { key: 'showSoldierState', label: '🎭 État soldats', section: 'soldiers' },
            { key: 'showFormationDirection', label: '🧭 Direction formations', section: 'formations' },
            { key: 'showFormationState', label: '📋 État formations', section: 'formations' },
            { key: 'showFormationGrid', label: '📐 Grille formations', section: 'formations' },
            { key: 'showFallbackMode', label: '⭕ Mode fallback (ronds)', section: 'rendering' },
            { key: 'showDamageNumbers', label: '💥 Nombres de dégâts', section: 'combat' },
            { key: 'showCollisionRadius', label: '🔵 Rayon collision', section: 'combat' }
        ];

        let currentSection = '';
        const sections = {
            main: 'Principal',
            soldiers: 'Soldats',
            formations: 'Formations',
            rendering: 'Rendu',
            combat: 'Combat'
        };

        for (const opt of optionsConfig) {
            if (opt.section !== currentSection) {
                currentSection = opt.section;
                const sectionHeader = document.createElement('div');
                sectionHeader.style.cssText = `
                    color: #888;
                    font-size: 10px;
                    margin: 8px 0 4px 0;
                    text-transform: uppercase;
                `;
                sectionHeader.textContent = sections[currentSection];
                menu.appendChild(sectionHeader);
            }

            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                align-items: center;
                margin: 4px 0;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            `;
            row.onmouseenter = () => row.style.background = 'rgba(255,255,255,0.1)';
            row.onmouseleave = () => row.style.background = 'transparent';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.options[opt.key];
            checkbox.id = `debug_${opt.key}`;
            checkbox.style.cssText = `margin-right: 8px; cursor: pointer;`;

            const label = document.createElement('label');
            label.htmlFor = `debug_${opt.key}`;
            label.textContent = opt.label;
            label.style.cssText = `cursor: pointer; flex: 1;`;

            row.appendChild(checkbox);
            row.appendChild(label);

            row.onclick = () => {
                this.toggleOption(opt.key);
            };

            menu.appendChild(row);
        }

        // Bouton reset
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 Réinitialiser';
        resetBtn.style.cssText = `
            width: 100%;
            margin-top: 10px;
            padding: 6px;
            background: #333;
            border: 1px solid #555;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
        `;
        resetBtn.onclick = () => {
            this.options = { ...DEFAULT_DEBUG_OPTIONS };
            this.saveToStorage();
            this.updateMenu();
        };
        menu.appendChild(resetBtn);

        document.body.appendChild(menu);
        this.menuElement = menu;

        // Event close
        document.getElementById('debugCloseBtn').onclick = () => this.hideMenu();
    }

    /**
     * Met à jour les checkboxes du menu
     */
    updateMenu() {
        if (!this.menuElement) return;

        for (const key of Object.keys(this.options)) {
            const checkbox = document.getElementById(`debug_${key}`);
            if (checkbox) {
                checkbox.checked = this.options[key];
            }
        }
    }

    /**
     * Affiche le menu
     */
    showMenu() {
        this.createMenu();
    }

    /**
     * Cache le menu
     */
    hideMenu() {
        if (this.menuElement) {
            this.menuElement.remove();
            this.menuElement = null;
        }
    }

    /**
     * Toggle le menu
     */
    toggleMenu() {
        if (this.menuElement) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }

    /**
     * Ajoute un nombre de dégâts à afficher
     */
    addDamageNumber(x, y, damage, type = 'normal') {
        if (!this.options.showDamageNumbers) return;

        this.damageNumbers.push({
            x,
            y,
            damage,
            type, // 'normal', 'critical', 'blocked', 'missed'
            timer: 0,
            maxTimer: 1500,
            vy: -1 // Vélocité verticale
        });
    }

    /**
     * Met à jour les nombres de dégâts
     */
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.timer += deltaTime;
            dn.y += dn.vy;
            dn.vy *= 0.98; // Ralentissement

            if (dn.timer >= dn.maxTimer) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    /**
     * Rend les informations de debug
     */
    render(ctx) {
        if (!this.options.enabled) return;

        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];

        // Mode fallback forcé (cercles)
        if (this.options.showFallbackMode) {
            this.renderFallbackSoldiers(ctx, allUnits);
        }

        // Grille de formation
        if (this.options.showFormationGrid) {
            this.renderFormationGrid(ctx, allUnits);
        }

        // Infos soldats
        for (const unit of allUnits) {
            if (!unit.soldiers) continue;

            for (const soldier of unit.soldiers) {
                if (!soldier.isAlive) continue;

                // HP
                if (this.options.showSoldierHP) {
                    this.renderSoldierHP(ctx, soldier);
                }

                // Direction
                if (this.options.showSoldierDirection) {
                    this.renderSoldierDirection(ctx, soldier);
                }

                // État
                if (this.options.showSoldierState) {
                    this.renderSoldierState(ctx, soldier);
                }

                // Rayon de collision
                if (this.options.showCollisionRadius) {
                    this.renderCollisionRadius(ctx, soldier);
                }
            }

            // Direction de formation
            if (this.options.showFormationDirection) {
                this.renderFormationDirection(ctx, unit);
            }

            // État de formation
            if (this.options.showFormationState) {
                this.renderFormationState(ctx, unit);
            }
        }

        // Nombres de dégâts
        if (this.options.showDamageNumbers) {
            this.renderDamageNumbers(ctx);
        }
    }

    /**
     * Rend les soldats en mode fallback (cercles colorés)
     */
    renderFallbackSoldiers(ctx, allUnits) {
        for (const unit of allUnits) {
            if (!unit.soldiers) continue;

            const color = this.battle.game?.FACTIONS?.[unit.faction]?.color || '#888';

            for (const soldier of unit.soldiers) {
                if (!soldier.isAlive) continue;

                const baseRadius = 4;
                ctx.globalAlpha = 0.7;

                if (soldier.role === 'leader') {
                    // Leader: cercle jaune avec couronne
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(soldier.x, soldier.y, baseRadius * 1.3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.moveTo(soldier.x, soldier.y - baseRadius * 2.5);
                    ctx.lineTo(soldier.x - baseRadius * 0.8, soldier.y - baseRadius * 1.2);
                    ctx.lineTo(soldier.x + baseRadius * 0.8, soldier.y - baseRadius * 1.2);
                    ctx.closePath();
                    ctx.fill();
                } else if (soldier.role === 'standardBearer') {
                    // Porte-drapeau: avec hampe
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(soldier.x, soldier.y, baseRadius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(soldier.x, soldier.y);
                    ctx.lineTo(soldier.x, soldier.y - baseRadius * 4);
                    ctx.stroke();

                    ctx.fillStyle = color;
                    ctx.fillRect(soldier.x, soldier.y - baseRadius * 4, baseRadius * 2, baseRadius * 1.5);
                } else {
                    // Soldat normal
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(soldier.x, soldier.y, baseRadius, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalAlpha = 1;
            }
        }
    }

    /**
     * Rend la grille de formation
     */
    renderFormationGrid(ctx, allUnits) {
        ctx.globalAlpha = 0.3;

        for (const unit of allUnits) {
            if (!unit.soldiers) continue;

            ctx.strokeStyle = unit.side === 'attacker' ? '#00f' : '#f00';
            ctx.lineWidth = 1;

            for (const soldier of unit.soldiers) {
                if (!soldier.isAlive) continue;

                // Ligne vers position formation
                ctx.beginPath();
                ctx.moveTo(soldier.x, soldier.y);
                ctx.lineTo(soldier.formationX, soldier.formationY);
                ctx.stroke();

                // Point position formation
                ctx.fillStyle = unit.side === 'attacker' ? '#00f' : '#f00';
                ctx.beginPath();
                ctx.arc(soldier.formationX, soldier.formationY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
    }

    /**
     * Rend les HP d'un soldat
     */
    renderSoldierHP(ctx, soldier) {
        const hpPercent = soldier.hp / soldier.maxHp;
        const barWidth = 12;
        const barHeight = 2;
        const x = soldier.x - barWidth / 2;
        const y = soldier.y - 18;

        // Fond
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Barre de vie
        let color = '#0f0';
        if (hpPercent <= 0.5) color = '#ff0';
        if (hpPercent <= 0.25) color = '#f00';

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
    }

    /**
     * Rend la direction d'un soldat
     */
    renderSoldierDirection(ctx, soldier) {
        const dirAngles = {
            'S': Math.PI / 2,
            'SW': Math.PI * 3 / 4,
            'W': Math.PI,
            'NW': -Math.PI * 3 / 4,
            'N': -Math.PI / 2,
            'NE': -Math.PI / 4,
            'E': 0,
            'SE': Math.PI / 4
        };

        const angle = dirAngles[soldier.direction] || 0;
        const length = 10;

        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(soldier.x, soldier.y);
        ctx.lineTo(
            soldier.x + Math.cos(angle) * length,
            soldier.y + Math.sin(angle) * length
        );
        ctx.stroke();

        // Pointe de flèche
        const arrowSize = 3;
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(
            soldier.x + Math.cos(angle) * length,
            soldier.y + Math.sin(angle) * length
        );
        ctx.lineTo(
            soldier.x + Math.cos(angle - 0.5) * (length - arrowSize),
            soldier.y + Math.sin(angle - 0.5) * (length - arrowSize)
        );
        ctx.lineTo(
            soldier.x + Math.cos(angle + 0.5) * (length - arrowSize),
            soldier.y + Math.sin(angle + 0.5) * (length - arrowSize)
        );
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Rend l'état d'un soldat
     */
    renderSoldierState(ctx, soldier) {
        const stateColors = {
            'idle': '#888',
            'moving': '#0ff',
            'fighting': '#f00',
            'charging': '#f80',
            'returning': '#08f'
        };

        const stateIcons = {
            'idle': '⏸',
            'moving': '🚶',
            'fighting': '⚔',
            'charging': '🏃',
            'returning': '↩'
        };

        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = stateColors[soldier.state] || '#fff';
        ctx.fillText(stateIcons[soldier.state] || '?', soldier.x, soldier.y - 22);
    }

    /**
     * Rend le rayon de collision d'un soldat
     */
    renderCollisionRadius(ctx, soldier) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(soldier.x, soldier.y, 6, 0, Math.PI * 2); // Rayon de collision standard
        ctx.stroke();
    }

    /**
     * Rend la direction d'une formation
     */
    renderFormationDirection(ctx, unit) {
        if (unit.currentMen <= 0) return;

        const angle = unit.facing || 0;
        const length = 30;

        ctx.strokeStyle = unit.side === 'attacker' ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(unit.x, unit.y);
        ctx.lineTo(
            unit.x + Math.cos(angle) * length,
            unit.y + Math.sin(angle) * length
        );
        ctx.stroke();

        // Tête de flèche
        const arrowSize = 8;
        ctx.fillStyle = unit.side === 'attacker' ? '#00ff00' : '#ff0000';
        ctx.beginPath();
        ctx.moveTo(
            unit.x + Math.cos(angle) * length,
            unit.y + Math.sin(angle) * length
        );
        ctx.lineTo(
            unit.x + Math.cos(angle - 0.4) * (length - arrowSize),
            unit.y + Math.sin(angle - 0.4) * (length - arrowSize)
        );
        ctx.lineTo(
            unit.x + Math.cos(angle + 0.4) * (length - arrowSize),
            unit.y + Math.sin(angle + 0.4) * (length - arrowSize)
        );
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Rend l'état d'une formation
     */
    renderFormationState(ctx, unit) {
        if (unit.currentMen <= 0) return;

        const stateLabels = {
            'idle': 'IDLE',
            'moving': 'MOVE',
            'attacking': 'ATTACK',
            'routing': 'FLEE'
        };

        const stateColors = {
            'idle': '#888',
            'moving': '#0ff',
            'attacking': '#f00',
            'routing': '#ff0'
        };

        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(stateLabels[unit.state] || unit.state, unit.x + 1, unit.y - 35 + 1);
        ctx.fillStyle = stateColors[unit.state] || '#fff';
        ctx.fillText(stateLabels[unit.state] || unit.state, unit.x, unit.y - 35);
    }

    /**
     * Rend les nombres de dégâts flottants
     */
    renderDamageNumbers(ctx) {
        for (const dn of this.damageNumbers) {
            const alpha = 1 - (dn.timer / dn.maxTimer);

            ctx.globalAlpha = alpha;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';

            let color, text;
            switch (dn.type) {
                case 'critical':
                    color = '#ff0';
                    text = `💥${dn.damage}`;
                    break;
                case 'blocked':
                    color = '#888';
                    text = `🛡${dn.damage}`;
                    break;
                case 'missed':
                    color = '#aaa';
                    text = 'Miss';
                    break;
                default:
                    color = '#f00';
                    text = `-${dn.damage}`;
            }

            ctx.fillStyle = '#000';
            ctx.fillText(text, dn.x + 1, dn.y + 1);
            ctx.fillStyle = color;
            ctx.fillText(text, dn.x, dn.y);

            ctx.globalAlpha = 1;
        }
    }

    /**
     * Nettoie les ressources
     */
    destroy() {
        this.hideMenu();
        this.damageNumbers = [];
    }
}

export default BattleDebugManager;

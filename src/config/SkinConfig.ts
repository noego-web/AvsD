export interface AngelSkinStats {
    id: string;
    name: string;
    bonusDesc: string;
    manaMult: number;
    speedMult: number;
    damageMult: number;
    cooldownMult: number;
}

export interface ColumnSkinStats {
    id: string;
    name: string;
    bonusDesc: string;
    maxHP: number;
}

export const ANGEL_SKINS: AngelSkinStats[] = [
    { 
        id: 'angel-1', name: 'BASIC ANGEL', bonusDesc: 'Standard stats', 
        manaMult: 1.0, speedMult: 1.0, damageMult: 1.0, cooldownMult: 1.0 
    },
    { 
        id: 'angel-2', name: 'SERAPHIN', bonusDesc: 'Mana +40%\nSpeed +25%', 
        manaMult: 1.4, speedMult: 1.25, damageMult: 1.0, cooldownMult: 1.0 
    },
    { 
        id: 'angel-3', name: 'ARCHANGEL', bonusDesc: 'Damage +35%\nBeam Cooldown -30%', 
        manaMult: 1.0, speedMult: 1.0, damageMult: 1.35, cooldownMult: 0.7 
    }
];

export const COLUMN_SKINS: ColumnSkinStats[] = [
    { id: 'column-1', name: 'WHITE PILLAR', bonusDesc: 'Health: 400', maxHP: 400 },
    { id: 'column-2', name: 'DARK OBELISK', bonusDesc: 'Health: 700', maxHP: 700 },
    { id: 'column-3', name: 'SACRED TOWER', bonusDesc: 'Health: 1100', maxHP: 1100 }
];

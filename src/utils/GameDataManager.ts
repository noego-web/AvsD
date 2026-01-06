export class GameDataManager {
    private static readonly COINS_KEY = 'avd_coins';
    private static readonly UNLOCKED_ANGELS_KEY = 'avd_unlocked_angels';
    private static readonly UNLOCKED_COLUMNS_KEY = 'avd_unlocked_columns';
    private static readonly SELECTED_ANGEL_KEY = 'avd_selected_angel';
    private static readonly SELECTED_COLUMN_KEY = 'avd_selected_column';

    // Default configuration
    private static readonly DEFAULT_ANGELS = ['angel-1'];
    private static readonly DEFAULT_COLUMNS = ['column-1'];

    static getCoins(): number {
        return parseInt(localStorage.getItem(this.COINS_KEY) || '0', 10);
    }

    static addCoins(amount: number): void {
        const current = this.getCoins();
        localStorage.setItem(this.COINS_KEY, (current + amount).toString());
    }

    static spendCoins(amount: number): boolean {
        const current = this.getCoins();
        if (current >= amount) {
            localStorage.setItem(this.COINS_KEY, (current - amount).toString());
            return true;
        }
        return false;
    }

    static getUnlockedAngels(): string[] {
        const stored = localStorage.getItem(this.UNLOCKED_ANGELS_KEY);
        return stored ? JSON.parse(stored) : [...this.DEFAULT_ANGELS];
    }

    static unlockAngel(skinId: string): void {
        const unlocked = this.getUnlockedAngels();
        if (!unlocked.includes(skinId)) {
            unlocked.push(skinId);
            localStorage.setItem(this.UNLOCKED_ANGELS_KEY, JSON.stringify(unlocked));
        }
    }

    static getUnlockedColumns(): string[] {
        const stored = localStorage.getItem(this.UNLOCKED_COLUMNS_KEY);
        return stored ? JSON.parse(stored) : [...this.DEFAULT_COLUMNS];
    }

    static unlockColumn(skinId: string): void {
        const unlocked = this.getUnlockedColumns();
        if (!unlocked.includes(skinId)) {
            unlocked.push(skinId);
            localStorage.setItem(this.UNLOCKED_COLUMNS_KEY, JSON.stringify(unlocked));
        }
    }

    static getSelectedAngel(): string {
        return localStorage.getItem(this.SELECTED_ANGEL_KEY) || 'angel-1';
    }

    static setSelectedAngel(skinId: string): void {
        localStorage.setItem(this.SELECTED_ANGEL_KEY, skinId);
    }

    static getSelectedColumn(): string {
        return localStorage.getItem(this.SELECTED_COLUMN_KEY) || 'column-1';
    }

    static setSelectedColumn(skinId: string): void {
        localStorage.setItem(this.SELECTED_COLUMN_KEY, skinId);
    }
}

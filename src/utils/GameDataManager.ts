import { GameStorage } from './Storage';

export class GameDataManager {
    private static readonly COINS_KEY = 'avd_coins';
    private static readonly UNLOCKED_ANGELS_KEY = 'avd_unlocked_angels';
    private static readonly UNLOCKED_COLUMNS_KEY = 'avd_unlocked_columns';
    private static readonly SELECTED_ANGEL_KEY = 'selectedAngel';
    private static readonly SELECTED_COLUMN_KEY = 'selectedColumn';

    // Default configuration
    private static readonly DEFAULT_ANGELS = ['angel-1'];
    private static readonly DEFAULT_COLUMNS = ['column-1'];

    static async getCoins(): Promise<number> {
        const val = await GameStorage.get(this.COINS_KEY);
        return parseInt(val || '0', 10);
    }

    static async addCoins(amount: number): Promise<void> {
        const current = await this.getCoins();
        await GameStorage.set(this.COINS_KEY, (current + amount).toString());
    }

    static async spendCoins(amount: number): Promise<boolean> {
        const current = await this.getCoins();
        if (current >= amount) {
            await GameStorage.set(this.COINS_KEY, (current - amount).toString());
            return true;
        }
        return false;
    }

    static async getUnlockedAngels(): Promise<string[]> {
        const stored = await GameStorage.get(this.UNLOCKED_ANGELS_KEY);
        return stored ? JSON.parse(stored) : [...this.DEFAULT_ANGELS];
    }

    static async unlockAngel(skinId: string): Promise<void> {
        const unlocked = await this.getUnlockedAngels();
        if (!unlocked.includes(skinId)) {
            unlocked.push(skinId);
            await GameStorage.set(this.UNLOCKED_ANGELS_KEY, JSON.stringify(unlocked));
        }
    }

    static async getUnlockedColumns(): Promise<string[]> {
        const stored = await GameStorage.get(this.UNLOCKED_COLUMNS_KEY);
        return stored ? JSON.parse(stored) : [...this.DEFAULT_COLUMNS];
    }

    static async unlockColumn(skinId: string): Promise<void> {
        const unlocked = await this.getUnlockedColumns();
        if (!unlocked.includes(skinId)) {
            unlocked.push(skinId);
            await GameStorage.set(this.UNLOCKED_COLUMNS_KEY, JSON.stringify(unlocked));
        }
    }

    static async getSelectedAngel(): Promise<string> {
        return await GameStorage.get(this.SELECTED_ANGEL_KEY) || 'angel-3';
    }

    static async setSelectedAngel(skinId: string): Promise<void> {
        await GameStorage.set(this.SELECTED_ANGEL_KEY, skinId);
    }

    static async getSelectedColumn(): Promise<string> {
        return await GameStorage.get(this.SELECTED_COLUMN_KEY) || 'column-1';
    }

    static async setSelectedColumn(skinId: string): Promise<void> {
        await GameStorage.set(this.SELECTED_COLUMN_KEY, skinId);
    }
}

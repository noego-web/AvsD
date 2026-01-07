import { Preferences } from '@capacitor/preferences';

export class GameStorage {
    static async set(key: string, value: string): Promise<void> {
        await Preferences.set({
            key: key,
            value: value,
        });
    }

    static async get(key: string): Promise<string | null> {
        const { value } = await Preferences.get({ key: key });
        return value;
    }

    static async remove(key: string): Promise<void> {
        await Preferences.remove({ key: key });
    }

    static async clear(): Promise<void> {
        await Preferences.clear();
    }
}

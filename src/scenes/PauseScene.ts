import Phaser from 'phaser';
import { GameScene } from './GameScene';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.scale;

        // Dim background (Very high depth)
        this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setDepth(100000);

        // Header
        this.add.text(width / 2, height * 0.3, 'PAUSED', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(100001);

        // Resume Button
        this.createButton(width / 2, height * 0.5, 'RESUME', () => {
            const gameScene = this.scene.get('GameScene') as GameScene;
            if (gameScene) {
                gameScene.resumeFromPause();
            }
            this.scene.stop();
        });

        // Menu Button
        this.createButton(width / 2, height * 0.65, 'QUIT TO MENU', () => {
            this.scene.stop('GameScene'); 
            this.scene.start('MainMenuScene');
        });
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const btn = this.add.container(x, y).setDepth(100001);
        const bg = this.add.rectangle(0, 0, 240, 60, 0xffffff).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, label, {
            fontSize: '24px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        bg.on('pointerover', () => bg.setFillStyle(0xdddddd));
        bg.on('pointerout', () => bg.setFillStyle(0xffffff));
        bg.on('pointerdown', callback);

        return btn;
    }
}

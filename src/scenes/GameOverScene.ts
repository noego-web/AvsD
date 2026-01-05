import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const { width, height } = this.scale;

        // Dim background
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // Title
        this.add.text(width / 2, height * 0.3, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Restart Button
        this.createButton(width / 2, height * 0.5, 'RESTART', () => {
            this.scene.stop('GameScene'); // STOP the paused scene
            this.scene.start('GameScene');
        });

        // Menu Button
        this.createButton(width / 2, height * 0.65, 'MAIN MENU', () => {
            this.scene.stop('GameScene'); // STOP the paused scene
            this.scene.start('MainMenuScene');
        });
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const btn = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 240, 60, 0xffffff).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, label, {
            fontSize: '28px',
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

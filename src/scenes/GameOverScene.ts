import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const { width, height } = this.scale;

        // Dim background
        this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0);

        // Title
        this.add.text(width / 2, height * 0.3, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff4444',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Restart Button
        this.createButton(width / 2, height * 0.50, 'RESTART', () => {
            this.scene.stop('GameScene'); // STOP the paused scene
            this.scene.start('GameScene');
        });

        // Menu Button
        this.createButton(width / 2, height * 0.70, 'MAIN MENU', () => {
            this.scene.stop('GameScene'); // STOP the paused scene
            this.scene.start('MainMenuScene');
        });
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const btn = this.add.container(x, y).setDepth(100);
        
        const w = 200, h = 52;
        const bg = this.add.graphics();
        
        const drawBtn = (color: number) => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-w/2, -h/2, w, h, 12);
            bg.lineStyle(2, 0x9d50bb, 0.8);
            bg.strokeRoundedRect(-w/2, -h/2, w, h, 12);
        };

        drawBtn(0x2a0845); // Dark Purple base

        const text = this.add.text(0, 0, label, {
            fontSize: '24px',
            color: '#e0c3fc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        const hitZone = this.add.rectangle(0, 0, w, h, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        btn.add(hitZone);

        hitZone.on('pointerover', () => drawBtn(0x4b0082));
        hitZone.on('pointerout', () => drawBtn(0x2a0845));
        hitZone.on('pointerdown', () => {
            bg.setAlpha(0.7);
            callback();
        });

        return btn;
    }
}

import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a0a).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, height * 0.3, 'ANGELS vs DEMONS', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#ffd700',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Start Button
        const startButton = this.add.container(width / 2, height * 0.6);
        const bg = this.add.rectangle(0, 0, 240, 70, 0xffd700).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, 'PLAY', {
            fontSize: '32px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startButton.add([bg, text]);

        // Hover effects
        bg.on('pointerover', () => bg.setFillStyle(0xffec8b));
        bg.on('pointerout', () => bg.setFillStyle(0xffd700));

        bg.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Simple animation
        this.tweens.add({
            targets: title,
            y: title.y - 20,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

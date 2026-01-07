import Phaser from 'phaser';
import { GameDataManager } from '../utils/GameDataManager';

export class MainMenuScene extends Phaser.Scene {
    private howToPlayPopup?: Phaser.GameObjects.Container;

    constructor() {
        super('MainMenuScene');
    }

    preload() {
        this.load.image('main_menu_bg', 'src/assets/images/ux/main-menu.webp');
        this.load.image('skin_preview', 'src/assets/images/angels/angel-3.webp');
        this.load.image('icon_settings', 'src/assets/images/ux/buttons/settings.webp');
        this.load.image('icon_how_to', 'src/assets/images/ux/buttons/how-to-play.webp');
        this.load.image('icon_ads', 'src/assets/images/ux/buttons/turn-off-ads.webp');
    }

    async init() {
        // Initialize registry from Capacitor Storage via Manager
        const savedAngel = await GameDataManager.getSelectedAngel();
        const savedColumn = await GameDataManager.getSelectedColumn();
        this.game.registry.set('selectedAngel', savedAngel);
        this.game.registry.set('selectedColumn', savedColumn);
    }

    create() {
        const { width, height } = this.scale;

        // Background
        const bgImg = this.add.image(width / 2, height / 2, 'main_menu_bg');
        const scale = Math.max(width / bgImg.width, height / bgImg.height);
        bgImg.setScale(scale);

        // Layout constants (Higher positioning)
        const centerY = height * 0.52;
        const spacing = 220; // Tighter spacing

        // 1. Customization Block (Center-Left)
        this.createCustomizationBlock(width / 2 - spacing, centerY);

        // 2. Play Button (Lowered to align bottoms)
        this.createButton(width / 2, centerY + 45, 'PLAY', () => {
            this.scene.start('GameScene');
        }, 150, 56, '24px');

        // 3. Right Utility Buttons (Center-Right)
        const rightButtonsX = width / 2 + spacing;
        const btnSpacing = 50;
        
        this.createButton(rightButtonsX, centerY - btnSpacing, 'SETTINGS', () => {}, 160, 38, '14px');
        this.createButton(rightButtonsX, centerY, 'HOW TO PLAY', () => {
            this.showHowToPlay();
        }, 160, 38, '14px');
        this.createButton(rightButtonsX, centerY + btnSpacing, 'REMOVE ADS', () => {}, 160, 38, '14px');

        // 4. Hidden Popups
        this.createHowToPlayPopup();
    }

    private showHowToPlay() {
        if (this.howToPlayPopup) this.howToPlayPopup.setVisible(true);
    }

    private createHowToPlayPopup() {
        const { width, height } = this.scale;
        this.howToPlayPopup = this.add.container(0, 0).setDepth(2000).setVisible(false);

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0).setInteractive();
        
        const winW = Math.min(width * 0.8, 600), winH = Math.min(height * 0.7, 400);
        const panel = this.add.graphics();
        panel.fillStyle(0x1a042d, 0.95);
        panel.fillRoundedRect(width/2 - winW/2, height/2 - winH/2, winW, winH, 20);
        panel.lineStyle(3, 0x9d50bb, 1);
        panel.strokeRoundedRect(width/2 - winW/2, height/2 - winH/2, winW, winH, 20);

        const title = this.add.text(width / 2, height / 2 - winH / 2 + 45, 'HOW TO PLAY', {
            fontSize: '32px', color: '#e0c3fc', fontStyle: 'bold'
        }).setOrigin(0.5);

        const instructions = [
            "• Use Left Area to move the Angel",
            "• Use Right Area to aim and fire Holy Beam",
            "• Protect the Pillars from Demonic waves",
            "• Collect Power-ups to upgrade your beam",
            "• Unleash ULT when Mana is full!"
        ];

        const content = this.add.text(width / 2, height / 2 + 30, instructions.join("\n"), {
            fontSize: '17px', color: '#ffffff', align: 'left', lineSpacing: 10
        }).setOrigin(0.5);

        const closeBtn = this.createButton(width/2 + winW/2 - 40, height/2 - winH/2 + 40, 'X', () => {
            this.howToPlayPopup?.setVisible(false);
        }, 40, 40, '20px');

        this.howToPlayPopup.add([overlay, panel, title, content, closeBtn]);
    }

    private createButton(x: number, y: number, label: string, callback: () => void, w: number = 200, h: number = 52, fontSize: string = '24px', iconKey?: string) {
        const btn = this.add.container(x, y);
        const bg = this.add.graphics();
        
        const drawBtn = (color: number) => {
            bg.clear();
            bg.fillStyle(color, 0.9);
            bg.fillRoundedRect(-w/2, -h/2, w, h, 12);
            bg.lineStyle(2, 0x9d50bb, 0.8);
            bg.strokeRoundedRect(-w/2, -h/2, w, h, 12);
        };

        drawBtn(0x2a0845); // Dark Purple base

        const text = this.add.text(iconKey ? 15 : 0, 0, label, {
            fontSize: fontSize,
            color: '#e0c3fc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        if (iconKey) {
            const icon = this.add.image(-w/2 + 25, 0, iconKey);
            icon.setDisplaySize(24, 24);
            btn.add(icon);
        }

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

    private createCustomizationBlock(x: number, y: number) {
        const w = 180, h = 140;
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        // Matching button style: Dark Purple base
        bg.fillStyle(0x2a0845, 0.9);
        bg.fillRoundedRect(-w/2, -h/2, w, h, 15);
        // Glowing purple border
        bg.lineStyle(2, 0x9d50bb, 0.8);
        bg.strokeRoundedRect(-w/2, -h/2, w, h, 15);

        const title = this.add.text(0, -h/2 + 18, 'CUSTOMIZATION', {
            fontSize: '14px',
            color: '#e0c3fc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Character preview
        const preview = this.add.image(0, 6, 'skin_preview');
        preview.setDisplaySize(85, 85);

        container.add([bg, title, preview]);

        // Interactivity
        const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.launch('CustomizationScene'));
        container.add(hit);
    }
}

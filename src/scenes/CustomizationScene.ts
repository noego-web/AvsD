import Phaser from 'phaser';
import { GameDataManager } from '../utils/GameDataManager';
import { ANGEL_SKINS, COLUMN_SKINS } from '../config/SkinConfig';

export class CustomizationScene extends Phaser.Scene {
    private currentTab: 'angels' | 'columns' = 'angels';
    private scrollContainer!: Phaser.GameObjects.Container;
    private scrollMask!: Phaser.Display.Masks.GeometryMask;
    private items: Phaser.GameObjects.Container[] = [];
    
    // Layout Constants
    private viewW!: number;
    private viewH!: number;
    private viewX!: number;
    private viewY!: number;
    private itemW = 280;
    private itemH = 140;
    private itemSpacing = 20;

    private angelSkins = ANGEL_SKINS;
    private columnSkins = COLUMN_SKINS;

    constructor() {
        super('CustomizationScene');
    }

    preload() {
        this.angelSkins.forEach(s => this.load.image(s.id, `src/assets/images/angels/${s.id}.webp`));
        this.columnSkins.forEach(s => this.load.image(s.id, `src/assets/images/columns/${s.id}.webp`));
        this.load.image('tab_angels', 'src/assets/images/ux/buttons/angels-skins-shop.webp');
        this.load.image('tab_columns', 'src/assets/images/ux/buttons/columns-skins-shop.webp');
    }

    create() {
        const { width, height } = this.scale;

        // Overlay & Input Blocking
        this.add.rectangle(0, 0, width, height, 0x0a0a0a, 0.95)
            .setOrigin(0)
            .setInteractive();

        // Initialize Layout Constants
        this.viewW = width * 0.90;
        this.viewH = 180;
        this.viewX = (width - this.viewW) / 2;
        this.viewY = 110;

        const tabY = 55;
        const spacing = 140;

        this.add.image(width / 2 - spacing, tabY, 'tab_angels')
            .setInteractive({ useHandCursor: true })
            .setDisplaySize(80, 80)
            .on('pointerdown', () => this.switchTab('angels'));

        this.add.image(width / 2 + spacing, tabY, 'tab_columns')
            .setInteractive({ useHandCursor: true })
            .setDisplaySize(80, 80)
            .on('pointerdown', () => this.switchTab('columns'));

        // Close Button
        this.add.text(width - 40, 35, 'X', {
            fontSize: '36px', color: '#e0c3fc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
              this.scene.stop();
          });

        // Scroll Area Background
        const scrollBg = this.add.graphics();
        scrollBg.fillStyle(0x1a042d, 0.6);
        scrollBg.fillRoundedRect(this.viewX, this.viewY, this.viewW, this.viewH, 20);
        scrollBg.lineStyle(2, 0x9d50bb, 0.4);
        scrollBg.strokeRoundedRect(this.viewX, this.viewY, this.viewW, this.viewH, 20);

        const maskShape = this.add.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(this.viewX, this.viewY, this.viewW, this.viewH, 20);
        maskShape.setVisible(false);
        this.scrollMask = maskShape.createGeometryMask();

        this.scrollContainer = this.add.container(this.viewX, this.viewY);
        this.scrollContainer.setMask(this.scrollMask);

        // Input for scrolling
        this.input.on('wheel', (_p: any, _g: any, _dx: number, dy: number) => {
            if (this.scene.isActive()) {
                this.scrollContainer.x -= dy;
                this.clampScroll();
            }
        });

        let isDragging = false;
        this.input.on('pointerdown', () => isDragging = true);
        this.input.on('pointerup', () => isDragging = false);
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (isDragging && this.scene.isActive()) {
                this.scrollContainer.x += pointer.velocity.x * 0.5;
                this.clampScroll();
            }
        });

        this.switchTab('angels');
    }

    private switchTab(tab: 'angels' | 'columns') {
        this.currentTab = tab;
        this.renderItems();
    }

    private renderItems() {
        this.items.forEach(item => item.destroy());
        this.items = [];
        this.scrollContainer.removeAll();
        this.scrollContainer.x = this.viewX;

        const data = this.currentTab === 'angels' ? this.angelSkins : this.columnSkins;
        const leftPadding = 25;

        // Get currently selected from registry (default to first if not set)
        const registryKey = this.currentTab === 'angels' ? 'selectedAngel' : 'selectedColumn';
        if (!this.game.registry.has(registryKey)) {
            this.game.registry.set(registryKey, data[0].id);
        }
        const selectedId = this.game.registry.get(registryKey);

        data.forEach((s, i) => {
            const isSelected = s.id === selectedId;
            const container = this.add.container((this.itemW + this.itemSpacing) * i + this.itemW / 2 + leftPadding, this.viewH / 2);
            
            const bg = this.add.graphics();
            const bgColor = isSelected ? 0x4b0082 : 0x2a0845;
            const borderColor = isSelected ? 0xe0c3fc : 0x9d50bb;
            const borderAlpha = isSelected ? 1 : 0.6;

            bg.fillStyle(bgColor, 0.82);
            bg.fillRoundedRect(-this.itemW/2, -this.itemH/2, this.itemW, this.itemH, 15);
            bg.lineStyle(isSelected ? 3 : 2, borderColor, borderAlpha);
            bg.strokeRoundedRect(-this.itemW/2, -this.itemH/2, this.itemW, this.itemH, 15);

            // Skin Image
            const img = this.add.image(-70, 0, s.id);
            const scale = Math.min(100 / img.width, 100 / img.height);
            img.setScale(scale);

            // Text info
            const nameTxt = this.add.text(10, -35, s.name, {
                fontSize: '15px', color: '#e0c3fc', fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            const bonusTxt = this.add.text(10, 15, s.bonusDesc, {
                fontSize: '12px', color: isSelected ? '#ffffff' : '#b28dff', lineSpacing: 4
            }).setOrigin(0, 0.5);

            container.add([bg, img, nameTxt, bonusTxt]);

            if (isSelected) {
                const badge = this.add.text(this.itemW/2 - 5, -this.itemH/2 + 5, 'SELECTED', {
                    fontSize: '10px', color: '#00ff00', fontStyle: 'bold', backgroundColor: '#003300', padding: { x: 4, y: 2 }
                }).setOrigin(1, 0);
                container.add(badge);
            }
            
            const hitZone = this.add.rectangle(0, 0, this.itemW, this.itemH, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', async () => {
                    this.game.registry.set(registryKey, s.id);
                    if (this.currentTab === 'angels') {
                        await GameDataManager.setSelectedAngel(s.id);
                    } else {
                        await GameDataManager.setSelectedColumn(s.id);
                    }
                    this.renderItems(); 
                });
            container.add(hitZone);

            this.scrollContainer.add(container);
            this.items.push(container);
        });
    }

    private clampScroll() {
        const leftPadding = 25;
        const rightPadding = 25;
        const contentW = this.items.length * (this.itemW + this.itemSpacing) + leftPadding + rightPadding;
        const minX = this.viewX - (contentW > this.viewW ? contentW - this.viewW : 0);
        const maxX = this.viewX;

        if (this.scrollContainer.x < minX) this.scrollContainer.x = minX;
        if (this.scrollContainer.x > maxX) this.scrollContainer.x = maxX;
    }
}

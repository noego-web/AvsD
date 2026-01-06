import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class HUD {
    private hudGraphics: Phaser.GameObjects.Graphics;
    private worldGraphics: Phaser.GameObjects.Graphics;
    private superBtn: Phaser.GameObjects.Arc;
    private superIcon: Phaser.GameObjects.Text;
    private player: Player;
    private bonusIcons: Phaser.GameObjects.Group;

    private lastBuffKeys: string = '';

    constructor(scene: Phaser.Scene, player: Player) {
        this.player = player;
        this.hudGraphics = scene.add.graphics().setDepth(100).setScrollFactor(0);
        this.worldGraphics = scene.add.graphics().setDepth(90);
        this.bonusIcons = scene.add.group();

        const { width, height } = scene.scale;

        // Player HUD Labels (HP, Mana)
        scene.add.text(20, 20, 'HP', { fontSize: '14px', color: '#ff4444', fontStyle: 'bold' }).setScrollFactor(0).setDepth(10002);
        scene.add.text(20, 40, 'M', { fontSize: '14px', color: '#0088ff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(10002);

        const superBtnY = height - 130;

        // Super Attack Button 
        const superBtn = scene.add.circle(width - 80, superBtnY, 40, 0x0000ff, 0.3)
            .setScrollFactor(0).setDepth(10000).setInteractive({ useHandCursor: true });
        
        this.superIcon = scene.add.text(width - 80, superBtnY, 'ULT', { 
            fontSize: '24px', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

        this.superBtn = superBtn;

        superBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            this.player.activateSuper();
        });

        scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            const newY = gameSize.height - 130;
            this.superBtn.setPosition(gameSize.width - 80, newY);
            this.superIcon.setPosition(gameSize.width - 80, newY);
        });
    }

    public update() {
        this.hudGraphics.clear();
        this.worldGraphics.clear();
        
        const alpha = this.player.mana >= this.player.maxMana ? 0.8 : 0.3;
        this.superBtn.setFillStyle(0x0000ff, alpha);
        this.superIcon.setAlpha(this.player.mana >= this.player.maxMana ? 1 : 0.5);

        // Global Bars on top left (Fixed on screen)
        this.drawBar(this.hudGraphics, 45, 22, 80, 10, this.player.hp / this.player.maxHP, 0xff0000);
        this.drawBar(this.hudGraphics, 45, 42, 80, 8, this.player.mana / this.player.maxMana, 0x0088ff);

        // Floating Heat Bar above Player (Moves with player)
        const x = this.player.x - 24;
        const yE = this.player.y - 45;

        this.drawBar(this.worldGraphics, x, yE, 48, 4, 1, 0x000000, 0.4);
        if (this.player.isOverheated) {
            const ratio = Math.min((this.player as any).cooldownElapsed / (this.player as any).cooldownTime, 1);
            this.drawBar(this.worldGraphics, x, yE, 48, 4, ratio, 0x888888);
        } else {
            this.drawBar(this.worldGraphics, x, yE, 48, 4, 1 - this.player.beamHeat / this.player.maxHeat, 0xffffff);
        }

        // --- Active Bonus Indicators ---
        this.updateBonusIcons();
    }

    private updateBonusIcons() {
        const buffs = (this.player.scene as any).buffTimers;
        if (!buffs) return;

        const activeKeys = Object.keys(buffs).filter(k => buffs[k] > 0).sort();
        const keysSerialized = activeKeys.join('|');

        // Only redraw icons if the active buff set has changed
        if (keysSerialized !== this.lastBuffKeys) {
            this.bonusIcons.clear(true, true);
            let startX = 20;
            let startY = 75;

            activeKeys.forEach((key, index) => {
                const textureKey = this.getTextureForBuff(key);
                if (!textureKey) return;

                const icon = this.player.scene.add.image(startX + (index * 35), startY, textureKey)
                    .setScrollFactor(0)
                    .setDisplaySize(24, 24)
                    .setDepth(10005);
                
                icon.setData('buffKey', key);
                this.bonusIcons.add(icon);
            });
            this.lastBuffKeys = keysSerialized;
        }

        // Handle fading/alpha without destroying objects
        this.bonusIcons.getChildren().forEach((icon: any) => {
            const key = icon.getData('buffKey');
            const timeLeft = buffs[key];
            if (timeLeft < 3000) {
                const alpha = 0.3 + 0.7 * (Math.sin(this.player.scene.time.now / 150) * 0.5 + 0.5);
                icon.setAlpha(alpha);
            } else {
                icon.setAlpha(1);
            }
        });
    }

    private getTextureForBuff(key: string): string {
        switch(key) {
            case 'damage': return 'b_damage';
            case 'noOverheat': return 'b_cool';
            case 'speed': return 'b_speed';
            case 'attract': return 'b_attract';
            default: return '';
        }
    }

    private drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, ratio: number, color: number, bgAlpha: number = 0.6) {
        g.fillStyle(0x000000, bgAlpha);
        g.fillRoundedRect(x, y, w, h, h/2);
        if (ratio > 0) {
            g.fillStyle(color, 1);
            g.fillRoundedRect(x, y, w * ratio, h, h/2);
        }
    }

    public getGraphics() {
        return this.worldGraphics;
    }
}

import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class HUD {
    private uiGraphics: Phaser.GameObjects.Graphics;
    private superBtn: Phaser.GameObjects.Arc;
    private superIcon: Phaser.GameObjects.Text;
    private player: Player;

    constructor(scene: Phaser.Scene, player: Player) {
        this.player = player;
        this.uiGraphics = scene.add.graphics().setDepth(100);

        const { width, height } = scene.scale;
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
        this.uiGraphics.clear();
        
        const alpha = this.player.mana >= this.player.maxMana ? 0.8 : 0.3;
        this.superBtn.setFillStyle(0x0000ff, alpha);
        this.superIcon.setAlpha(this.player.mana >= this.player.maxMana ? 1 : 0.5);

        const x = this.player.x - 24;
        const yE = this.player.y - 45;
        const yH = this.player.y - 52;
        const yM = this.player.y - 40;

        // Heath Bar
        this.uiGraphics.fillStyle(0x000000, 0.6).fillRect(x, yH, 48, 5);
        this.uiGraphics.fillStyle(0x22ff22, 1).fillRect(x, yH, 48 * (this.player.hp / this.player.maxHP), 5);

        // Heat Bar
        this.uiGraphics.fillStyle(0x000000, 0.6).fillRect(x, yE, 48, 4);
        if (this.player.isOverheated) {
            // Show cooling progress
            const ratio = Math.min((this.player as any).cooldownElapsed / (this.player as any).cooldownTime, 1);
            this.uiGraphics.fillStyle(0x888888, 0.9).fillRect(x, yE, 48 * ratio, 4);
        } else {
            this.uiGraphics.fillStyle(0xffffff, 1).fillRect(x, yE, 48 * (1 - this.player.beamHeat / this.player.maxHeat), 4);
        }

        // Mana Bar
        this.uiGraphics.fillStyle(0x000000, 0.6).fillRect(x, yM, 48, 4);
        this.uiGraphics.fillStyle(0x0088ff, 1).fillRect(x, yM, 48 * (this.player.mana / this.player.maxMana), 4);
    }

    public getGraphics() {
        return this.uiGraphics;
    }
}

import Phaser from 'phaser';

export class Column extends Phaser.Physics.Arcade.Sprite {
    public maxHP: number = 300;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static

        // Further reduced size (Original 60x105 -> New 44x77)
        this.setDisplaySize(44, 77);
        (this.body as Phaser.Physics.Arcade.Body).setSize(18, 50).setOffset(
            (this.displayWidth - 18) / 2,
            (this.displayHeight - 50) / 2
        );
        
        this.setData('hp', this.maxHP);
        this.setDepth(9);
    }

    public updateUI(uiGraphics: Phaser.GameObjects.Graphics) {
        if (!this.active) return;
        const hp = this.getData('hp');
        // Adjusted for new 77px height
        this.drawRoundedBar(uiGraphics, this.x - 22, this.y - 48, 44, 5, hp / this.maxHP, 0x00ffff);
    }

    private drawRoundedBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, ratio: number, color: number) {
        g.fillStyle(0x000000, 0.6);
        g.fillRoundedRect(x, y, w, h, h/2);
        if (ratio > 0) {
            g.fillStyle(color, 1);
            g.fillRoundedRect(x, y, w * ratio, h, h/2);
        }
    }

    public onHit() {
        if (!this.active || this.scene.tweens.isTweening(this)) return;
        
        // Visual flash
        this.setTint(0xff6666);
        this.scene.time.delayedCall(80, () => {
            if (this.active) this.clearTint();
        });
    }
}

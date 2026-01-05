import Phaser from 'phaser';

export class Column extends Phaser.Physics.Arcade.Sprite {
    public maxHP: number = 300;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'column');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static

        this.setData('hp', this.maxHP);
        this.setDepth(9);
    }

    public updateUI(uiGraphics: Phaser.GameObjects.Graphics) {
        if (!this.active) return;
        const hp = this.getData('hp');
        uiGraphics.fillStyle(0x000000, 0.6).fillRect(this.x - 30, this.y - 60, 60, 6);
        uiGraphics.fillStyle(0x00ffff, 1).fillRect(this.x - 30, this.y - 60, 60 * (hp / this.maxHP), 6);
    }
}

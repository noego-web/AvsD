import Phaser from 'phaser';

export type BonusType = 'b_damage' | 'b_cool' | 'b_heal' | 'b_speed' | 'b_attract';

export class Bonus extends Phaser.Physics.Arcade.Sprite {
    public bonusType: BonusType;

    constructor(scene: Phaser.Scene, x: number, y: number, type: BonusType) {
        super(scene, x, y, type);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.bonusType = type;
        this.setData('type', type);

        this.setDisplaySize(24, 24);
        (this.body as Phaser.Physics.Arcade.Body).setCircle(12);

        scene.tweens.add({
            targets: this,
            y: y - 15,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

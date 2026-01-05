import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, target: any) {
        super(scene, x, y, 'bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(15);
        (this.body as Phaser.Physics.Arcade.Body).setCircle(6);
        
        // Calculate velocity once to avoid issues if target is destroyed
        const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
        scene.physics.velocityFromRotation(angle, 400, (this.body as Phaser.Physics.Arcade.Body).velocity);

        // Auto destroy after 3 seconds if no hit
        scene.time.delayedCall(3000, () => {
            if (this.active) this.destroy();
        });
    }
}

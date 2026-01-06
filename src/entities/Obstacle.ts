import Phaser from 'phaser';

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static

        // Calculate dimensions to maintain aspect ratio (Increased 2.5x base size)
        const ratio = this.width / this.height;
        let targetWidth = 180;

        if (textureKey.includes('rock')) targetWidth = 175;
        else if (textureKey.includes('statue')) targetWidth = 160;

        const targetHeight = targetWidth / ratio;
        this.setDisplaySize(targetWidth, targetHeight);

        // Precise hitbox adjustment for Static Body
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        
        // IMPORTANT: Sync static body to the new display size
        body.updateFromGameObject();

        if (textureKey.includes('statue')) {
            // Statue hitbox: narrow and focused on the lower half
            body.setSize(targetWidth * 0.5, targetHeight * 0.6);
            body.setOffset(targetWidth * 0.25, targetHeight * 0.35);
        } else {
            // Rock hitbox: tight circular-ish center
            body.setSize(targetWidth * 0.8, targetHeight * 0.8);
            body.setOffset(targetWidth * 0.1, targetHeight * 0.1);
        }

        this.setDepth(8);
    }
}

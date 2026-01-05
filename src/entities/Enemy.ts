import Phaser from 'phaser';

export type EnemyType = 'normal' | 'tank' | 'kami' | 'healer';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    public hp: number;
    public maxHP: number;
    public speed: number;
    public enemyType: EnemyType;
    public lastAttackTime: number = 0;

    private aura: Phaser.GameObjects.Sprite;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType, baseStats: any) {
        let texture = 'enemy_normal';
        let hp = baseStats.hp;
        let speed = baseStats.speed;

        switch (type) {
            case 'tank': texture = 'enemy_tank'; break;
            case 'kami': texture = 'enemy_kami'; break;
            case 'healer': texture = 'enemy_healer'; break;
        }

        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.enemyType = type;
        this.hp = hp;
        this.maxHP = hp;
        this.speed = speed;

        if (type === 'tank') {
            this.setDisplaySize(48, 48);
            (this.body as Phaser.Physics.Arcade.Body).setSize(48, 48);
        }

        // Shadow Aura
        this.aura = scene.add.sprite(x, y, 'shadow_aura');
        this.aura.setDepth(this.depth - 1).setAlpha(0.5).setScale(0.8);
        if (type === 'tank') this.aura.setScale(1.2);

        // Dark Particles (Smoke/Shadow)
        this.particles = scene.add.particles(0, 0, 'spark', {
            speed: { min: 5, max: 20 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 800,
            frequency: 150,
            tint: 0x440000,
            blendMode: 'NORMAL',
            follow: this
        });
        this.particles.setDepth(this.depth - 2);
        
        // Breathing
        scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.03,
            scaleY: this.scaleY * 1.03,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Sync aura in postupdate to prevent lag
        scene.events.on('postupdate', () => {
            if (this.active && this.aura) {
                this.aura.setPosition(this.x, this.y);
            }
        });
    }

    destroy(fromScene?: boolean) {
        if (this.aura) this.aura.destroy();
        if (this.particles) this.particles.destroy();
        super.destroy(fromScene);
    }

    public updateAI(_time: number, target: any, isAttractActive: boolean, uiGraphics: Phaser.GameObjects.Graphics) {
        if (!this.active) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        const player = (this.scene as any).player;
        const playerDist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (this.enemyType === 'healer' && !isAttractActive && playerDist < 250) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, (this.body as Phaser.Physics.Arcade.Body).velocity);
            
            if (target && target.active && target !== player && dist < 300) {
                target.hp = Math.min(target.maxHP, target.hp + 0.3); // Buffed healing speed
                uiGraphics.lineStyle(2, 0x00ff00, 0.6).lineBetween(this.x, this.y, target.x, target.y); // Thicker line
            }
        } else if (this.enemyType === 'kami') {
            this.scene.physics.moveToObject(this, target, this.speed);
            if (dist < 40) {
                (this.scene as any).explodeEnemy(this);
            }
        } else {
            // Melee (Normal / Tank)
            const range = this.enemyType === 'tank' ? 80 : 60;
            if (dist > range) {
                this.scene.physics.moveToObject(this, target, this.speed);
            } else {
                (this.body as Phaser.Physics.Arcade.Body).setVelocity(0);
                if (target === player) {
                    (this.scene as any).handleMeleeAttack(this);
                } else {
                    const dmg = this.enemyType === 'tank' ? 0.6 : 0.3;
                    target.setData('hp', Math.max(0, target.getData('hp') - dmg));
                    (this.scene as any).columnDamageThisFrame = true;
                    if (target.getData('hp') <= 0) target.setActive(false).setVisible(false);
                }
            }
        }

        // Draw individual HP bar
        const barW = this.enemyType === 'tank' ? 48 : 32, barH = 3;
        uiGraphics.fillStyle(0x000000, 0.5).fillRect(this.x - barW/2, this.y - (this.enemyType === 'tank' ? 40 : 30), barW, barH);
        uiGraphics.fillStyle(0xff0000, 1).fillRect(this.x - barW/2, this.y - (this.enemyType === 'tank' ? 40 : 30), barW * (this.hp / this.maxHP), barH);
    }
}

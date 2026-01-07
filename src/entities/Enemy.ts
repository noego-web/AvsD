import Phaser from 'phaser';
import { Column } from './Column';

export type EnemyType = 'normal' | 'tank' | 'kami' | 'healer';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    public hp: number;
    public maxHP: number;
    public speed: number;
    public enemyType: EnemyType;
    private aura: Phaser.GameObjects.Sprite;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter;
    public lastAttackTime: number = 0;
    private avoidAngle: number = 0;
    private lastAvoidUpdateTime: number = 0;
    private isAvoidingPlayer: boolean = false;

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
        this.setDepth(15);

        this.enemyType = type;
        this.hp = hp;
        this.maxHP = hp;
        this.speed = speed;

        // Adjusted visual sizes (Further reduced)
        if (type === 'tank') {
            this.setDisplaySize(38, 38);
            (this.body as Phaser.Physics.Arcade.Body).setSize(16, 16).setOffset(11, 11);
        } else if (type === 'kami') {
            this.setDisplaySize(22, 22);
            (this.body as Phaser.Physics.Arcade.Body).setSize(12, 12).setOffset(5, 5);
        } else {
            this.setDisplaySize(30, 30);
            (this.body as Phaser.Physics.Arcade.Body).setSize(14, 14).setOffset(8, 8);
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

        this.setCollideWorldBounds(true);
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

        if (this.enemyType === 'healer' && !isAttractActive) {
            // Support Range Logic: stay between 180 and 380 pixels from player
            const avoidDist = 110;
            const stopAvoidDist = 180;
            const approachDist = 250;

            if (!this.isAvoidingPlayer && playerDist < avoidDist) {
                this.isAvoidingPlayer = true;
            } else if (this.isAvoidingPlayer && playerDist > stopAvoidDist) {
                this.isAvoidingPlayer = false;
            }

            if (this.isAvoidingPlayer) {
                // Avoid Mode: Move away from player in cycles
                const cycleTime = 800;
                const moveTime = 800;
                const timeInCycle = _time % cycleTime;

                if (timeInCycle < moveTime) {
                    if (_time > this.lastAvoidUpdateTime + (cycleTime - moveTime)) {
                        this.avoidAngle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
                        this.lastAvoidUpdateTime = _time;
                    }
                    this.scene.physics.velocityFromRotation(this.avoidAngle, this.speed, (this.body as Phaser.Physics.Arcade.Body).velocity);
                } else {
                    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0);
                }
            } else if (playerDist > approachDist) {
                // Approach Mode: Get closer to the player if too far (Support)
                this.scene.physics.moveToObject(this, player, this.speed * 0.8);
            } else {
                // Idle Mode: Found a sweet spot
                (this.body as Phaser.Physics.Arcade.Body).setVelocity(0);
            }
            
            if (target && target.active && target !== player && dist < 260) {
                target.hp = Math.min(target.maxHP, target.hp + 0.3);
                uiGraphics.lineStyle(2, 0x00ff00, 0.6).lineBetween(this.x, this.y, target.x, target.y);
            }
        } else if (this.enemyType === 'kami') {
            this.scene.physics.moveToObject(this, target, this.speed);
            if (dist < 32) {
                (this.scene as any).explodeEnemy(this);
            }
        } else {
            // Melee (Normal / Tank) - Range adjusted for smaller sizes
            const range = this.enemyType === 'tank' ? 22 : 16;
            if (dist > range) {
                this.scene.physics.moveToObject(this, target, this.speed);
            } else {
                // Attack cooldown for Player (Stacking fix)
                if (target === player) {
                    if (_time > this.lastAttackTime + 800) {
                        this.lastAttackTime = _time;
                        (this.scene as any).handleMeleeAttack(this);
                    }
                } else {
                    const dmg = this.enemyType === 'tank' ? 0.6 : 0.3;
                    target.setData('hp', Math.max(0, target.getData('hp') - dmg));
                    if (target instanceof Column) target.onHit();
                    (this.scene as any).columnDamageThisFrame = true;
                    if (target.getData('hp') <= 0) target.setActive(false).setVisible(false);
                }
            }
        }

        // Draw individual HP bar
        const barW = this.enemyType === 'tank' ? 48 : 32, barH = 5;
        this.drawRoundedBar(uiGraphics, this.x - barW/2, this.y - (this.enemyType === 'tank' ? 40 : 32), barW, barH, this.hp / this.maxHP, 0xff0000);
    }

    private drawRoundedBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, ratio: number, color: number) {
        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(x, y, w, h, h/2);
        if (ratio > 0) {
            g.fillStyle(color, 1);
            g.fillRoundedRect(x, y, w * ratio, h, h/2);
        }
        
        // Horizontal Flipping based on movement (Velocity)
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body && body.velocity.x !== 0) {
            this.setFlipX(body.velocity.x > 0);
        }
    }
}

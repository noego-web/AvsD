import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public hp: number = 100;
    public maxHP: number = 100;
    public speed: number = 170; // should be faster than demons
    public mana: number = 0;
    public maxMana: number = 100;
    public beamHeat: number = 0;
    public maxHeat: number = 100;
    public isOverheated: boolean = false;
    public isSuperActive: boolean = false;
    public superAttackRadius: number = 0;

    private beamGraphics: Phaser.GameObjects.Graphics;
    private superAttackGraphics: Phaser.GameObjects.Graphics;
    private aura: Phaser.GameObjects.Sprite;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter;
    private buffTimers: { [key: string]: number } = {};

    private lastBeamAngle: number = 0;
    private cooldownTime: number = 3000;
    private cooldownElapsed: number = 0;

    // Skin Multipliers
    public manaMult: number = 1.0;
    public speedMult: number = 1.0;
    public damageMult: number = 1.0;
    public cooldownMult: number = 1.0;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'player', 
        multipliers: { mana: number, speed: number, damage: number, cooldown: number } = { mana: 1, speed: 1, damage: 1, cooldown: 1 }) {
        super(scene, x, y, texture);
        this.manaMult = multipliers.mana;
        this.speedMult = multipliers.speed;
        this.damageMult = multipliers.damage;
        this.cooldownMult = multipliers.cooldown;

        this.speed = 170 * this.speedMult;
        this.cooldownTime = 3000 * this.cooldownMult;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(48, 48);
        (this.body as Phaser.Physics.Arcade.Body).setSize(this.width, this.height);
        this.setCollideWorldBounds(true);
        this.setDepth(10);

        // Breathing effect
        scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.03,
            scaleY: this.scaleY * 1.03,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Holy Aura (under player)
        this.aura = scene.add.sprite(x, y, 'holy_aura');
        this.aura.setDepth(9).setAlpha(0.6).setScale(1.2);
        scene.tweens.add({
            targets: this.aura,
            angle: 360,
            duration: 5000,
            repeat: -1
        });
        scene.tweens.add({
            targets: this.aura,
            alpha: 0.3,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // Particles
        this.particles = scene.add.particles(0, 0, 'spark', {
            speed: { min: 20, max: 50 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            frequency: 100,
            blendMode: 'ADD',
            follow: this
        });
        this.particles.setDepth(8);

        this.beamGraphics = scene.add.graphics().setDepth(5);
        this.superAttackGraphics = scene.add.graphics().setDepth(6);

        // Fix aura lag by syncing in postupdate event
        scene.events.on('postupdate', () => {
            if (this.active && this.aura) {
                this.aura.setPosition(this.x, this.y);
            }
        });
    }

    public update(delta: number, joysticks: any, buffTimers: { [key: string]: number }) {
        this.buffTimers = buffTimers;
        this.beamGraphics.clear();
        this.superAttackGraphics.clear();

        const { left, right } = joysticks;
        const isMoving = left.visible && left.force > 0;
        const isAttacking = right.visible && right.force > 0;

        // Movement
        if (isMoving) {
            this.scene.physics.velocityFromRotation(
                left.rotation,
                Math.min(left.force, 60) * (this.speed / 60),
                (this.body as Phaser.Physics.Arcade.Body).velocity
            );
            if (!isAttacking) this.setFlipX(Math.cos(left.rotation) > 0);
        } else {
            this.setVelocity(0);
        }

        // --- Cooling & Overheat Logic ---
        if (this.isOverheated) {
            this.cooldownElapsed += delta;
            if (this.cooldownElapsed >= this.cooldownTime) {
                this.isOverheated = false;
                this.beamHeat = 0;
                this.cooldownElapsed = 0;
            }
        } else if (!isAttacking && this.beamHeat > 0) {
            this.beamHeat -= 0.5; // HEAT_DECAY
            if (this.beamHeat < 0) this.beamHeat = 0;
        }

        // Beam Logic
        const beamAngle = isAttacking ? right.rotation : this.lastBeamAngle;
        if (isAttacking && !this.isOverheated) {
            this.lastBeamAngle = right.rotation;
        }
        
        // Beam logic: only draw if attacking AND not overheated
        this.drawBeam(beamAngle, isAttacking && !this.isOverheated);

        if (isAttacking && !this.isOverheated) {
            if (this.buffTimers.noOverheat <= 0) {
                this.beamHeat += 0.7; // HEAT_GAIN
            }

            if (this.beamHeat >= this.maxHeat) {
                this.isOverheated = true;
                this.beamHeat = this.maxHeat;
                this.cooldownElapsed = 0;
            }
        }
        
        // Horizontal Flipping based on movement or aim
        if (isAttacking) {
            this.setFlipX(Math.cos(beamAngle) > 0);
        } else if (isMoving) {
            this.setFlipX(Math.cos(left.rotation) > 0);
        }

        // Super Attack Rendering
        if (this.isSuperActive) {
            this.superAttackGraphics.lineStyle(4, 0x00ffff, 1 - (this.superAttackRadius / 400));
            this.superAttackGraphics.strokeCircle(this.x, this.y, this.superAttackRadius);
            this.superAttackGraphics.fillStyle(0x00ffff, 0.2 * (1 - this.superAttackRadius / 400));
            this.superAttackGraphics.fillCircle(this.x, this.y, this.superAttackRadius);
        }
    }

    private drawBeam(angle: number, isActive: boolean) {
        if (!isActive) return;

        const beamL = 180;
        const beamW = Phaser.Math.DegToRad(this.buffTimers.damage > 0 ? 80 : 50);
        const color = this.buffTimers.damage > 0 ? 0xffbb00 : 0xffff00;

        // Ultra High-fidelity gradient (20 layers for ultra smooth fade)
        const steps = 20;
        const baseAlpha = this.buffTimers.damage > 0 ? 0.45 : 0.35;
        
        for (let i = steps; i >= 1; i--) {
            const ratio = i / steps;
            const layerAlpha = (baseAlpha / steps) * 1.6;
            const layerRadius = beamL * ratio;
            
            this.beamGraphics.fillStyle(color, layerAlpha);
            this.beamGraphics.beginPath();
            this.beamGraphics.moveTo(this.x, this.y);
            this.beamGraphics.arc(this.x, this.y, layerRadius, angle - beamW/2, angle + beamW/2);
            this.beamGraphics.closePath();
            this.beamGraphics.fillPath();
        }
    }

    public activateSuper() {
        if (this.mana < this.maxMana) return;

        this.mana = 0;
        this.isSuperActive = true;
        this.superAttackRadius = 0;

        // Damage logic (similar to old GameScene implementation)
        const enemies = (this.scene as any).enemies;
        if (enemies) {
            const list = enemies.getChildren();
            for (let i = 0; i < list.length; i++) {
                const enemy = list[i] as any;
                if (enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist < 400) {
                        enemy.hp -= 200;
                        if (enemy.hp <= 0) enemy.destroy();
                    }
                }
            }
        }

        this.scene.tweens.add({
            targets: this,
            superAttackRadius: 400,
            duration: 800,
            ease: 'Expo.out',
            onComplete: () => {
                this.isSuperActive = false;
                this.superAttackRadius = 0;
                this.superAttackGraphics.clear();
            }
        });
    }

    public takeDamage(amount: number) {
        this.hp = Math.max(0, this.hp - amount);
        
        // Damage Flash instead of invulnerability to allow stacking
        this.setTint(0xff5555);
        this.scene.time.delayedCall(120, () => {
            if (this.active) this.clearTint();
        });
    }

    public addMana(amount: number) {
        this.mana = Math.min(this.maxMana, this.mana + amount * this.manaMult);
    }

    destroy(fromScene?: boolean) {
        if (this.aura) this.aura.destroy();
        if (this.particles) this.particles.destroy();
        if (this.beamGraphics) this.beamGraphics.destroy();
        if (this.superAttackGraphics) this.superAttackGraphics.destroy();
        super.destroy(fromScene);
    }
}

import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public hp: number = 100;
    public maxHP: number = 100;
    public speed: number = 300;
    public mana: number = 0;
    public maxMana: number = 100;
    public beamHeat: number = 0;
    public maxHeat: number = 100;
    public isOverheated: boolean = false;
    public isInvulnerable: boolean = false;
    public isSuperActive: boolean = false;
    public superAttackRadius: number = 0;

    private beamGraphics: Phaser.GameObjects.Graphics;
    private superAttackGraphics: Phaser.GameObjects.Graphics;
    private aura: Phaser.GameObjects.Sprite;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter;
    private buffTimers: { [key: string]: number } = {};

    private cooldownTime: number = 3000;
    private cooldownElapsed: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');
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

        // Attack
        if (isAttacking && !this.isOverheated) {
            const rotation = right.rotation;
            this.setFlipX(Math.cos(rotation) > 0);

            this.drawBeam(rotation);
            if (this.buffTimers.noOverheat <= 0) {
                this.beamHeat += 0.7; // HEAT_GAIN
            }

            if (this.beamHeat >= this.maxHeat) {
                this.isOverheated = true;
                this.beamHeat = this.maxHeat;
                this.cooldownElapsed = 0;
            }
        }

        // Super Attack Rendering
        if (this.isSuperActive) {
            this.superAttackGraphics.lineStyle(4, 0x00ffff, 1 - (this.superAttackRadius / 400));
            this.superAttackGraphics.strokeCircle(this.x, this.y, this.superAttackRadius);
            this.superAttackGraphics.fillStyle(0x00ffff, 0.2 * (1 - this.superAttackRadius / 400));
            this.superAttackGraphics.fillCircle(this.x, this.y, this.superAttackRadius);
        }
    }

    private drawBeam(angle: number) {
        const beamL = 180;
        const beamW = Phaser.Math.DegToRad(this.buffTimers.damage > 0 ? 80 : 50);
        const ratio = this.beamHeat / this.maxHeat;
        const color = this.buffTimers.damage > 0 ? 0xff8c00 : Phaser.Display.Color.GetColor(255, Math.floor(255 * (1 - ratio)), 0);
        
        this.beamGraphics.lineStyle(2, color, 0.4).fillStyle(color, 0.25).beginPath();
        this.beamGraphics.moveTo(this.x, this.y);
        this.beamGraphics.arc(this.x, this.y, beamL, angle - beamW/2, angle + beamW/2);
        this.beamGraphics.closePath().fillPath().strokePath();
    }

    public activateSuper() {
        if (this.mana < this.maxMana) return;

        this.mana = 0;
        this.isSuperActive = true;
        this.superAttackRadius = 0;

        // Damage logic (similar to old GameScene implementation)
        const enemies = (this.scene as any).enemies;
        if (enemies) {
            [...enemies.getChildren()].forEach((enemy: any) => {
                if (enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist < 400) {
                        enemy.hp -= 200;
                        if (enemy.hp <= 0) enemy.destroy();
                    }
                }
            });
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
        if (this.isInvulnerable) return;
        this.hp = Math.max(0, this.hp - amount);
        this.triggerInvulnerability();
    }

    private triggerInvulnerability() {
        this.isInvulnerable = true;
        this.scene.tweens.add({
            targets: this,
            alpha: 0.4,
            duration: 100,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.isInvulnerable = false;
                this.setAlpha(1);
            }
        });
    }

    public addMana(amount: number) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }

    destroy(fromScene?: boolean) {
        if (this.aura) this.aura.destroy();
        if (this.particles) this.particles.destroy();
        if (this.beamGraphics) this.beamGraphics.destroy();
        if (this.superAttackGraphics) this.superAttackGraphics.destroy();
        super.destroy(fromScene);
    }
}

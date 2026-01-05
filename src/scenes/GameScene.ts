import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import type { EnemyType } from '../entities/Enemy';
import { Column } from '../entities/Column';
import { Bonus } from '../entities/Bonus';
import type { BonusType } from '../entities/Bonus';
import { Projectile } from '../entities/Projectile';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
    public player!: Player;
    private columns!: Phaser.Physics.Arcade.StaticGroup;
    private enemies!: Phaser.Physics.Arcade.Group;
    private bonuses!: Phaser.Physics.Arcade.Group;
    private projectiles!: Phaser.Physics.Arcade.Group;
    
    private leftJoystick: any;
    private rightJoystick: any;
    private hud!: HUD;
    private screenGlow!: Phaser.GameObjects.Graphics;
    
    public columnDamageThisFrame: boolean = false;
    private lastSpawnTime: number = 0;
    private lastBonusSpawnTime: number = 0;
    private readonly SPAWN_INTERVAL = 1800;
    private readonly BONUS_INTERVAL = 15000;

    private buffTimers: { [key: string]: number } = {
        damage: 0,
        noOverheat: 0,
        speed: 0,
        attract: 0
    };

    constructor() {
        super('GameScene');
    }

    init() {
        this.buffTimers = { damage: 0, noOverheat: 0, speed: 0, attract: 0 };
        this.lastSpawnTime = 0;
        this.lastBonusSpawnTime = 0;
        this.columnDamageThisFrame = false;
    }

    preload() {
        this.load.image('player', 'src/assets/images/angels/angel-3.webp');
        const g = this.make.graphics({ x: 0, y: 0 });
        
        // Textures
        g.clear().fillStyle(0xff0000).fillRect(0,0,32,32).generateTexture('enemy_normal', 32, 32);
        g.clear().fillStyle(0x8b4513).fillRect(0,0,48,48).lineStyle(3,0).strokeRect(0,0,48,48).generateTexture('enemy_tank', 48, 48);
        g.clear().fillStyle(0xffff00).fillCircle(16,16,16).lineStyle(2,0xff0000).strokeCircle(16,16,16).generateTexture('enemy_kami', 32, 32);
        g.clear().fillStyle(0xffffff).fillRect(0,0,32,32).fillStyle(0x0000ff).fillRect(14,4,4,24).fillRect(4,14,24,4).generateTexture('enemy_healer', 32, 32);
        g.clear().fillStyle(0xdddddd).fillRect(0,0,40,80).lineStyle(2,0x888888).strokeRect(0,0,40,80).fillStyle(0xaaaaff).fillRect(5,5,30,20).generateTexture('column', 40, 80);
        g.clear().fillStyle(0x00ff00).fillCircle(6,6,6).generateTexture('bullet', 12, 12);

        // Auras and Particles
        // Holy Aura (Gradient-like circle)
        g.clear();
        for(let i = 0; i < 20; i++) {
            g.fillStyle(0xfff8e1, (20-i)/40);
            g.fillCircle(32, 32, 12 + i);
        }
        g.generateTexture('holy_aura', 64, 64);

        // Shadow Aura
        g.clear();
        for(let i = 0; i < 20; i++) {
            g.fillStyle(0x4a0000, (20-i)/40);
            g.fillCircle(32, 32, 12 + i);
        }
        g.generateTexture('shadow_aura', 64, 64);

        // Spark Particle
        g.clear().fillStyle(0xffffff).fillCircle(4, 4, 4).generateTexture('spark', 8, 8);

        const drawB = (n: string, c: number) => g.clear().fillStyle(c).fillCircle(16,16,16).lineStyle(2,0xffffff).strokeCircle(16,16,16).generateTexture(n, 32, 32);
        drawB('b_damage', 0xff4500); drawB('b_cool', 0x00bfff); drawB('b_heal', 0x32cd32); drawB('b_speed', 0xffd700); drawB('b_attract', 0x9400d3);
        
        g.destroy();
    }

    create() {
        const w = this.scale.width, h = this.scale.height;
        const mw = w * 2, mh = h * 2;

        // Background dots
        const bg = this.add.graphics();
        bg.fillStyle(0x555555);
        for(let i=0; i<200; i++) bg.fillCircle(Phaser.Math.Between(0, mw), Phaser.Math.Between(0, mh), 1.5);

        this.player = new Player(this, mw/2, mh/2 + 150);
        this.columns = this.physics.add.staticGroup();
        this.columns.add(new Column(this, mw/2 - 200, mh/2));
        this.columns.add(new Column(this, mw/2 + 200, mh/2));

        this.enemies = this.physics.add.group();
        this.bonuses = this.physics.add.group();
        this.projectiles = this.physics.add.group();

        this.hud = new HUD(this, this.player);
        this.screenGlow = this.add.graphics().setDepth(1000).setScrollFactor(0);

        this.setupPhysics();
        this.setupControls();

        this.physics.world.setBounds(0,0, mw, mh);
        this.cameras.main.setBounds(0,0, mw, mh).startFollow(this.player, true, 0.5, 0.5);
    }

    private setupPhysics() {
        this.physics.add.overlap(this.player, this.bonuses, (_p, b: any) => this.collectBonus(b));
        this.physics.add.overlap(this.player, this.projectiles, (_p, pr: any) => {
            if(!this.player.isInvulnerable) {
                this.player.takeDamage(5);
                pr.destroy();
            }
        });
        this.physics.add.overlap(this.projectiles, this.columns, (pr: any, col: any) => {
            if (col.active) {
                const currentHP = col.getData('hp');
                col.setData('hp', Math.max(0, currentHP - 10));
                this.columnDamageThisFrame = true;
                pr.destroy();
                if (currentHP - 10 <= 0) col.setActive(false).setVisible(false);
            }
        });
    }

    private setupControls() {
        const jsPlugin = this.plugins.get('rexVirtualJoystick') as any;
        const config = (x:number, y:number) => ({
            x, y, radius: 60,
            base: this.add.circle(0,0,60,0x888888,0.5).setDepth(100).setScrollFactor(0),
            thumb: this.add.circle(0,0,30,0xcccccc,0.5).setDepth(100).setScrollFactor(0),
            dir: '8dir', forceMin: 16, enable: true
        });

        this.leftJoystick = jsPlugin.add(this, config(0, 0)).setVisible(false);
        this.rightJoystick = jsPlugin.add(this, config(0, 0)).setVisible(false);

        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if(Phaser.Math.Distance.Between(p.x, p.y, this.scale.width - 60, 50) < 55) return;
            if(p.x < this.scale.width / 2) {
                this.leftJoystick.x = p.x; this.leftJoystick.y = p.y; this.leftJoystick.setVisible(true);
            } else {
                this.rightJoystick.x = p.x; this.rightJoystick.y = p.y; this.rightJoystick.setVisible(true);
            }
        });

        this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
            if(p.x < this.scale.width/2) this.leftJoystick.setVisible(false);
            else this.rightJoystick.setVisible(false);
        });

        // Pause Button
        const pBtnX = this.scale.width - 60;
        const pBg = this.add.circle(pBtnX, 50, 45, 0xffffff, 0.4).setScrollFactor(0).setDepth(10000);
        this.add.text(pBtnX, 50, '||', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);
        const pZone = this.add.zone(pBtnX, 50, 90, 90).setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(10002);
        
        pZone.on('pointerdown', (p: any) => { p.event.stopPropagation(); this.togglePause(); });
        this.scale.on('resize', (s:any) => {
            pBg.x = s.width - 60; pZone.x = s.width - 60;
        });
    }

    private togglePause() {
        this.scene.pause();
        this.scene.launch('PauseScene');
        this.leftJoystick.setEnable(false); this.rightJoystick.setEnable(false);
        this.leftJoystick.setVisible(false); this.rightJoystick.setVisible(false);
    }

    public resumeFromPause() {
        this.leftJoystick.setEnable(true); this.rightJoystick.setEnable(true);
        this.scene.resume();
    }

    update(time: number, delta: number) {
        if (this.scene.isPaused()) return;
        this.screenGlow.clear();
        this.columnDamageThisFrame = false;

        // Update Buffs
        Object.keys(this.buffTimers).forEach(k => {
            if(this.buffTimers[k] > 0) {
                this.buffTimers[k] -= delta;
                if(this.buffTimers[k] <= 0) {
                    this.buffTimers[k] = 0;
                    if(k === 'speed') this.player.speed = 300;
                }
            }
        });

        this.player.update(delta, { left: this.leftJoystick, right: this.rightJoystick }, this.buffTimers);
        this.hud.update();

        // Spawning
        if(time > this.lastSpawnTime + this.SPAWN_INTERVAL) { this.spawnEnemy(); this.lastSpawnTime = time; }
        if(time > this.lastBonusSpawnTime + this.BONUS_INTERVAL) { this.spawnBonus(); this.lastBonusSpawnTime = time; }

        // Attack Logic for Player Beam
        if(this.rightJoystick.visible && this.rightJoystick.force > 0 && !this.player.isOverheated) {
            this.handleBeamCombat(this.rightJoystick.rotation);
        }

        // Enemy AI
        const isAttract = this.buffTimers.attract > 0;
        this.enemies.getChildren().forEach((e: any) => {
            let target = this.getEnemyTarget(e, isAttract);
            e.updateAI(time, target, isAttract, this.hud.getGraphics());
        });

        if (isAttract) {
            const g = this.hud.getGraphics();
            g.lineStyle(4, 0x9400d3, 0.6).strokeCircle(this.player.x, this.player.y, 100);
        }

        // Final UI
        if(this.columnDamageThisFrame) {
            this.screenGlow.lineStyle(20, 0xff0000, 0.4).strokeRect(0,0, this.scale.width, this.scale.height);
        }

        // Game Over Check
        let activeCols = 0;
        this.columns.getChildren().forEach((c: any) => { if(c.active) { activeCols++; c.updateUI(this.hud.getGraphics()); } });
        if(activeCols === 0 || this.player.hp <= 0) {
            this.scene.pause();
            this.scene.launch('GameOverScene');
        }
    }

    private handleBeamCombat(rotation: number) {
        const dMult = this.buffTimers.damage > 0 ? 2 : 1;
        [...this.enemies.getChildren()].forEach((e: any) => {
            if(!e.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if(dist < 180) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
                const diff = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(rotation), Phaser.Math.RadToDeg(angle)));
                if(diff < (this.buffTimers.damage > 0 ? 40 : 25)) {
                    e.hp -= 2.5 * dMult;
                    this.player.addMana(0.5);
                    e.setTint(0xffaaaa);
                    this.time.delayedCall(50, () => { if(e.active) e.clearTint(); });
                    if(e.hp <= 0) { e.destroy(); this.player.addMana(20); }
                }
            }
        });
    }

    private getEnemyTarget(e: Enemy, isAttract: boolean) {
        if(isAttract) return this.player;
        if(e.enemyType === 'tank') {
            const cols = (this.columns.getChildren() as Column[]).filter(c => c.active);
            if (cols.length === 0) return this.player;
            let closest = cols[0];
            let minDist = Phaser.Math.Distance.Between(e.x, e.y, closest.x, closest.y);
            cols.forEach(c => {
                const d = Phaser.Math.Distance.Between(e.x, e.y, c.x, c.y);
                if (d < minDist) { minDist = d; closest = c; }
            });
            return closest;
        }
        if(e.enemyType === 'healer') {
            let lowest = 1, found = null;
            this.enemies.getChildren().forEach((o: any) => {
                if(o !== e && o.hp/o.maxHP < lowest) { lowest = o.hp/o.maxHP; found = o; }
            });
            return found || this.player;
        }
        // Normal/Shooter/Kami closest
        let best: any = this.player;
        let minD = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
        this.columns.getChildren().forEach((c: any) => {
            if(!c.active) return;
            const d = Phaser.Math.Distance.Between(e.x, e.y, c.x, c.y);
            if(d < minD) { minD = d; best = c; }
        });
        return best;
    }

    public spawnProjectile(x: number, y: number, target: any) {
        this.projectiles.add(new Projectile(this, x, y, target));
    }

    public explodeEnemy(e: any) {
        const circle = this.add.circle(e.x, e.y, 80, 0xffa500, 0.5);
        this.tweens.add({ targets: circle, radius: 100, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
        if(Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 100) this.player.takeDamage(20);
        this.columns.getChildren().forEach((c: any) => {
            if(c.active && Phaser.Math.Distance.Between(e.x, e.y, c.x, c.y) < 100) {
                c.setData('hp', Math.max(0, c.getData('hp') - 40));
                this.columnDamageThisFrame = true;
            }
        });
        e.destroy();
    }

    public handleMeleeAttack(e: Enemy) {
        if(!this.player.isInvulnerable) {
            const dmg = e.enemyType === 'tank' ? 15 : 10;
            this.player.takeDamage(dmg);
        }
    }

    private spawnEnemy() {
        const side = Phaser.Math.Between(0, 3);
        let x = 0, y = 0;
        const mw = this.scale.width * 2, mh = this.scale.height * 2;
        if(side===0){x=Phaser.Math.Between(0,mw); y=-50;}
        else if(side===1){x=Phaser.Math.Between(0,mw); y=mh+50;}
        else if(side===2){x=-50; y=Phaser.Math.Between(0,mh);}
        else {x=mw+50;y=Phaser.Math.Between(0,mh);}

        const r = Math.random();
        let t: EnemyType = 'normal';
        let stats = { hp: 100, speed: 120 };
        if(r < 0.20) { t='tank'; stats={hp:450, speed:75}; } // Buffed tank hp
        else if(r < 0.45) { t='kami'; stats={hp:50, speed:240}; } // More kamikazes
        else if(r < 0.65) { t='healer'; stats={hp:120, speed:140}; } // Buffed healer hp/speed

        this.enemies.add(new Enemy(this, x, y, t, stats));
    }

    private spawnBonus() {
        const x = Phaser.Math.Between(100, (this.scale.width*2)-100);
        const y = Phaser.Math.Between(100, (this.scale.height*2)-100);
        const types: BonusType[] = ['b_damage', 'b_cool', 'b_heal', 'b_speed', 'b_attract'];
        this.bonuses.add(new Bonus(this, x, y, Phaser.Utils.Array.GetRandom(types)));
    }

    private collectBonus(b: Bonus) {
        const type = b.bonusType;
        b.destroy();
        if(type === 'b_damage') this.buffTimers.damage = 12000;
        else if(type === 'b_cool') this.buffTimers.noOverheat = 12000;
        else if(type === 'b_heal') this.columns.getChildren().forEach((c:any) => { if(c.active) c.setData('hp', Math.min(300, c.getData('hp')+60)); });
        else if(type === 'b_speed') { this.buffTimers.speed = 12000; this.player.speed = 450; }
        else if(type === 'b_attract') this.buffTimers.attract = 12000;
    }
}

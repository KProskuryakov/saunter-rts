import Phaser from 'phaser';

class Unit extends Phaser.Physics.Arcade.Sprite {
  movingToLoc?: Phaser.Math.Vector2;
  speed: number = 100;
  faction: 'player' | 'enemy' = 'player';
  state: 'commandmove' | 'idle' = 'idle';
  hp: number = 100;
  maxhp: number = 100;
  atkdelay: number = 600;
  tta: number = 0;
  damage: number = 10;
  atkrange: number = 100;
  aggrorange: number = 200;
  target?: Unit;

  constructor(scene: GameScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    this.setInteractive();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.movingToLoc) {
      if (Phaser.Math.Distance.BetweenPointsSquared(this, this.movingToLoc) < 49) {
        this.body.stop();
        this.movingToLoc = undefined;
        if (this.state === 'commandmove') {
          this.state = 'idle';
        }
      } else {
        this.scene.physics.moveTo(this, this.movingToLoc.x, this.movingToLoc.y, this.speed);
      }
    } else {
      this.body.stop();
    }
  }
  
  static isUnit(obj: Phaser.GameObjects.GameObject): obj is Unit {
    return obj instanceof Unit;
  }
}

class GameScene extends Phaser.Scene {

  units: Set<Unit> = new Set();
  healthbars!: Phaser.GameObjects.Graphics;
  aggroTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('catgirl', 'assets/catgirl-forward.png');
    this.load.image('mushroom', 'https://labs.phaser.io/assets/sprites/mushroom16x16.png');

    this.load.audio('lasergun', 'assets/KP_LaserGun01.ogg');
  }

  create() {
    this.input.mouse.disableContextMenu();

    this.cameras.main.setBounds(0, 0, 3840, 2160);
    this.cameras.main.zoom = 0.5;

    this.healthbars = this.add.graphics();

    const uiScene = this.scene.get('UIScene') as UIScene;

    const spriteInnerBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.cameras.main.getBounds()), -1600, -800);

    const spriteInnerBounds2 = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.cameras.main.getBounds()), -1400, -600);
    const spriteOuterBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.cameras.main.getBounds()), -20, -20);

    for (let i = 0; i < 20; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteInnerBounds, new Phaser.Geom.Point());
      const catgirl = this.physics.add.existing(new Unit(this, pos.x, pos.y, 'catgirl'));
      catgirl.speed = 125;
      this.units.add(catgirl);
    }

    for (let i = 0; i < 1000; i++) {
      const pos = Phaser.Geom.Rectangle.RandomOutside(spriteOuterBounds, spriteInnerBounds2, new Phaser.Geom.Point());
      const mushroom = this.physics.add.existing(new Unit(this, pos.x, pos.y, 'mushroom'));
      mushroom.speed = 75;
      mushroom.atkrange = 25;
      mushroom.faction = 'enemy';
      this.units.add(mushroom);
    }
    

    this.input.on('pointermove', function (this: GameScene, pointer: Phaser.Input.Pointer) {
      if (pointer.middleButtonDown()) {
        const cam = this.cameras.main;
        cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
        cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
      }
    }, this);

    this.input.on('wheel', function (this: GameScene, pointer: Phaser.Input.Pointer) {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - .25 * Math.sign(pointer.deltaY), 0.5, 1.5);

      if (this.cameras.main.zoom !== newZoom) {
        this.cameras.main.pan(pointer.worldX, pointer.worldY, 150);
      }

      this.cameras.main.zoomTo(newZoom, 150);
    });

    this.input.on('pointerup', function (this: GameScene, pointer: Phaser.Input.Pointer, clickedObjects: Phaser.GameObjects.GameObject[]) {
      if (pointer.leftButtonReleased()) {
        this.units.forEach(sprite => {
          sprite.setTint(0xffffff);
        });
        if (!uiScene.drawDragbox && clickedObjects.length > 0) {
          uiScene.selected = [];
          const unit = clickedObjects[0];
          if (unit instanceof Unit) {
            unit.setTint(0x00ff00);
            uiScene.selected.push(unit);
          }
        } else {
          uiScene.selected = [];
          uiScene.drawDragbox = false;
          uiScene.dragbox.clear();

          const boxStart = this.cameras.main.getWorldPoint(Math.min(pointer.downX, pointer.x), Math.min(pointer.downY, pointer.y));
          this.physics.overlapRect(boxStart.x, boxStart.y, pointer.getDistanceX() / this.cameras.main.zoom, pointer.getDistanceY() / this.cameras.main.zoom, true, false).forEach((body) => {
            const obj = body.gameObject;
            if (obj instanceof Unit && obj.faction === 'player') {
              obj.setTint(0x00ff00);
              uiScene.selected.push(obj);
            }
          });
        }
      } else if (pointer.rightButtonReleased()) {
        uiScene.selected.forEach((unit) => {
          if (unit.faction === 'player') {
            unit.movingToLoc = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
            unit.state = 'commandmove';
          }
        });
      }
    }, this);

    this.aggroTimer = this.time.addEvent({delay: 200, callbackScope: this, loop: true, callback: function(this: GameScene) {
      this.units.forEach(u => {
        const closestEnemy = this.physics.closest(u, Array.from(this.units).filter(e => e.faction !== u.faction)) as Unit;
        if (u.target === undefined && closestEnemy && Phaser.Math.Distance.BetweenPoints(u, closestEnemy) <= u.aggrorange) {
          u.target = closestEnemy;
          u.tta = Phaser.Math.RND.integerInRange(0, 150);
        } else {
          u.target = undefined;
        }
      });
      
    }});

    this.scene.launch('UIScene');

  }

  update(_time: number, delta: number) {
    this.healthbars.clear();
    
    const cameraStart = this.cameras.main.getWorldPoint(this.cameras.main.x, this.cameras.main.y);
    const objs = this.physics.overlapRect(cameraStart.x, cameraStart.y, this.cameras.main.width / this.cameras.main.zoom, this.cameras.main.height / this.cameras.main.zoom);
    objs.forEach((b) => {
      const g = b.gameObject;
      if (Unit.isUnit(g) && g.hp !== g.maxhp) {
        this.healthbars.fillStyle(0xff0000);
        this.healthbars.fillRect(b.x, g.y + b.halfHeight, g.width, 5);
        this.healthbars.fillStyle(0x00ff00);
        this.healthbars.fillRect(b.x, g.y + b.halfHeight, g.width * g.hp / g.maxhp, 5);
      }
    });

    this.units.forEach(u => u.tta = Math.max(0, u.tta - delta));

    const deathList: Unit[] = [];

    this.units.forEach(u => {
      if (u.target && u.state === 'idle') {
        if (Phaser.Math.Distance.BetweenPoints(u, u.target) > u.atkrange) {
          u.movingToLoc = new Phaser.Math.Vector2(u.target);
        } else {
          u.movingToLoc = undefined;
          if (u.tta === 0) {
            u.target.hp = Math.max(0, u.target.hp - u.damage);
            u.tta = u.atkdelay;
            this.sound.play('lasergun', {volume: 0.1});
          }
        }
      }
      if (u.hp === 0) {
        deathList.push(u);
      }
    });

    deathList.forEach(u => { this.units.delete(u); u.destroy(); });
  }

}

class UIScene extends Phaser.Scene {

  selected: Unit[] = [];
  dragbox!: Phaser.GameObjects.Graphics;
  drawDragbox = false;

  constructor() {
    super('UIScene');
  }

  create() {
    this.add.text(20, 20, "Left-click to select, drag left button to select multiple.\nRight click to move command.\nEnter to fullscreen.\nMouse wheel to scroll, drag mouse wheel to pan.");

    this.add.text(this.cameras.main.width / 2, 20, 'You are the catgirls. Slay the mushrooms.', {fontSize: '20px'}).setOrigin(0.5);

    this.dragbox = this.add.graphics();

    this.input.keyboard.on('keydown-ENTER', function (this: UIScene) {
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
    }, this);

    this.input.on('pointermove', function (this: UIScene, pointer: Phaser.Input.Pointer) {
      if (pointer.leftButtonDown()) {
        if (Phaser.Math.Distance.Squared(pointer.downX, pointer.downY, pointer.x, pointer.y) > 100) {
          this.drawDragbox = true;
          this.dragbox.clear();
          this.dragbox.lineStyle(2, 0x00ff00, 1);
          this.dragbox.strokeRect(pointer.downX, pointer.downY, pointer.x - pointer.downX, pointer.y - pointer.downY);
        }
      }
    }, this);
  }

  update() {
    
  }

}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080
  },
  physics: {
    default: 'arcade',
  },
  scene: [GameScene, UIScene]
};

new Phaser.Game(config);
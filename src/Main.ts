import Phaser from 'phaser';

class Unit extends Phaser.Physics.Arcade.Sprite {
  movingToLoc?: Phaser.Math.Vector2;
  speed: number;

  constructor(scene: Scene, x: number, y: number, texture: string, speed: number) {
    super(scene, x, y, texture);
    this.speed = speed;
    scene.add.existing(this);
    this.setInteractive();
    this.scale = 2;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (!this.body.velocity.equals(Phaser.Math.Vector2.ZERO) && this.movingToLoc) {
      if (Phaser.Math.Distance.BetweenPointsSquared(this, this.movingToLoc) < 49) {
        this.body.stop();
      }
    }
  }
}

class Scene extends Phaser.Scene {

  selected: Unit[] = [];

  constructor() {
    super('Scene');
  }

  preload() {
    this.load.image('catgirl', 'assets/catgirl-forward.png');
    this.load.image('mushroom', 'https://labs.phaser.io/assets/sprites/mushroom16x16.png');
  }

  create() {
    this.input.mouse.disableContextMenu();

    this.add.text(20, 20, "Left-click to select, drag left button to select multiple.\nRight click to move command.\nEnter to fullscreen.");

    const spriteBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.physics.world.bounds), -20, -20);
    const sprites: Phaser.GameObjects.Sprite[] = []
    for (let i = 0; i < 5; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteBounds, new Phaser.Geom.Point());
      const mushroom = this.physics.add.existing(new Unit(this, pos.x, pos.y, 'mushroom', 200));
      sprites.push(mushroom);
    }
    for (let i = 0; i < 5; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteBounds, new Phaser.Geom.Point());
      const catgirl = this.physics.add.existing(new Unit(this, pos.x, pos.y, 'catgirl', 250));
      sprites.push(catgirl);
    }

    let dragbox = this.add.graphics();
    let drawDragbox = false;

    this.input.keyboard.on('keydown-ENTER', function (this: Scene) {
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
      
    }, this);

    // this.input.on('pointerdown', function (this: Scene, pointer: Phaser.Input.Pointer) {
    //   if (pointer.leftButtonDown()) {

    //   }
    // }, this);

    this.input.on('pointermove', function (pointer: Phaser.Input.Pointer) {
      if (pointer.leftButtonDown()) {
        if (Phaser.Math.Distance.Squared(pointer.downX, pointer.downY, pointer.x, pointer.y) > 49) {
          drawDragbox = true;
          dragbox.clear();
          dragbox.lineStyle(2, 0x00ff00, 1);
          dragbox.strokeRect(pointer.downX, pointer.downY, pointer.x - pointer.downX, pointer.y - pointer.downY);
        }
      }

    }, this);

    this.input.on('pointerup', function (this: Scene, pointer: Phaser.Input.Pointer, clickedObjects: Phaser.GameObjects.GameObject[]) {
      if (pointer.leftButtonReleased()) {
        sprites.forEach(sprite => {
          sprite.setTint(0xffffff);
        });
        if (drawDragbox) {
          this.selected = [];
          drawDragbox = false;
          dragbox.clear();

          const boxX = Math.min(pointer.downX, pointer.x);
          const boxY = Math.min(pointer.downY, pointer.y);
          const width = Math.abs(pointer.getDistanceX());
          const height = Math.abs(pointer.getDistanceY());
          this.physics.overlapRect(boxX, boxY, width, height, true, false).forEach((body) => {
            const obj = body.gameObject;
            if (obj instanceof Unit) {
              obj.setTint(0x00ff00);
              this.selected.push(obj);
            }
          });
        } else {
          if (clickedObjects.length > 0) {
            this.selected = [];
            const unit = clickedObjects[0];
            if (unit instanceof Unit) {
              unit.setTint(0x00ff00);
              this.selected.push(unit);
            }
          }
        }

      } else if (pointer.rightButtonReleased()) {
        this.selected.forEach((unit) => {
          this.physics.moveToObject(unit, pointer, unit.speed);
          unit.movingToLoc = new Phaser.Math.Vector2(pointer);
        });
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
  scene: Scene
};

new Phaser.Game(config);
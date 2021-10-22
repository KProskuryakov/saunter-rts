import Phaser from 'phaser';

class Unit extends Phaser.Physics.Arcade.Sprite {
  movingToLoc?: Phaser.Math.Vector2;
  speed: number;
  faction: string = 'player';

  constructor(scene: GameScene, x: number, y: number, texture: string, speed: number) {
    super(scene, x, y, texture);
    this.speed = speed;
    scene.add.existing(this);
    this.setInteractive();
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

class GameScene extends Phaser.Scene {

  sprites: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('catgirl', 'assets/catgirl-forward.png');
    this.load.image('mushroom', 'https://labs.phaser.io/assets/sprites/mushroom16x16.png');
  }

  create() {
    this.input.mouse.disableContextMenu();

    this.cameras.main.setBounds(0, 0, 4096, 2160);
    this.cameras.main.zoom = 1.0;

    const uiScene = this.scene.get('UIScene') as UIScene;

    const spriteBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.cameras.main.getBounds()), -20, -20);
    for (let i = 0; i < 20; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteBounds, new Phaser.Geom.Point());
      const mushroom = this.physics.add.existing(new Unit(this, pos.x, pos.y, 'mushroom', 100));
      this.sprites.push(mushroom);
    }
    for (let i = 0; i < 20; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteBounds, new Phaser.Geom.Point());
      const catgirl = this.physics.add.existing(new Unit(this, pos.x, pos.y, 'catgirl', 125));
      this.sprites.push(catgirl);
    }

    this.input.on('pointermove', function (this: GameScene, pointer: Phaser.Input.Pointer) {
      if (pointer.middleButtonDown()) {
        const cam = this.cameras.main;
        cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
        cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
      }
    }, this);

    this.input.on('wheel', function (this: GameScene, pointer: Phaser.Input.Pointer) {
      this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom - .25 * Math.sign(pointer.deltaY), 0.5, 2.0)
    });

    this.input.on('pointerup', function (this: GameScene, pointer: Phaser.Input.Pointer, clickedObjects: Phaser.GameObjects.GameObject[]) {
      if (pointer.leftButtonReleased()) {
        this.sprites.forEach(sprite => {
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
            if (obj instanceof Unit) {
              obj.setTint(0x00ff00);
              uiScene.selected.push(obj);
            }
          });
        }
      } else if (pointer.rightButtonReleased()) {
        uiScene.selected.forEach((unit) => {
          this.physics.moveToObject(unit, pointer.positionToCamera(this.cameras.main), unit.speed);
          unit.movingToLoc = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        });
      }
    }, this);

    this.scene.launch('UIScene');

  }

  update() {
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
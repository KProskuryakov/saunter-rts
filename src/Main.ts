import Phaser from 'phaser';

class Scene extends Phaser.Scene {  

  preload() {
    this.load.image('catgirl', 'assets/catgirl-forward.png');
    this.load.image('mushroom', 'https://labs.phaser.io/assets/sprites/mushroom16x16.png');
  }

  create() {
    const spriteBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.physics.world.bounds), -20, -20);
    const sprites: Phaser.GameObjects.Sprite[] = []
    for (let i = 0; i < 5; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteBounds, new Phaser.Geom.Point());
      const mushroom = this.physics.add.sprite(pos.x, pos.y, 'mushroom').setCollideWorldBounds(true);
      sprites.push(mushroom);
    }
    for (let i = 0; i < 5; i++) {
      const pos = Phaser.Geom.Rectangle.Random(spriteBounds, new Phaser.Geom.Point());
      const catgirl = this.physics.add.sprite(pos.x, pos.y, 'catgirl').setCollideWorldBounds(true);
      sprites.push(catgirl);
    }

    let dragbox = this.add.graphics();
    let drawDragbox = false;

    this.input.on('pointerdown', function() {
      drawDragbox = true;
    });

    this.input.on('pointermove', function(pointer: Phaser.Input.Pointer) {
      if (drawDragbox) {
        dragbox.clear();
        dragbox.lineStyle(2, 0x00ff00, 1);
        dragbox.strokeRect(pointer.downX, pointer.downY, pointer.x - pointer.downX, pointer.y - pointer.downY);
      }
    });

    this.input.on('pointerup', function(this: Scene, pointer: Phaser.Input.Pointer) {
      sprites.forEach(sprite => {
        sprite.setTint(0xffffff);
      });
      drawDragbox = false;
      dragbox.clear();
      const boxX = Math.min(pointer.downX, pointer.x);
      const boxY = Math.min(pointer.downY, pointer.y);
      const width = Math.abs(pointer.x - pointer.downX);
      const height = Math.abs(pointer.y - pointer.downY);
      this.physics.overlapRect(boxX, boxY, width, height, true, false).forEach((body) => {
        const obj = body.gameObject;
        
        if (obj instanceof Phaser.GameObjects.Sprite) {
          obj.setTint(0x00ff00);
        }
        
      });
    }, this);

  }

  update() {
  }

}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
  },
  scene: Scene
};

new Phaser.Game(config);

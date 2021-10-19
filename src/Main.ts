import Phaser from 'phaser';

class Scene extends Phaser.Scene {  

  preload() {
    this.load.setBaseURL('https://labs.phaser.io');

    // this.load.image('sky', 'assets/skies/space3.png');
    // this.load.image('logo', 'assets/sprites/phaser3-logo.png');
    // this.load.image('red', 'assets/particles/red.png');

    this.load.image('mushroom', 'assets/sprites/mushroom16x16.png');
    
  }

  create() {
    const unit1 = this.physics.add.sprite(50, 100, 'mushroom').setCollideWorldBounds(true);
    const unit2 = this.physics.add.sprite(50, 150, 'mushroom').setCollideWorldBounds(true);
    const unit3 = this.physics.add.sprite(50, 200, 'mushroom').setCollideWorldBounds(true);

    let dragbox = this.add.graphics();
    let drawDragbox = false;

    this.add.rectangle(399, 299, 50, 50, 0xff00ff);

    this.input.on('pointerdown', function(pointer: Phaser.Input.Pointer) {
      drawDragbox = true;
    });

    this.input.on('pointermove', function(pointer: Phaser.Input.Pointer) {
      if (drawDragbox) {
        dragbox.clear();
        dragbox.lineStyle(2, 0x00ff00, 1);
        dragbox.strokeRect(pointer.downX, pointer.downY, pointer.x - pointer.downX, pointer.y - pointer.downY);
      }
    });

    this.input.on('pointerup', function(pointer: Phaser.Input.Pointer) {
      drawDragbox = false;
      dragbox.clear();
    });

    // this.add.image(400, 300, 'sky');

    // const particles = this.add.particles('red');
  
    // const emitter = particles.createEmitter({
    //   speed: 100,
    //   scale: { start: 1, end: 0 },
    //   blendMode: 'ADD'
    // });
  
    // const logo = this.physics.add.image(400, 100, 'logo');
  
    // logo.setVelocity(100, 200);
    // logo.setBounce(1, 1);
    // logo.setCollideWorldBounds(true);
  
    // emitter.startFollow(logo);
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

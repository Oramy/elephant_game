
import { MainScene } from "./mainScene";
import { Menu } from "./menu";
import { GameOverScene } from "./gameOverScene";
import { PauseScene } from "./pauseScene";

export class Preloader extends Phaser.Scene{
    constructor ()
    {
        super('Preloader');
    }
    resize() {
    var canvas = this.sys.canvas, width = window.innerWidth, height = window.innerHeight;
    var wratio = width / height, ratio = canvas.width / canvas.height;

    if (wratio < ratio) {
        canvas.style.width = width + "px";
        canvas.style.height = (width / ratio) + "px";
    } else {
        canvas.style.width = (height * ratio) + "px";
        canvas.style.height = height + "px";
    }
}


    create () {
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    }
    preload ()
    {
        // @ts-ignore
        this.facebook.once('startgame', this.startGame, this);
        // @ts-ignore
        this.facebook.showLoadProgress(this);
        this.load.bitmapFont('jungle', 'assets/font/jungle_0.png', 'assets/font/jungle.xml');
        this.load.image('sky', 'assets/background/background.png');

        this.load.atlasXML('round', 'assets/atlas/round.png', 'assets/atlas/round.xml');
        this.load.atlasXML('roundOutline', 'assets/atlas/roundOutline.png', 'assets/atlas/roundOutline.xml');
        this.load.atlasXML('square', 'assets/atlas/square.png', 'assets/atlas/square.xml');
        this.load.atlasXML('squareOutline', 'assets/atlas/square.png', 'assets/atlas/square.xml');
        this.load.atlasXML('squareSilhouette', 'assets/atlas/squareSilhouette.png', 'assets/atlas/squareSilhouette.xml');
        this.load.atlasXML('square_nodetailsOutline', 'assets/atlas/square_nodetailsOutline.png', 'assets/atlas/square_nodetailsOutline.xml');
        this.load.atlasXML('icons', 'assets/atlas/sheet_black1x.png', 'assets/atlas/sheet_black1x.xml');
        this.load.atlasXML('topdownsprites', 'assets/atlas/allSprites_default.png', 'assets/atlas/allSprites_default.xml');
        this.load.atlasXML('spritesheet_other', 'assets/atlas/spritesheet_other.png', 'assets/atlas/spritesheet_other.xml');

        this.load.image('fire1', 'assets/particles/fire1.png');
        this.load.image('yellow', 'assets/particles/yellow.png');
        this.load.image('blue', 'assets/particles/blue.png');
        this.load.image('animalCoins', 'assets/ui/animalCoins.png');

    }

    startGame ()
    {
        this.scene.start('Menu');
    }

}


import { MainScene } from "./mainScene";
import { Menu } from "./menu";
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
        window.addEventListener('resize', this.resize);
        this.resize();
    }
    preload ()
    {
        // @ts-ignore
        this.facebook.once('startgame', this.startGame, this);
        // @ts-ignore
        this.facebook.showLoadProgress(this);
        this.load.bitmapFont('jungle', 'assets/font/jungle_0.png', 'assets/font/jungle.xml');
        this.load.bitmapFont('ice', 'assets/font/iceicebaby.png', 'assets/font/iceicebaby.xml');
        this.load.image('sky', 'assets/background/background.png');
        this.load.image('mask', 'assets/ui/mask1.png');
        this.load.atlasXML('round', 'assets/atlas/round.png', 'assets/atlas/round.xml');
        this.load.atlasXML('roundOutline', 'assets/atlas/roundOutline.png', 'assets/atlas/roundOutline.xml');
        this.load.atlasXML('square', 'assets/atlas/square.png', 'assets/atlas/square.xml');
        this.load.atlasXML('square_nodetailsOutline', 'assets/atlas/square_nodetailsOutline.png', 'assets/atlas/square_nodetailsOutline.xml');
        this.load.atlasXML('icons', 'assets/atlas/sheet_black1x.png', 'assets/atlas/sheet_black1x.xml');
        this.load.atlasXML('topdownsprites', 'assets/atlas/allSprites_default.png', 'assets/atlas/allSprites_default.xml');

        this.load.image('fire1', 'assets/particles/fire1.png');
        this.load.image('yellow', 'assets/particles/yellow.png');

    }

    startGame ()
    {
        this.scene.start('Menu');
    }

}
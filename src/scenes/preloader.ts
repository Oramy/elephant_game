
import { MainScene } from "./mainScene";
import { Menu } from "./menu";
export class Preloader extends Phaser.Scene{
    constructor ()
    {
        super('Preloader');
    }
    create(){


    }
    preload ()
    {
        // @ts-ignore
        this.facebook.once('startgame', this.startGame, this);
        // @ts-ignore
        this.facebook.showLoadProgress(this);
        this.load.bitmapFont('jungle', 'assets/font/jungle_0.png', 'assets/font/jungle.xml');
        this.load.bitmapFont('ice', 'assets/font/iceicebaby.png', 'assets/font/iceicebaby.xml');
        this.load.image('sky', 'assets/skies/space3.png');
        this.load.image('mask', 'assets/ui/mask1.png');
        this.load.atlasXML('round', 'assets/atlas/round.png', 'assets/atlas/round.xml');
        this.load.atlasXML('square', 'assets/atlas/square.png', 'assets/atlas/square.xml');
        this.load.atlasXML('square_nodetailsOutline', 'assets/atlas/square_nodetailsOutline.png', 'assets/atlas/square_nodetailsOutline.xml');
    }

    startGame ()
    {
        this.scene.start('Menu');
    }

}
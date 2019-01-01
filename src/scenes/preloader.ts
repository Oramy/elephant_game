
import { MainScene } from "./mainScene";
import { Menu } from "./menu";
export class Preloader extends Phaser.Scene{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        // @ts-ignore
        this.facebook.once('startgame', this.startGame, this);
        // @ts-ignore
        this.facebook.showLoadProgress(this);
        this.load.image('sky', 'assets/skies/space3.png');
        this.load.image('mask', 'assets/ui/mask1.png');
        this.load.atlasXML('round', 'assets/atlas/round.png', 'assets/atlas/round.xml');
        this.load.atlasXML('square', 'assets/atlas/square.png', 'assets/atlas/square.xml');
    }

    startGame ()
    {
        this.scene.start('Menu');
    }

}
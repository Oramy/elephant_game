
import { MainScene } from "./mainScene";
import { Menu } from "./menu";
import { GameOverScene } from "./gameOverScene";
import { PauseScene } from "./pauseScene";

export class Preloader extends Phaser.Scene{
    constructor () {
        super('Preloader');
	}

    resize() {
    	let canvas = this.sys.canvas, width = window.innerWidth, height = window.innerHeight;
    	let wratio = width / height, ratio = canvas.width / canvas.height;

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

		// @ts-ignore
	 	this.i18n.initialize(
    		{
      			fallbackLng: 'fr',
      			loadPath: 'assets/i18n/{{lng}}/{{ns}}.json',
   		   		debug: false,
    		},
    		function () {
      			console.log('I18nPlugin initialized!')
    		},
  		)
	}

    preload () {
        // @ts-ignore
        this.facebook.once('startgame', this.startGame, this);
        // @ts-ignore
        this.facebook.showLoadProgress(this);
        this.load.bitmapFont('jungle', 'assets/font/jungle_0.png', 'assets/font/jungle.xml');
        this.load.image('sky', 'assets/background/background.png');

        this.load.atlasXML('round', 'assets/atlas/round.png', 'assets/atlas/round.xml');
        this.load.atlas('roundQuarter', 'assets/atlas/roundQuarter.png', 'assets/atlas/roundQuarter.json');

        this.load.atlasXML('roundOutline', 'assets/atlas/roundOutline.png', 'assets/atlas/roundOutline.xml');
        this.load.atlasXML('square', 'assets/atlas/square.png', 'assets/atlas/square.xml');
        this.load.atlasXML('squareOutline', 'assets/atlas/square.png', 'assets/atlas/square.xml');
        this.load.atlasXML('squareSilhouette', 'assets/atlas/squareSilhouette.png', 'assets/atlas/squareSilhouette.xml');
        this.load.atlasXML('square_nodetailsOutline', 'assets/atlas/square_nodetailsOutline.png', 'assets/atlas/square_nodetailsOutline.xml');
        this.load.atlasXML('topdownsprites', 'assets/atlas/allSprites_default.png', 'assets/atlas/allSprites_default.xml');
        this.load.atlasXML('icons', 'assets/atlas/sheet_black1x.png', 'assets/atlas/sheet_black1x.xml');
        this.load.atlasXML('iconsw', 'assets/atlas/sheet_white1x.png', 'assets/atlas/sheet_white1x.xml');
        this.load.atlasXML('spritesheet_other', 'assets/atlas/spritesheet_other.png', 'assets/atlas/spritesheet_other.xml');

        this.load.image('fire1', 'assets/particles/fire1.png');
        this.load.image('yellow', 'assets/particles/yellow.png');
        this.load.image('blue', 'assets/particles/blue.png');
        this.load.image('animalCoins', 'assets/ui/animalCoins.png');

        this.load.image('logo', 'assets/ui/fake_logo_final_v4.png');

        this.load.image('menuBackground', 'assets/background/backgroundPastelPlus.png');

        this.load.audio('bass', ['assets/audio/tech/bass.ogg', 'assets/audio/tech/bass.mp3']);
        this.load.audio('drums', ['assets/audio/tech/drums.ogg', 'assets/audio/tech/drums.mp3']);
        this.load.audio('percussion', ['assets/audio/tech/percussion.ogg', 'assets/audio/tech/percussion.mp3']);
        this.load.audio('synth1', ['assets/audio/tech/synth1.ogg', 'assets/audio/tech/synth1.mp3']);
        this.load.audio('synth2', ['assets/audio/tech/synth2.ogg', 'assets/audio/tech/synth2.mp3']);
        this.load.audio('top1', ['assets/audio/tech/top1.ogg', 'assets/audio/tech/top1.mp3']);
        this.load.audio('top2', ['assets/audio/tech/top2.ogg', 'assets/audio/tech/top2.mp3']);
        this.load.audio('pickCoin', 'assets/audio/399196__spiceprogram__perc-bip.wav');
        this.load.audio('unlockSound', 'assets/audio/270304__littlerobotsoundfactory__collect-point-00.wav');
        this.load.audio('clickSound', 'assets/audio/425187__mabdurrahman__calculatorclick.wav')
        this.load.audio('buySound', 'assets/audio/201159__kiddpark__cash-register.wav')
        this.load.audio('pickAnimal', 'assets/audio/328117__greenvwbeetle__pop-8.wav')
    }

    startGame () {
        this.scene.start('Menu');
    }
}

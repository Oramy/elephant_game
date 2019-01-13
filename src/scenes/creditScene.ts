import { MainScene } from "./mainScene";

import BitmapText = Phaser.GameObjects.BitmapText;

var SC;
export class CreditScene extends Phaser.Scene{
    private width: number;
    private height: number;
    private camera: Phaser.Cameras.Scene2D.Camera;

    private touchToResume: BitmapText;
	private speed;
    private text="Game Design, Level Design, Programmation\n\n" +
		"Amaury Absolu Butaux\n" +
		"\n\n\n" +
		"Stagiaire Programmation\n\n" +
		"Johyn Enigm'Absolu Papin\n" +
		"\n\n\n" +
		"Assistance Game Design\n\n" +
		"Aloïs Butaux\n" +
		"Felix Szczesny\n" +
		"\n\n" +
		"Concept initial\n\n" +
		"Amaury Absolu Butaux\n" +
		"Johyn Enigm'Absolu Papin\n" +
		"Margot Absolu Tinturier\n" +
		"Mathieu Absolu Huet\n" +
		"\n" +
		"\n" +
		"Test\n" +
		"\n" +
		"Alex Enigm'Absolu Bouez\n" +
		"Alix Absolu Bruckert\n" +
		"Alix Enigm'Absolu Cotelle\n" +
		"Aloïs Butaux\n" +
		"Claire Absolu Bonnel\n" +
		"Fabien Absolu Guiziou\n" +
		"Fabien Absolu Pourre\n" +
		"Felix Szczesny\n" +
		"Geoffroy Absolu Oudoumanessah\n" +
		"Hugo Absolu Beg\n" +
		"Jacopo Absolu Iollo\n" +
		"Johyn Enigm'Absolu Papin\n" +
		"Léa Absolu Angles\n" +
		"Léo Absolu Bécourt\n" +
		"Luca Absolu Rosales\n" +
		"Lucie Absolu Uffoltz\n" +
		"Margot Absolu Tinturier\n" +
		"Mathieu Absolu Huet\n" +
		"Mathieu Enigm'Absolu David\n" +
		"Meven Absolu Kerzreho\n" +
		"Michael Absolu Descombes\n" +
		"Olivier Ars'n Absolu Checchin\n" +
		"Pierre Absolu Pereira\n" +
		"Rémi Absolu Imbert\n" +
		"Roman Absolu Bredehoft\n" +
		"Tanguy Absolu Michardière\n" +
		"Titouan Absolu Jouffray\n" +
		"Valentin Absolu Debon\n" +
		"Valérian Absolu Thomas\n" +
		"Victor Absolu Saunier\n" +
		"Xavier Absolu Bouclé\n" +
		"\n" +
		"Graphismes\n" +
		"\n" +
		"Kenney\n" +
		"kenney.nl\n" +
		"\n" +
		"Bonsaiheldin\n" +
		"bonsaiheld.org\n" +
		"\n" +
		"LittleRobotSoundFactory\n" +
		"License; creativecommons.org/licenses/by/3.0/\n" +
		"\n" +
        "Crowns designed by Good Ware from Flaticon" +
        "\n" +
		"\n" +
		"Absolue Monarchliste.";
	private logo: Phaser.GameObjects.Image;
	private finished: boolean;
	constructor() {
		super({
			key: "CreditScene"
		});
	}
	addCenteredText(y: number, text:string) : void{
		// @ts-ignore
        this.add._bitmapText(this.width/2, y, 'jungle', text, 50*SC).setOrigin(0.5, 0.5);
	}
	create () {
		this.height = this.sys.canvas.height;
        this.width = this.sys.canvas.width;
        SC = this.height / 1920;
        this.camera = this.cameras.main;

		this.camera.setBackgroundColor('rgba(0, 0, 0, 0.8)');

		var i = 0;
		this.text.split(/\r?\n/).forEach(function(line){
		    console.log(line)
			this.addCenteredText(this.height + i * 50 * SC, line);
			i += 1;
		}, this);

		this.logo = this.add.image(this.width/2, this.height + this.height / 2 + i * 50 * SC, 'logo');
		this.logo.setScale(3*SC);
		this.speed = 3;

		this.input.on('pointerdown', function(){
			if(!this.finished)
				this.speed = 12;
		}, this);
		this.input.on('pointerup', function(){
			if(!this.finished)
				this.speed = 3;
		}, this);
		this.finished = false;
	}
	resumeGame(){
		this.scene.resume('Menu');
		this.scene.stop('CreditScene');
	}
	update(time, delta){

		this.camera.scrollY += this.speed * SC;

		if(this.camera.scrollY > this.logo.y - this.height / 2){
			this.camera.scrollY = this.logo.y - this.height / 2;
			this.speed = 0;
			if(!this.finished) {
				this.input.on('pointerdown', this.resumeGame, this);
				this.finished = true;
			}
		}
	}
}

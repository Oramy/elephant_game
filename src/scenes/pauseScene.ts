import { MainScene } from "./mainScene";

import BitmapText = Phaser.GameObjects.BitmapText;

export class PauseScene extends Phaser.Scene{
    private width: number;
    private height: number;
    private camera: Phaser.Cameras.Scene2D.Camera;

    private touchToResume: BitmapText;

	constructor() {
		super({
			key: "PauseScene"
		});
	}

	resume () {
		this.scene.resume('MainScene')
		this.scene.stop('PauseScene')
	}
	
	create () {
		this.height = this.sys.canvas.height;
        this.width = this.sys.canvas.width;
        var SC = this.height / 1920;
        this.camera = this.cameras.main;

		this.camera.setBackgroundColor('rgba(0, 0, 0, 0.6)')

		this.touchToResume = this.add.bitmapText(0, 0, "jungle", "Touch anywhere to resume." , 40*SC);
		
		var title = this.add.bitmapText(0, 100, "jungle", "PAUSE", 120*SC);
        var screenZone = this.add.zone(this.width / 2, this.height / 2, this.width, this.height);
        var topZone = this.add.zone(this.width / 2, 200*SC, this.width, this.height / 2);
		
		Phaser.Display.Align.In.Center(this.touchToResume, screenZone);
        Phaser.Display.Align.In.Center(title, topZone);

		this.input.on('pointerdown', this.resume, this);
	}
}

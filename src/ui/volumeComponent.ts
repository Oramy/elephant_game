import Scene = Phaser.Scene
import Image = Phaser.GameObjects.Image

export class VolumeComponent {
	private scene: Scene

	private muteImage: Image
	private unmuteImage: Image

	constructor(scene) {
		this.scene = scene
		let SC = this.scene.sys.canvas.height / 1920

		this.muteImage = this.scene.add.image(0 * SC, 0 * SC, 'iconsw', 'musicOff.png').setOrigin(0,0).setInteractive() as Image
		this.unmuteImage = this.scene.add.image(0 * SC, 0 * SC, 'iconsw', 'musicOn.png').setOrigin(0,0).setInteractive() as Image
		this.muteImage.setDepth(Infinity).setScale(2 * SC)
		this.unmuteImage.setDepth(Infinity).setScale(2 * SC)

        this.update()

		this.scene.input.on('gameobjectdown', (pointer, gameObject) => {
			switch (gameObject) {
				case this.unmuteImage:
				case this.muteImage:
					// @ts-ignore
					if (!!this.scene.facebook.data.values.mute) {
						// @ts-ignore
						this.scene.facebook.data.values.mute = false
						this.scene.game.sound.mute = false
					} else {
						// @ts-ignore
						this.scene.facebook.data.values.mute = true
						this.scene.game.sound.mute = true
                    }

                    this.update()
					break
			}
		})
    }

    update() {
		// @ts-ignore
		if (this.scene.facebook.data && !!this.scene.facebook.data.values.mute) {
            this.muteImage.setVisible(true)
			this.unmuteImage.setVisible(false)
        } else {
			this.muteImage.setVisible(false)
			this.unmuteImage.setVisible(true)
		}
    }
}

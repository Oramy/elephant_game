import { MainScene } from './mainScene'
import { Menu } from './menu'
import { VolumeComponent } from '../ui/volumeComponent'

import BitmapText = Phaser.GameObjects.BitmapText
import Image = Phaser.GameObjects.Image
import Container = Phaser.GameObjects.Container

export class PauseScene extends Phaser.Scene {
  private width: number
  private height: number
  private camera: Phaser.Cameras.Scene2D.Camera

  private mainMenuImage: Image
  private resumeImage: Image
  private restartImage: Image

  private buttonsContainer: Container

  private playerData: any

  constructor () {
    super({
      key: "PauseScene"
    })
  }

  resume () {
    this.scene.resume('MainScene')
    this.scene.stop('PauseScene')
  }

  create () {
    let SC = this.sys.canvas.height / 1920

    this.height = this.sys.canvas.height
    this.width = this.sys.canvas.width
    this.camera = this.cameras.main

    this.camera.setBackgroundColor('rgba(0, 0, 0, 0.6)')

    this.mainMenuImage = this.add.image(0, 0, "iconsw", "home.png").setScale(3 * SC, 3 * SC).setInteractive() as Image
    this.resumeImage = this.add.image(0, 0, "iconsw", "next.png").setScale(4 * SC, 4 * SC).setInteractive() as Image
    this.restartImage = this.add.image(0, 0, "iconsw", "return.png").setScale(3 * SC, 3 * SC).setInteractive() as Image

    Phaser.Display.Align.To.LeftCenter(this.mainMenuImage, this.resumeImage, 75)
    Phaser.Display.Align.To.RightCenter(this.restartImage, this.resumeImage, 75)

    this.buttonsContainer = this.add.container(0, 0, this.mainMenuImage)
    this.buttonsContainer.add(this.resumeImage)
    this.buttonsContainer.add(this.restartImage)

    // @ts-ignore
    let title = this.add._bitmapText(0, 100, "jungle", "PAUSE", 120*SC)
    let screenZone = this.add.zone(this.width / 2, this.height / 2, this.width, this.height)
    let topZone = this.add.zone(this.width / 2, 200*SC, this.width, this.height / 2)

    Phaser.Display.Align.In.Center(this.buttonsContainer, screenZone)
        Phaser.Display.Align.In.Center(title, topZone)

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      switch (gameObject) {
        case this.mainMenuImage:
          this.scene.stop('MainScene')
          this.scene.start('Menu')
          break
        case this.resumeImage:
          this.resume()
          break
        case this.restartImage:
          this.scene.start('MainScene')
          // @ts-ignore
          this.scene.get('MainScene').setPlayerData(this.playerData)
          break
      }
    })
  }

  setPlayerData(playerData: any) {
    this.playerData = playerData

    new VolumeComponent(this)
  }
}

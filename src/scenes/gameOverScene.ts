
import {ANIMAL_SCALE, MainScene, ROUND_Y_OFFSETS} from "./mainScene"
import { Menu } from "./menu"
import GameObject = Phaser.GameObjects.GameObject
import Image = Phaser.GameObjects.Image
import TweenBuilder = Phaser.Tweens.Builders.TweenBuilder
import NumberTweenBuilder = Phaser.Tweens.Builders.NumberTweenBuilder
import {CoinsComponent} from '../ui/coinsComponent'

let SC

let notused = []
let notused_offsets = []

export class GameOverScene extends Phaser.Scene{
    private width: number
    private height: number
    private camera: Phaser.Cameras.Scene2D.Camera
    private leftWall: Phaser.Physics.Matter.Sprite
    private rightWall: Phaser.Physics.Matter.Sprite
    private bottomWall: Phaser.Physics.Matter.Sprite
    private roundFrames: string[]
    private scoreCenter: boolean
    private character: string

    private unlockList : string[]
    private unlocked: string[]
    private returnToMenu: Phaser.GameObjects.BitmapText
    private score: number
    private gainedAnimals: number
    private playerData: any
    private oldAnimalCount: any
    private coinsComponent: CoinsComponent

    private characterFrames: string[]
    private characterNames: string[]

    private clickSound: Phaser.Sound.BaseSound

    constructor ()
    {
        super({
            key: "GameOverScene",
            physics: {
                default: 'matter',
                matter: {
                    gravity: {y: 5},
                    debug: false,
                    enableSleeping: false
                }
            }
        })
        
    }
    shuffle(array) {
        let currentIndex = array.length, temporaryValue, randomIndex

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex -= 1

            // And swap it with the current element.
            temporaryValue = array[currentIndex]
            array[currentIndex] = array[randomIndex]
            array[randomIndex] = temporaryValue
        }

        return array
    }

    spawnAnimal(x = 0,y = 0, scale = 1): GameObject {
        let gold = Phaser.Math.FloatBetween(0, 1) < 1/20

        if(notused.length == 0){
            notused = notused.concat(this.roundFrames)
            notused_offsets = ROUND_Y_OFFSETS
		}

        let i = Phaser.Math.Between(0, notused.length - 1)
        let key = gold ? 'roundOutline': 'round'

        let frame = notused[i]
        let animal = this.matter.add.image(x,y, key, frame, {
            shape: {
                type: 'circle',
                radius: 64
            },
            render: {sprite: {xOffset: 0, yOffset: notused_offsets[i]}},
            label: 'animal',

		})
        animal.setBounce(0.5)
		
		notused = notused.filter(function (el,j) {
            return i!=j
        })
        notused_offsets = notused_offsets.filter(function (el, j) {
            return i!=j
        })
		
		animal.setScale(ANIMAL_SCALE * scale / 4 * SC)
        animal.body.allowRotation = false
        // @ts-ignore
        animal.gold = gold
		
		if (gold) {
            animal.tint = 0xDAA520

        }
		
		return animal
	}

    spawnAnimalRel (u = 0, v = 0, offsetX = 0, offsetY = 0){
        this.spawnAnimal(u * this.width + offsetX, v * this.height + offsetY)
	}

    /***
     * Spawns count animals in rectangle of coordinates (x,y,x2,y2).
     * @param x
     * @param y
     * @param x2
     * @param y2
     * @param count
     */
    spawnAnimals( x, y, x2, y2, count): void{
        let scale = 1
        if(count == 0)
            return
        if(count % 20 < 5){
            count = count - count % 20 + Phaser.Math.Between(5, 19)
        }
        while(count != 0){
            while(count % 20 == 0){
                count = Math.round(count/20)
                scale *= 2
                if(count % 20 < 5 && count > 20){
                    count = count - count % 20 + Phaser.Math.Between(5, 19)
                }
            }
            let animalX = Phaser.Math.Between(x, x2)
            let animalY = Phaser.Math.Between(y, y2)
            this.spawnAnimal(animalX, animalY, scale)
            count -= 1

        }
    }

    createSideWalls(): void{
        this.leftWall = this.matter.add.sprite(-this.width * 1, this.height/2, 'round', 'elephant.png', { isStatic: true})
        this.leftWall.setDisplaySize(this.width * 0.5, this.height)
        this.leftWall.setVisible(false)

        this.rightWall = this.matter.add.sprite(this.width * 2,this.height/2, 'round', 'elephant.png', { isStatic: true})
        this.rightWall.setDisplaySize(this.width * 0.5, this.height)
        this.rightWall.setVisible(false)

        this.bottomWall = this.matter.add.sprite(this.width * 0.5,this.height * 1.25, 'round', 'elephant.png', { isStatic: true})
        this.bottomWall.setDisplaySize(this.width, this.height * 0.5)
        this.bottomWall.setVisible(false)

    }
	
	initStats(score, unlockedList, unlocked,  character, oldAnimalCount, gainedAnimals, playerData){
        this.score = score
        this.unlockList = unlockedList
        this.character = character
        this.gainedAnimals = gainedAnimals
        this.oldAnimalCount = oldAnimalCount
        this.playerData = playerData
        this.unlocked = unlocked

        this.unlockList = this.unlockList.filter((function(character){
            return !this.unlocked.includes(character)
        }).bind(this))


    }
	
	create () {
        let unlockSound = this.sound.add('unlockSound');
        this.clickSound = this.sound.add('clickSound')

        this.shuffle(this.unlocked)
        this.shuffle(this.unlockList)

        this.camera = this.cameras.main
        this.camera.setBackgroundColor('#5a756f')

        this.width = this.sys.canvas.width
        this.height = this.sys.canvas.height
        SC = this.height / 1920

        let background = this.add.image(this.width / 2, this.height / 2, 'menuBackground')
        background.setScale(SC)

        let atlasTexture = this.textures.get('round')
        this.roundFrames = atlasTexture.getFrameNames()
        
        this.createSideWalls()
        this.spawnAnimals(0, 0, this.width, -this.height * 2, this.gainedAnimals*3)
        background = this.add.image(this.width * 0.5,this.height * 0.70, 'squareSilhouette', "gorilla.png")
        background.setScale(5)
        background.tint = 0xFF0000
        background.setAlpha(0.8)

        this.returnToMenu = this.add.bitmapText(this.width * 0.15, this.height * 0.9, 'jungle', 'gotomenu', 50 * SC)
        this.returnToMenu.setAlpha(0)
        this.returnToMenu.setInteractive()
        this.input.on("gameobjectdown",  this.goToMenu.bind(this))

        this.scoreCenter = true

		// @ts-ignore
        let scoreText = this.add._bitmapText(this.width * 0.5, this.height * 0.25, 'jungle', 'Score: ' + this.score, 150 * SC)
		scoreText._setText('Score: ' + this.score)
		scoreText.setOrigin(0.5, 0.5)
		scoreText.setScale(0)

        let disableScoreCenter = (function() {
            this.scoreCenter = false
        }).bind(this)

        this.coinsComponent = new CoinsComponent(this, this.oldAnimalCount)
        this.coinsComponent.create(SC)

        let timeline2 = this.tweens.createTimeline({})
        let timeline = this.tweens.createTimeline({})
        let coinsTimeline = this.coinsComponent.smoothChangeScore(this.gainedAnimals, 0.1, timeline)

        let onComplete = function() {
            coinsTimeline.play()
		}

        timeline2.add({
            targets: scoreText,
            scaleX: 1,
            scaleY: 1,
            ease: 'Bounce.easeOut',
            duration: 500,
            yoyo: false,
            repeat: 0,
            delay: 2000,
            onComplete: onComplete
        })

        let touchToPlay = this.add.bitmapText(this.width * 0.5, this.height * 0.5, 'jungle', 'touchtoplay',  50 * SC).setOrigin(0.5,0.5)
        touchToPlay.setAlpha(0)

        let list
        if (this.unlockList.length == 0){
            list = this.unlocked.filter((function(el){
                return el != this.character
            }).bind(this)).slice(0, Math.min(this.unlocked.length, 2))
            list.push(this.character)
		} else {
            list =  this.unlockList.slice(0, Math.min(this.unlockList.length, 2))
            if(list.length < 2){
                list = list.concat(this.unlocked.filter((function(el){
                    return el != this.character
                }).bind(this)).slice(0, Math.min(this.unlocked.length, 1-list.length)))
            }
            list.push(this.character)
		}

        if (this.unlockList.length != 0) {
            let charactersUnlockedText = this.add.bitmapText(this.width / 2, this.height * 0.13, 'jungle', (this.unlockList.length > 1 ? 'unlocked_plural' : 'unlocked'), 90 * SC).setOrigin(0.5, 0.5)
            charactersUnlockedText.tint = 0xFF5757
            charactersUnlockedText.angle = 0
            charactersUnlockedText.setScale(100)
			charactersUnlockedText.setAlpha(0)

            timeline.add({
                targets: charactersUnlockedText,
                scaleX: 1,
                scaleY: 1,
                alpha: 0.8,
                ease: 'Bounce.easeOut',
                duration: 500,
                yoyo: false,
                repeat: 0,
                delay: 0,
                onStart: function(){
                    unlockSound.play()
                }
            })
		    }

        list.forEach((function (character, i){
            let characterImg
			if (list.length % 2 == 0 || i < list.length - 1) {
               characterImg = this.add.image(this.width * 0.35 + this.width * 0.3 * (i%2), this.height * 0.65 + this.height * 0.15 * (i-i%2)/2,
                    'square_nodetailsOutline', character + '.png')
			} else {
                characterImg = this.add.image(this.width * 0.35 + this.width * 0.3 * 0.5, this.height * 0.65 + this.height * 0.15 * (i-i%2)/2,
                    'square_nodetailsOutline', character + '.png')
			}

            characterImg.setScale(0)
		
			timeline.add({
                targets: characterImg,
                scaleX: 1,
                scaleY: 1,
                ease: 'Bounce.easeOut',
                duration: 200,
                yoyo: false,
                repeat: 0,
                delay: i == 0 ? 500 : 100,
                onComplete: (function(){
                    if(this.unlockList.includes(character)){
                        this.addParticleOnAnimal(characterImg, 'square', +".png")
                    }
                }).bind(this)
            })
			
			characterImg.setInteractive()
			
			this.input.on('gameobjectdown', (function(event, gameobject){
               if(gameobject === characterImg){
                   this.startGame(character)
                   this.clickSound.play()
               }
            }).bind(this))
        }).bind(this))
	   
		let addBlinkingTween = (function(){
            this.tweens.add({
                targets: touchToPlay,
                alpha: 1,
                ease: 'Quad.easeIn',
                duration: 1000,
                yoyo: true,
                repeat: Infinity,
                hold: 400})

		}).bind(this)

        timeline.add({
            targets: [this.returnToMenu],
            alpha: 1,
            ease: 'Expo.easeIn',
            duration: 500,
            yoyo: false,
            repeat: 0,
            delay: 100,
            onComplete: addBlinkingTween
        })
	
		timeline2.play()
	}

    addParticleOnAnimal(animal, key, frame) {
        let logoSource = {
            getRandomPoint: (function (vec) {
                    let x = Phaser.Math.Between(0, animal.width)
                    let y = Phaser.Math.Between(0, animal.height)
                    let pixel =  this.textures.getPixel(x, y, key, frame)

                    return vec.setTo(x + animal.getTopLeft().x, y + animal.getTopLeft().y)

            }).bind(this)
        }
		
		let particles = this.add.particles('blue')
        particles.createEmitter({
            x: 0,
            y: 0,
            lifespan: 1000,
            gravityY: 0,
            scale: { start: 0, end: 0.25, ease: 'Quad.easeOut' },
            alpha: { start: 1, end: 0, ease: 'Quad.easeIn' },
            blendMode: 'ADD',
            emitZone: { type: 'random', source: logoSource }
        })
    }
	
	update() {
        /*if(this.scoreCenter){
            Phaser.Display.Align.In.RightCenter(this.newCoinsText, this.animalCoinsText)

            this.newCoinsText.setY(this.height * 0.10)
        }*/
        this.coinsComponent.update()

	}

    startGame(character) {
        this.scene.start('MainScene')
        // @ts-ignore
        this.scene.get('MainScene').updateCharacter(character)
    }

    goToMenu (event, gameObject) {
		if(gameObject === this.returnToMenu) {
            this.scene.start('Menu')
        this.clickSound.play()
		}
	}
}

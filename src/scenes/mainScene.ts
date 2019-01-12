/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 Digitsensitive
 * @license      Digitsensitive
 */
import Body = MatterJS.Body;
import MatterPhysics = Phaser.Physics.Matter.MatterPhysics;
import GameObject = Phaser.GameObjects.GameObject;
import Image = Phaser.Physics.Matter.Image;
import Sprite = Phaser.Physics.Matter.Sprite;
import Composite = MatterJS.Composite;
import combined = Phaser.Cameras.Sprite3D.combined;
import { Menu } from "./menu";
import { PauseScene } from "./pauseScene";
import "../prefabs/prefabs.ts";
import {Prefabs} from "../prefabs/prefabs";
import ScaleModes = Phaser.ScaleModes;
import Color = Phaser.Display.Color;
import {EASY_OBSTACLE_MAX_ID} from "../prefabs/prefabs";
import Tween = Phaser.Tweens.Tween;
import getTintAppendFloatAlpha = Phaser.Renderer.WebGL.Utils.getTintAppendFloatAlpha;
import Group = Phaser.GameObjects.Group;
import {Animal} from "../gameobjects/animal";

function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele !== value;
    });

}
export const ELEPHANT_SCALE = 2;
export const ANIMAL_SCALE = 3;
//1 = NO DELAY
export const MOVE_DELAY_COEFF = 0.1;
export const DIRECTION_UPDATE_DIST_SQ = 3 ** 2;
export const ANIMAL_BASE_SPEED = 280;
export const ANIMAL_SPEED_XY_RATIO = 1/20;
export const CAMERA_BASE_SPEED = -15; // -15;
export const CAMERA_BEGIN_SPEED = -5;
export const ANIMAL_ACC = 6;
export const CAMERA_ACC = -2; // -0;
export const ANIMALS_SPAWN = 5;
export const SCORE_MULTIPLIER = 1.148698355; // 2 ^ (1/5)
export const BASE_SCORE = 10;

//For each frame, yOffset in percent, for the collision mesh and the image to fit together.
export const ROUND_Y_OFFSETS = [0, -0.02,0, 0.05, 0, 0, 0.1, 0, -0.08, 0.05, 0.1, 0, 0, 0, 0.05,
    0, 0.1, 0.07, 0, 0, 0, 0, 0, 0.14, 0, 0, -0.04, -0.03, 0.08, 0.05];

export var SC;

export class MainScene extends Phaser.Scene {
    private elephant: Sprite;
    private elephantDirection: Phaser.Math.Vector2;
    //Last recorded position of the Elephant. This is used to orientate the elephant without shaking.
    private lastPosition: number[];


    private camera: Phaser.Cameras.Scene2D.Camera;

    private followingAnimals: Array<Image>;
    private liveShelters: Array<Image>;


    character: string;
    //List of atlas 'round' frame names.
    roundFrames: string[];

    //Counting how many times we spawned animals.
    private spawnCount: number;

    //Objects that must stay inside screen space.
    private insideScreenObjects: Array<GameObject>;
    private insideAnimals : Array<Animal>;

    //Collision categories.
    obstacleCat: number;
    elephantCat: number;


    private background;

    private cameraSpeed: number;
    private animalSpeed: number;
    private acquiredScore: number;
    private scoreText: Phaser.GameObjects.BitmapText;


    private highscores: any;
    private friends : any;

    private gameOverB : any;
    private height: number;
    private width: number;

    private prefabs: Prefabs;
    private multiplierText: Phaser.GameObjects.BitmapText;
    private tween: Phaser.Tweens.Tween;
    private multiplier: number;
    private multiplierTween: Phaser.Tweens.Tween;

    private unlockList= [];

    private leftWall: Sprite;
    private rightWall: Sprite;

    private playerData: any;
    private savedAnimals: number;
    private deadInLava: number;

    private characterNames: string[];
    private characterFrames: string[];

    private lava: any;
    private lavaMoveType: integer;
    private lavaNextBeginTime: integer;
    private lavaNextEndTime: integer;
    private lavaBottom: Phaser.GameObjects.TileSprite;

    private disableControl: boolean;
    private lastUpdateTime: number;
    private pauseTime: number;
    private justResumed: boolean;
    private lastTime: number;
    private started: boolean;

    private touchToPlay: Phaser.GameObjects.BitmapText[];
    private touchToPlayTweens: Tween[];
    private maxFollowingAnimals: number;
    private rewardTweens: Tween[];
    private highscored: boolean;
    private bestDistanced: boolean;
    
    private lastMeterMark: number;
    
    private animals: Group;
    private fps: Phaser.GameObjects.BitmapText;
	
	constructor() {
        super({
            key: 'MainScene',
            physics: {
                default: 'matter',
                matter: {
                    gravity: {y: 0},
                    debug: false,
                    enableSleeping: false,
                    autoUpdate: false

                }
            }
        })
    }

    updateCharacter(character: string) {
        this.character = character
    }

    loadLeaderboards(): void{
        // @ts-ignore
        this.facebook.once('getleaderboard', (function (leaderboard) {
            if (leaderboard.name == 'Highscores') {
                this.highscores = leaderboard;
            } else if (leaderboard.name == 'Amis.' + this.facebook.contextID){
                console.log("friends!!")
                this.friends = leaderboard;
            }
        }).bind(this), this);

        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        this.facebook.getPlayers();
        // @ts-ignore
        this.facebook.once('players', (function(event, data){
            this.facebook.createContext(data.playerID);
        }).bind(this));
        // @ts-ignore
        this.facebook.once('create', (function(event, data){
            if(this.facebook.contextID != null){
                // @ts-ignore
                this.facebook.getLeaderboard('Amis.' + this.facebook.contextID);
            }
        }).bind(this));
        // @ts-ignore
        if(this.facebook.contextID != null){
            // @ts-ignore
            this.facebook.getLeaderboard('Amis.' + this.facebook.contextID);
        }

        this.maxFollowingAnimals = 0;
	}

    initializeAnimals(): void{
        this.animals = this.add.group({
            classType: Animal,
            maxSize: 50,
            runChildUpdate: false,
            defaultKey: 'roundQuarter',
            defaultFrame: 'elephant.png'
        });
	}

    getAnimal(): Animal{
        let animal = this.animals.get();

        this.insideAnimals.push(animal);

        return animal;
	}

    createBackground(): void{
        this.background = this.add.tileSprite(0, 0, 1080, 1920, 'sky').setOrigin(0,0);
        this.background.setScale(2*SC);
        this.background.setScrollFactor(0);

        this.lavaBottom = this.add.tileSprite(this.width/2, this.height, this.width, 128*SC, 'spritesheet_other', 'fluidRed.png');
        this.lavaBottom.setScale(2*SC);
        this.lavaBottom.setScrollFactor(0);
        this.lavaBottom.setDepth(2);
        this.lava = this.add.tileSprite(this.width/2, this.height - 64*SC, this.width, 64*SC, 'spritesheet_other', 'fluidRed_top.png');
        this.lava.setScale(2*SC);
        this.lava.setScrollFactor(0);
        this.lava.setDepth(2);

        this.lavaNextBeginTime = 0;
        this.lavaNextEndTime = 0;

	}

    computeMeters(): integer{
        return Math.trunc(-this.camera.scrollY / this.height * 35);
	}

    createUI(): void{
        this.rewardTweens = [];

		// @ts-ignore
		this.fps = this.add._bitmapText(this.width / 2, 0, 'jungle', 'FPS: 60', 80 * SC)
        this.fps.setScrollFactor(0);
        this.fps.setDepth(Infinity);

		// @ts-ignore
		this.scoreText = this.add._bitmapText(20 * SC, 20 * SC,'jungle', 'Score: ' + this.acquiredScore, 100 * SC).setOrigin(0, 0)
        this.scoreText.tint = 0xFFFFFF;
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(Infinity);

		// @ts-ignore
		this.multiplierText = this.add._bitmapText(this.width - 200 * SC, 0, 'jungle', 'x2', 100*SC).setOrigin(0, 0)
        this.multiplierText.setRotation(45 /360 * Phaser.Math.PI2);
        this.multiplierText.setScrollFactor(0);
        this.multiplierText.setDepth(Infinity);
        this.multiplierText.setOrigin(-0.5, 0);

        let zone = this.add.zone(this.width/2, this.height/2, this.width + 100*SC, this.height + 50*SC);
        Phaser.Display.Align.In.TopRight(this.multiplierText, zone);

        this.touchToPlay = [];
		
		let drag = this.add.bitmapText(this.width / 2,this.height * 0.8,'jungle', 'drag', 60*SC).setOrigin(0.5, 0.5);
        drag.tint = 0xFFFFFF;
        drag.setScale(1);
        drag.setScrollFactor(0);
        drag.setDepth(Infinity);

        let escape = this.add.bitmapText(this.width / 2,this.height * 0.30,'jungle', 'escape', 100*SC).setOrigin(0.5, 0.5);
        escape.tint = 0xFFFFFF;
        escape.setScrollFactor(0);
        escape.setDepth(Infinity);
        escape.setAlpha(0);
		
		let touch = this.add.image(this.width * 0.68, this.height * 0.50, 'icons', 'downLeft.png');
        touch.setDepth(Infinity);
        touch.setScale(4 * SC);
        touch.setScrollFactor(0);
		
		this.touchToPlay.push(drag);
        this.touchToPlay.push(escape);
        this.touchToPlayTweens = [];
        this.touchToPlayTweens.push(this.tweens.add({
            targets: touch,
            x: this.width * 0.65,
            y: this.height * 0.53,
            ease: 'Quad.easeInOut',
            duration: 600,
            yoyo: true,
            repeat: Infinity,
            hold: 600}));
        this.touchToPlayTweens.push(this.tweens.add({
            targets: escape,
            alpha : 1,
            ease: 'Quad.easeIn',
            duration: 180,
            yoyo: true,
            repeat: Infinity,
            hold: 240}));
        this.touchToPlayTweens.push(this.tweens.add({
            targets: drag,
            scaleX: 0.98,
            scaleY: 0.98,
            ease: 'Sine.easeInOut',
            duration: 600,
            yoyo: true,
            repeat: Infinity,
            hold: 0}));
        this.input.once('pointerdown', function(){
            this.touchToPlayTweens.forEach(function(tween){
                tween.stop();

            });
            this.tweens.add({
                targets: touch,
                x: this.width *  1.2,
                y: this.height * 0.2,
                ease: 'Quad.easeOut',
                duration: 800});
            this.tweens.add({
                targets: escape,
                alpha : 0,
                ease: 'Quad.easeOut',
                duration: 800});
           this.tweens.add({
                targets: drag,
                scaleX: 0,
                scaleY: 0,
                ease: 'Quad.easeOut',
                duration: 800});
            this.touchToPlayTweens = [];

        }, this);

        let image = this.add.image(this.width - 50 * SC, this.height - 50 * SC, 'iconsw', 'pause.png');
		image.setDepth(Infinity);
		image.setScrollFactor(0);
		image.setInteractive();

		this.input.on('gameobjectdown', (pointer, gameObject) => {
			if (gameObject === image) {	
		    	if (this.started) {
            	    this.scene.pause('MainScene');
            	    this.scene.launch('PauseScene');
				}
			}
		});
	
        this.bestDistanced = false;
        this.highscored = false;

        this.lastMeterMark = 0;
	}

	createSideWalls(): void {
        this.leftWall = this.matter.add.sprite(-this.width * 0.9, this.height/2, 'round', 'elephant.png', { isStatic: true});
        this.leftWall.setCollisionCategory(this.obstacleCat);
        this.leftWall.setDisplaySize(this.width * 0.5, this.height);
        this.leftWall.setVisible(false);
        this.rightWall = this.matter.add.sprite(this.width * 1.9,this.height/2, 'round', 'elephant.png', { isStatic: true});
        this.rightWall.setCollisionCategory(this.obstacleCat);
        this.rightWall.setDisplaySize(this.width * 0.5, this.height);
        this.rightWall.setVisible(false);
	}
	
	createElephant(): void {
        this.disableControl = false;
        if(this.character === undefined){
            this.character = 'elephant';
        }
        this.elephant = this.matter.add.sprite(this.width/2, this.height * 0.6, 'round', this.character + '.png',
            {
                shape:{
                    type:'circle',
                    radius: 64,

                },
                render: { sprite: { xOffset: 0, yOffset: ROUND_Y_OFFSETS[this.characterNames.indexOf(this.character)]} }
            });
        this.elephant.setDepth(1);
        this.elephant.setScale(ELEPHANT_SCALE*SC);
        this.elephant.setCollisionCategory(this.elephantCat);
        this.elephant.setCollidesWith(this.obstacleCat);
        //We forbid the engine to use physics on the rotation parameter.
        this.elephant.body.allowRotation = false;

        this.elephantDirection = new Phaser.Math.Vector2(0, 1);
        this.lastPosition = [0.5 * this.width, 0.5 * this.height];

    }

    /**
     * Collision logic, with assymetrical roles for bodyA and bodyB.
     * @param event
     * @param bodyA
     * @param bodyB
     */
    checkOneSideCollision(event, bodyA, bodyB): void{
        if (bodyA.label == 'animal' && (bodyB.label == 'elephant' || bodyB.label == 'followingAnimal')){
            bodyA.label = 'followingAnimal';
            this.followingAnimals.push(bodyA.gameObject);
            bodyA.gameObject.setCollidesWith(this.obstacleCat);
            bodyA.gameObject.setSensor(false);
		}

        if (bodyA.label == 'disableControl' && bodyB.label == 'elephant') {
            this.killElephant();
		}

        if (bodyA.label == 'followingAnimal' && bodyB.label == 'shelter') {
            this.savedAnimals += 1

            let animal = bodyA.gameObject.frame.name
            animal = animal.slice(0, animal.length - 4)

            this.playerData.values[animal + 'Count'] += 1

            if (bodyA.gameObject.gold) {
                this.playerData.values.goldSaved += 1
            }

            let shelter = bodyB.gameObject

            let multiplier = SCORE_MULTIPLIER
            if (bodyA.gameObject.gold) {
                multiplier = multiplier ** 5
			}

			if (shelter.score == 0) {
                shelter.score = BASE_SCORE * multiplier
			} else {
                shelter.score *= multiplier
			}
			
			if (this.tween === undefined || !this.tween.isPlaying()) {
                this.tween = this.tweens.add({
                    targets: this.scoreText,
                    duration: 50,
                    yoyo: true,
                    ease: 'Cubic.easeIn',
                    y: (20 + Math.log(shelter.score) * 5) * SC

                });
			}

            this.killAnimal(bodyA.gameObject);
        }
	}

    create (): void {
        this.started = false;

        var atlasTexture = this.textures.get('round');
        this.characterFrames = atlasTexture.getFrameNames();
        this.characterNames = this.characterFrames.map(function(frame){
            return frame.slice(0, frame.length - 4);
        });

        this.savedAnimals = 0;
        this.deadInLava = 0;

        SC = this.sys.canvas.height / 1920;
        this.gameOverB = false;
        //Initializing categories.
        this.obstacleCat = this.matter.world.nextCategory();
        this.elephantCat = this.matter.world.nextCategory();

        this.spawnCount = 0;
        this.followingAnimals = [];
        this.insideScreenObjects = [];
        this.insideAnimals = [];
        this.liveShelters = [];
        this.acquiredScore = 0;

        this.height = this.sys.canvas.height;
        this.width = this.sys.canvas.width;

        this.camera = this.cameras.main;


        var atlasTexture = this.textures.get('round');
        this.roundFrames = atlasTexture.getFrameNames();
        this.loadLeaderboards();
        this.createUI();
        this.createBackground();
        this.createElephant();
        this.createSideWalls();
        this.initializeAnimals();

        this.prefabs = new Prefabs(this, this.width, this.height);
        //this.prefabs.addObstaclesAndAnimals(0, 0, 16, 1);

        var collisionCallback = (function (event) {
                var pairs = event.pairs;

                for (var i = 0, j = pairs.length; i != j; ++i) {
                    var pair = pairs[i];

                    this.checkOneSideCollision(event, pair.bodyA, pair.bodyB);
                    this.checkOneSideCollision(event, pair.bodyB, pair.bodyA);

                }

            }
        ).bind(this);

        this.matter.world.on('collisionstart', collisionCallback);


        this.cameraSpeed = CAMERA_BEGIN_SPEED;
		this.animalSpeed = ANIMAL_BASE_SPEED;

		/*this.input.on('pointerup', function () {
		    if(this.started) {
                this.scene.pause();
                this.scene.launch('pausescene');
            }
		}, this);*/
		this.events.on('pause', function(){
		    this.pauseTime = this.lastTime;
        }, this);
        this.events.on('resume', function () {
            this.justResumed = true;
        }, this);
        window.addEventListener('focus', this.onFocus.bind(this));
        window.addEventListener('blur', this.onBlur.bind(this));
        this.justResumed = false;
        this.pauseTime = 0;
        this.lastUpdateTime = 0;

        this.input.once('pointerdown', function(){
            this.started = true;
        }, this);

        this.scoreLine(-this.height / 35 * this.playerData.values.bestDistance + this.height / 2, 0x4169E1,
            this.playerData.values.bestDistance + "m", "Best distance");

        this.scoreLine(-this.height / 35 * this.playerData.values.lastDistance + this.height / 2, 0x9b1c31,
            this.playerData.values.lastDistance + "m", "Last distance");
    }

	createRewardTween(text, color) {
		// @ts-ignore
        let textEl = this.add._bitmapText(this.width / 2, this.height * (0.2 + 0.1 * this.rewardTweens.length), 'jungle', text, 100 * SC).setOrigin(0.5, 0.5);
        textEl.setScale(0);
        textEl.setScrollFactor(0);
        textEl.tint = color;

        let tween = this.add.tween({
            targets: textEl,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            yoyo: true,
            ease: 'Quad.easeIn',
            hold: 800,
            onComplete: (function(){
                this.rewardTweens = this.rewardTweens.filter(t => t != tween);
            }).bind(this)
		})

        this.rewardTweens.push(tween)
    }

    scoreLine(y: number, color: number, rightText, leftText): void {
        let line = new Phaser.Geom.Line(0, y, this.width, y)
        let graphics = this.add.graphics({
            lineStyle:{
                width: 8,
                color: color,
                alpha: 1
            },
            x: 0,
            y: 0
		})
        graphics.strokeLineShape(line)

        let x = this.width - 50 * SC
		// @ts-ignore
		let textEl = this.add._bitmapText(x, y - 30*SC, 'jungle', rightText, 75*SC).setOrigin(1, 0.5)
        textEl.tint = color
        x = 50 * SC

        this.insideScreenObjects.push(textEl)

		// @ts-ignore
        textEl = this.add._bitmapText(x, y - 30*SC, 'jungle', leftText, 75*SC).setOrigin(0, 0.5)
        textEl.tint = color

        this.insideScreenObjects.push(textEl)
	}

    onBlur(): void {
        this.scene.pause('MainScene');
        this.pauseTime = this.lastTime;
	}

    onFocus(): void {
        this.scene.resume('MainScene');
        this.justResumed = true;
    }

	update(time, delta): void {
        if(this.matter.world != null) {
            if (this.lastUpdateTime == 0) {
                this.lastUpdateTime = time;
            }
            if (this.justResumed) {
                this.lastUpdateTime = this.lastUpdateTime - this.lastTime + time;
                this.justResumed = false;
            }
            this.lastTime = time;

            var i = 0;
            while (i < 3 && time - this.lastUpdateTime > 1000 / 60) {
                this.matter.step(1000 / 60, 1);
                this.lastUpdateTime += 1000 / 60;

                this.updateCamera(time, delta);

                if (this.elephant != null)
                    this.updateElephant();

                this.updateScrolling();
                this.updateAnimals(delta);
                this.deleteOutsideScreen();
                this.updateUI();
                this.updateStats();
                i += 1;
            }
        }
    }
	
	killAnimal(animal): void {
		animal.kill()

		if (this.insideAnimals.includes(animal)) {
            this.insideAnimals.splice(this.insideAnimals.indexOf(animal), 1)
		}

		if (this.followingAnimals.includes(animal)) {
            this.followingAnimals.splice(this.followingAnimals.indexOf(animal), 1)
		}
	}

    computeMultiplier(): integer {
		let s = 0

        this.followingAnimals.forEach((function(animal) {
            s += animal.gold ? 5 : 1
        }).bind(this))
		
		let multiplier_log = Math.trunc(s / 5)
        let multiplier = Math.trunc(Math.pow(2, multiplier_log))

        return multiplier
	}

	updateUI(): void {
		// @ts-ignore
		this.fps._setText('FPS: ' + Math.trunc(this.game.loop.actualFps))
		// @ts-ignore
		this.scoreText._setText('Score: ' + Math.round(this.computeScore()))

        let multiplier = this.computeMultiplier()
		if (this.multiplier != multiplier) {
			// @ts-ignore
			this.multiplierText._setText(this.i18n.t('x' + multiplier))

            this.multiplierTween = this.tweens.addCounter({
                duration: 500,
                yoyo: false,
                ease: 'Cubic.easeInOut',
                from: this.multiplier,
                to: multiplier
			})

            this.multiplier = multiplier
		}

        if (this.multiplierTween !== undefined) {
            let truncValue = Math.trunc(this.multiplierTween.getValue())
			let logAdvance : integer

            logAdvance = Math.trunc(Math.log2(this.multiplierTween.getValue()) / 10 * 255)
            if (!isNaN(logAdvance)) {
				this.multiplierText.setTint(new Color(1 - logAdvance, 1, 1, 1).color)
				// @ts-ignore
				this.multiplierText._setText('x' +  truncValue)
                this.multiplierText.setFontSize((100 + logAdvance / 10) * SC)
                this.multiplierText.setPosition(this.width, 100 * SC).setOrigin(1, 0)
            }
		}

        let meters = this.computeMeters()
        if (meters > this.lastMeterMark) {
            this.lastMeterMark += 500
            this.scoreLine(-this.metersToCamera(this.lastMeterMark) + this.height/2, 0x2F4F4F, this.lastMeterMark + 'm', '')
        }
	}

    metersToCamera (pos: number): number {
        return pos / 35 * this.height
	}
	
	updateAnimals (delta): void {
        this.animalSpeed += delta * ANIMAL_ACC / 1000

        // Following the elephant logic.
        for (let i = 0; i < this.followingAnimals.length; i++) {
            let animal = this.followingAnimals[i]

            let dir = this.elephant.getCenter().subtract(animal.getCenter())
            animal.setVelocity(dir.x, dir.y)
            let distance = dir.length()
            dir.normalize()

            let scaleY = ((distance - this.elephant.width * this.elephant.scaleX * 0.2) * 2 / this.height)
            let scaleX = this.animalSpeed * ANIMAL_SPEED_XY_RATIO
            scaleY *= this.animalSpeed
            scaleY *= 0.05 + 0.95 * 1 / (1 + (i + 1))
            dir.x = dir.x * scaleX
            dir.y = dir.y * scaleY
            animal.setVelocity(dir.x * SC, dir.y * SC)

            animal.rotation = this.elephantDirection.angle() - Phaser.Math.PI2 / 4;
        }
    }

	computeScore():  number {
		let score = 0
        for (let i = 0; i < this.liveShelters.length; i++) {
            // @ts-ignore
            score += this.liveShelters[i].score
        }
        score += this.acquiredScore

        return score
	}

    inScreen(gameObject): boolean {
        return gameObject.y - gameObject.displayHeight / 2 < this.camera.scrollY + this.camera.height
    }
	
	deleteOutsideScreen(): void {
        // Checking that objects are inside the screen.
        let toDestroy = [];

        this.insideAnimals.forEach((function(animal) {
            if (!this.inScreen(animal)) {
                this.deadInLava += 1
                this.killAnimal(animal)
            }
		}).bind(this))

        this.insideScreenObjects.forEach((function(object) {
            if (!this.inScreen(object)) {
                // @ts-ignore
                if (typeof object.score !== 'undefined') {
                    // @ts-ignore
                    this.acquiredScore += object.score
                }
            }
		}).bind(this))

        this.insideScreenObjects = this.insideScreenObjects.filter((this.inScreen).bind(this));

        this.insideAnimals = this.insideAnimals.filter((this.inScreen).bind(this));
        this.followingAnimals = this.followingAnimals.filter((this.inScreen).bind(this));
        this.liveShelters = this.liveShelters.filter((this.inScreen).bind(this));
    }
	
	updateElephant(): void{
        if(!this.disableControl && this.started) {
            var nx = this.input.x + this.camera.scrollX;
            var ny = this.input.y + this.camera.scrollY + this.cameraSpeed;
            var x = this.elephant.getCenter().x;
            var y = this.elephant.getCenter().y;
            var mx = (nx - x) * MOVE_DELAY_COEFF;
            var my = (ny - y) * MOVE_DELAY_COEFF;
            my = Phaser.Math.Clamp(my, -this.height / 2 * MOVE_DELAY_COEFF, this.height / 2 * MOVE_DELAY_COEFF);

            this.elephant.setVelocity(mx, my);

            var move = new Phaser.Math.Vector2(this.input.x - this.lastPosition[0],
                this.input.y - this.lastPosition[1]);

            if (move.lengthSq() > DIRECTION_UPDATE_DIST_SQ) {

                this.lastPosition = [this.input.x, this.input.y];
                this.elephantDirection = move;
            }
            this.elephant.rotation = this.elephantDirection.angle() - Phaser.Math.PI2 / 4;
            this.elephant.body.label = 'elephant';
        }

	}

    updateCamera(time, delta): void{
        if(this.started) {
            if(this.cameraSpeed  > CAMERA_BASE_SPEED)
            {
                this.cameraSpeed += delta * CAMERA_ACC / 1000 * SC;
                if(this.cameraSpeed  < CAMERA_BASE_SPEED)
                {
                    this.cameraSpeed = CAMERA_BASE_SPEED;
                }
            }
            this.camera.scrollY += this.cameraSpeed;
        }
        this.background.tilePositionY = this.camera.scrollY / (SC * 2);
        this.lava.tilePositionX += 3;
        this.lavaBottom.tilePositionX = this.lava.tilePositionX;



        if(time > this.lavaNextEndTime){
            this.lavaMoveType = Phaser.Math.Between(0, 1);

            this.lavaNextBeginTime = time;
            if(this.lavaMoveType == 0)
                this.lavaNextEndTime = this.lavaNextBeginTime + Phaser.Math.FloatBetween(2000, 4000);
            else
                this.lavaNextEndTime = this.lavaNextBeginTime + Phaser.Math.FloatBetween(1000, 3000);


            this.lava.y = Math.trunc(this.height - 64 * SC );
            this.lavaBottom.y =  Math.trunc(this.height + 16 * SC);

        }
        else if(time > this.lavaNextBeginTime){
            var duration = this.lavaNextEndTime - this.lavaNextBeginTime;
            var t = (time - this.lavaNextBeginTime) / duration;

            switch (this.lavaMoveType) {
                case 0:
                    this.lava.y = Math.trunc(this.height - 64 * SC - 10 * SC* (1 - Math.cos(Math.PI * 2 * t)));
                    this.lavaBottom.y =  Math.trunc(this.height + 16 * SC -  10 * SC* ( 1 - Math.cos(Math.PI * 2 * t)));

                    break;
                case 1:
                    this.lava.y = Math.trunc(this.height - 64 * SC - 50 * SC* (1 - Math.cos(Math.PI * 2 * t)));
                    this.lavaBottom.y =  Math.trunc(this.height + 16 * SC -  50 * SC* ( 1 - Math.cos(Math.PI * 2 * t)));

                    break;
            }

        }

        this.leftWall.setPosition(-this.width, this.camera.scrollY + this.height/2);
        this.rightWall.setPosition(this.width * 2, this.camera.scrollY + this.height/2);
    }
    private updateScrolling() : void {
        if(this.camera.scrollY < -this.spawnCount * this.height){
            var x = 0;
            var y = - (this.spawnCount + 1) * this.height;

            if(this.spawnCount % 8 == 1)
            {
                if(this.spawnCount < 50)
                {
                    this.prefabs.addObstaclesWithShelter(x, y, 0);
                }
                else
                    this.prefabs.addObstaclesWithShelter(x, y);
            }

            else if(this.spawnCount == 0)
                this.prefabs.addObstaclesAndAnimals(x, y, 0);
            else{
                if(this.spawnCount < 50)
                {

                    this.prefabs.addObstaclesAndAnimals(x, y, Phaser.Math.Between(0,EASY_OBSTACLE_MAX_ID));
                }
                else
                    this.prefabs.addObstaclesAndAnimals(x, y);
            }

            this.spawnCount ++;

        }
        if(!this.inScreen(this.elephant)){
            this.gameOver();
        }
    }

    private destroyObject(gameObject: any) {
        this.insideScreenObjects = this.insideScreenObjects.filter(function(ele){
            return ele != gameObject;
        });
        this.followingAnimals = this.followingAnimals.filter(function(ele){
            return ele != gameObject;
        });
        if(typeof gameObject.score !== 'undefined'){
            this.acquiredScore += gameObject.score;
        }
        this.liveShelters = this.liveShelters.filter(function(ele){
            return ele != gameObject;
        });
        gameObject.setActive(false);
    }
    unlock(character){
        if(!this.unlockList.includes(character) && this.playerData.values[character] !== 'unlocked') {
            this.unlockList.push(character);
            this.createRewardTween(character + " unlocked !", 0xEBC500);
        }
    }
    updateStats(){
        if(this.followingAnimals.length >= this.maxFollowingAnimals){
            this.maxFollowingAnimals = this.followingAnimals.length;

        }
        var score = this.computeScore();
        if (score >= 5000) {
            this.unlock('frog');
        }
        if (score >= 20000) {
            this.unlock('giraffe');
        }
        if(score > this.playerData.values.bestScore && this.playerData.values.bestScore > 0 && !this.highscored){
            this.highscored = true;
            this.createRewardTween("Best Highscore!", 0x4169E1);
        }
        if(this.computeMeters() > this.playerData.values.bestDistance 
            && this.playerData.values.bestDistance > 0 && this.bestDistanced){
            this.bestDistanced = true;
            this.createRewardTween("Best Distance!", 0x4169E1);
        }
        if(this.maxFollowingAnimals >= 40){
            this.unlock('gorilla');
        }

        if(this.playerData.values.mooseCount >= 500){
            this.unlock('moose');
        }
        if(this.playerData.values.goldSaved >= 2000){
            this.unlock('narwhal');
        }
        if(this.computeMeters() >= 5000){
            this.unlock('snake');
        }
        if(this.savedAnimals >= 500){
            this.unlock('hippo');
        }
    }
    gameOver(): void{
        if(!this.gameOverB) {
            this.gameOverB = true;
            if(this.playerData.values.maxFollowingAnimals < this.maxFollowingAnimals)
                this.playerData.values.maxFollowingAnimals = this.maxFollowingAnimals;


            var data = {
                character: this.character
            }
            var menu = this.scene.get("menu");

            var oldAnimalCount = this.playerData.values.coins;

            this.playerData.values.coins += this.savedAnimals;
            this.playerData.values.gameCount += 1;
            this.playerData.values.deadInLava += this.deadInLava;
            this.playerData.values.lastScore = this.computeScore();

            var lastDist = this.computeMeters();
            this.playerData.values.lastDistance = lastDist;
            if(this.playerData.values.bestDistance < lastDist){
                this.playerData.values.bestDistance = lastDist;
            }

            var score = Math.trunc(this.computeScore());
            this.playerData.lastScore = score;

            if(this.playerData.values.bestScore < score){
                this.playerData.values.bestScore = score;
            }

            this.playerData.values.maxAnimalsSavedOneRun = this.savedAnimals;

            this.updateStats();
            this.scene.pause("MainScene");

            // @ts-ignore
            this.highscores.on('setscore', function (key) {
                var unlocked = [];
                for(var i = 0; i < this.characterNames.length; i++){
                    if(this.playerData.get(this.characterNames[i]) === 'unlocked')
                    {
                        unlocked.push(this.characterNames[i]);
                    }
                }
                this.scene.get('GameOverScene').initStats(Math.trunc(this.computeScore()), this.unlockList, unlocked, this.character, oldAnimalCount, this.savedAnimals, this.playerData);

                if (this.unlockList.length > 0) {
                    // @ts-ignore
                    this.unlockList.forEach((function(character){
                        this.facebook.data.set(character, 'unlocked');
                    }).bind(this));

                    this.facebook.on('savedata', this.scene.get('Menu').updateCharacter);
                }


                this.scene.start('GameOverScene');

                this.scene.get('Menu').lastScore = Math.trunc(this.computeScore());

            }.bind(this), this);

           	// @ts-ignore
            this.facebook.on('updatefail', function(e){
                console.log("update failed" + e.message);
			})

            this.highscores.setScore(Math.trunc(this.computeScore()), JSON.stringify(data));
            if(this.friends != null){
                // @ts-ignore
                FBInstant.updateAsync({
                    action: 'LEADERBOARD',
                    // @ts-ignore
                    name: 'Amis.' + this.facebook.contextID,
                });
				
				console.log('ouf');
                this.friends.setScore(Math.trunc(this.computeScore()), JSON.stringify(data));
            }
        }
    }

    addInsideScreenObject(object: Phaser.Physics.Matter.Image) {
        this.insideScreenObjects.push(object)
    }

    addShelter(shelter: Phaser.Physics.Matter.Image) {
        this.insideScreenObjects.push(shelter)
        this.liveShelters.push(shelter)
        // @ts-ignore
        shelter.score = 0
    }

    getCharacter() {
        return this.character
	}

    setPlayerData(playerData) {
        this.playerData = playerData
    }

    private killElephant() {
        this.disableControl = true
        this.elephant.setTint(0x333333)
    }
}

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

function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele !== value;
    });

}
export const ELEPHANT_SCALE = 2;
export const ANIMAL_SCALE = 0.75;
//1 = NO DELAY
export const MOVE_DELAY_COEFF = 0.1;
export const DIRECTION_UPDATE_DIST_SQ = 3 ** 2;
export const ANIMAL_BASE_SPEED = 280;
export const ANIMAL_SPEED_XY_RATIO = 1/20;
export const CAMERA_BASE_SPEED = -15; // -15;
export const ANIMAL_ACC = 6;
export const CAMERA_ACC = -0; // -0;
export const ANIMALS_SPAWN = 5;
export const SCORE_MULTIPLIER = 1.148698355; // 2 ^ (1/5)
export const BASE_SCORE = 10;

//For each frame, yOffset in percent, for the collision mesh and the image to fit together.
export const ROUND_Y_OFFSETS = [0, -0.02,0, 0.05, 0, 0, 0.1, 0, -0.08, 0.05, 0.1, 0, 0, 0, 0.05,
    0, 0.1, 0.07, 0, 0, 0, 0, 0, 0.14, 0, 0, -0.04, -0.03, 0.08, 0.05];

var SC;

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
    private insideScreenObjects: Array<Image>;

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
    private xyText: Phaser.GameObjects.BitmapText;

    private prefabs: Prefabs;
    private multiplierText: Phaser.GameObjects.BitmapText;
    private tween: Phaser.Tweens.Tween;
    private multiplier: number;
    private multiplierTween: Phaser.Tweens.Tween;

    private unlockList= [];
    private metersText: Phaser.GameObjects.BitmapText;

    private leftWall: Sprite;
    private rightWall: Sprite;
    private playerData: any;
    private savedAnimals: number;
    private characterNames: string[];
    private characterFrames: string[];
    private lava: any;
    private disableControl: boolean;

    constructor() {
        super({
            key: "MainScene",
            physics: {
                default: 'matter',
                matter: {
                    gravity: {y: 0},
                    debug: false,
                    enableSleeping: false
                }
            }
        });
    }

    updateCharacter(character: string){
        this.character = character;
    }
    preload(): void
    {
    }

    loadLeaderboards(): void{

        // @ts-ignore
        this.facebook.on('getleaderboard', (function (leaderboard)
        {
            if(leaderboard.name == 'Highscores') {

                this.highscores = leaderboard;
            }
            else if(leaderboard.name == 'Amis.' + this.facebook.contextID){
                console.log("friends!!")
                this.friends = leaderboard;
            }




        }).bind(this), this);

        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        this.facebook.getPlayers();
        // @ts-ignore
        this.facebook.on('players', (function(event, data){
            this.facebook.createContext(data.playerID);
        }).bind(this));
        // @ts-ignore
        this.facebook.on('playersfail', function(){
            console.log("sad");
        });
        // @ts-ignore
        this.facebook.on('create', (function(event, data){
            if(this.facebook.contextID != null){
                // @ts-ignore
                this.facebook.getLeaderboard('Amis.' + this.facebook.contextID);
            }
        }).bind(this));
        // @ts-ignore
        console.log(this.facebook.contextID);
        // @ts-ignore
        if(this.facebook.contextID != null){
            // @ts-ignore
            this.facebook.getLeaderboard('Amis.' + this.facebook.contextID);
        }


    }
    createBackground(): void{

        this.background = this.add.tileSprite(0, 0, 1080, 1920, 'sky').setOrigin(0,0);
        this.background.setScale(SC);
        this.background.setScrollFactor(0);

        this.lava = this.add.tileSprite(this.width/2, this.height - 32*SC, this.width, 64*SC, 'spritesheet_other', 'fluidRed_top.png');
        this.lava.setScale(2*SC);
        this.lava.setScrollFactor(0);
		this.lava.setDepth(2);
        /**var particles = this.add.particles('fire1');
        // @ts-ignore
        particles.setDepth(2);
        var emitter = particles.createEmitter({
            x: {min:0, max:this.width},
            y: this.height,
            lifespan: 1000,
            speedY: { min: -200*SC, max: -600*SC },
            scale: {start: 4, end: 0},
            quantity: 3,
            blendMode: 'ADD',

        });

        emitter.setScrollFactor(0);
        **/
    }
    computeMeters(): integer{
        return Math.trunc(-this.camera.scrollY / this.width * 20);
    }
    createUI(): void{
        this.scoreText = this.add.bitmapText(20*SC,20*SC,'jungle', 'Score: ' + this.acquiredScore, 100*SC).setOrigin(0, 0);
        this.scoreText.tint = 0xFFFFFF;
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(Infinity);

        this.metersText = this.add.bitmapText(20*SC,120*SC,'jungle', this.computeScore() + 'm', 100*SC).setOrigin(0, 0);
        this.metersText.tint = 0xFFFFFF;
        this.metersText.setScrollFactor(0);
        this.metersText.setDepth(Infinity);

        this.multiplierText = this.add.bitmapText(this.width - 200*SC,0,'jungle', 'x2', 100*SC).setOrigin(0, 0);
        this.multiplierText.setRotation(45 /360 * Phaser.Math.PI2);
        this.multiplierText.setScrollFactor(0);
        this.multiplierText.setDepth(Infinity);
        this.multiplierText.setOrigin(-0.5, 0);

        this.xyText = this.add.bitmapText(20*SC, this.height - 100*SC,'jungle', 'X: Y:', 50*SC).setOrigin(0, 0);
        this.xyText.tint = 0xFFFFFF;
        this.xyText.setScrollFactor(0);
        this.xyText.setDepth(Infinity);
        var zone = this.add.zone(this.width/2, this.height/2, this.width + 100*SC, this.height + 50*SC);
        Phaser.Display.Align.In.TopRight(this.multiplierText, zone);

    }
    createSideWalls(): void{
        this.leftWall = this.matter.add.sprite(-this.width * 0.9, this.height/2, 'round', 'elephant.png', { isStatic: true});
        this.leftWall.setCollisionCategory(this.obstacleCat);
        this.leftWall.setDisplaySize(this.width * 0.5, this.height);
        this.leftWall.setVisible(false);
        this.rightWall = this.matter.add.sprite(this.width * 1.9,this.height/2, 'round', 'elephant.png', { isStatic: true});
        this.rightWall.setCollisionCategory(this.obstacleCat);
        this.rightWall.setDisplaySize(this.width * 0.5, this.height);
        this.rightWall.setVisible(false);
    }
    createElephant(): void{
        this.disableControl = false;
        if(this.character === undefined){
            this.character = 'elephant';
        }
        this.elephant = this.matter.add.sprite(400*SC, 400*SC, 'round', this.character + '.png',
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
        if(bodyA.label == 'animal' && (bodyB.label == 'elephant' || bodyB.label == 'followingAnimal')){

            bodyA.label = 'followingAnimal';
            this.followingAnimals.push(bodyA.gameObject);
            bodyA.gameObject.setCollidesWith(this.obstacleCat);
            bodyA.gameObject.setSensor(false);
        }
        if(bodyA.label == 'disableControl' && bodyB.label == 'elephant'){
            this.killElephant();
        }
        if(bodyA.label == 'followingAnimal' && bodyB.label == 'shelter'){

            bodyA.label == 'dead';
            this.savedAnimals += 1;
            var shelter = bodyB.gameObject;

            var multiplier = SCORE_MULTIPLIER;
            if(bodyA.gameObject.gold){
                multiplier = multiplier ** 5;
                console.log(multiplier);
            }
            if(shelter.score == 0)
                shelter.score = BASE_SCORE * multiplier;
            else
                shelter.score *= multiplier;
            if(this.tween === undefined || !this.tween.isPlaying()) {
                this.tween = this.tweens.add({
                    targets: this.scoreText,
                    duration: 50,
                    yoyo: true,
                    ease: 'Cubic.easeIn',

                    y: (20 + Math.log(shelter.score) * 5)*SC

                });
            }
            this.destroyObject(bodyA.gameObject);
        }
    }
    create (): void {
        var atlasTexture = this.textures.get('round');
        this.characterFrames = atlasTexture.getFrameNames();
        this.characterNames = this.characterFrames.map(function(frame){
            return frame.slice(0, frame.length - 4);
        });
        this.savedAnimals = 0;
        SC = this.sys.canvas.height / 1920;
        this.gameOverB = false;
        //Initializing categories.
        this.obstacleCat = this.matter.world.nextCategory();
        this.elephantCat = this.matter.world.nextCategory();

        this.spawnCount = 0;
        this.followingAnimals = [];
        this.insideScreenObjects = [];
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


        this.cameraSpeed = CAMERA_BASE_SPEED;
		this.animalSpeed = ANIMAL_BASE_SPEED;

		this.input.on('pointerup', function () {
			this.scene.pause();
		    this.scene.launch('PauseScene');
		}, this);
    }
    update(time, delta): void
    {
        this.updateCamera(time, delta);

        if(this.elephant != null)
            this.updateElephant();


        this.updateScrolling();
        this.updateAnimals(delta);
        this.deleteOutsideScreen();
        this.updateUI();
        this.updateAchievements();

    }
    computeMultiplier(): integer{
        var s = 0;
        this.followingAnimals.forEach((function(animal){
            s += animal.gold ? 5 : 1;
        }).bind(this));
        var multiplier_log = Math.trunc(s / 5);
        var multiplier = Math.trunc(Math.pow(2,multiplier_log));

        return multiplier;
    }
    updateUI(): void{
        this.scoreText.setText("Score: " + Math.round(this.computeScore()));
        this.metersText.setText(this.computeMeters() + 'm');
        this.xyText.setText("X: " + Math.round(this.input.activePointer.x)
            + " - Y: "+ Math.round(this.input.activePointer.y)
        +  "\n X2: " + (this.input.activePointer.x / this.width).toFixed(2)
        + "- Y2: " + (this.input.activePointer.y / this.height).toFixed(2));

        var multiplier = this.computeMultiplier();
        if(this.multiplier != multiplier) {

            this.multiplierText.setText("x" + multiplier);


            this.multiplierTween = this.tweens.addCounter({
                duration: 500,
                yoyo: false,
                ease: 'Cubic.easeInOut',
                from: this.multiplier,
                to: multiplier

            });
            this.multiplier = multiplier;
        }
        if(this.multiplierTween !== undefined){

            var truncValue = Math.trunc(this.multiplierTween.getValue());

            var logAdvance:integer;
            logAdvance = Math.trunc(Math.log2(this.multiplierTween.getValue()) / 10 * 255) ;
            if(!isNaN(logAdvance)){
                this.multiplierText.setTint(new Color(1 - logAdvance, 1, 1, 1).color);
                this.multiplierText.setText('x'+truncValue);
                this.multiplierText.setFontSize((100 + logAdvance/10)*SC)

                var zone = this.add.zone(this.width/2, this.height/2, this.width + 100*SC, this.height + 50*SC);
                Phaser.Display.Align.In.TopRight(this.multiplierText, zone);
            }

        }


    }
    updateAchievements(): void{
        if(this.followingAnimals.length >= 50){
            this.unlock('gorilla');
        }
        if(this.computeMeters() >= 5000){
            this.unlock('snake');
        }

    }
    updateAnimals(delta): void {
        this.animalSpeed += delta * ANIMAL_ACC /1000;

        //Following the elephant logic.
        for (var i = 0; i < this.followingAnimals.length; i++) {
            var animal = this.followingAnimals[i];

            var dir = this.elephant.getCenter().subtract(animal.getCenter());
            animal.setVelocity(dir.x, dir.y);
            var distance = dir.length();
            dir.normalize();

            var scaleY = ((distance - this.elephant.width * this.elephant.scaleX * 0.2) * 2 / this.height);
            var scaleX = this.animalSpeed * ANIMAL_SPEED_XY_RATIO;
            scaleY *= this.animalSpeed ;
            scaleY *= 0.05 + 0.95 * 1/(1 + (i+1));
            dir.x = dir.x * scaleX;
            dir.y = dir.y * scaleY;
            animal.setVelocity(dir.x * SC, dir.y * SC);



            animal.rotation = this.elephantDirection.angle() - Phaser.Math.PI2 / 4;
        }
    }
    computeScore():  number{
        var score = 0;
        for(var i = 0; i < this.liveShelters.length; i++){
            // @ts-ignore
            score += this.liveShelters[i].score;
        }
        score += this.acquiredScore;

        return score;

    }
    inScreen(gameObject): boolean{
        return gameObject.y - gameObject.displayHeight / 2 < this.camera.scrollY + this.camera.height;
    }
    deleteOutsideScreen(): void{

        //Checking that objects are inside the screen.
        var toDestroy = []
        for(var i = 0; i < this.insideScreenObjects.length; i++){
            var gameObject = this.insideScreenObjects[i];

            if(!this.inScreen(gameObject)){
                gameObject.destroy();
                toDestroy.push(gameObject);
                // @ts-ignore
                if(typeof gameObject.score !== 'undefined'){
                    // @ts-ignore
                    this.acquiredScore += gameObject.score;
                }
            }


        }
        this.insideScreenObjects = this.insideScreenObjects.filter(function(ele){
            return !toDestroy.includes(ele);
        });
        this.followingAnimals = this.followingAnimals.filter(function(ele){
            return !toDestroy.includes(ele);
        });
        this.liveShelters = this.liveShelters.filter(function(ele){

            return !toDestroy.includes(ele);
        });
    }
    updateElephant(): void{
        if(!this.disableControl) {
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
        this.cameraSpeed += delta * CAMERA_ACC / 1000 * SC;

        this.camera.scrollY += this.cameraSpeed;
        this.background.tilePositionY = this.camera.scrollY / SC;
        this.lava.tilePositionX += 3;

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
        gameObject.destroy();
    }
    unlock(character){
        if(!this.unlockList.includes(character))
            this.unlockList.push(character);
    }
    gameOver(): void{
        if(!this.gameOverB) {
            this.gameOverB = true;

            if (this.computeScore() >= 5000) {
                this.unlock('frog');
            }
            if (this.computeScore() >= 20000) {
                this.unlock('giraffe');
            }
            var data = {
                character: this.character
            }
            var menu = this.scene.get("menu");

            var oldAnimalCount = this.playerData.values.coins;
            this.playerData.values.coins += this.savedAnimals;

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
            });
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
        this.insideScreenObjects.push(object);
    }

    addShelter(shelter: Phaser.Physics.Matter.Image) {
        this.insideScreenObjects.push(shelter);
        this.liveShelters.push(shelter);
        // @ts-ignore
        shelter.score = 0;
    }

    getCharacter() {
        return this.character;
    }
    setPlayerData(playerData){
        this.playerData = playerData;
    }

    private killElephant() {
        this.disableControl = true;
        this.elephant.setTint(0x333333);
    }
}
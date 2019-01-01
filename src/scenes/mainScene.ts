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

function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele !== value;
    });

}
const ELEPHANT_SCALE = 0.8;
const ANIMAL_SCALE = 0.35;
//1 = NO DELAY
const MOVE_DELAY_COEFF = 0.1;
const DIRECTION_UPDATE_DIST_SQ = 3 ** 2;
const ANIMAL_BASE_SPEED = 140;
const ANIMAL_SPEED_XY_RATIO = 1/20;
const CAMERA_BASE_SPEED = -3;
const ANIMAL_ACC = 3;
const CAMERA_ACC = -0.1;
const ANIMALS_SPAWN = 5;
const SCORE_MULTIPLIER = 1.3;

//For each frame, yOffset in percent, for the collision mesh and the image to fit together.
const ROUND_Y_OFFSETS = [0, -0.02,0, 0.05, 0, 0, 0.1, 0, -0.08, 0.05, 0.1, 0, 0, 0, 0.05,
    0, 0.1, 0.07, 0, 0, 0, 0, 0, 0.14, 0, 0, -0.04, -0.03, 0.08, 0.05];


export class MainScene extends Phaser.Scene {
    private elephant: Sprite;
    private elephantDirection: Phaser.Math.Vector2;
    //Last recorded position of the Elephant. This is used to orientate the elephant without shaking.
    private lastPosition: number[];


    private camera: Phaser.Cameras.Scene2D.Camera;

    private followingAnimals: Array<Image>;
    private liveShelters: Array<Image>;

    //List of atlas 'round' frame names.
    private roundFrames: string[];

    //Counting how many times we spawned animals.
    private spawnCount: number;

    //Objects that must stay inside screen space.
    private insideScreenObjects: Array<Image>;

    //Collision categories.
    private obstacleCat: number;
    private elephantCat: number;


    private background: Phaser.GameObjects.Image;

    private cameraSpeed: number;
    private animalSpeed: number;
    private acquiredScore: number;
    private scoreText: Phaser.GameObjects.Text;


    private highscores: any;
    private friends : any;

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
    preload(): void
    {
    }

    loadLeaderboards(): void{

        // @ts-ignore
        this.facebook.on('getleaderboard', (function (leaderboard)
        {
            if(leaderboard.name == 'Highscores') {

                this.highscores = leaderboard;
                //leaderboard.on('getscores', (function(scores){
                //    this.createHighscoreTab(scores);
                //}).bind(this));
                this.highscores.getScores(10, 0);
            }
            else if(leaderboard.name == 'Amis')
                this.friends = leaderboard;



        }).bind(this), this);

        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        //this.facebook.getLeaderboard('Amis');
    }
    createBackground(): void{
        this.background = this.add.image(0, 0, 'sky').setOrigin(0,0);
    }
    createUI(): void{
        this.scoreText = this.add.text(20,20,'Score: ' + this.acquiredScore).setOrigin(0, 0);
        this.scoreText.setColor("white");
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(Infinity);
    }
    createElephant(): void{

        this.elephant = this.matter.add.sprite(400, 400, 'round','sloth.png',
            {
                shape:{
                    type:'circle',
                    radius: 64,

                },
                render: { sprite: { xOffset: 0, yOffset: -0.08} }
            });
        this.elephant.setDepth(1);
        this.elephant.setScale(ELEPHANT_SCALE);
        this.elephant.setCollisionCategory(this.elephantCat);
        this.elephant.setCollidesWith(this.obstacleCat);
        //We forbid the engine to use physics on the rotation parameter.
        this.elephant.body.allowRotation = false;

        this.elephantDirection = new Phaser.Math.Vector2(0, 1);
        this.lastPosition = [400, 400];

    }

    /**
     * Spawn a random animal at position x, y
     * @param x
     * @param y
     */
    spawnAnimal(x,y): void{
        var i = Phaser.Math.Between(0, this.roundFrames.length - 1);

        var animal = this.matter.add.image(x,y, 'round', this.roundFrames[i], {
            shape: {
                type: 'circle',
                radius: 64
            },
            render: {sprite: {xOffset: 0, yOffset: ROUND_Y_OFFSETS[i]}},
            label: 'animal',

        });
        animal.setScale(ANIMAL_SCALE);
        animal.body.allowRotation = false;
        animal.setCollisionCategory(this.obstacleCat);
        animal.setCollidesWith([this.elephantCat, this.obstacleCat]);
        animal.setSensor(true);
        this.insideScreenObjects.push(animal);
    }
    /***
     * Spawns count animals in rectangle of coordinates (x,y,x2,y2).
     * @param x
     * @param y
     * @param x2
     * @param y2
     * @param count
     */
    spawnAnimals(x, y, x2, y2, count): void{
        for (var j = 0; j < count; j++) {
            var animalX = Phaser.Math.Between(x, x2);
            var animalY = Phaser.Math.Between(y, y2);
            this.spawnAnimal(animalX, animalY);
        }
    }
    spawnShelter(x,y): void{

        var shelter = this.matter.add.image(x,y, 'square', 'elephant.png');
        shelter.setScale(5,1);
        shelter.body.label = "shelter";
        shelter.setSensor(true);
        shelter.setStatic(true);
        shelter.setCollidesWith(this.obstacleCat);
        shelter.setCollisionCategory(this.obstacleCat);

        this.insideScreenObjects.push(shelter);
        this.liveShelters.push(shelter);
        // @ts-ignore
        shelter.score = 0;
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
        if(bodyA.label == 'followingAnimal' && bodyB.label == 'shelter'){
            this.destroyObject(bodyA.gameObject);
            bodyA.label == 'dead';
            var shelter = bodyB.gameObject;

            if(shelter.score == 0)
                shelter.score = 1;
            else
                shelter.score *= SCORE_MULTIPLIER;
        }
    }
    create (): void {
        //Initializing categories.
        this.obstacleCat = this.matter.world.nextCategory();
        this.elephantCat = this.matter.world.nextCategory();

        this.spawnCount = 0;
        this.followingAnimals = [];
        this.insideScreenObjects = [];
        this.liveShelters = [];
        this.acquiredScore = 0;
        this.camera = this.cameras.main;

        var atlasTexture = this.textures.get('round');
        this.roundFrames = atlasTexture.getFrameNames();
        this.loadLeaderboards();
        this.createUI();
        this.createBackground();
        this.createElephant();
        this.spawnAnimals(0, 0, 600, 400, 10);


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

    }

    updateUI(): void{
        this.scoreText.setText("Score: " + Math.round(this.computeScore()));
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

            var scaleY = ((distance - this.elephant.width * this.elephant.scaleX * 0.2) * 2 / this.camera.height);
            var scaleX = this.animalSpeed * ANIMAL_SPEED_XY_RATIO;
            scaleY *= this.animalSpeed ;
            scaleY *= 0.05 + 0.95 * 1/(1 + (i+1));
            dir.x = dir.x * scaleX;
            dir.y = dir.y * scaleY;
            animal.setVelocity(dir.x, dir.y);



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
    deleteOutsideScreen(): void{

        //Checking that objects are inside the screen.
        var toDestroy = []
        for(var i = 0; i < this.insideScreenObjects.length; i++){
            var gameObject = this.insideScreenObjects[i];

            if(gameObject.y - gameObject.height * gameObject.scaleY / 2> this.camera.scrollY + this.camera.height){
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
        var nx = this.input.x + this.camera.scrollX;
        var ny = this.input.y + this.camera.scrollY;
        var x = this.elephant.getCenter().x;
        var y = this.elephant.getCenter().y;
        this.elephant.setVelocity((nx-x)*MOVE_DELAY_COEFF,(ny-y)*MOVE_DELAY_COEFF);

        var move = new Phaser.Math.Vector2(this.input.x - this.lastPosition[0],
            this.input.y - this.lastPosition[1]);

        if(move.lengthSq() > DIRECTION_UPDATE_DIST_SQ){

            this.lastPosition = [this.input.x, this.input.y];
            this.elephantDirection = move;
        }
        this.elephant.rotation = this.elephantDirection.angle() - Phaser.Math.PI2/4;
        this.elephant.body.label = 'elephant';

    }
    updateCamera(time, delta): void{
        this.cameraSpeed += delta * CAMERA_ACC / 1000;
        this.camera.scrollY += this.cameraSpeed;

        this.background.setPosition(0, this.camera.scrollY);

    }
    private updateScrolling() : void {
        if(this.camera.scrollY < -this.spawnCount * this.sys.game.canvas.height){
            this.spawnAnimals(0,  - this.spawnCount * this.sys.game.canvas.height,
                this.sys.game.canvas.width, - (this.spawnCount + 1) * this.sys.game.canvas.height,
                ANIMALS_SPAWN);
            if(this.spawnCount % 8 == 1)
                this.spawnShelter(this.camera.width / 2, - (this.spawnCount + 1/2) * this.sys.game.canvas.height);
            this.spawnCount ++;

            if(this.spawnCount >= 19){
                this.gameOver();
            }
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

    gameOver(): void{
        var data = {
            character: 'elephant'
        }

        this.highscores.setScore(Math.trunc(this.computeScore()), JSON.stringify(data));
        //this.friends.setScore(this.computeScore(), data);

        this.scene.start('Menu');
    }
}

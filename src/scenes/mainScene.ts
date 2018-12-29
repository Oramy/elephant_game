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
function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele !== value;
    });

}
const ELEPHANT_SCALE = 0.5;
const ANIMAL_SCALE = 0.25;
//1 = NO DELAY
const MOVE_DELAY_COEFF = 0.1;
const DIRECTION_UPDATE_DIST_SQ = 3 ** 2;
const FOLLOWING_MIN_DIST_SQ = 200 ** 2;
const ANIMAL_SPEED = 2;
const CAMERA_SPEED = -1;

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

    constructor() {
        super({
            key: "MainScene",
            physics: {
                default: 'matter',
                matter: {
                    gravity: {y: 0},
                    debug: true,
                    enableSleeping: false
                }
            }
        });
    }
    preload(): void
    {
        this.load.setBaseURL('http://labs.phaser.io');
        this.load.image('sky', 'assets/skies/space3.png');
        this.load.atlasXML('round', 'assets/atlas/round.png', 'assets/atlas/round.xml');
        this.load.atlasXML('round', 'assets/atlas/square.png', 'assets/atlas/square.xml');
    }
    createBackground(): void{
        this.background = this.add.image(0, 0, 'sky').setOrigin(0,0);
    }
    createElephant(): void{

        this.elephant = this.matter.add.sprite(400, 400, 'round','elephant.png',
            {
                shape:{
                    type:'circle',
                    radius: 64,

                },
                render: { sprite: { xOffset: 0, yOffset: -0.08} }
            });
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
            label: 'animal'
        });
        animal.setScale(ANIMAL_SCALE);
        animal.body.allowRotation = false;
        animal.setCollisionCategory(this.obstacleCat);
        animal.setCollidesWith([this.elephantCat, this.obstacleCat]);
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

    /**
     * Collision logic, with assymetrical roles for bodyA and bodyB.
     * @param event
     * @param bodyA
     * @param bodyB
     */
    checkOneSideCollision(event, bodyA, bodyB): void{
        if(bodyA.label == 'animal'){
            console.log(bodyA.label, bodyB.label);
        }
        if(bodyA.label == 'animal' && (bodyB.label == 'elephant' || bodyB.label == 'followingAnimal')){

            bodyA.label = 'followingAnimal';
            this.followingAnimals.push(bodyA.gameObject);
            bodyA.gameObject.setCollidesWith(this.obstacleCat);
        }
    }
    create (): void {
        //Initializing categories.
        this.obstacleCat = this.matter.world.nextCategory();
        this.elephantCat = this.matter.world.nextCategory();

        this.spawnCount = 0;
        this.followingAnimals = [];
        this.insideScreenObjects = [];

        this.camera = this.cameras.main;

        var atlasTexture = this.textures.get('round');
        this.roundFrames = atlasTexture.getFrameNames();

        this.createBackground();
        this.createElephant();
        this.spawnAnimals(0, 0, 600, 400, 10);

        var collisionCallback = (function (event, bodyA, bodyB) {
                this.checkOneSideCollision(event, bodyA, bodyB);
                this.checkOneSideCollision(event, bodyB, bodyA);
            }
        ).bind(this);
        this.matter.world.on('collisionstart', collisionCallback);
        this.matter.world.on('collisionactive', collisionCallback);
        this.matter.world.on('collisionend', collisionCallback);


    }
    update(time, delta): void
    {
        this.updateCamera(time, delta);

        if(this.elephant != null)
            this.updateElephant();

        this.updateScrolling();
        this.updateAnimals(delta);
        this.deleteOutsideScreen();


    }
    updateAnimals(delta): void {

        //Following the elephant logic.
        for (var i = 0; i < this.followingAnimals.length; i++) {
            var animal = this.followingAnimals[i];

            var dir = this.elephant.getCenter().subtract(animal.getCenter());
            if (dir.lengthSq() > FOLLOWING_MIN_DIST_SQ|| animal.getCenter().y < this.elephant.getCenter().y) {
                dir.normalize();
                dir.scale(ANIMAL_SPEED);
                animal.setVelocity(dir.x, dir.y);
            }
            animal.rotation = this.elephantDirection.angle() - Phaser.Math.PI2 / 4;
        }
    }
    deleteOutsideScreen(): void{

        //Checking that objects are inside the screen.
        var toDestroy = []
        for(var i = 0; i < this.insideScreenObjects.length; i++){
            var gameObject = this.insideScreenObjects[i];

            if(gameObject.y > this.camera.scrollY + this.camera.height - 100){
                gameObject.destroy();
                toDestroy.push(gameObject);
            }

        }
        this.insideScreenObjects = this.insideScreenObjects.filter(function(ele){
            return !toDestroy.includes(ele);
        });
        this.followingAnimals = this.followingAnimals.filter(function(ele){
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
        this.camera.scrollY += CAMERA_SPEED;

        this.background.setPosition(0, this.camera.scrollY);

    }
    private updateScrolling() : void {
        if(this.camera.scrollY < -this.spawnCount * this.sys.game.canvas.height){
            this.spawnAnimals(0,  - this.spawnCount * this.sys.game.canvas.height, this.sys.game.canvas.width, - (this.spawnCount + 1) * this.sys.game.canvas.height, 10);
            this.spawnCount ++;
        }
    }
}

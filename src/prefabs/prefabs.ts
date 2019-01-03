import {ANIMAL_SCALE, ANIMALS_SPAWN, MainScene, ROUND_Y_OFFSETS} from "../scenes/mainScene";
import Line = Phaser.Geom.Line;
import Rectangle = Phaser.Geom.Rectangle;
import GameObject = Phaser.GameObjects.GameObject;

var notused = [];
var notused_offsets = [];
/**
 * Spawn a random animal at position x, y
 * @param x
 * @param y
 */
const OBSTACLE_MAX_ID = 9;
const VARIANTS_MAX_ID = [11, 2, 1, 0, 0, 0, 0, 1,1,6];
const SHELTER_MAX_ID = 0;
export class Prefabs{
    private width: any;
    private height: any;
    private scene: MainScene;
    constructor(scene:MainScene, width, height){
        this.scene = scene;
        this.width = width;
        this.height = height;
        var sum = 0;
        VARIANTS_MAX_ID.forEach(function(el){
            sum += el;
        });
        sum += OBSTACLE_MAX_ID + 1;
        sum == SHELTER_MAX_ID + 1;
        console.log(sum + " situations différentes");
    }
    spawnAnimal(x = 0,y = 0): GameObject{
        var scene = this.scene;
        if(notused.length == 0){
            notused = notused.concat(scene.roundFrames);
            notused_offsets = ROUND_Y_OFFSETS;
        }
        var i = Phaser.Math.Between(0, notused.length - 1);
        var animal = scene.matter.add.image(x,y, 'round',notused[i], {
            shape: {
                type: 'circle',
                radius: 64
            },
            render: {sprite: {xOffset: 0, yOffset: notused_offsets[i]}},
            label: 'animal',

        });
        notused = notused.filter(function (el,j) {
            return i!=j;
        });
        notused_offsets = notused_offsets.filter(function (el, j) {
            return i!=j;
        });
        animal.setScale(ANIMAL_SCALE);
        animal.body.allowRotation = false;
        animal.setCollisionCategory(scene.obstacleCat);
        animal.setCollidesWith([scene.elephantCat, scene.obstacleCat]);
        animal.setSensor(true);
        scene.addInsideScreenObject(animal);
        return animal;
    }
    spawnAnimalRel(u = 0, v = 0, offsetX = 0, offsetY = 0){
        this.spawnAnimal(u * this.width + offsetX, v * this.height + offsetY);
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
        for (var j = 0; j < count; j++) {
            var animalX = Phaser.Math.Between(x, x2);
            var animalY = Phaser.Math.Between(y, y2);
            this.spawnAnimal(animalX, animalY);
        }
    }
    animalCircle(x:number, y:number, radius:number,  angle:number, count:integer){
        var scene = this.scene;
        var animals = this.genAnimals( count);
        var circle = new Phaser.Geom.Circle(x,y,radius);
        var updateCircle;
        updateCircle = (function(event){
            animals = animals.filter(function(animal){
                return animal.body != undefined && animal.body.label === "animal";});
            Phaser.Actions.RotateAroundDistance(animals,{x: x, y:y}, angle, radius);

            if(animals.length == 0){
                // @ts-ignore
                scene.events.removeListener("update", updateCircle);
            }
        }).bind(this);
        scene.events.on("update", updateCircle, this);
        Phaser.Actions.PlaceOnCircle(animals, circle);
        return animals;
    }
    addBarrier( x = 0, y = 0, scale = 1){
        var scene = this.scene;
        var barrier = scene.matter.add.image(x,y, "square_nodetailsOutline", "elephant.png");
        barrier.setScale(scale);
        barrier.setStatic(true);
        barrier.tint = 0x888888;

        barrier.setCollisionCategory(scene.obstacleCat);

        scene.addInsideScreenObject(barrier);
        return barrier;
    }
    genBarriers(count:number){
        var items = []
        for(var i = 0; i < count; i++){
            items.push(this.addBarrier());
        }
        return items;
    }
    genAnimals(count:number){
        var items = []
        for(var i = 0; i < count; i++){
            items.push(this.spawnAnimal());
        }
        return items;
    }
    spawnShelter(x,y): void{
        var scene = this.scene;
        var shelter = scene.matter.add.image(x,y, 'square', 'elephant.png');
        shelter.setScale(3);
        shelter.body.label = "shelter";
        shelter.setSensor(true);
        shelter.setStatic(true);
        shelter.setCollidesWith(scene.obstacleCat);
        shelter.setCollisionCategory(scene.obstacleCat);

        scene.addShelter(shelter);

    }


    addObstaclesAndAnimals(x:number, y:number,
                           obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID),
                           variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
        this.addObstacles( x,y, obstacle_id, variant_id);
        this.addAnimals(x,y, obstacle_id, variant_id);

    }
    addObstacles( x:number, y:number,
                 obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID),
                 variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
        var w = this.width;
        var h = this.height;
        if (obstacle_id === 0) {// Left and right 1/4 barrier.
            var left = this.genBarriers(2);
            var right = this.genBarriers( 2);
            var leftLine = new Line(x + 64, y + h / 2, x + w / 4 + 64, y + h / 2);
            var rightLine = new Line(x + w - 64, y + h / 2, x + w * 3 / 4 - 64, y + h / 2);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);

        } else if (obstacle_id === 1) {// Left-right-left 1/4
            var left = this.genBarriers( 2);
            var right = this.genBarriers( 2);
            var left2 = this.genBarriers( 2);

            var leftLine = new Line(x + 64, y + h / 4, x + w / 4 + 64, y + h / 4);
            var rightLine = new Line(x + w - 64, y + h / 2, x + w * 3 / 4 - 64, y + h / 2);
            var leftLine2 = new Line(x + 64, y + h * 3 / 4, x + w / 4 + 64, y + h * 3 / 4);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(left2, leftLine2);
        } else if (obstacle_id === 2) {// Left-right-left 1/2
            var left = this.genBarriers( 4);
            var right = this.genBarriers( 4);
            var left2 = this.genBarriers( 4);

            var leftLine = new Line(x + 64, y + h / 4, x + w / 2 + 64, y + h / 4);
            var rightLine = new Line(x + w - 64, y + h / 2, x + w / 2 - 64, y + h / 2);
            var leftLine2 = new Line(x + 64, y + h * 3 / 4, x + w / 2 + 64, y + h * 3 / 4);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(left2, leftLine2);
        } else if (obstacle_id === 3) {// Right-Left-Right 1/4
            var left = this.genBarriers( 2);
            var right = this.genBarriers( 2);
            var right2 = this.genBarriers( 2);

            var leftLine = new Line(x + 64, y + h / 2, x + w / 4 + 64, y + h / 2);
            var rightLine = new Line(x + w - 64, y + h / 4, x + w * 3 / 4 - 64, y + h / 4);
            var rightLine2 = new Line(x + w - 64, y + h * 3 / 4, x + w * 3 / 4 - 64, y + h * 3 / 4);

            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(right2, rightLine2);
        } else if (obstacle_id === 4) {// Right-Left-Right 1/2
            var left = this.genBarriers( 4);
            var right = this.genBarriers( 4);
            var right2 = this.genBarriers( 4);

            var leftLine = new Line(x + 64, y + h / 2, x + w / 2 + 64, y + h / 2);
            var rightLine = new Line(x + w - 64, y + h / 4, x + w / 2 - 64, y + h / 4);
            var rightLine2 = new Line(x + w - 64, y + h * 3 / 4, x + w / 2 - 64, y + h * 3 / 4);

            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(right2, rightLine2);
        } else if (obstacle_id === 5) {// Random
            var items = this.genBarriers( 3);
            var rect = new Rectangle(x, y, w, h);
            Phaser.Actions.RandomRectangle(items, rect);
        } else if (obstacle_id === 6) {// Nothing

        } else if (obstacle_id === 7) {// Middle 1/2
            var middle = this.genBarriers( 4);
            var middleLine = new Line(x + w / 4 + 64, y + h / 2, x + w * 3 / 4 + 64, y + h / 2);


            Phaser.Actions.PlaceOnLine(middle, middleLine);

        } else if (obstacle_id === 8) {// Middle 1/4
            var middle = this.genBarriers( 2);
            var middleLine = new Line(x + w * 3 / 8 + 64, y + h / 2, x + w * 5 / 8 + 64, y + h / 2);


            Phaser.Actions.PlaceOnLine(middle, middleLine);

        } else if (obstacle_id === 9) {//L&R, mid, L&R
            var left = this.genBarriers( 2);
            var right = this.genBarriers( 2);
            var leftLine = new Line(x + 64, y + h / 4, x + w / 4 + 64, y + h / 4);
            var rightLine = new Line(x + w - 64, y + h / 4, x + w * 3 / 4 - 64, y + h / 4);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);

            left = this.genBarriers( 2);
            right = this.genBarriers( 2);
            leftLine = new Line(x + 64, y + h * 3 / 4, x + w / 4 + 64, y + h * 3 / 4);
            rightLine = new Line(x + w - 64, y + h * 3 / 4, x + w * 3 / 4 - 64, y + h * 3 / 4);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);

            var middle = this.genBarriers( 4);
            var middleLine = new Line(x + w / 4 + 64, y + h / 2, x + w * 3 / 4 + 64, y + h / 2);


            Phaser.Actions.PlaceOnLine(middle, middleLine);

        }
    }
    addAnimals(x:number, y:number,
               obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID),
               variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
        var w = this.width;
        var h = this.height;
        switch (obstacle_id) {
            case 0: // Left and right 1/4 barrier.
                switch (variant_id) {
                    case 0: // 1 Front Left
                        this.spawnAnimal( x+64, y+ h/2+ 128);
                        break;
                    case 1:// 2 Front Left
                        this.spawnAnimal( x+64, y+ h/2+ 128);
                        this.spawnAnimal( x+64+128, y+ h/2+ 128);
                        break;
                    case 2: // 1 Front Right
                        this.spawnAnimal( x+w-64, y+ h/2+ 128);
                        break;
                    case 3: // 2 Front Right
                        this.spawnAnimal( x+w-64, y+ h/2+ 128);
                        this.spawnAnimal( x+w-64-128, y+ h/2+ 128);
                        break;
                    case 4: // 2 Front Left-Right
                        this.spawnAnimal( x+w-64, y+ h/2+ 128);
                        this.spawnAnimal( x+64, y+ h/2+ 128);
                        break;
                    case 5: // 4 Front Left-Right
                        this.spawnAnimal( x+w-64, y+ h/2+ 128);
                        this.spawnAnimal( x+w-64-128, y+ h/2+ 128);
                        this.spawnAnimal( x+64, y+ h/2+ 128);
                        this.spawnAnimal( x+64+128, y+ h/2+ 128);
                        break;
                    case 6: // 1 Behind Left
                        this.spawnAnimal( x+64, y+ h/2- 128);
                        break

                    case 7: // 1 Behind Right
                        this.spawnAnimal( x+w-64, y+ h/2- 128);
                        break;
                    case 8: // 2 Behind Left-Right
                        this.spawnAnimal( x+64, y+ h/2- 128);
                        this.spawnAnimal( x+w-64-128, y+ h/2- 128);
                        break;
                    case 9: // 2 Middle
                        this.spawnAnimal( x + w/2 - 128, y + h / 2);
                        this.spawnAnimal( x + w/2 + 128, y + h / 2);
                        break;
                    case 10: // 4 Middle
                        this.spawnAnimal( x + w/2 - 128 - 64, y + h / 2);
                        this.spawnAnimal( x + w/2 + 128 + 64, y + h / 2);
                        this.spawnAnimal( x + w/2  - 64, y + h / 2);
                        this.spawnAnimal( x + w/2  + 64, y + h / 2);
                        break;
                    case 11: // 8 Middle Jackpot
                        this.spawnAnimal( x + w/2 - 128 - 64, y + h / 2);
                        this.spawnAnimal( x + w/2 + 128 + 64, y + h / 2);
                        this.spawnAnimal( x + w/2  - 64, y + h / 2);
                        this.spawnAnimal( x + w/2  + 64, y + h / 2);
                        this.spawnAnimal( x + w/2  - 64, y + 128 + h / 2);
                        this.spawnAnimal( x + w/2  + 64, y + 128 + h / 2);
                        this.spawnAnimal( x + w/2  - 64, y - 128 +  h / 2);
                        this.spawnAnimal( x + w/2  + 64, y - 128 + h / 2);
                        break;


                }
                break;
            case 1: // Left-right-left 1/4
                switch (variant_id) {
                    case 0: // Mid
                        this.spawnAnimalRel( 0.30, 0.75, x, y);
                        this.spawnAnimalRel( 0.30, 0.25, x, y);
                        this.spawnAnimalRel( 0.70, 0.50, x, y);
                        break;
                    case 1: // Behind obstacles
                        this.spawnAnimalRel( 0, 0.75, x + 64, y-128);
                        this.spawnAnimalRel( 0, 0.25, x + 64, y-128);
                        this.spawnAnimalRel( 1, 0.5, x - 64, y-128);
                        break;
                    case 2: // Sinusoidal jackpot
                        for(var i = 0; i < 10; i++){
                            var t = i / 9;
                            var u = 0.25 + (1 - Math.sin(t*Math.PI)) * 0.5;
                            var v = 0.25 + t * 0.5;
                            this.spawnAnimalRel(u, v);
                        }

                        break;
                }
                break;
            case 2: // Left-right-left 1/2
                switch (variant_id) {
                    case 0: //Circle mid
                        this.animalCircle(x + w / 4, y + h / 2, w / 16, 0.05, 3);
                        break;
                    case 1: //Circle front mid behind
                        this.animalCircle(x + w / 4, y + h / 2, w / 16, 0.05, 3);
                        this.animalCircle(x + 3 * w / 4, y + h / 4, w / 16, 0.05, 3);
                        this.animalCircle(x + 3 * w / 4, y + 3 * h / 4, w / 16, 0.05, 3);
                        break;
                }
                break;
            case 3: // Right-Left-Right 1/4

            case 4: // Right-Left-Right 1/2

            case 5: // Random

            case 6: // Nothing
                this.spawnAnimals( x, y, x + w, y + h, ANIMALS_SPAWN);
                break;
            case 7: // Middle 1/2
                switch (variant_id) {
                    case 0: //Circle
                        this.animalCircle( x + w/2,y+  h/2, w * 3/8, 0.02, 10);
                        break;
                    case 1: //Fill line
                        this.spawnAnimal( x+64, y+ h/2);
                        this.spawnAnimal( x+64+128, y+ h/2);
                        this.spawnAnimal( x+w-64, y+ h/2);
                        this.spawnAnimal( x+w-64-128, y+ h/2);
                        break;
                }
                break;
            case 8://Middle 1/4
                switch (variant_id) {
                    case 0: // Circle jackpot
                        this.animalCircle( x + w/2, y + h/2, w * 3/8, 0.02, 10);
                        break;
                    case 1: // Fill line
                        this.spawnAnimal( x+64, y+ h/2);
                        this.spawnAnimal( x+64+128, y+ h/2);
                        this.spawnAnimal( x+64+256, y+ h/2);
                        this.spawnAnimal( x+w-64, y+ h/2);
                        this.spawnAnimal( x+w-64-128, y+ h/2);
                        this.spawnAnimal( x+w-64-256, y+ h/2);
                        break;
                }
                break;
            case 9://L&R, mid, L&R
                switch (variant_id) {
                    case 0: //Circle jackpot
                        this.animalCircle( x + w/2, y + h/2, w * 3/8, 0.02, 10);
                        break;
                    case 1: //Fill mid line
                        this.spawnAnimal( x+64, y+ h/2);
                        this.spawnAnimal( x+64+128, y+ h/2);
                        this.spawnAnimal( x+w-64, y+ h/2);
                        this.spawnAnimal( x+w-64-128, y+ h/2);
                        break;
                    case 2: // 4 Behind
                        this.spawnAnimal( x + w/2 - 128 - 64, y + h / 4);
                        this.spawnAnimal( x + w/2 + 128 + 64, y + h / 4);
                        this.spawnAnimal( x + w/2  - 64, y + h / 4);
                        this.spawnAnimal( x + w/2  + 64, y + h / 4);
                        break;
                    case 3: // 4 Front
                        this.spawnAnimal( x + w/2 - 128 - 64, y + h*3 / 4);
                        this.spawnAnimal( x + w/2 + 128 + 64, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  - 64, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  + 64, y + h*3 / 4);
                        break;
                    case 4://Slalom L (Front MidLeft, Mid Right, Behind MidLeft)
                        this.spawnAnimal( x + w/2 - 128 - 64, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  - 64, y + h*3 / 4);

                        this.spawnAnimal( x + w/2 - 128 - 64, y + h / 4);
                        this.spawnAnimal( x + w/2  - 64, y + h / 4);

                        this.spawnAnimal( x+w-64, y+ h/2);
                        this.spawnAnimal( x+w-64-128, y+ h/2);
                        break;
                    case 5://Slalom R (Front MidR, Mid L, Behind MidR)
                        this.spawnAnimal( x + w/2 + 128 + 64, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  + 64, y + h*3 / 4);

                        this.spawnAnimal( x + w/2 + 128 + 64, y + h / 4);
                        this.spawnAnimal( x + w/2  + 64, y + h / 4);

                        this.spawnAnimal( x+64, y+ h/2);
                        this.spawnAnimal( x+64+128, y+ h/2);
                        break;
                    case 6://4 MidFront
                        this.spawnAnimal( x + w/2 - 128 - 64, y + h / 2 + 128);
                        this.spawnAnimal( x + w/2 + 128 + 64, y + h / 2 + 128);
                        this.spawnAnimal( x + w/2  - 64, y + h / 2 + 128);
                        this.spawnAnimal( x + w/2  + 64, y + h / 2 + 128);
                        break;
                }
                break;
        }
    }

    addObstaclesWithShelter( x:number, y:number,  id = Phaser.Math.Between(0,SHELTER_MAX_ID)) {
        var w = this.width;
        var h = this.height;
        switch (id) {
            case 0:
                this.addObstaclesAndAnimals( x, y, 0);
                this.spawnShelter( x + w / 2, y + h/2);
                break;
        }
    }

}

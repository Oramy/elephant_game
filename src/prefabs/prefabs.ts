import {ANIMAL_SCALE, ANIMALS_SPAWN, MainScene, ROUND_Y_OFFSETS} from "../scenes/mainScene";
import Line = Phaser.Geom.Line;
import Rectangle = Phaser.Geom.Rectangle;
import GameObject = Phaser.GameObjects.GameObject;
import FloatBetween = Phaser.Math.FloatBetween;
import Vector2 = Phaser.Math.Vector2;

var notused = [];
var notused_offsets = [];
/**
 * Spawn a random animal at position x, y
 * @param x
 * @param y
 */
export const OBSTACLE_MAX_ID = 27;
export const EASY_OBSTACLE_MAX_ID = 10;
export const VARIANTS_MAX_ID = [4,
    1, 1, 1, 1, 0, 0, 1, 1, 6, 1,
    1, 1, 4, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 1, 0, 0, 0];
export const SHELTER_MAX_ID = 1;

var SC;
export class Prefabs{
    private width: any;
    private height: any;
    private scene: MainScene;
    private spikesOptions: object;


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

        SC = scene.sys.canvas.height / 1920;

        this.spikesOptions = {
            body: {
                type: 'rectangle',
                width: 80,
                height: 20
            }
        };
    }
    spawnAnimal(x = 0,y = 0): GameObject{
        var scene = this.scene;

        var gold = Phaser.Math.FloatBetween(0, 1) < 1/20;

        if(notused.length == 0){
            notused = notused.concat(scene.roundFrames);
            notused_offsets = ROUND_Y_OFFSETS;
        }
        var i = Phaser.Math.Between(0, notused.length - 1);
        var key = 'roundQuarter';

        var frame = notused[i];
        let animal = scene.getAnimal();

        animal.spawn(x, y, frame, scene);
        animal.body.render.sprite.yOffset = notused_offsets[i];
        notused = notused.filter(function (el,j) {
            return i!=j;
        });
        notused_offsets = notused_offsets.filter(function (el, j) {
            return i!=j;
        });

        scene.addInsideScreenObject(animal);
        // @ts-ignore
        animal.gold = gold;
        if(gold){
            animal.tint = 0xDAA520;

        }
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
    move(objects, offset){
        objects.forEach(function(object){
            object.x = object.baseX + offset.x;
            object.y = object.baseY + offset.y;

        });
    }
    objectsMovement(objects, xMove, yMove, aliveCondition = (function(object){
        return object.body != undefined}), angle = 0){
        var scene = this.scene;
        var updateMove;
        var t = 0;

        objects.forEach(function(object){
            object.baseX = object.x;
            object.baseY = object.y;
        })
        updateMove = (function(event){
            objects = objects.filter(aliveCondition);
            objects.forEach((function(object){
                object.rotation += angle;
            }).bind(this));
            t += 1 / 60;
            this.move(objects,{x: xMove(t), y:yMove(t)});

            if(objects.length == 0){
                // @ts-ignore
                scene.events.removeListener("update", updateMove);
            }
        }).bind(this);
        scene.events.on("update", updateMove, this);
        return objects;
    }
    objectCircle(x:number, y:number, radius:number,  angle:number, objects, aliveCondition, rotate = false){
        var scene = this.scene;
        var circle = new Phaser.Geom.Circle(x,y,radius);
        var updateCircle;
        updateCircle = (function(event){
            objects = objects.filter(aliveCondition);
            if(rotate){
                objects.forEach((function(object){
                    object.rotation += angle;
                }).bind(this));
            }
            Phaser.Actions.RotateAroundDistance(objects,{x: x, y:y}, angle, radius);

            if(objects.length == 0){
                // @ts-ignore
                scene.events.removeListener("update", updateCircle);
            }
        }).bind(this);
        scene.events.on("update", updateCircle, this);
        Phaser.Actions.PlaceOnCircle(objects, circle);
        if(rotate){
            var center = new Vector2(x,y);
            objects.forEach((function(object){
                var pos = new Vector2(object.x, object.y);
                object.rotation =  pos.subtract(center.clone()).angle();
            }).bind(this));
        }
        return objects;
    }
    animalCircle(x:number, y:number, radius:number,  angle:number, count:integer){
        var aliveCondition = function(animal){
            return animal.body != undefined && animal.body.label === "animal";};
        var animals = this.genAnimals(count);
        return this.objectCircle(x, y, radius, angle, animals, aliveCondition);
    }

    rotateArray(objects, angle){
        objects.forEach((function(object){
            object.rotation += angle;
        }).bind(this));
    }
    barrierCircle(x:number, y:number, radius:number, angle:number, count:integer,
                  frame="fence.png", barrierAngle = 0, kill = false, options={}){
        var aliveCondition = function(barrier){
            return barrier.body != undefined};

        var barriers = this.genBarriers(count, frame, kill, options);
        barriers = this.objectCircle(x, y, radius, angle, barriers,aliveCondition, true);
        this.rotateArray(barriers, barrierAngle);
        return  barriers;
    }
    addBarrier( x = 0, y = 0, scale = 1, frame = 'fence.png', kill = false, options = {}){
        var scene = this.scene;
        var barrier = scene.matter.add.image(x,y, "spritesheet_other", frame, options);
        barrier.setScale(scale*2.2 * SC);
        barrier.setStatic(true);

        if(kill){
            barrier.body.label = 'disableControl';
        }
        barrier.setCollisionCategory(scene.obstacleCat);

        scene.addInsideScreenObject(barrier);
        return barrier;
    }
    genBarriers(count:number, frame='fence.png', kill=false, options={}){
        var items = []
        for(var i = 0; i < count; i++){
            items.push(this.addBarrier(0, 0, 1, frame, kill, options));
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
        var shelter = scene.matter.add.image(x,y, 'square', this.scene.getCharacter() + '.png');
        shelter.setScale(3 * SC);
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
        this.addAnimals(x,y, obstacle_id, variant_id);
        this.addObstacles( x,y, obstacle_id, variant_id);


    }
    addObstacles( x:number, y:number,
                  obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID),
                  variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
        var w = this.width;
        var h = this.height;
        switch (obstacle_id) {

            case 0:// Left and right 1/4 barrier.
                var left = this.genBarriers(2);
                var right = this.genBarriers(2);
                var leftLine = new Line(x + 64 * SC, y + h / 2, x + 64 * SC + w / 4, y + h / 2);
                var rightLine = new Line(x + w - 64 * SC, y + h / 2, x + w * 3 / 4 - 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);

                break;
            case 1:// Left-right-left 1/4
                var left = this.genBarriers(2);
                var right = this.genBarriers(2);
                var left2 = this.genBarriers(2);

                var leftLine = new Line(x + 64 * SC, y + h / 4, x + w / 4 + 64 * SC, y + h / 4);
                var rightLine = new Line(x + w - 64 * SC, y + h / 2, x + w * 3 / 4 - 64 * SC, y + h / 2);
                var leftLine2 = new Line(x + 64 * SC, y + h * 3 / 4, x + w / 4 + 64 * SC, y + h * 3 / 4);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                Phaser.Actions.PlaceOnLine(left2, leftLine2);
                break;
            case 2:// Left-right-left 1/2
                var left = this.genBarriers(4);
                var right = this.genBarriers(4);
                var left2 = this.genBarriers(4);

                var leftLine = new Line(x + 64 * SC, y + h / 4, x + w / 2 + 64 * SC, y + h / 4);
                var rightLine = new Line(x + w - 64 * SC, y + h / 2, x + w / 2 - 64 * SC, y + h / 2);
                var leftLine2 = new Line(x + 64 * SC, y + h * 3 / 4, x + w / 2 + 64 * SC, y + h * 3 / 4);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                Phaser.Actions.PlaceOnLine(left2, leftLine2);
                break;
            case 3:// Right-Left-Right 1/4
                var left = this.genBarriers(2);
                var right = this.genBarriers(2);
                var right2 = this.genBarriers(2);

                var leftLine = new Line(x + 64 * SC, y + h / 2, x + w / 4 + 64 * SC, y + h / 2);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w * 3 / 4 - 64 * SC, y + h / 4);
                var rightLine2 = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w * 3 / 4 - 64 * SC, y + h * 3 / 4);

                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                Phaser.Actions.PlaceOnLine(right2, rightLine2);
                break;
            case 4:// Right-Left-Right 1/2
                var left = this.genBarriers(4);
                var right = this.genBarriers(4);
                var right2 = this.genBarriers(4);

                var leftLine = new Line(x + 64 * SC, y + h / 2, x + w / 2 + 64 * SC, y + h / 2);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w / 2 - 64 * SC, y + h / 4);
                var rightLine2 = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w / 2 - 64 * SC, y + h * 3 / 4);

                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                Phaser.Actions.PlaceOnLine(right2, rightLine2);
                break;
            case 5:// Ladder Right
                var right3 = this.genBarriers(2);
                var right2 = this.genBarriers(2);
                var right = this.genBarriers(2);

                var rightLine3 = new Line(x + w -  64 * SC, y + h / 2, x + w * 3 / 4 - 64 * SC, y + h / 2);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w * 3 / 4 - 64 * SC, y + h / 4);
                var rightLine2 = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w * 3  / 4 - 64 * SC, y + h * 3 / 4);

                Phaser.Actions.PlaceOnLine(right3, rightLine3);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                Phaser.Actions.PlaceOnLine(right2, rightLine2);
                break;
            case 6:// Ladder Left
                var left3 = this.genBarriers(2);
                var left2 = this.genBarriers(2);
                var left = this.genBarriers(2);

                var leftLine3 = new Line(x +  64 * SC, y + h / 2, x + w * 1 / 4 + 64 * SC, y + h / 2);
                var leftLine = new Line(x + 64 * SC, y + h / 4, x + w * 1 / 4 + 64 * SC, y + h / 4);
                var leftLine2 = new Line(x + 64 * SC, y + h * 3 / 4, x + w * 1  / 4 + 64 * SC, y + h * 3 / 4);

                Phaser.Actions.PlaceOnLine(left3, leftLine3);
                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(left2, leftLine2);
                break;
            case 7:// Middle 1/2
                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 4 + 64 * SC, y + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);

                break;
            case 8:// Middle 1/4
                var middle = this.genBarriers(2);
                var middleLine = new Line(x + w * 3 / 8 + 64 * SC, y + h / 2, x + w * 5 / 8 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);

                break;
            case 9://L&R, mid, L&R
                var left = this.genBarriers(2);
                var right = this.genBarriers(2);
                var leftLine = new Line(x + 64 * SC, y + h / 4, x + w / 4 + 64 * SC, y + h / 4);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w * 3 / 4 - 64 * SC, y + h / 4);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);

                left = this.genBarriers(2);
                left = this.genBarriers(2);
                leftLine = new Line(x + 64 * SC, y + h * 3 / 4, x + w / 4 + 64, y + h * 3 / 4);
                leftLine = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w * 3 / 4 - 64 * SC, y + h * 3 / 4);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);

                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 4 + 64 * SC, y + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                break;
            case 10: // Block circle
                var angle = 0.02;
                angle *= variant_id % 2 == 0 ? 1 : -1;
                this.barrierCircle(x + w/2, y + h/2, w/3, angle, 2, 'blockBrown.png');
                break;
            case 11: // Spikes trap right
                this.addBarrier(x + w/2, y + h * 7 / 8, 1, 'signArrow_left.png');

                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 2, y + h / 4 + 64*SC, x + w /2, y + h * 3 /4 +64 *SC);

                var right = this.genBarriers(4, 'blockBrown.png');
                var rightLine = new Line(x + w - 64 * SC, y - 100*SC  + h / 4, x + w /2 - 64 * SC, y - 100*SC + h / 4);
                Phaser.Actions.PlaceOnLine(right, rightLine);


                var right = this.genBarriers(2, 'spikesHigh.png', true, this.spikesOptions);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w * 3/4 - 64 * SC, y + h / 4);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                this.rotateArray(right, Math.PI);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                break;
            case 12:// Spikes trap left
                this.addBarrier(x + w/2, y + h * 7 / 8, 1, 'signArrow_right.png');

                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 2, y + h / 4 + 64*SC, x + w /2, y + h * 3 /4 +64 *SC);

                var left = this.genBarriers(4, 'blockBrown.png');
                var leftLine = new Line(x +  64 * SC, y - 100*SC + h / 4, x + w * 1/2 + 64 * SC, y - 100*SC + h / 4);
                Phaser.Actions.PlaceOnLine(left, leftLine);

                var left = this.genBarriers(2, 'spikesHigh.png', true, this.spikesOptions);
                var leftLine = new Line(x +  64 * SC, y + h / 4, x + w * 1/4 + 64 * SC, y + h / 4);
                Phaser.Actions.PlaceOnLine(left, leftLine);
                this.rotateArray(left, Math.PI);



                Phaser.Actions.PlaceOnLine(middle, middleLine);
                break;
            case 13:// Left and right 1/4 spikes.
                var left = this.genBarriers(2, 'blockBrown.png', );
                var right = this.genBarriers(2, 'blockBrown.png',);
                var leftLine = new Line(x + 64 * SC, y + h / 2 - 100 * SC, x + 64 * SC + w / 4, y + h / 2  - 100 * SC);
                var rightLine = new Line(x + w - 64 * SC, y + h / 2  - 100 * SC, x + w * 3 / 4 - 64 * SC, y + h / 2  - 100 * SC);



                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);

                var left = this.genBarriers(2, 'spikesHigh.png', true, this.spikesOptions);
                var right = this.genBarriers(2, 'spikesHigh.png', true, this.spikesOptions);
                var leftLine = new Line(x + 64 * SC, y + h / 2, x + 64 * SC + w / 4, y + h / 2);
                var rightLine = new Line(x + w - 64 * SC, y + h / 2, x + w * 3 / 4 - 64 * SC, y + h / 2);



                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                this.rotateArray(left, Math.PI);
                this.rotateArray(right, Math.PI);


                break;
            case 14:// Middle 1/2 Spikes
                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w / 4 + 64 * SC, y  - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y - 100 * SC + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);

                var middle = this.genBarriers(4, 'spikesHigh.png', true, this.spikesOptions);
                var middleLine = new Line(x + w / 4 + 64 * SC, y + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.rotateArray(middle, Math.PI);



                break;
            case 15:// Middle 1/4 Spikes
                var middle = this.genBarriers(2, 'blockBrown.png');
                var middleLine = new Line(x + w * 3 / 8 + 64 * SC, y - 100 * SC + h / 2, x + w * 5 / 8 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);

                var middle = this.genBarriers(2, 'spikesHigh.png', true, this.spikesOptions);
                var middleLine = new Line(x + w * 3 / 8 + 64 * SC, y + h / 2, x + w * 5 / 8 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.rotateArray(middle, Math.PI);

                break;
            case 16: // Spiked-Block circle
                var angle = 0.02;
                angle *= variant_id % 2 == 0 ? 1 : -1;
                this.barrierCircle(x + w/2, y + h/2, w/3, angle, 2, 'blockBrown.png');
                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 - 96*SC, angle,
                  2, 'spikesHigh.png', -Math.PI /2, true, this.spikesOptions);
                spikes.forEach(function(spike){
                    spike.setOrigin(0.5, 0.5);
                });
                break;

            case 17: // Full-Spiked-Block circle
                var angle = 0.02;
                var sign =variant_id % 2 == 0 ? 1 : -1;
                angle *= sign;
                this.barrierCircle(x + w/2, y + h/2, w/3, angle, 2, 'blockBrown.png');
                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 + 100*SC, angle,
                  2, 'spikesHigh.png', Math.PI /2, true, this.spikesOptions);

                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 - 100*SC, angle,
                  2, 'spikesHigh.png', -Math.PI /2, true, this.spikesOptions);

                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 + 15*SC, angle,
                  2, 'spikesHigh.png', 0, true, this.spikesOptions);

                Phaser.Actions.RotateAroundDistance(spikes,{x: x +w/2, y:y+h/2}, -20*SC*angle*sign,  w/3 + 15 * SC);

                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 + 15*SC, angle,
                  2, 'spikesHigh.png', Math.PI, true, this.spikesOptions);

                Phaser.Actions.RotateAroundDistance(spikes,{x: x +w/2, y:y+h/2}, 20*SC*angle*sign,  w/3 + 15 * SC);

                break;

            case 18: //Sinusoidal move
                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => Math.sin(5 * t) * w * 1/4, t => 0);


                break;
            case 19: //Squared signal cascade
                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);

                var delay = variant_id == 0 ? 1 : 0;
                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => Phaser.Math.Clamp(5 * Math.sin(3 * (t+delay)), -1, 1) * w * 1/4, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 520 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 520 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => Phaser.Math.Clamp(5 * Math.sin(3 * (t +delay - 0.3)), -1, 1) * w * 1/4, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y + 320 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 + 320 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => Phaser.Math.Clamp(5 * Math.sin(3 * (t + delay + 0.3)), -1, 1) * w * 1/4, t => 0);


                break;
            case 20: //Squared signal
                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);
                var delay = variant_id == 0 ? 1 : 0;


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => Phaser.Math.Clamp(5 * Math.sin(3 * (t + delay)), -1, 1) * w * 1/4, t => 0);


                break;
            case 21: // Moving spikes R
                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => (t % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t-1) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 240 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 240 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t - 0.125) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 240 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 240 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t - 1.125) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 380 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 380 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t - 0.250) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 380 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 380 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t - 1.250) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 520 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 520 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t - 0.375) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 520 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 520 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => ((t - 1.375) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'spikesHigh.png', true, this.spikesOptions);
                var middleLine = new Line(x + w - 32 * SC, y - 520 * SC + h / 2, x + w - 32 * SC, y + 32*SC + h / 2 );


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.rotateArray(middle, -Math.PI / 2);


                break;
            case 22: // Moving spikes L
                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -(t % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 100 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t-1) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 240 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 240 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t - 0.125) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 240 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 240 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t - 1.125) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 380 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 380 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t - 0.250) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 380 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 380 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t - 1.250) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 520 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 520 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t - 0.375) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'blockBrown.png');
                var middleLine = new Line(x + w * 1 / 4 + 64 * SC, y - 520 * SC + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2 - 520 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.objectsMovement(middle, t => -((t - 1.375) % 2 - 1) * w, t => 0);

                var middle = this.genBarriers(4, 'spikesHigh.png', true, this.spikesOptions);
                var middleLine = new Line(x + 32 * SC, y - 520 * SC + h / 2, x + 32 * SC, y + 32*SC + h / 2 );


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.rotateArray(middle, Math.PI / 2);


                break;

            case 23: // Supermarket block
                var angle = 0.04;
                angle *= variant_id % 2 == 0 ? 1 : -1;
                this.barrierCircle(x + w/2, y + h/2, w/4 - 64*SC, angle, 2, 'blockBrown.png');


                var angle = 0.04;
                angle *= variant_id % 2 == 0 ? 1 : -1;
                this.barrierCircle(x + w/2, y + h/2, w/4 - 204*SC, angle, 2, 'blockBrown.png');

                var left = this.genBarriers(2);
                var right = this.genBarriers(2);
                var leftLine = new Line(x + 16 * SC, y + h / 2, x + 16 * SC + w / 4, y + h / 2);
                var rightLine = new Line(x + w - 16 * SC, y + h / 2, x + w * 3 / 4 - 16 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);

                break;
            case 24:
                var right3 = this.genBarriers(3);
                var right2 = this.genBarriers(2);
                var right = this.genBarriers(4);

                var rightLine3 = new Line(x + w -  64 * SC, y + h / 2, x + w * 2 / 3 - 64 * SC, y + h / 2);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w * 2 / 4 - 64 * SC, y + h / 4);
                var rightLine2 = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w * 3  / 4 - 64 * SC, y + h * 3 / 4);

                Phaser.Actions.PlaceOnLine(right3, rightLine3);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                Phaser.Actions.PlaceOnLine(right2, rightLine2);

                break
            case 25:
                var left3 = this.genBarriers(3);
                var left2 = this.genBarriers(2);
                var left = this.genBarriers(4);

                var leftLine3 = new Line(x +  64 * SC, y + h / 2, x + w * 1 / 3 + 64 * SC, y + h / 2);
                var leftLine = new Line(x + 64 * SC, y + h / 4, x + w * 2 / 4 + 64 * SC, y + h / 4);
                var leftLine2 = new Line(x + 64 * SC, y + h * 3 / 4, x + w * 1  / 4 + 64 * SC, y + h * 3 / 4);

                Phaser.Actions.PlaceOnLine(left3, leftLine3);
                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(left2, leftLine2);

                break
            case 26:
                var left2 = this.genBarriers(5);
                var left = this.genBarriers(5);

                var leftLine = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w * 1 / 4 - 64 * SC, y + h * 3 / 4);
                var leftLine2 = new Line(x + 64 * SC, y + h * 3 / 8, x + w * 3  / 4 + 64 * SC, y + h * 3 / 8    );

                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(left2, leftLine2);

                break
            case 27:
                var left2 = this.genBarriers(5);
                var left = this.genBarriers(5);

                var leftLine = new Line(x +  64 * SC, y + h * 3 / 4, x + w * 3 / 4 + 64 * SC, y + h * 3 / 4);
                var leftLine2 = new Line(x + w - 64 * SC, y + h * 3 / 8, x + w * 1  / 4 - 64 * SC, y + h * 3 / 8    );

                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(left2, leftLine2);

                break

        }
    }
    addAnimals(x:number, y:number,
               obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID),
               variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
        var w = this.width;
        var h = this.height;
        switch (obstacle_id) {
            case 13:// Left and right 1/4 spikes.
            case 0: // Left and right 1/4 barrier.
                switch (variant_id) {
                    case 0:// 2 Front Left
                        this.spawnAnimal( x+64*SC, y+ h/2+ 128*SC);
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2+ 128*SC);
                        break;
                    case 1: // 2 Front Right
                        this.spawnAnimal( x+w-64*SC, y+ h/2+ 128*SC);
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2+ 128*SC);
                        break;
                    case 2: // 4 Front Left-Right
                        this.spawnAnimal( x+w-64*SC, y+ h/2+ 128*SC);
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2+ 128*SC);
                        this.spawnAnimal( x+64*SC, y+ h/2+ 128*SC);
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2+ 128*SC);
                        break;
                    case 3: // 4 Middle
                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h / 2);
                        break;
                    case 4: // 8 Middle Jackpot
                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h / 2);
                        this.spawnAnimal( x + w/2  - 64*SC, y + 128*SC + h / 2);
                        this.spawnAnimal( x + w/2  + 64*SC, y + 128*SC + h / 2);
                        this.spawnAnimal( x + w/2  - 64*SC, y - 128*SC +  h / 2);
                        this.spawnAnimal( x + w/2  + 64*SC, y - 128*SC + h / 2);
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
                    case 1: // Sinusoidal jackpot
                        for(var i = 0; i < 5; i++){
                            var t = i / 4;
                            var u = 0.25 + (1 - Math.sin(t*Math.PI)) * 0.5;
                            var v = 0.25 + t * 0.5;
                            this.spawnAnimalRel(u, v, x, y);
                        }

                        break;
                }
                break;
            case 2: // Left-right-left 1/2
                switch (variant_id) {
                    case 0: //Circle mid
                        this.animalCircle(x + w / 4, y + h / 2, w / 8, 0.05, 5);
                        break;
                    case 1: //Circle front mid behind
                        this.animalCircle(x + w / 4, y + h / 2, w / 16, 0.05, 2);
                        this.animalCircle(x + 3 * w / 4, y + h / 4, w / 16, 0.05, 2);
                        this.animalCircle(x + 3 * w / 4, y + 3 * h / 4, w / 16, 0.05, 2);
                        break;
                }
                break;
            case 3: // Right-Left-Right 1/4
                switch (variant_id) {
                    case 0: // Mid
                        this.spawnAnimalRel( 0.70, 0.75, x, y);
                        this.spawnAnimalRel( 0.70, 0.25, x, y);
                        this.spawnAnimalRel( 0.30, 0.50, x, y);
                        break;
                    case 1: // Sinusoidal jackpot
                        for(var i = 0; i < 5; i++){
                            var t = i / 4;
                            var u = 0.25 + (1 - Math.sin(t*Math.PI)) * 0.5;
                            var u = 1 - u;
                            var v = 0.25 + t * 0.5;
                            this.spawnAnimalRel(u, v, x, y);
                        }

                        break;
                }
                break;

                break;
            case 4: // Right-Left-Right 1/2
                switch (variant_id) {
                    case 0: //Circle mid
                        this.animalCircle(x + w * 3 / 4, y + h / 2, w / 8, 0.05, 5);
                        break;
                    case 1: //Circle front mid behind
                        this.animalCircle(x + w * 3/ 4, y + h / 2, w / 16, 0.05, 2);
                        this.animalCircle(x + w / 4, y + h / 4, w / 16, 0.05, 2);
                        this.animalCircle(x + w / 4, y + 3 * h / 4, w / 16, 0.05, 2);
                        break;
                }
                break;
            case 5: // Ladder Right
                switch (variant_id) {
                    case 0:
                        this.spawnAnimal( x+w-64*SC, y+ h/2+ 128*SC)
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2+ 128*SC)

                        this.spawnAnimal( x+w-64*SC, y+ h/4+ 128*SC)
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/4+ 128*SC)

                        this.spawnAnimal( x+w-64*SC, y+ h * 3 / 4+ 128*SC)
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h * 3 / 4+ 128*SC)
                        break
                }
                break
            case 6: // Ladder Left
                switch (variant_id) {
                    case 0:
                        this.spawnAnimal( x+64*SC, y+ h/2+ 128*SC)
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2+ 128*SC)

                        this.spawnAnimal( x+64*SC, y+ h/4+ 128*SC)
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/4+ 128*SC)

                        this.spawnAnimal( x+64*SC, y+ h * 3 / 4+ 128*SC)
                        this.spawnAnimal( x+64*SC+128*SC, y+ h * 3 / 4+ 128*SC)
                        break
                }
                break
            case 14: //Middle 1/2 Spikes
            case 7: // Middle 1/2
                switch (variant_id) {
                    case 0: //Circle
                        this.animalCircle( x + w/2,y+  h/2, w * 3/8, 0.03, 5);
                        break;
                    case 1: //Fill line
                        this.spawnAnimal( x+64*SC, y+ h/2);
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2);
                        break;
                }
                break;
            case 15: //Middle 1/2 Spikes
            case 8://Middle 1/4
                switch (variant_id) {
                    case 0: // Circle jackpot
                        this.animalCircle( x + w/2, y + h/2, w * 3/8, 0.03, 5);
                        break;
                    case 1: // Fill line
                        this.spawnAnimal( x+64*SC, y+ h/2);
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2);
                        this.spawnAnimal( x+64*SC+256*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC-256*SC, y+ h/2);
                        break;
                }
                break;
            case 9://L&R, mid, L&R
                switch (variant_id) {
                    case 0: //Circle jackpot
                        this.animalCircle( x + w/2, y + h/2, w * 3/8, 0.03, 5);
                        break;
                    case 1: //Fill mid line
                        this.spawnAnimal( x+64*SC, y+ h/2);
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2);
                        break;
                    case 2: // 4 Behind
                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h / 4);
                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h / 4);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h / 4);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h / 4);
                        break;
                    case 3: // 4 Front
                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h*3 / 4);
                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h*3 / 4);
                        break;
                    case 4://Slalom L (Front MidLeft, Mid Right, Behind MidLeft)
                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h*3 / 4);

                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h / 4);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h / 4);

                        this.spawnAnimal( x+w-64*SC, y+ h/2);
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h/2);
                        break;
                    case 5://Slalom R (Front MidR, Mid L, Behind MidR)
                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h*3 / 4);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h*3 / 4);

                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h / 4);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h / 4);

                        this.spawnAnimal( x+64*SC, y+ h/2);
                        this.spawnAnimal( x+64*SC+128*SC, y+ h/2);
                        break;
                    case 6://4 MidFront
                        this.spawnAnimal( x + w/2 - 128*SC - 64*SC, y + h / 2 + 128*SC);
                        this.spawnAnimal( x + w/2 + 128*SC + 64*SC, y + h / 2 + 128*SC);
                        this.spawnAnimal( x + w/2  - 64*SC, y + h / 2 + 128*SC);
                        this.spawnAnimal( x + w/2  + 64*SC, y + h / 2 + 128*SC);
                        break;
                }
                break;
            case 16:
            case 17:
            case 10: // Barrier circle
                switch (variant_id) {
                    case 0:
                        this.animalCircle(x + w/2, y + h/2, w/8, -0.04, 5);
                        break;
                    case 1:
                        this.animalCircle(x + w/2, y + h/2, w/8, 0.04, 5);
                        break;
                }
                break;
            case 11: // Spikes trap right
                switch (variant_id) {
                    case 0: // Trap
                        this.animalCircle(x + w * 0.8, y + h  * 0.6, w / 16, 0.05, 4);
                        this.spawnAnimalRel(0.22, 0.3, x, y);
                        break;
                    case 1: //  Easy
                        this.animalCircle(x + w * 0.22, y + h  * 0.3, w / 16, 0.05, 5);
                        break;

                }
                break;
            case 12: // Spikes trap left
                switch (variant_id) {
                    case 0: // Trap
                        this.animalCircle(x + w * 0.2, y + h  * 0.6, w / 16, 0.05, 4);
                        this.spawnAnimalRel(0.78, 0.3, x, y);
                        break;
                    case 1: //  Easy
                        this.animalCircle(x + w * 0.78, y + h  * 0.3, w / 16, 0.05, 5);
                        break;

                }
                break;
            case 20:
            case 18:
                switch (variant_id) {
                    case 0:
                        this.spawnAnimal( x + w/4 - 128*SC - 64*SC, y + h / 2 - 100*SC);
                        this.spawnAnimal( x + w/4 + 128*SC + 64*SC, y + h / 2 - 100*SC);
                        this.spawnAnimal( x + w/4  - 64*SC, y + h / 2 - 100 * SC);
                        this.spawnAnimal( x + w/4  + 64*SC, y + h / 2 - 100 * SC);
                        break;
                    case 1:
                        this.spawnAnimal( x + w*3/4 - 128*SC - 64*SC, y + h / 2 - 100*SC);
                        this.spawnAnimal( x + w*3/4 + 128*SC + 64*SC, y + h / 2 - 100*SC);
                        this.spawnAnimal( x + w*3/4  - 64*SC, y + h / 2 - 100 * SC);
                        this.spawnAnimal( x + w*3/4  + 64*SC, y + h / 2 - 100 * SC);
                        break;
                }
                break;
            case 19:
                switch (variant_id) {
                    case 0:
                        this.spawnAnimal( x + w/4 - 128*SC - 64*SC, y + h / 2 + 320*SC);
                        this.spawnAnimal( x + w/4 + 128*SC + 64*SC, y + h / 2 + 320*SC);
                        this.spawnAnimal( x + w/4  - 64*SC, y + h / 2 + 320 * SC);
                        this.spawnAnimal( x + w/4  + 64*SC, y + h / 2 + 320 * SC);
                        break;
                    case 1:
                        this.spawnAnimal( x + w*3/4 - 128*SC - 64*SC, y + h / 2 + 320*SC);
                        this.spawnAnimal( x + w*3/4 + 128*SC + 64*SC, y + h / 2 + 320*SC);
                        this.spawnAnimal( x + w*3/4  - 64*SC, y + h / 2 + 320 * SC);
                        this.spawnAnimal( x + w*3/4  + 64*SC, y + h / 2 + 320 * SC);
                        break;
                }
                break;
            case 21:
            case 22:
                switch (variant_id) {
                    case 0:
                        this.spawnAnimalRel(0.5, 1/2, x, y);

                        this.spawnAnimalRel(0.5, 0.45, x, y);
                        this.spawnAnimalRel(0.5, 0.40, x, y);
                        this.spawnAnimalRel(0.5, 0.35, x, y);
                        this.spawnAnimalRel(0.5, 0.30, x, y);
                        this.spawnAnimalRel(0.5, 0.25, x, y);
                        break;
                }
                break;

            case 23: // Supermarket block
                switch(variant_id){
                    case 0:
                        this.spawnAnimalRel(0.3, 0.50, x, y);
                        this.spawnAnimalRel(0.5, 0.40, x, y);
                        this.spawnAnimalRel(0.5, 0.60, x, y);
                        this.spawnAnimalRel(0.7, 0.50, x, y);
                        break;
                    case 1:
                        var animals = this.animalCircle(x + w * 0.5, y + h  * 0.5, w / 4, -0.04, 4);

                        Phaser.Actions.RotateAroundDistance(animals,{x: x + w * 0.5, y:y + h * 0.5}, Math.PI / 4, w/4);
                        break;
                }

                break;
            case 24:
                switch(variant_id){
                    case 0:
                        this.spawnAnimal( x+w-64*SC, y+ h/2+ 128*SC)
                        this.spawnAnimal( x+w-64*SC-128*SC-128*SC, y+ h/2+ 128*SC)

                        this.spawnAnimal( x+w-64*SC, y+ h/4+ 128*SC)
                        this.spawnAnimal( x+w-64*SC - 256*SC-128*SC, y+ h/4+ 128*SC)

                        this.spawnAnimal( x+w-64*SC, y+ h * 3 / 4+ 128*SC)
                        this.spawnAnimal( x+w-64*SC-128*SC, y+ h * 3 / 4+ 128*SC)
                        break
                }
                break
            case 25:
                switch(variant_id){
                    case 0:
                        this.spawnAnimal( x+64*SC, y+ h/2+ 128*SC)
                        this.spawnAnimal( x+64*SC+128*SC+128*SC, y+ h/2+ 128*SC)

                        this.spawnAnimal( x+64*SC, y+ h/4+ 128*SC)
                        this.spawnAnimal( x+64*SC + 256*SC+128*SC, y+ h/4+ 128*SC)

                        this.spawnAnimal( x+64*SC, y+ h * 3 / 4+ 128*SC)
                        this.spawnAnimal( x+64*SC+128*SC, y+ h * 3 / 4+ 128*SC)
                        break
                }
                break
            case 26:
                switch(variant_id){
                    case 0:
                        let animals = this.genAnimals(3)
                        let line = new Line(x + +128 *SC + 64*SC, y + h * 3 / 8 + 128*SC,
                            x + w + 64*SC, y + h * 3 / 4 - 64*SC)
                        Phaser.Actions.PlaceOnLine(animals, line)

                        let animals2 = this.genAnimals(3)
                        let line2 = new Line(x + +128 *SC + 64*SC, y + h * 3 / 8 - 128*SC,
                            x + w + 64*SC, y)
                        Phaser.Actions.PlaceOnLine(animals2, line2)
                        break
                }
                break
            case 27:
                switch(variant_id){
                    case 0:
                        let animals = this.genAnimals(3)
                        let line = new Line(x + w -128 *SC - 64*SC, y + h * 3 / 8 + 128*SC,
                            x - 64*SC, y + h * 3 / 4 - 64*SC)
                        Phaser.Actions.PlaceOnLine(animals, line)

                        let animals2 = this.genAnimals(3)
                        let line2 = new Line(x + w -128 *SC -64*SC, y + h * 3 / 8 - 128*SC,
                            x - 64*SC, y)
                        Phaser.Actions.PlaceOnLine(animals2, line2)
                        break
                }
                break
        }
    }

    addObstaclesWithShelter( x:number, y:number,  id = Phaser.Math.Between(0,SHELTER_MAX_ID)) {
        var w = this.width;
        var h = this.height;
        switch (id) {
            case 0: // Normal shelter

                this.spawnShelter( x + w / 2, y + h/2);
                this.addObstaclesAndAnimals( x, y, 0, 0);
                break;
            case 1: //Spiked shelter
                this.addObstaclesAndAnimals( x, y, 13, 0);
                this.spawnShelter( x + w / 2, y + h/2);
                break;
        }
    }

}

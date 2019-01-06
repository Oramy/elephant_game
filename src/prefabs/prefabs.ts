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
export const OBSTACLE_MAX_ID = 17;
export const EASY_OBSTACLE_MAX_ID = 10;
export const VARIANTS_MAX_ID = [4, 1, 1, 1, 1, 0, 0, 1,1,6, 1, 1, 1, 4, 1, 1, 1, 1];
export const SHELTER_MAX_ID = 1;

var SC;
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

        SC = scene.sys.canvas.height / 1920;
    }
    spawnAnimal(x = 0,y = 0): GameObject{
        var scene = this.scene;

        var gold = Phaser.Math.FloatBetween(0, 1) < 1/20;

        if(notused.length == 0){
            notused = notused.concat(scene.roundFrames);
            notused_offsets = ROUND_Y_OFFSETS;
        }
        var i = Phaser.Math.Between(0, notused.length - 1);
        var key = gold ? 'roundOutline': 'round';

        var frame = notused[i];
        var animal = scene.matter.add.image(x,y, key, frame, {
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
        animal.setScale(ANIMAL_SCALE * SC);
        animal.body.allowRotation = false;
        animal.setCollisionCategory(scene.obstacleCat);
        animal.setCollidesWith([scene.elephantCat, scene.obstacleCat]);
        animal.setSensor(true);
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
                  frame="fence.png", barrierAngle = 0, kill = false){
        var aliveCondition = function(barrier){
            return barrier.body != undefined};

        var barriers = this.genBarriers(count, frame, kill);
        barriers = this.objectCircle(x, y, radius, angle, barriers,aliveCondition, true);
        this.rotateArray(barriers, barrierAngle);
        return  barriers;
    }
    addBarrier( x = 0, y = 0, scale = 1, frame = 'fence.png', kill = false){
        var scene = this.scene;
        var barrier = scene.matter.add.image(x,y, "spritesheet_other", frame);
        barrier.setScale(scale*2.2 * SC);
        barrier.setStatic(true);

        if(kill){
            barrier.body.label = 'disableControl';
        }
        barrier.setCollisionCategory(scene.obstacleCat);

        scene.addInsideScreenObject(barrier);
        return barrier;
    }
    genBarriers(count:number, frame='fence.png', kill=false){
        var items = []
        for(var i = 0; i < count; i++){
            items.push(this.addBarrier(0, 0, 1, frame, kill));
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
        this.addObstacles( x,y, obstacle_id, variant_id);
        this.addAnimals(x,y, obstacle_id, variant_id);

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
            case 5:// Random
                var items = this.genBarriers(3);
                var rect = new Rectangle(x, y, w, h);
                Phaser.Actions.RandomRectangle(items, rect);
                break;
            case 6:// Nothing

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
                right = this.genBarriers(2);
                leftLine = new Line(x + 64 * SC, y + h * 3 / 4, x + w / 4 + 64, y + h * 3 / 4);
                rightLine = new Line(x + w - 64 * SC, y + h * 3 / 4, x + w * 3 / 4 - 64 * SC, y + h * 3 / 4);


                Phaser.Actions.PlaceOnLine(left, leftLine);
                Phaser.Actions.PlaceOnLine(right, rightLine);

                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 4 + 64 * SC, y + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                break;
            case 10: // Block circle
                var angle = 0.02;
                angle *= variant_id % 2 == 0 ? 1 : -1;
                this.barrierCircle(x + w/2, y + h/2, w/3, angle, 2, 'blockBrown');
                break;
            case 11: // Spikes trap right
                this.addBarrier(x + w/2, y + h * 7 / 8, 1, 'signArrow_TL.png');

                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 2, y + h / 4 + 64*SC, x + w /2, y + h * 3 /4 +64 *SC);

                var right = this.genBarriers(4, 'blockBrown.png', true);
                var rightLine = new Line(x + w - 64 * SC, y - 100*SC  + h / 4, x + w /2 - 64 * SC, y - 100*SC + h / 4);
                Phaser.Actions.PlaceOnLine(right, rightLine);


                var right = this.genBarriers(2, 'spikesHigh.png', true);
                var rightLine = new Line(x + w - 64 * SC, y + h / 4, x + w * 3/4 - 64 * SC, y + h / 4);
                Phaser.Actions.PlaceOnLine(right, rightLine);
                this.rotateArray(right, Math.PI);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                break;
            case 12:// Spikes trap left
                this.addBarrier(x + w/2, y + h * 7 / 8, 1, 'signArrow_TR.png');

                var middle = this.genBarriers(4);
                var middleLine = new Line(x + w / 2, y + h / 4 + 64*SC, x + w /2, y + h * 3 /4 +64 *SC);

                var left = this.genBarriers(4, 'blockBrown.png');
                var leftLine = new Line(x +  64 * SC, y - 100*SC + h / 4, x + w * 1/2 + 64 * SC, y - 100*SC + h / 4);
                Phaser.Actions.PlaceOnLine(left, leftLine);

                var left = this.genBarriers(2, 'spikesHigh.png', true);
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

                var left = this.genBarriers(2, 'spikesHigh.png', true);
                var right = this.genBarriers(2, 'spikesHigh.png', true);
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

                var middle = this.genBarriers(4, 'spikesHigh.png', true);
                var middleLine = new Line(x + w / 4 + 64 * SC, y + h / 2, x + w * 3 / 4 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.rotateArray(middle, Math.PI);



                break;
            case 15:// Middle 1/4 Spikes
                var middle = this.genBarriers(2, 'blockBrown.png');
                var middleLine = new Line(x + w * 3 / 8 + 64 * SC, y - 100 * SC + h / 2, x + w * 5 / 8 + 64 * SC, y + h / 2 - 100 * SC);


                Phaser.Actions.PlaceOnLine(middle, middleLine);

                var middle = this.genBarriers(2, 'spikesHigh.png', true);
                var middleLine = new Line(x + w * 3 / 8 + 64 * SC, y + h / 2, x + w * 5 / 8 + 64 * SC, y + h / 2);


                Phaser.Actions.PlaceOnLine(middle, middleLine);
                this.rotateArray(middle, Math.PI);

                break;
            case 16: // Spiked-Block circle
                var angle = 0.02;
                angle *= variant_id % 2 == 0 ? 1 : -1;
                this.barrierCircle(x + w/2, y + h/2, w/3, angle, 2, 'blockBrown.png');
                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 - 64*SC, angle, 2, 'spikesHigh.png', -Math.PI /2, true);
                spikes.forEach(function(spike){
                    spike.setOrigin(0.5, 1);
                });
                break;

            case 17: // Full-Spiked-Block circle
                var angle = 0.02;
                var sign =variant_id % 2 == 0 ? 1 : -1;
                angle *= sign;
                this.barrierCircle(x + w/2, y + h/2, w/3, angle, 2, 'blockBrown.png');
                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 + 64*SC, angle, 2, 'spikesHigh.png', Math.PI /2, true);
                spikes.forEach(function(spike){
                    spike.setOrigin(0.5, 1);
                });
                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 - 128*SC, angle, 2, 'spikesHigh.png', -Math.PI /2, true);
                spikes.forEach(function(spike){
                    spike.setOrigin(0.5, 0);
                });
                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 + 15*SC, angle, 2, 'spikesHigh.png', 0, true);

                Phaser.Actions.RotateAroundDistance(spikes,{x: x +w/2, y:y+h/2}, -20*SC*angle*sign,  w/3 + 15 * SC);

                var spikes = this.barrierCircle(x + w/2, y + h/2, w/3 + 15*SC, angle, 2, 'spikesHigh.png', Math.PI, true);

                Phaser.Actions.RotateAroundDistance(spikes,{x: x +w/2, y:y+h/2}, 20*SC*angle*sign,  w/3 + 15 * SC);

                break;
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
                        this.animalCircle(x + w / 4, y + h / 2, w / 16, 0.05, 4);
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
                        this.animalCircle(x + w * 3 / 4, y + h / 2, w / 16, 0.05, 4);
                        break;
                    case 1: //Circle front mid behind
                        this.animalCircle(x + w * 3/ 4, y + h / 2, w / 16, 0.05, 2);
                        this.animalCircle(x + w / 4, y + h / 4, w / 16, 0.05, 2);
                        this.animalCircle(x + w / 4, y + 3 * h / 4, w / 16, 0.05, 2);
                        break;
                }
                break;
            case 5: // Random

            case 6: // Nothing
                this.spawnAnimals( x, y, x + w, y + h, ANIMALS_SPAWN);
                break;
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
        }
    }

    addObstaclesWithShelter( x:number, y:number,  id = Phaser.Math.Between(0,SHELTER_MAX_ID)) {
        var w = this.width;
        var h = this.height;
        switch (id) {
            case 0: // Normal shelter
                this.addObstaclesAndAnimals( x, y, 0, 0);
                this.spawnShelter( x + w / 2, y + h/2);
                break;
            case 1: //Spiked shelter
                this.addObstaclesAndAnimals( x, y, 13, 0);
                this.spawnShelter( x + w / 2, y + h/2);
                break;
        }
    }

}

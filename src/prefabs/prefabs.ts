import {ANIMAL_SCALE, ANIMALS_SPAWN, MainScene, ROUND_Y_OFFSETS} from "../scenes/mainScene";
import Line = Phaser.Geom.Line;
import Rectangle = Phaser.Geom.Rectangle;

/**
 * Spawn a random animal at position x, y
 * @param x
 * @param y
 */
export function spawnAnimal(scene:MainScene, x,y): void{
    var i = Phaser.Math.Between(0, scene.roundFrames.length - 1);

    var animal = scene.matter.add.image(x,y, 'round', scene.roundFrames[i], {
        shape: {
            type: 'circle',
            radius: 64
        },
        render: {sprite: {xOffset: 0, yOffset: ROUND_Y_OFFSETS[i]}},
        label: 'animal',

    });
    animal.setScale(ANIMAL_SCALE);
    animal.body.allowRotation = false;
    animal.setCollisionCategory(scene.obstacleCat);
    animal.setCollidesWith([scene.elephantCat, scene.obstacleCat]);
    animal.setSensor(true);
    scene.addInsideScreenObject(animal);
}
/***
 * Spawns count animals in rectangle of coordinates (x,y,x2,y2).
 * @param x
 * @param y
 * @param x2
 * @param y2
 * @param count
 */
export function spawnAnimals(scene:MainScene, x, y, x2, y2, count): void{
    for (var j = 0; j < count; j++) {
        var animalX = Phaser.Math.Between(x, x2);
        var animalY = Phaser.Math.Between(y, y2);
        spawnAnimal(scene, animalX, animalY);
    }
}
export function addBarrier(scene:MainScene, x = 0, y = 0, scale = 1){
    var barrier = scene.matter.add.image(x,y, "square_nodetailsOutline", "elephant.png");
    barrier.setScale(scale);
    barrier.setStatic(true);
    barrier.tint = 0x888888;

    barrier.setCollisionCategory(scene.obstacleCat);

    scene.addInsideScreenObject(barrier);
    return barrier;
}
export function genBarriers(scene: MainScene, count:number){
    var items = []
    for(var i = 0; i < count; i++){
        items.push(addBarrier(scene));
    }
    return items;
}
export function spawnShelter(scene:MainScene, x,y): void{

    var shelter = scene.matter.add.image(x,y, 'square', 'elephant.png');
    shelter.setScale(3);
    shelter.body.label = "shelter";
    shelter.setSensor(true);
    shelter.setStatic(true);
    shelter.setCollidesWith(scene.obstacleCat);
    shelter.setCollisionCategory(scene.obstacleCat);

    scene.addShelter(shelter);

}

const OBSTACLE_MAX_ID = 7;
const VARIANTS_MAX_ID = [8,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
export function addObstaclesAndAnimals(scene:MainScene, x:number, y:number, width:number, height:number,
                                       obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID), variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
    addObstacles(scene, x,y, width, height, obstacle_id, variant_id);
    addAnimals(scene, x,y, width, height, obstacle_id, variant_id);

}
export function addObstacles(scene:MainScene, x:number, y:number, width:number, height:number,
                             obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID), variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
    switch (obstacle_id) {
        case 0: // Left and right 1/4 barrier.
            var left = genBarriers(scene, 2);
            var right = genBarriers(scene, 2);
            var leftLine = new Line(x + 64, y + height / 2, x + width / 4 + 64, y + height / 2);
            var rightLine = new Line(x + width - 64, y + height / 2, x + width * 3 / 4 - 64, y + height / 2);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);

            break;
        case 1: // Left-right-left 1/4
            var left = genBarriers(scene, 2);
            var right = genBarriers(scene, 2);
            var left2 = genBarriers(scene, 2);

            var leftLine = new Line(x + 64, y + height / 4, x + width / 4 + 64, y + height / 4);
            var rightLine = new Line(x + width - 64, y + height / 2, x + width * 3 / 4 - 64, y + height / 2);
            var leftLine2 = new Line(x + 64, y + height * 3 / 4, x + width / 4 + 64, y + height * 3 / 4);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(left2, leftLine2);
            break;
        case 2: // Left-right-left 1/2
            var left = genBarriers(scene, 4);
            var right = genBarriers(scene, 4);
            var left2 = genBarriers(scene, 4);

            var leftLine = new Line(x + 64, y + height / 4, x + width / 2 + 64, y + height / 4);
            var rightLine = new Line(x + width - 64, y + height / 2, x + width / 2 - 64, y + height / 2);
            var leftLine2 = new Line(x + 64, y + height * 3 / 4, x + width / 2 + 64, y + height * 3 / 4);


            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(left2, leftLine2);
            break;
        case 3: // Right-Left-Right 1/4
            var left = genBarriers(scene, 2);
            var right = genBarriers(scene, 2);
            var right2 = genBarriers(scene, 2);

            var leftLine = new Line(x + 64, y + height / 2, x + width / 4 + 64, y + height / 2);
            var rightLine = new Line(x + width - 64, y + height / 4, x + width * 3 / 4 - 64, y + height / 4);
            var rightLine2 = new Line(x + width - 64, y + height * 3 / 4, x + width * 3 / 4 - 64, y + height * 3 / 4);

            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(right2, rightLine2);
            break;
        case 4: // Right-Left-Right 1/2
            var left = genBarriers(scene, 4);
            var right = genBarriers(scene, 4);
            var right2 = genBarriers(scene, 4);

            var leftLine = new Line(x + 64, y + height / 2, x + width / 2 + 64, y + height / 2);
            var rightLine = new Line(x + width - 64, y + height / 4, x + width / 2 - 64, y + height / 4);
            var rightLine2 = new Line(x + width - 64, y + height * 3 / 4, x + width / 2 - 64, y + height * 3 / 4);

            Phaser.Actions.PlaceOnLine(left, leftLine);
            Phaser.Actions.PlaceOnLine(right, rightLine);
            Phaser.Actions.PlaceOnLine(right2, rightLine2);
            break;
        case 5: // Random
            var items = genBarriers(scene, 3);
            var rect = new Rectangle(x, y, width, height);
            Phaser.Actions.RandomRectangle(items, rect);
            break;
        case 6: // Nothing

            break;
    }
}
export function addAnimals(scene:MainScene, x:number, y:number, width:number, height:number,
                           obstacle_id = Phaser.Math.Between(0,OBSTACLE_MAX_ID), variant_id=Phaser.Math.Between(0, VARIANTS_MAX_ID[obstacle_id])) {
    switch (obstacle_id) {
        case 0: // Left and right 1/4 barrier.
            switch (variant_id) {
                case 0: // 1 Front Left
                    spawnAnimal(scene, x+64, y+ height/2+ 128);
                    break;
                case 1:// 2 Front Left
                    spawnAnimal(scene, x+64, y+ height/2+ 128);
                    spawnAnimal(scene, x+64+128, y+ height/2+ 128);
                    break;
                    case 2: // 1 Front Right
                    spawnAnimal(scene, x+width-64, y+ height/2+ 128);
                    break;
                case 3: // 2 Front Right
                    spawnAnimal(scene, x+width-64, y+ height/2+ 128);
                    spawnAnimal(scene, x+width-64-128, y+ height/2+ 128);
                    break;
                case 4: // 2 Front Left-Right
                    spawnAnimal(scene, x+width-64, y+ height/2+ 128);
                    spawnAnimal(scene, x+64, y+ height/2+ 128);
                    break;
                case 5: // 4 Front Left-Right
                    spawnAnimal(scene, x+width-64, y+ height/2+ 128);
                    spawnAnimal(scene, x+width-64-128, y+ height/2+ 128);
                    spawnAnimal(scene, x+64, y+ height/2+ 128);
                    spawnAnimal(scene, x+64+128, y+ height/2+ 128);
                    break;
                case 6: // 1 Behind Left
                    spawnAnimal(scene, x+64, y+ height/2- 128);
                    break

                case 7: // 1 Behind Right
                    spawnAnimal(scene, x+width-64, y+ height/2- 128);
                    break;
                case 8: // 2 Behind Left-Right
                    spawnAnimal(scene, x+64, y+ height/2- 128);
                    spawnAnimal(scene, x+width-64-128, y+ height/2- 128);
                    break;


            }
            break;
        case 1: // Left-right-left 1/4

        case 2: // Left-right-left 1/2

        case 3: // Right-Left-Right 1/4

        case 4: // Right-Left-Right 1/2

        case 5: // Random

        case 6: // Nothing
            spawnAnimals(scene, x, y, x + width, y + height, ANIMALS_SPAWN);
            break;
    }
}
export function addObstaclesWithShelter(scene:MainScene, x:number, y:number, width:number, height:number, id = Phaser.Math.Between(0,0)) {
    switch (id) {
        case 0:
            addObstaclesAndAnimals(scene, x, y, width, height, 0);
            spawnShelter(scene, x + width / 2, y + height/2);
            break;
    }
}

import {ANIMAL_SCALE, SC} from "../scenes/mainScene";

export class Animal extends Phaser.Physics.Matter.Image{
    constructor(scene, x, y, atlas, frame){
        super(scene.matter.world, 0, 0, atlas,frame,{
            shape: {
                type: 'circle',
                radius: 16
            },
            label: 'animal',

        });
    };


    spawn(x:number, y:number, frame:string, scene){

        this.setPosition(x, y);
        this.setScale(ANIMAL_SCALE * SC);
        this.setActive(true);
        this.setVisible(true);
        this.body.label = 'animal';
        this.setVelocity(0);
        this.setAngularVelocity(0);
        this.setRotation(0);
        this.setFrame(frame);

        this.body.allowRotation = false;
        this.setCollisionCategory(scene.obstacleCat);
        this.setCollidesWith([scene.elephantCat, scene.obstacleCat]);
        this.setSensor(true);
        this.tint = 0xFFFFFF;
    }
    kill(){
        this.setActive(false);
        this.body.label = 'dead';
        this.setVisible(false);
        this.setVelocity(0);
        this.setAngularVelocity(0);
        this.setRotation(0);
        this.setCollidesWith([]);
        this.emit('killed');
    }
}
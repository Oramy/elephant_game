import {ANIMAL_SCALE, SC} from "../scenes/mainScene";

export class Animal extends Phaser.Physics.Matter.Image{
    private zombie: boolean;
    constructor(scene, x, y, atlas, frame){
        super(scene.matter.world, 0, 0, atlas,frame,{
            shape: {
                type: 'circle',
                radius: 16
            },
            label: 'animal',

        });
        this.zombie = false
    };


    spawn(x:number, y:number, frame:string, scene){

        this.setScale(ANIMAL_SCALE * SC);
        this.setActive(true);
        this.setVisible(true);
        this.body.label = 'animal';


        this.setFrame(frame);
        this.setPosition(x, y);

        this.body.allowRotation = false;
        //if(this.zombie)
        //    scene.matter.world.add(this.body);
        this.setVelocity(0);


        this.setAngularVelocity(0);
        this.setRotation(0);


        this.setCollisionCategory(scene.obstacleCat);
        this.setCollidesWith([scene.elephantCat, scene.obstacleCat]);
        this.setSensor(true);
        this.tint = 0xFFFFFF;
    }
    kill(scene){
        //scene.matter.world.remove(this);
        this.zombie = true;
        this.setActive(false);
        this.body.label = 'dead';
        this.setVisible(false);
        this.setVelocity(0);
        this.setAngularVelocity(0);
        this.setRotation(0);
        this.setCollidesWith([]);
    }
}

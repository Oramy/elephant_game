import Scene = Phaser.Scene;
import Tween = Phaser.Tweens.Tween;
import NumberTweenBuilder = Phaser.Tweens.Builders.NumberTweenBuilder;
import Timeline = Phaser.Tweens.Timeline;

var SC;
export class CoinsComponent{
    private SC;
    private coinsText: Phaser.GameObjects.BitmapText;
    private newCoinsText: any;

    private scene:Scene;
    private width: number;
    private height: number;
    private icon: any;
    private score: integer;
    private gainedScore: integer;

    private topZone;
    private tween: Tween;
    constructor(scene, score){
        this.scene = scene;
        this.score = score;
    }
    updatePlacement(){
        Phaser.Display.Align.In.TopRight(this.coinsText, this.topZone);

        Phaser.Display.Align.In.TopRight(this.newCoinsText, this.topZone);

        this.newCoinsText.y += this.height * 0.05;
    }
    computeText(value){
        var text = '';
        if(value > 0){
            text = '+ ' + value;
        }
        else if(value == 0){
            text = '' + value;
        }
        else{
            text = '- ' + (-value);
        }
        return text;
    }
    initNewCoinsText(value) {
        this.gainedScore = value;
        var text = this.computeText(value);

        this.newCoinsText.setText(text);
        this.newCoinsText.alpha = 0;
        this.newCoinsText.setVisible(true);
        this.updatePlacement();
    }
    smoothChangeScore(value, bonusPart = 0.1, timeline2 = undefined) : Timeline{
        this.initNewCoinsText(value);


        var onComplete = (function (){

            this.newCoinsText.setVisible(false);
            this.coinsText.setText("" + (this.score + value));
            if(timeline2 !== undefined)
            {
                timeline2.play();
            }
            this.tween = undefined;
            this.score += value;

        }).bind(this);

        var onComplete2 = (function(){
            this.newCoinsText.setText(this.computeText(Math.trunc(this.tween.getValue())));
            this.coinsText.setText("" + (this.score + this.gainedScore - Math.trunc(this.tween.getValue())));

            this.updatePlacement();
        }).bind(this);

        var timeline = this.scene.tweens.createTimeline({});
        timeline.add({
            targets: this.newCoinsText,
            alpha: 1,
            ease: 'Power1',
            duration: 500,
            yoyo: false,
            repeat: 0,
            delay: 400,

        });
        // @ts-ignore
        this.tween = NumberTweenBuilder(timeline, {

            duration: bonusPart == 1 ? 10: 500,
            yoyo: false,
            ease: 'Cubic.easeIn',
            from: value,
            to: bonusPart == 1 || value == 0 ? value: Phaser.Math.Between(1, Math.trunc(value * bonusPart)),
            delay: 0,
            onComplete: onComplete2

        });
        timeline.queue(this.tween);
        timeline.add({
            targets: this.newCoinsText,
            y: 0,
            ease: 'Cubic.easeIn',
            duration: 500,
            yoyo: false,
            repeat: 0,
            delay: bonusPart != 1 ? 400 : 0,
            onComplete: onComplete
        });
        return timeline;

    }
    create(SC){

        var scene = this.scene;
        this.width = scene.sys.canvas.width;
        this.height = scene.sys.canvas.height;

        this.topZone = this.scene.add.zone(this.width /2,this.height/4, this.width * 0.80, this.height / 2);

       this.coinsText = scene.add.bitmapText(0, 0, "jungle", "" + this.score, 100 * SC).setOrigin(1, 0);
        this.coinsText.setTint(0x000000);
        this.icon = scene.add.image(this.width * 0.9, this.height * 0.03, 'animalCoins').setScale(0.30 * SC).setOrigin(0, 0.5);

        this.newCoinsText = scene.add.bitmapText(-300, 0, "jungle", "+ ", 100*SC).setOrigin(0,0);
        this.newCoinsText.setTint(0x000000);

        this.initNewCoinsText(0);
        this.updatePlacement();

    }
    update(){
        if(this.tween !== undefined && this.tween.isPlaying())
        {
            this.newCoinsText.setText(this.computeText(Math.trunc(this.tween.getValue())));
            this.coinsText.setText("" + (this.score + this.gainedScore - Math.trunc(this.tween.getValue())));
            this.updatePlacement();
        }
    }
}
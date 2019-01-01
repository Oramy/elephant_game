
import { MainScene } from "./mainScene";

export class Menu extends Phaser.Scene{
    private highscores: any;
    private friends : any;
    private scores: any;
    constructor ()
    {
        super('Menu');
    }


    create ()
    {
        // @ts-ignore
        this.facebook.on('getleaderboard', (function (leaderboard)
        {
            if(leaderboard.name == 'Highscores') {

                this.highscores = leaderboard;
                leaderboard.on('getscores', (function(scores){
                    this.createHighscoreTab(scores);
                }).bind(this));
                this.highscores.getScores(10, 0);
            }
            else if(leaderboard.name == 'Amis')
                this.friends = leaderboard;



        }).bind(this), this);

        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        //this.facebook.getLeaderboard('Amis.'+FBInstant.context.getID());
        // @ts-ignore
        var touchToStart = this.add.text(0, 0, "Welcome " + this.facebook.playerName + "! Touch anywhere to start." );
        var title = this.add.text(0, 0, "Elephant Game");
        title.setFontSize(32);
        var screenZone = this.add.zone(this.sys.canvas.width / 2, this.sys.canvas.height / 2, this.sys.canvas.width, this.sys.canvas.height);
        var topZone = this.add.zone(this.sys.canvas.width / 2, this.sys.canvas.height / 4, this.sys.canvas.width, this.sys.canvas.height / 2);
        Phaser.Display.Align.In.Center(touchToStart, screenZone);
        Phaser.Display.Align.In.Center(title, topZone);

        var callback = this.startGame.bind(this);
        this.input.on("pointerdown", callback);


        // @ts-ignore
        this.load.image('player', this.facebook.playerPhotoURL);

        this.load.image('mask');


    }
    createHighscoreTab(scores): void{
        this.scores = scores;
        this.scores = this.scores.concat(scores);
        for(var i = 0; i < scores.length; i++){
            var entry = scores[i];
            console.log(entry.playerPhotoURL);
            this.load.image('best' + i, entry.playerPhotoURL);
            var baseY = this.sys.canvas.height / 2 + 100;
            var rank = this.add.text(0, baseY + 10 + i*50, (i+1) + '.' );
            var name = this.add.text(100, baseY + i * 50, entry.playerName);
            var scoreText = this.add.text(100, baseY + i * 50 + 25, "Score: " + entry.scoreFormatted);
            // @ts-ignore
            if(entry.playerID == this.facebook.playerID){
                rank.setColor("red");
                name.setColor("red");
                scoreText.setColor("red");
            }
        }
        this.load.on('filecomplete', this.addPhotos, this);

        this.load.start();
    }
    addPhotos(key):void{
        if(key == "player")
            this.addPlayerPhoto(key);
        else{
            var baseY = this.sys.canvas.height / 2 + 100;
            console.log(Number.parseInt(key[4]));
            var pic = this.add.image(50, baseY + 20 +  Number.parseInt(key[4])* 50,key);
            pic.setScale(0.15);
        }

    }
    addPlayerPhoto (key)
    {
        var profile = this.add.image(0, 0, key);

        var secondQuarterZone = this.add.zone(this.sys.canvas.width / 2,  3 * this.sys.canvas.height / 8, this.sys.canvas.width, this.sys.canvas.height / 4);
        profile.setScale(0.25);
        Phaser.Display.Align.In.Center(profile, secondQuarterZone);
    }
    startGame ()
    {
        this.scene.start('MainScene');
    }

}
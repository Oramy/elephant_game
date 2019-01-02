
import { MainScene } from "./mainScene";

const LEADERBOARD_DRAW = 3;
export class Menu extends Phaser.Scene{
    private highscores: any;
    private friends : any;
    private scores: any;

    private loadedPhotos: any;
    private inLeaderboard: boolean;

    private width: number;
    private height: number;
    private camera: Phaser.Cameras.Scene2D.Camera;
    constructor ()
    {
        super('Menu');
    }





    resize() {
        var canvas = this.sys.canvas, width = window.innerWidth, height = window.innerHeight;
        var wratio = width / height, ratio = canvas.width / canvas.height;

        if (wratio < ratio) {
            canvas.style.width = width + "px";
            canvas.style.height = (width / ratio) + "px";
        } else {
            canvas.style.width = (height * ratio) + "px";
            canvas.style.height = height + "px";
        }
    }


    create ()
    {
        window.addEventListener('resize', this.resize);
        this.resize();
        this.height = 1920;
        this.width = 1080;
        this.camera = this.cameras.main;
        // @ts-ignore
        this.facebook.once('getleaderboard', (function (leaderboard)
        {

            if(leaderboard.name == 'Highscores') {

                this.highscores = leaderboard;
                leaderboard.on('getscores', (function(scores){
                    this.createHighscoreTab(scores);

                    // @ts-ignore
                    this.highscores.on('getplayerscore', function (score, name)
                    {

                        this.createPlayerScoreLine();

                    }.bind(this), this);

                    this.highscores.getPlayerScore();
                }).bind(this));
                this.highscores.getScores(LEADERBOARD_DRAW, 0);

            }
            else if(leaderboard.name == 'Amis')
                this.friends = leaderboard;



        }).bind(this), this);
        this.camera.setBackgroundColor('#5a756f');
        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        //this.facebook.getLeaderboard('Amis.'+FBInstant.context.getID());
        // @ts-ignore
        var touchToStart = this.add.bitmapText(0, 0, "jungle", "Welcome " + this.facebook.playerName + "! Touch anywhere to start." , 40);
        var title = this.add.bitmapText(0, 100, "jungle", "Elephant Game", 120);
        var screenZone = this.add.zone(this.width / 2, this.height / 2, this.width, this.height);
        var topZone = this.add.zone(this.width / 2, 200, this.width, this.height / 2);
        Phaser.Display.Align.In.Center(touchToStart, screenZone);
        Phaser.Display.Align.In.Center(title, topZone);

        var callback = this.startGame.bind(this);
        this.input.on("pointerdown", callback);


        // @ts-ignore
        this.load.image(this.facebook.playerID, this.facebook.playerPhotoURL);
        this.load.on('complete', this.addPlayerPhoto, this);
        this.load.image('mask');


    }

    addScoreEntryPhoto(imageID, y): void{
        var pic = this.add.image(320, y + 40, imageID);
        pic.setScale(0.3);
    }
    addScoreEntry(entry,  y) : boolean
    {
        this.load.image(entry.playerID, entry.playerPhotoURL);
        this.load.on('complete', (function() {
            this.addScoreEntryPhoto(entry.playerID, y);

        }).bind(this));
        var data = JSON.parse(entry.data);
        var character = this.add.image(215, y + 40, "square_nodetailsOutline", data.character + ".png");
        character.setScale(0.75);
        var rankText = this.add.bitmapText(200, y + 13, "jungle",entry.rank);
        var nameText = this.add.bitmapText(400, y , "jungle", entry.playerName);
        var scoreText = this.add.bitmapText(400, y+ 50, "jungle", "Score: " + entry.scoreFormatted);

        rankText.tint = 0x11604f;


        rankText.setFontSize(50);
        nameText.setFontSize(50);
        scoreText.setFontSize(50);
        // @ts-ignore
        if(entry.playerID == this.facebook.playerID){
            nameText.tint = 0xFF5757;
            return true;
        }
        return false;
    }
    createPlayerScoreLine(){
        if(!this.inLeaderboard){
            var baseY = this.height / 2 + 100;
            var entry = this.highscores.playerScore;
            // @ts-ignore
            this.addScoreEntry(entry, baseY + (LEADERBOARD_DRAW + 1)*100 + 25);
            this.addScoreEntryPhoto(entry.playerID, baseY + (LEADERBOARD_DRAW + 1)*100 + 25);
        }
    }
    createHighscoreTab(scores): void{
        this.scores = scores;
        this.scores = this.scores.concat(scores);

        var baseY = this.height / 2 + 100;

        this.inLeaderboard = false;
        for(var i = 0; i < scores.length; i++){
            var entry = scores[i];

            if(this.addScoreEntry(entry, baseY + i * 100))
                this.inLeaderboard = true;
        }



        this.load.start();
    }
    addPlayerPhoto ()
    {
        // @ts-ignore
        var profile = this.add.image(0, 0, this.facebook.playerID);

        var secondQuarterZone = this.add.zone(this.width / 2,  3 * this.height / 8, this.width, this.height / 4);
        profile.setScale(0.75);
        Phaser.Display.Align.In.Center(profile, secondQuarterZone);
    }
    startGame ()
    {
        this.scene.start('MainScene');
    }

}
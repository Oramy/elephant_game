
import { MainScene } from "./mainScene";
import Image = Phaser.GameObjects.Image;
import BitmapText = Phaser.GameObjects.BitmapText;

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

    private character: string;
    private characterImage: Image;
    private characterFrames: string[];
    private nextCharacterImage: Phaser.GameObjects.Image;
    private prevCharacterImage: Phaser.GameObjects.Image;

    private lastScore;
    private touchToStart: BitmapText;
    private playerData: any;
    private playImage: Phaser.GameObjects.Image;
    private unlocked : BitmapText;

    private indices = {'elephant':'', 'frog':'Score over 5000 to unlock this animal.'};
    constructor ()
    {
        super('Menu');
    }



    updateCharacter(character=this.character){
        console.log("updateCharacter");
        this.character = character;
        this.characterImage.setFrame(character + ".png");
        var ind = this.characterFrames.findIndex((function (el) {
            return el == this.character + ".png"
        }).bind(this));
        this.updateCharacterImages(ind);
    }
    updateCharacterImages(ind){
        var next = (ind + 1) % this.characterFrames.length;
        var prev = (ind + this.characterFrames.length - 1) % this.characterFrames.length;
        this.character = this.characterFrames[ind];
        this.character = this.character.slice(0, this.character.length - 4);

        this.characterImage.setFrame(this.characterFrames[ind]);
        this.prevCharacterImage.setFrame(this.characterFrames[prev]);
        this.nextCharacterImage.setFrame(this.characterFrames[next]);

        if(this.playerData.get(this.character) == 'unlocked'){
            this.playImage.setFrame('forward.png');
            // @ts-ignore
            this.touchToStart.setText("Welcome " + this.facebook.playerName + "! Touch your " + this.character + " to start.");

        }
        else
        {
            this.playImage.setFrame('locked.png');
            // @ts-ignore
            var touchText = "This " + this.character + " is locked...\n";
            if(this.indices[this.character] !== undefined)
                touchText += this.indices[this.character];
            this.touchToStart.setText(touchText);

        }
        var unlockedCount = 0;
        for(var i = 0; i < this.characterFrames.length; i++){
            if(this.playerData.get(this.characterFrames[i].slice(0, this.characterFrames[i].length - 4)) === 'unlocked')
            {
                unlockedCount +=1;
            }
        }
        this.unlocked.setText(unlockedCount+ '/'+ this.characterFrames.length);

    }
    next(pointer, gameObject){
        if(gameObject == this.nextCharacterImage) {
            var ind = this.characterFrames.findIndex((function (el) {
                return el == this.character + ".png"
            }).bind(this));
            ind = (ind + 1) % this.characterFrames.length;

            this.updateCharacterImages(ind);
        }
    }
    prev(pointer, gameObject){
        if(gameObject == this.prevCharacterImage) {
            var ind = this.characterFrames.findIndex((function (el) {
                return el == this.character + ".png"
            }).bind(this));
            ind = (ind + this.characterFrames.length - 1) % this.characterFrames.length;
            var next = (ind + 1) % this.characterFrames.length;
            var prev = (ind + this.characterFrames.length - 1) % this.characterFrames.length;
            this.character = this.characterFrames[ind];
            this.character = this.character.slice(0, this.character.length - 4);
            this.updateCharacterImages(ind);
        }
    }
    play(pointer, gameObject){
        if(gameObject == this.characterImage) {
            this.startGame();
        }
    }createSave() {
        console.log("createSave");
        var data = {
           'bear':'locked',
       'buffalo':'locked',
       'chick':'locked',
       'chicken':'locked',
       'cow':'locked',
       'crocodile':'locked',
       'dog':'locked',
       'duck':'locked',
       'elephant':'unlocked',
       'frog':'locked',
       'giraffe':'locked',
       'goat':'locked',
       'gorilla':'locked',
       'hippo':'locked',
       'horse':'locked',
       'monkey':'locked',
       'moose':'locked',
       'narwhal':'locked',
       'owl':'locked',
       'panda':'locked',
       'parrot':'locked',
       'penguin':'locked',
       'pig':'locked',
       'rabbit':'locked',
       'rhino':'locked',
       'sloth':'locked',
       'snake':'locked',
       'walrus':'locked',
       'whale':'locked',
       'zebra':'locked',
        }
        //@ts-ignore
        this.facebook.saveData(data);

        // @ts-ignore
        this.playerData = this.facebook.data;
        this.updateCharacter();
    }
    create ()
    {
        this.height = 1920;
        this.width = 1080;
        this.camera = this.cameras.main;
        var atlasTexture = this.textures.get('round');
        this.characterFrames = atlasTexture.getFrameNames();
        
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
                        var data = JSON.parse(score.data);
                        this.updateCharacter(data.character);
                        this.createPlayerScoreLine();

                    }.bind(this), this);

                    this.highscores.getPlayerScore();
                }).bind(this));
                this.highscores.getScores(LEADERBOARD_DRAW, 0);

            }
            else if(leaderboard.name == 'Amis')
                this.friends = leaderboard;



        }).bind(this), this);


        this.characterImage = this.add.image(0, 0, 'square_nodetailsOutline', 'elephant.png');
        this.characterImage.setScale(1.8);

        this.playImage = this.add.image(0, 0, 'icons', 'forward.png');
        this.playImage.setScale(3);
        var secondQuarterZone = this.add.zone(this.width / 2,  270 + 2 * this.height / 8, this.width, this.height*3 / 8);
        Phaser.Display.Align.In.Center(this.characterImage, secondQuarterZone);
        Phaser.Display.Align.In.Center(this.playImage, secondQuarterZone);

        this.nextCharacterImage = this.add.image(0, 0, 'square_nodetailsOutline', 'frog.png');
        this.nextCharacterImage.setScale(1.8);

        var next = this.add.image(0, 0, 'icons', 'arrowRight.png');
        next.setScale(3);

        var zone = this.add.zone(this.width / 2 + (64 + 128) * 1.8,  270  + 2 * this.height / 8, this.width, this.height*3 / 8);
        Phaser.Display.Align.In.Center(next, zone);
        Phaser.Display.Align.In.Center(this.nextCharacterImage, zone);

        this.prevCharacterImage = this.add.image(0, 0, 'square_nodetailsOutline', 'duck.png');
        this.prevCharacterImage.setScale(1.8);

        var prev = this.add.image(0, 0, 'icons', 'arrowLeft.png');
        prev.setScale(3);

        var zone = this.add.zone(this.width / 2 - (64 + 128) * 1.8,  270  + 2 * this.height / 8, this.width, this.height*3 / 8);
        Phaser.Display.Align.In.Center(prev, zone);
        Phaser.Display.Align.In.Center(this.prevCharacterImage, zone);

        next.setAlpha(0.8);
        prev.setAlpha(0.8);
        this.playImage.setAlpha(0.8);

        this.nextCharacterImage.setInteractive();
        this.prevCharacterImage.setInteractive();
        this.characterImage.setInteractive();

        var zone = this.add.zone(this.width / 2 - (64 + 128) * 1.8,    -50 + 2 * this.height / 8, this.width, this.height*3 / 8);
        var unlockedImage = this.add.image(0, 0 ,'icons', 'unlocked.png');
        unlockedImage.setScale(2);
        unlockedImage.setAlpha(0.5);

        this.unlocked = this.add.bitmapText(0, 0, 'jungle','');
        this.unlocked.setFontSize(70);
        this.unlocked.tint = 0xCCCCCC;


        Phaser.Display.Align.In.Center(this.unlocked, zone);
        Phaser.Display.Align.In.Center(unlockedImage, this.unlocked);

        this.nextCharacterImage.setAlpha(1, 0, 1, 0);
        this.prevCharacterImage.setAlpha(0, 1, 0, 1);

        this.camera.setBackgroundColor('#5a756f');
        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        //this.facebook.getLeaderboard('Amis.'+FBInstant.context.getID());
        // @ts-ignore
        this.touchToStart = this.add.bitmapText(0, 0, "jungle", "Welcome " + this.facebook.playerName + "! Touch anywhere to start." , 40);
        var title = this.add.bitmapText(0, 100, "jungle", "Elephant Game", 120);
        var screenZone = this.add.zone(this.width / 2, this.height / 2, this.width, this.height);
        var topZone = this.add.zone(this.width / 2, 200, this.width, this.height / 2);
        Phaser.Display.Align.In.Center(this.touchToStart, screenZone);
        Phaser.Display.Align.In.Center(title, topZone);

        var callback = this.startGame.bind(this);
        //this.input.on("pointerdown", callback);


        // @ts-ignore
        this.load.image(this.facebook.playerID, this.facebook.playerPhotoURL);
        this.load.on('complete', this.addPlayerPhoto, this);
        this.load.image('mask');

        this.input.on("gameobjectdown",  (this.next).bind(this));
        this.input.on("gameobjectdown",  (this.prev).bind(this));
        this.input.on("gameobjectdown",  (this.play).bind(this));
        if(this.lastScore !== undefined){
            var text = this.add.bitmapText(0, 0, 'jungle', 'Last score: ' + this.lastScore);
            text.setFontSize(70);
            var topZone = this.add.zone(this.width /2 , this.height /20, this.width, this.height / 10);
            Phaser.Display.Align.In.Center(text, topZone);
        }



        // @ts-ignore

        else{

            // @ts-ignore
            this.facebook.getData(this.characterFrames.map(function(el){
                return el.slice(0, el.length - 4);
            }));
            // @ts-ignore
            this.facebook.on('getdata', (function () {
                this.playerData = this.facebook.data;
                if(this.facebook.data.get('elephant') === undefined){
                    this.createSave();
                }else
                {
                    console.log(this.playerData);
                }
                //In order to update images and texts.
                this.updateCharacter(this.character);
            }).bind(this), this);
        }
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

        var secondQuarterZone = this.add.zone(this.width / 2,  2 * this.height / 8, this.width, this.height*3 / 8);
        profile.setScale(0.75);
        Phaser.Display.Align.In.Center(profile, secondQuarterZone);
    }
    startGame ()
    {
        this.scene.start('MainScene');
        // @ts-ignore
        this.scene.get('MainScene').updateCharacter(this.character);
    }

}
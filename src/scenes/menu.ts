import {MainScene} from "./mainScene";
import {CoinsComponent} from "../ui/coinsComponent";
import Image = Phaser.GameObjects.Image;
import BitmapText = Phaser.GameObjects.BitmapText;

const LEADERBOARD_DRAW = 3;
var SC;
export const SQUARE_Y_OFFSETS = {'bear':0, 'buffalo':-0.015, 'chick':0, 'chicken' : 0.05, 'cow':0, 'crocodile':0, 'dog':0.1, 'duck':0, 'elephant':0.06, 'frog':0.02, 'giraffe':0.1, 'goat':0, 'gorilla':0, 'hippo':0, 'horse':0.05,
   'monkey': 0, 'moose':0.1, 'narwhal':0, 'owl':0, 'panda':0, 'parrot':0, 'penguin':0, 'pig':0, 'rabbit':0.14, 'rhino':0, 'sloth':0, 'snake':-0.05, 'walrus':-0.03, 'whale':0.02, 'zebra':0.05};

export class Menu extends Phaser.Scene {
    private highscores: any;
    private friends: any;
    private scores: any;


    private loadedPhotos: any;
    private inLeaderboard: boolean;

    private width: number;
    private height: number;
    private camera: Phaser.Cameras.Scene2D.Camera;

    private character: string;
    private characterImage: Image;
    private characterSImage: Image;
    private characterFrames: string[];
    private nextCharacterImage: Phaser.GameObjects.Image;
    private prevCharacterImage: Phaser.GameObjects.Image;
    private nextCharacterSImage: Phaser.GameObjects.Image;
    private prevCharacterSImage: Phaser.GameObjects.Image;
    private lastScore;
    private touchToStart: BitmapText;
    private playerData: any;
    private playImage: Phaser.GameObjects.Image;
    private unlocked: BitmapText;

    private indices = {
        'elephant': '', 'frog': 'Score over 5000 to unlock this animal.',
        'gorilla': 'Have more than 40 animals following you \n' +
            '                              to unlock this animal.',
        'giraffe': 'Score over 20000 to unlock this animal.',
        'snake': 'Escape the fire on 5000m to unlock this animal.',
        'moose': 'Save 500 of this type to unlock this animal.',
        'narwhal':  'Save 2000 gold animals to unlock this animal.',
        'parrot': 'Let 1000 animals die in lava to unlock this animal.',
        'hippo': 'Save 500 in one run to unlock this animal.'
    };
    private characterNames: string[];
    private coinsComponent: CoinsComponent;
    private prices = {'bear': 1000, 'crocodile': 5000, 'monkey': 2500, 'whale': 10000, 'panda': 5000};

    private saveCreated: boolean;
    private nextZone: Phaser.GameObjects.Zone;
    private prevZone: Phaser.GameObjects.Zone;
    private playZone: Phaser.GameObjects.Zone;
    private moveTween: Phaser.Tweens.Tween;
    private nextImage: Phaser.GameObjects.Image;
    private prevImage: Phaser.GameObjects.Image;

    private clickSound: Phaser.Sound.BaseSound;
    private buySound : Phaser.Sound.BaseSound;

    constructor() {
        super('Menu');
    }


    updateCharacter(character = this.character) {
        this.character = character;
        this.characterImage.setFrame(character + ".png");
        this.characterSImage.setFrame(character + ".png");
        var ind = this.characterFrames.findIndex((function (el) {
            return el == this.character + ".png"
        }).bind(this));
        this.updateCharacterImages(ind);
    }

	updatePlayerDataUI() {
		// @ts-ignore
		this.indices['narwhal'] = this.i18n.t('animals.narwhal', {n: this.playerData.values.goldSaved})
		// @ts-ignore
		this.indices['moose'] = this.i18n.t('animals.moose', {n: this.playerData.values.mooseCount})
		// @ts-ignore
		this.indices['parrot'] = this.i18n.t('animals.parrot', {n: this.playerData.values.deadInLava})
		// @ts-ignore
		this.indices['snake'] = this.i18n.t('animals.snake', {n: this.playerData.values.bestDistance})
		// @ts-ignore
        this.indices['gorilla'] = this.i18n.t('animals.gorilla', {n: this.playerData.values.maxFollowingAnimals})
		// @ts-ignore
		this.indices['giraffe'] = this.i18n.t('animals.giraffe', {n: this.playerData.values.bestScore})
		// @ts-ignore
		this.indices['frog'] = this.i18n.t('animals.frog', {n: this.playerData.values.bestScore})
		// @ts-ignore
		this.indices['hippo'] = this.i18n.t('animals.hippo', {n: this.playerData.values.maxAnimalsSavedOneRun})

        let characterStatus = this.playerData.get(this.character);
        if (characterStatus == 'unlocked') {
			this.playImage.setFrame('forward.png')
            // @ts-ignore
			this.touchToStart.setText(this.i18n.t("welcome", {name: this.facebook.playerName, character: this.character}))
        } else if (characterStatus == 'locked') {
            this.playImage.setFrame('locked.png')
            // @ts-ignore
            let touchText = this.i18n.t('locked')
			
			if (this.indices[this.character] !== undefined) {
				touchText += this.indices[this.character]
			}

			// @ts-ignore
            this.touchToStart._setText(touchText)
        } else if (characterStatus == 'buyable') {
			this.playImage.setFrame('basket.png')
			// @ts-ignore
			this.touchToStart.setText(this.i18n.t('pay', {price: this.prices[this.character]}))
		}

		let unlockedCount = 0
        for (let i = 0; i < this.characterNames.length; i++) {
            if (this.playerData.get(this.characterNames[i]) === 'unlocked') {
                unlockedCount += 1
            }
		}
		// @ts-ignore
        this.unlocked._setText(unlockedCount + '/' + (Object.keys(this.indices).length + Object.keys(this.prices).length))
    }

    updateCharacterImages(ind) {
        var next = this.nextUnlockableIndex(ind);
        var prev = this.prevUnlockableIndex(ind);
        this.character = this.characterFrames[ind];
        this.character = this.character.slice(0, this.character.length - 4);

        this.characterImage.setFrame(this.characterFrames[ind]);
        this.characterImage.setOrigin(0.5, 0.5 + SQUARE_Y_OFFSETS[this.characterNames[ind]]);
        this.characterSImage.setFrame(this.characterFrames[ind]);
        this.characterSImage.setOrigin(0.5, 0.5 + SQUARE_Y_OFFSETS[this.characterNames[ind]]);
        this.prevCharacterImage.setFrame(this.characterFrames[prev]);
        this.prevCharacterImage.setOrigin(0.5, 0.5 + SQUARE_Y_OFFSETS[this.characterNames[prev]]);
        this.nextCharacterImage.setFrame(this.characterFrames[next]);
        this.nextCharacterImage.setOrigin(0.5, 0.5 + SQUARE_Y_OFFSETS[this.characterNames[next]]);
        this.prevCharacterSImage.setFrame(this.characterFrames[prev]);
        this.prevCharacterSImage.setOrigin(0.5, 0.5 + SQUARE_Y_OFFSETS[this.characterNames[prev]]);
        this.nextCharacterSImage.setFrame(this.characterFrames[next]);
        this.nextCharacterSImage.setOrigin(0.5, 0.5 + SQUARE_Y_OFFSETS[this.characterNames[next]]);

        if (this.playerData.get(this.characterNames[ind]) == 'locked') {
            this.characterSImage.setVisible(true);
            this.characterImage.setVisible(false);
        } else {
            this.characterImage.setVisible(true);
            this.characterSImage.setVisible(false);
        }
        if (this.playerData.get(this.characterNames[prev]) == 'locked') {
            this.prevCharacterSImage.setVisible(true);
            this.prevCharacterImage.setVisible(false);
        } else {
            this.prevCharacterImage.setVisible(true);
            this.prevCharacterSImage.setVisible(false);
        }
        if (this.playerData.get(this.characterNames[next]) == 'locked') {
            this.nextCharacterSImage.setVisible(true);
            this.nextCharacterImage.setVisible(false);
        } else {
            this.nextCharacterImage.setVisible(true);
            this.nextCharacterSImage.setVisible(false);
        }
        this.updatePlayerDataUI();

    }

    nextUnlockableIndex(ind) {
        ind = (ind + 1) % this.characterNames.length;
        while (this.indices[this.characterNames[ind]] === undefined && this.prices[this.characterNames[ind]] === undefined) {
            ind = (ind + 1) % this.characterNames.length;
        }
        return ind;
    }

    prevUnlockableIndex(ind) {
        ind = (ind + this.characterNames.length - 1) % this.characterNames.length;

        while (this.indices[this.characterNames[ind]] === undefined && this.prices[this.characterNames[ind]] === undefined) {
            ind = (ind + this.characterNames.length - 1) % this.characterNames.length;
        }
        return ind;
    }

    addMoveTween(onYoyo) {
        if (this.moveTween == null) {
            var done = false;
            this.moveTween = this.tweens.add({
                targets: [this.nextCharacterImage, this.nextCharacterSImage,
                    this.prevCharacterImage, this.prevCharacterSImage, this.characterImage, this.characterSImage,
                    this.playImage, this.nextImage, this.prevImage],
                scaleX: 0,
                scaleY: 0,
                ease: 'Quad.easeInOut',
                duration: 200,
                yoyo: true,
                repeat: 0,
                delay: 0,
                onYoyo: (function () {
                    if (!done) {
                        done = true;
                        onYoyo();
                    }
                }).bind(this),
                onComplete: (function () {
                    this.moveTween = null;
                    this.nextCharacterImage.setScale(1.8 * SC);
                    this.nextCharacterSImage.setScale(1.8 * SC);
                    this.characterSImage.setScale(1.8 * SC);
                    this.prevCharacterImage.setScale(1.8 * SC);
                    this.prevCharacterSImage.setScale(1.8 * SC);
                }).bind(this)
            });
        }
    }

    next(pointer, gameObject) {
        if (gameObject == this.nextCharacterImage || gameObject == this.nextCharacterSImage) {
            this.clickSound.play()
            this.addMoveTween((
                function () {
                    var ind = this.characterNames.findIndex((function (el) {
                        return el == this.character
                    }).bind(this));
                    ind = this.nextUnlockableIndex(ind);
                    this.updateCharacterImages(ind);
                }).bind(this));


        }
    }

    prev(pointer, gameObject) {
        if (gameObject == this.prevCharacterImage || gameObject == this.prevCharacterSImage) {
            this.clickSound.play()
            this.addMoveTween((
                function () {
                    var ind = this.characterNames.findIndex((function (el) {
                        return el == this.character
                    }).bind(this));
                    ind = this.prevUnlockableIndex(ind);
                    this.updateCharacterImages(ind);
                }).bind(this));
        }
    }

    play(pointer, gameObject) {
        if (this.characterImage === gameObject) {

            this.addMoveTween((
                function () {
                    var characterStatus = this.playerData.get(this.character);
                    if (characterStatus == 'unlocked') {
                        this.startGame();
                        this.clickSound.play()
                    } else if (characterStatus == 'buyable') {

                        if (this.playerData.values.coins >= this.prices[this.character]) {
                            this.buySound.play()
                            this.coinsComponent.smoothChangeScore(-this.prices[this.character], 1).play();
                            this.playerData.values.coins -= this.prices[this.character];
                            this.playerData.values[this.character] = 'unlocked';
                        }
                        this.updateCharacter();
                    }
                }).bind(this));

        }
    }

    createSave() {
        var data = {
            'bear': 'buyable',
            'buffalo': 'locked',
            'chick': 'locked',
            'chicken': 'locked',
            'cow': 'locked',
            'crocodile': 'buyable',
            'dog': 'locked',
            'duck': 'locked',
            'elephant': 'unlocked',
            'frog': 'locked',
            'giraffe': 'locked',
            'goat': 'locked',
            'gorilla': 'locked',
            'hippo': 'locked',
            'horse': 'locked',
            'monkey': 'buyable',
            'moose': 'locked',
            'narwhal': 'locked',
            'owl': 'locked',
            'panda': 'buyable',
            'parrot': 'locked',
            'penguin': 'locked',
            'pig': 'locked',
            'rabbit': 'locked',
            'rhino': 'locked',
            'sloth': 'locked',
            'snake': 'locked',
            'walrus': 'locked',
            'whale': 'buyable',
            'zebra': 'locked',
            'coins': 0,
            'deadInLava': 0,
            'gameCount': 0,
            'lastDistance': 0,
            'bestDistance': 0,
            'lastScore': 0,
            'bestScore': 0,
            'goldSaved': 0,
            'maxAnimalsSavedOneRun': 0,
            'maxFollowingAnimals': 0

        };


        this.characterNames.forEach(character => data[character + "Count"] = 0 );

        //@ts-ignore
        this.facebook.saveData(data);
        this.coinsComponent.smoothChangeScore(data['coins'], 1).play();

    }

    update() {
        this.coinsComponent.update();
    }

    create() {
        this.moveTween = null;
        this.saveCreated = false;
        // @ts-ignore
        console.log(this.facebook.playerID);
        this.height = this.sys.canvas.height;
        this.width = this.sys.canvas.width;
        SC = this.height / 1920;
        this.camera = this.cameras.main;
        var atlasTexture = this.textures.get('round');

        this.clickSound = this.sound.add('clickSound')
        this.buySound = this.sound.add('buySound')

        this.characterFrames = atlasTexture.getFrameNames();
        this.characterFrames = ['buffalo.png', 'chick.png', 'chicken.png', 'cow.png', 'dog.png', 'duck.png', 'elephant.png',
            'frog.png', 'giraffe.png', 'goat.png', 'hippo.png', 'horse.png', 'moose.png', 'narwhal.png', 'owl.png',
            'parrot.png', 'penguin.png', 'pig.png', 'rabbit.png', 'rhino.png', 'sloth.png', 'snake.png', 'gorilla.png', 'walrus.png', 'zebra.png',
            'whale.png', 'panda.png', 'crocodile.png', 'monkey.png', 'bear.png']
        this.characterNames = this.characterFrames.map(function (frame) {
            return frame.slice(0, frame.length - 4);
        });
        this.character = 'elephant';

        // @ts-ignore
        this.facebook.once('getleaderboard', (function (leaderboard) {

            if (leaderboard.name == 'Highscores') {

                this.highscores = leaderboard;
                leaderboard.on('getscores', (function (scores) {
                    this.createHighscoreTab(scores);

                    // @ts-ignore
                    this.highscores.on('getplayerscore', function (score, name) {
                        var data = JSON.parse(score.data);
                        this.updateCharacter(data.character);
                        this.createPlayerScoreLine();

                    }.bind(this), this);

                    this.highscores.getPlayerScore();
                }).bind(this));
                this.highscores.getScores(LEADERBOARD_DRAW, 0);

            } else if (leaderboard.name == 'Amis')
                this.friends = leaderboard;


        }).bind(this), this);

        var background = this.add.image(this.width / 2, this.height / 2, 'menuBackground');
        background.setScale(SC);
        this.coinsComponent = new CoinsComponent(this, 0);
        this.coinsComponent.create(SC);

        this.characterImage = this.add.image(0, 0, 'squareOutline', 'elephant.png');
        this.characterImage.setScale(1.8 * SC);

        this.characterSImage = this.add.image(0, 0, 'squareSilhouette', 'elephant.png');
        this.characterSImage.setScale(1.8 * SC);

        this.playImage = this.add.image(0, 0, 'icons', 'forward.png');
        this.playImage.setScale(3 * SC);
        this.playZone = this.add.zone(this.width / 2, 270 * SC + 2 * this.height / 8, this.width, this.height * 3 / 8);
        Phaser.Display.Align.In.Center(this.characterImage, this.playZone);
        Phaser.Display.Align.In.Center(this.characterSImage, this.playZone);
        Phaser.Display.Align.In.Center(this.playImage, this.playZone);

        this.nextCharacterImage = this.add.image(0, 0, 'squareOutline', 'frog.png');
        this.nextCharacterImage.setScale(1.8 * SC);

        this.nextCharacterSImage = this.add.image(0, 0, 'squareSilhouette', 'frog.png');
        this.nextCharacterSImage.setScale(1.8 * SC);

        this.nextImage = this.add.image(0, 0, 'icons', 'arrowRight.png');
        this.nextImage.setScale(3 * SC);

        this.nextZone = this.add.zone(this.width / 2 + (64 + 128) * 1.8 * SC, 270 * SC + 2 * this.height / 8, this.width, this.height * 3 / 8);

        Phaser.Display.Align.In.Center(this.nextImage, this.nextZone);
        Phaser.Display.Align.In.Center(this.nextCharacterImage, this.nextZone);
        Phaser.Display.Align.In.Center(this.nextCharacterSImage, this.nextZone);

        this.prevCharacterImage = this.add.image(0, 0, 'squareOutline', 'duck.png');
        this.prevCharacterImage.setScale(1.8 * SC);

        this.prevCharacterSImage = this.add.image(0, 0, 'squareSilhouette', 'duck.png');
        this.prevCharacterSImage.setScale(1.8 * SC);

        this.prevImage = this.add.image(0, 0, 'icons', 'arrowLeft.png');
        this.prevImage.setScale(3 * SC);

        this.prevZone = this.add.zone(this.width / 2 - (64 + 128) * 1.8 * SC, 270 * SC + 2 * this.height / 8, this.width, this.height * 3 / 8);
        Phaser.Display.Align.In.Center(this.prevImage, this.prevZone);
        Phaser.Display.Align.In.Center(this.prevCharacterImage, this.prevZone);
        Phaser.Display.Align.In.Center(this.prevCharacterSImage, this.prevZone);

        this.nextImage.setAlpha(0.8);
        this.prevImage.setAlpha(0.8);
        this.playImage.setAlpha(0.8);

        this.nextCharacterImage.setInteractive();
        this.prevCharacterImage.setInteractive();
        this.characterImage.setInteractive();

        this.nextCharacterSImage.setInteractive();
        this.prevCharacterSImage.setInteractive();

        var zone = this.add.zone(this.width / 2 - (64 + 128) * 1.8 * SC, -50 * SC + 2 * this.height / 8, this.width, this.height * 3 / 8);
        var unlockedImage = this.add.image(0, 0, 'icons', 'unlocked.png');
        unlockedImage.setScale(2 * SC);
        unlockedImage.setAlpha(0.5);

        this.unlocked = this.add.bitmapText(0, 0, 'jungle', '');
        this.unlocked.setFontSize(70 * SC);
        this.unlocked.tint = 0xCCCCCC;


        Phaser.Display.Align.In.Center(this.unlocked, zone);
        Phaser.Display.Align.In.Center(unlockedImage, this.unlocked);

        this.nextCharacterImage.setAlpha(1, 0.5, 1, 0.5);
        this.prevCharacterImage.setAlpha(0.5, 1, 0.5, 1);
        this.nextCharacterSImage.setAlpha(1, 0.5, 1, 0.5);
        this.prevCharacterSImage.setAlpha(0.5, 1, 0.5, 1);

        this.camera.setBackgroundColor('#5a756f');
        // @ts-ignore
        this.facebook.getLeaderboard('Highscores');
        // @ts-ignore
        //this.facebook.getLeaderboard('Amis.'+FBInstant.context.getID());
        // @ts-ignore
		this.touchToStart = this.add.bitmapText(0, 0, "jungle", "welcome2", 40 * SC, {name: this.facebook.playerName});

        let title = this.add.bitmapText(0, 100, "jungle", "Elephant Game", 120 * SC);
        let screenZone = this.add.zone(this.width / 2, this.height / 2, this.width, this.height);
    	var topZone = this.add.zone(this.width / 2, 200 * SC, this.width, this.height / 2);
        Phaser.Display.Align.In.Center(this.touchToStart, screenZone);
        Phaser.Display.Align.In.Center(title, topZone);

        let callback = this.startGame.bind(this);
        //this.input.on("pointerdown", callback);


        // @ts-ignore
        this.load.image(this.facebook.playerID, this.facebook.playerPhotoURL);
        this.load.on('complete', this.addPlayerPhoto, this);

        this.input.on("gameobjectdown", (this.next).bind(this));
        this.input.on("gameobjectdown", (this.prev).bind(this));
        this.input.on("gameobjectdown", (this.play).bind(this));
        if (this.lastScore !== undefined) {
            var text = this.add.bitmapText(0, 0, 'jungle', 'Last score: ' + this.lastScore);
            text.setFontSize(70 * SC);
            var topZone = this.add.zone(this.width / 2, this.height / 18, this.width, this.height / 10);
            Phaser.Display.Align.In.Center(text, topZone);
        }


        var dataKeys = this.characterNames.slice();

        dataKeys.push('coins');
        dataKeys.push('deadInLava');
        dataKeys.push('gameCount');
        dataKeys.push('lastDistance');
        dataKeys.push('bestDistance');
        dataKeys.push('lastScore');
        dataKeys.push('bestScore');
        dataKeys.push('goldSaved');
        dataKeys.push('maxAnimalsSavedOneRun');
        dataKeys.push('maxFollowingAnimals');

        this.characterNames.forEach(character => dataKeys.push(character + "Count"));
        // @ts-ignore
        this.facebook.getData(dataKeys);
        //@ts-ignore
        this.facebook.on('savedata', (function () {
            this.updateCharacter();
            this.updatePlayerDataUI();

            // @ts-ignore
            this.facebook.getData(dataKeys);

        }).bind(this));
        // @ts-ignore
        this.facebook.on('getdata', (function () {
            this.playerData = this.facebook.data;
            var s = false;
            if ((this.facebook.data.values.elephant === undefined
                || this.facebook.data.values.bear === 'locked'
                || this.facebook.data.values.panda === 'locked') && !this.saveCreated) {

                s = true;
                this.createSave();

            } else if (this.playerData.values.coins === undefined && !this.saveCreated) {
                this.playerData.set('coins', 0);
            }
            if (!s && !this.saveCreated) {
                this.saveCreated = true;
                this.coinsComponent.smoothChangeScore(this.playerData.values.coins, 1).play();
            }
            if (s)
                this.saveCreated = true;


            //In order to update images and texts.
            this.updateCharacter();
            this.updatePlayerDataUI();

            this.scene.get('MainScene').setPlayerData(this.playerData);

        }).bind(this), this);

        var logo = this.add.image(this.width * 0.83, this.height * 0.9, 'logo');
        logo.setScale(1.5 * SC);

        logo.setInteractive();
        this.input.on('gameobjectdown', function (pointer, gameObject) {
            if (gameObject === logo) {
                this.clickSound.play()
                this.scene.pause('Menu');
                this.scene.launch('CreditScene');
            }
        }, this);
        this.tweens.add({
            targets: logo,
            scaleX: 1.6 * SC,
            scaleY: 1.6 * SC,
            ease: 'Sine.easeInOut',
            duration: 2000,
            yoyo: true,
            repeat: Infinity,
            delay: 2000
        });
        this.tweens.add({
            targets: [this.characterImage],
            scaleX: 1.8 * 1.03 * SC,
            scaleY: 1.8 * 1.03 * SC,
            ease: 'Quint.easeIn',
            duration: 300,
            yoyo: true,
            repeat: Infinity,
            delay: 200
        });
        this.tweens.add({
            targets: [this.playImage],
            scaleX: 3 * 1.03 * SC,
            scaleY: 3 * 1.03 * SC,
            ease: 'Quint.easeIn',
            duration: 300,
            yoyo: true,
            repeat: Infinity,
            delay: 200
        });
    }

    addScoreEntry(entry, y): boolean {
        var pic = this.add.image(320 * SC - 1000 * SC, y + 40 * SC, entry.playerID);
        pic.setScale(0.3 * SC);
        var data = JSON.parse(entry.data);
        var character = this.add.image(215 * SC - 1000 * SC, y + 40 * SC, "square_nodetailsOutline", data.character + ".png");
        character.setScale(0.75 * SC);
        var rankText = this.add.bitmapText(200 * SC - 1000 * SC, y + 13 * SC, "jungle", entry.rank);
        var nameText = this.add.bitmapText(400 * SC - 1000 * SC, y, "jungle", entry.playerName);
        var scoreText = this.add.bitmapText(400 * SC - 1000 * SC, y + 50 * SC, "jungle", "Score: " + entry.scoreFormatted);


        this.tweens.add({
            targets: character,
            x: 215 * SC,
            ease: 'Quint.easeIn',
            duration: 1000,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: rankText,
            x: 200 * SC,
            ease: 'Quint.easeIn',
            duration: 1000,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: nameText,
            x: 400 * SC,
            ease: 'Quint.easeIn',
            duration: 1000,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: scoreText,
            x: 400 * SC,
            ease: 'Quint.easeIn',
            duration: 1000,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: pic,
            x: 320 * SC,
            ease: 'Quint.easeIn',
            duration: 1000,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        rankText.tint = 0x11604f;


        rankText.setFontSize(50 * SC);
        nameText.setFontSize(50 * SC);
        scoreText.setFontSize(50 * SC);
        // @ts-ignore
        if (entry.playerID == this.facebook.playerID) {
            nameText.tint = 0xFF5757;
            return true;
        }
        return false;
    }

    createPlayerScoreLine() {
        if (!this.inLeaderboard) {
            var baseY = this.height / 2 + 100 * SC;
            var entry = this.highscores.playerScore;
            // @ts-ignore
            this.addScoreEntry(entry, baseY + (LEADERBOARD_DRAW + 1) * 100 * SC + 25 * SC);
        }
    }

    createHighscoreTab(scores): void {
        for (var i = 0; i < scores.length; i++) {
            var entry = scores[i];

            this.load.image(entry.playerID, entry.playerPhotoURL);
        }
        this.load.once("complete", (function () {
            this.scores = scores;

            var baseY = this.height / 2 + 100 * SC;

            this.inLeaderboard = false;
            for (var i = 0; i < scores.length; i++) {
                var entry = scores[i];

                if (this.addScoreEntry(entry, baseY + i * 100 * SC))
                    this.inLeaderboard = true;
            }
        }).bind(this));


        this.load.start();
    }

    addPlayerPhoto() {
        // @ts-ignore
        var profile = this.add.image(0, 0, this.facebook.playerID);

        var secondQuarterZone = this.add.zone(this.width / 2, 2 * this.height / 8, this.width, this.height * 3 / 8);
        profile.setScale(0);
        this.tweens.add({
            targets: profile,
            scaleX: 0.75 * SC,
            scaleY: 0.75 * SC,
            ease: 'Quad.easeIn',
            duration: 1000,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        Phaser.Display.Align.In.Center(profile, secondQuarterZone);

    }

    startGame() {
        this.scene.start('MainScene');
        // @ts-ignore
        this.scene.get('MainScene').updateCharacter(this.character);

    }

}

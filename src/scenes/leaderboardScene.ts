import { MainScene } from './mainScene'
import { Menu } from './menu'
import { VolumeComponent } from '../ui/volumeComponent'

import BitmapText = Phaser.GameObjects.BitmapText
import Image = Phaser.GameObjects.Image
import Container = Phaser.GameObjects.Container
import GameObject = Phaser.GameObjects.GameObject

var SC;
export class LeaderboardScene extends Phaser.Scene {
    private width: number
    private height: number
    private camera: Phaser.Cameras.Scene2D.Camera

    private leaderboardObjects : GameObject[]
    private playerData: any
    private highscores

    private left: Phaser.GameObjects.Image
    private right: Phaser.GameObjects.Image
    private menu: Phaser.GameObjects.Image

    private offset: number;

    private clickSound: Phaser.Sound.BaseSound

    constructor () {
        super({
            key: "LeaderboardScene"
        })
    }

    resume () {
        this.scene.resume('MainScene')
        this.scene.stop('PauseScene')
    }
    handleTouchDown(pointer, gameobject){
        switch (gameobject) {
            case this.menu:
                this.resumeGame()
                this.clickSound.play()
                break
            case this.left:
                this.offset -= 10
                this.clickSound.play()
                this.generateLeaderBoardPage(10, this.offset)
                break

            case this.right:
                this.offset += 10
                this.clickSound.play()
                this.generateLeaderBoardPage(10, this.offset)
                break
        }
    }
    createHighscoreTab(scores): void {
        scores = scores.slice(0, Math.min(scores.length, 10))
        for (var i = 0; i < scores.length; i++) {
            var entry = scores[i];

            this.load.image(entry.playerID, entry.playerPhotoURL);
        }
        this.load.once('complete', function() {
            var baseY = 300 * SC;

            for (var i = 0; i < scores.length; i++) {
                var entry = scores[i];

                this.addScoreEntry(entry, baseY + i * 150 * SC)
            }

        }, this);

        this.load.start();
    }
    addScoreEntry(entry, y): boolean {

        var pic = this.add.image(400 * SC - 1000 * SC, y + 40 * SC, entry.playerID);
        pic.setScale(0.3 * SC);
        var data = JSON.parse(entry.data);
        var character = this.add.image(295 * SC - 1000 * SC, y + 40 * SC, "square_nodetailsOutline", data.character + ".png");
        character.setScale(0.75 * SC);
        var rankText = this.add.bitmapText(280 * SC - 1000 * SC, y + 13 * SC, "jungle", entry.rank);
        rankText.tint = 0xe5e5e5;
        var nameText = this.add.bitmapText(480 * SC - 1000 * SC, y, "jungle", entry.playerName);
        nameText.tint = 0xe5e5e5;
        var scoreText = this.add.bitmapText(480 * SC - 1000 * SC, y + 50 * SC, "jungle", "Score " + entry.scoreFormatted);
        scoreText.tint = 0xe5e5e5;

        this.leaderboardObjects.push(pic)
        this.leaderboardObjects.push(character)
        this.leaderboardObjects.push(rankText)
        this.leaderboardObjects.push(nameText)
        this.leaderboardObjects.push(scoreText)
        this.tweens.add({
            targets: character,
            x: 295 * SC,
            ease: 'Quint.easeIn',
            duration: 200,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: rankText,
            x: 280 * SC,
            ease: 'Quint.easeIn',
            duration: 200,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: nameText,
            x: 480 * SC,
            ease: 'Quint.easeIn',
            duration: 200,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: scoreText,
            x: 480 * SC,
            ease: 'Quint.easeIn',
            duration: 200,
            yoyo: false,
            repeat: 0,
            delay: 0
        });
        this.tweens.add({
            targets: pic,
            x: 400 * SC,
            ease: 'Quint.easeIn',
            duration: 200,
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
    getLeaderboard(){

        // @ts-ignore
        this.facebook.once('getleaderboard', (function (leaderboard) {
            if (leaderboard.name == 'Highscores') {
                this.highscores = leaderboard;
                leaderboard.once('getplayerscore', (function (score, name) {
                    this.offset = Math.trunc((score.rank - 1)/10) * 10
                    this.generateLeaderBoardPage(10, this.offset)
                }).bind(this));
                this.highscores.getPlayerScore();
            }
        }).bind(this));
        // @ts-ignore
        this.facebook.getLeaderboard('Highscores')
    }
    generateLeaderBoardPage(count, offset){
        this.leaderboardObjects.forEach(function(object){
            object.destroy()
        }
            )
        this.leaderboardObjects = []
        this.highscores.once('getscores', function (scores) {
            this.right.setActive(scores.length == 11)
            this.right.setVisible(scores.length == 11)
            this.left.setActive(offset > 0)
            this.left.setVisible(offset > 0)

            this.createHighscoreTab(scores);
        }.bind(this));
        this.highscores.getScores(11, offset);
    }
    resumeGame(){
        this.scene.resume('Menu');
        this.scene.stop('LeaderboardScene');
    }
    create () {
        SC = this.sys.canvas.height / 1920

        this.width = this.sys.canvas.width
        this.height = this.sys.canvas.height

        this.clickSound = this.sound.add('clickSound')
        this.offset = 0

        this.leaderboardObjects = []
        this.camera = this.sys.cameras.main
        this.camera.setBackgroundColor('rgba(0, 0, 0, 0.8)')


        this.getLeaderboard()

        var leaderboard = this.add.bitmapText(this.width/2, 100 * SC, 'jungle', 'leaderboard', 100*SC).setOrigin(0.5,0.5)

        this.left = this.add.image(this.width * 0.1, this.height * 0.1, 'iconsw', 'arrowLeft.png')
        this.left.setScale(2*SC)

        this.right = this.add.image(this.width * 0.9, this.height * 0.1, 'iconsw', 'arrowRight.png')
        this.right.setScale(2*SC)

        this.menu = this.add.image(this.width * 0.5, this.height * 0.1, 'iconsw', 'home.png')
        this.menu.setScale(2*SC)

        this.left.setInteractive()
        this.right.setInteractive()
        this.menu.setInteractive()
        this.input.on('gameobjectdown', this.handleTouchDown, this)
    }

    setPlayerData(playerData: any) {
        this.playerData = playerData

        new VolumeComponent(this)
    }
}

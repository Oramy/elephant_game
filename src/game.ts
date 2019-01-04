/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 Digitsensitive
 * @license      Digitsensitive
 */

/// <reference path="./phaser.d.ts"/>

import "phaser";
import { MainScene } from "./scenes/mainScene";
import { Menu } from "./scenes/menu";
import {Preloader} from "./scenes/preloader";
import {GameOverScene} from "./scenes/gameOverScene";

// main game configuration


// game class
export class Game extends Phaser.Game {

  private highscores : any;
  constructor(config: GameConfig) {
    super(config);
  }
}

// @ts-ignore
FBInstant.initializeAsync().then(function(){





  var config: any = {
    width: 720,
    height: 1280,
    scale:{
      // @ts-ignore
      mode: Phaser.DOM.SHOW_ALL
    },
    type: Phaser.AUTO,
    parent: "game",
    scene: [Preloader, Menu, MainScene, GameOverScene],
    physics: {
      default: "matter",
      matter: {
        gravity: { y: 0 }
      }
    },

  };
  new Game(config);
});

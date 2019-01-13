/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 Digitsensitive
 * @license      Digitsensitive
 */

/// <reference path="./phaser.d.ts"/>

import "phaser";
import { MainScene } from "./scenes/mainScene";
import { Menu } from "./scenes/menu";
import { Preloader } from "./scenes/preloader";
import { GameOverScene } from "./scenes/gameOverScene";
import { CreditScene } from "./scenes/creditScene";
import { PauseScene } from "./scenes/pauseScene";
import { I18nPlugin } from "@koreez/phaser3-i18n";
import { LeaderboardScene } from './scenes/leaderboardScene'

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
    scene: [Preloader, Menu, MainScene, GameOverScene, PauseScene, CreditScene, LeaderboardScene],
    physics: {
      default: "matter",
      matter: {
        gravity: { y: 0 }
      }
    },
    plugins: {
        scene: [
            {
                key: "i18nPlugin",
                plugin: I18nPlugin,
                mapping: "i18n"
            }
        ]
    }
  };
  new Game(config);
});

// Ponto de entrada principal da aplicação.

import { InfiniteMahjong } from './game.js';
import { initPWA } from './pwa.js';

const game = new InfiniteMahjong();
window.game = game;

initPWA();


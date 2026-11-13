import * as THREE from 'three';
import { store } from './game/store.js';
import { startEngine } from './game/engine.js';
import { initUI } from './ui/ui.js';

THREE.ColorManagement.enabled = true; // correct sRGB colours
store.load();
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
document.getElementById('game').appendChild(canvas);
initUI(startEngine(canvas).api);

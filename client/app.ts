AFRAME = require('aframe');

require('aframe-extras/src/controls');
require('aframe-look-at-component');
// require('aframe-sprite-component');
require('aframe-template-component');

require('networked-aframe');

require('mousetrap');

import './primitives/Shelf.primitive';
import './components/Shelf.component';
import './primitives/ShelfItem.primitive';
import './components/ShelfItem.component';

import './components/LockedPointer.component';
import './components/SlidingPointer.component';
import './components/Snap.component';
import './components/TestRotate.component';
import './components/DynamicCursor.component';
import './components/LockedTrack.component';
import './components/ConstantScale.component';
import './components/Velocity.component';
import './components/CopyRotation.component';
import './components/HDD.component';
import './components/EditorControls.component';
import './commands/CommandButton.component';
// import { AnchorCompDef } from './components/Anchor.component';
import './components/LineLink.component';
import './components/Subdivision.component';

import './components/GridMaterial.component';
// import './components/OutlineMaterial.component';
import './components/ApplyMaterial.component';

import './systems/GridMaterial.system';
import './commands/Command.system';
import './systems/TickOrder.system';
import './systems/UI.system';


document.addEventListener('load', () => {
	const scene = document.querySelector('a-scene');


AFRAME = require('aframe');

require('aframe-extras/src/controls');

const NAF = require('networked-aframe');

require('mousetrap');

import { GridComp } from "./components/Grid.component";
import { LockedPointerComp } from "./components/LockedPointer.component";
import { SnapComp } from "./components/Snap.component";

import { DrawingSystem } from "./systems/Drawing.system";


AFRAME.registerPrimitive('a-grid', GridComp);
AFRAME.registerComponent('locked-pointer', LockedPointerComp);
AFRAME.registerComponent('snap', SnapComp);

AFRAME.registerSystem('drawing', DrawingSystem);

document.addEventListener('load', () => {
	const axesHelper = new AFRAME.THREE.AxesHelper( 5 );
	document.querySelector('a-scene').object3D.add( axesHelper );
});

AFRAME = require('aframe');

require('aframe-extras/src/controls');

const NAF = require('networked-aframe');

require('mousetrap');

import { LockedPointerComp } from "./components/LockedPointer.component";
import { SnapComp } from "./components/Snap.component";
import { TestRotateComp } from "./components/TestRotate.component";

import { GridMaterial } from "./components/GridMaterial.component";

import { GridMatSys } from "./systems/GridMaterial.system";
import { DrawingSystem } from "./systems/Drawing.system";


AFRAME.registerComponent('locked-pointer', LockedPointerComp);
AFRAME.registerComponent('snap', SnapComp);

AFRAME.registerComponent('grid', GridMaterial);
AFRAME.registerComponent('test-rotate', TestRotateComp);

AFRAME.registerSystem('grid', GridMatSys);
AFRAME.registerSystem('drawing', DrawingSystem);

document.addEventListener('load', () => {
	const scene = document.querySelector('a-scene');

	const axesHelper = new AFRAME.THREE.AxesHelper( 5 );
	scene.object3D.add( axesHelper );

	Mousetrap.bind('space', () => {
		if (scene.isPlaying) {
			scene.pause();
		}
		else {
			scene.play();
		}
	});
});

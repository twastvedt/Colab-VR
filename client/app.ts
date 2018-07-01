AFRAME = require('aframe');

require('aframe-extras/src/controls');

require('aframe-sprite-component');

require('networked-aframe');

require('mousetrap');


import { LockedPointerComp } from './components/LockedPointer.component';
import { SlidingPointerComp } from './components/SlidingPointer.component';
import { SnapComp } from './components/Snap.component';
import { TestRotateComp } from './components/TestRotate.component';
import { CursorGeoComp } from './components/CursorGeo.component';
import { LockedTrackComp } from './components/LockedTrack.component';
import { ConstantScaleComp } from './components/ConstantScale.component';
import { VelocityCompDef } from './components/Velocity.component';

import { GridMatCompDef } from './components/GridMaterial.component';
import { OutlineMatCompDef } from './components/OutlineMaterial.component';
import { ApplyMatCompDef } from './components/ApplyMaterial.component';

import { GridMatSysDef } from './systems/GridMaterial.system';
import { DrawingSystem } from './systems/Drawing.system';
import { TickOrderSysDef } from './systems/TickOrder.system';


AFRAME.registerComponent('locked-pointer', LockedPointerComp);
AFRAME.registerComponent('sliding-pointer', SlidingPointerComp);
AFRAME.registerComponent('snap', SnapComp);
AFRAME.registerComponent('cursor-geo', CursorGeoComp);
AFRAME.registerComponent('locked-track', LockedTrackComp);
AFRAME.registerComponent('constant-scale', ConstantScaleComp);
AFRAME.registerComponent('velocity', VelocityCompDef);

AFRAME.registerComponent('grid-mat', GridMatCompDef);
AFRAME.registerComponent('outline', OutlineMatCompDef);
AFRAME.registerComponent('apply-material', ApplyMatCompDef);
AFRAME.registerComponent('test-rotate', TestRotateComp);

AFRAME.registerSystem('grid-mat', GridMatSysDef);
AFRAME.registerSystem('drawing', DrawingSystem);
AFRAME.registerSystem('tick-order', TickOrderSysDef);

document.addEventListener('load', () => {
	const scene = document.querySelector('a-scene');

	Mousetrap.bind('space', () => {
		if (scene.isPlaying) {
			scene.pause();
		}
		else {
			scene.play();
		}
	});
});

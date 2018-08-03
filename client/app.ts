AFRAME = require('aframe');

require('aframe-extras/src/controls');
require('aframe-look-at-component');
// require('aframe-sprite-component');
require('aframe-template-component');

require('networked-aframe');

require('mousetrap');

import { ShelfPrimDef } from './primitives/Shelf.primitive';
import { ShelfCompDef } from './components/Shelf.component';
import { ShelfItemPrimDef } from './primitives/ShelfItem.primitive';
import { ShelfItemCompDef } from './components/ShelfItem.component';

import { LockedPointerComp } from './components/LockedPointer.component';
import { SlidingPointerComp } from './components/SlidingPointer.component';
import { SnapComp } from './components/Snap.component';
import { TestRotateComp } from './components/TestRotate.component';
import { DynamicCursorComp } from './components/DynamicCursor.component';
import { LockedTrackComp } from './components/LockedTrack.component';
import { ConstantScaleComp } from './components/ConstantScale.component';
import { VelocityCompDef } from './components/Velocity.component';
import { CopyRotationComp } from './components/CopyRotation.component';
import { HDDComp } from './components/HDD.component';
import { EditorControlsComp } from './components/EditorControls.component';
import { CommandButtonCompDef } from './commands/CommandButton.component';
// import { AnchorCompDef } from './components/Anchor.component';
import { LineLinkCompDef } from './components/LineLink.component';

import { GridMatCompDef } from './components/GridMaterial.component';
import { OutlineMatCompDef } from './components/OutlineMaterial.component';
import { ApplyMatCompDef } from './components/ApplyMaterial.component';

import { GridMatSysDef } from './systems/GridMaterial.system';
import { CommandSystemDef } from './systems/Command.system';
import { TickOrderSysDef } from './systems/TickOrder.system';
import { UISystemDef } from './systems/UI.system';


AFRAME.registerSystem('grid-mat', GridMatSysDef);
AFRAME.registerSystem('command', CommandSystemDef);
AFRAME.registerSystem('tick-order', TickOrderSysDef);
AFRAME.registerSystem('ui', UISystemDef);

AFRAME.registerPrimitive('a-shelf', ShelfPrimDef);
AFRAME.registerComponent('shelf', ShelfCompDef);
AFRAME.registerPrimitive('a-shelf-item', ShelfItemPrimDef);
AFRAME.registerComponent('shelf-item', ShelfItemCompDef);

AFRAME.registerComponent('locked-pointer', LockedPointerComp);
AFRAME.registerComponent('sliding-pointer', SlidingPointerComp);
AFRAME.registerComponent('snap', SnapComp);
AFRAME.registerComponent('dynamic-cursor', DynamicCursorComp);
AFRAME.registerComponent('locked-track', LockedTrackComp);
AFRAME.registerComponent('constant-scale', ConstantScaleComp);
AFRAME.registerComponent('velocity', VelocityCompDef);
AFRAME.registerComponent('copy-rotation', CopyRotationComp);
AFRAME.registerComponent('hdd', HDDComp);
AFRAME.registerComponent('editor-controls', EditorControlsComp);
AFRAME.registerComponent('command-button', CommandButtonCompDef);
// AFRAME.registerComponent('anchor', AnchorCompDef);
AFRAME.registerComponent('line-link', LineLinkCompDef);

AFRAME.registerComponent('grid-mat', GridMatCompDef);
AFRAME.registerComponent('outline', OutlineMatCompDef);
AFRAME.registerComponent('apply-material', ApplyMatCompDef);
AFRAME.registerComponent('test-rotate', TestRotateComp);


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

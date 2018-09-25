AFRAME = require('aframe');

require('aframe-extras/src/controls');
require('aframe-look-at-component');
// require('aframe-sprite-component');
require('aframe-template-component');

require('networked-aframe');

require('mousetrap');


import { shelfPrimDef } from './primitives/Shelf.primitive';
import { shelfItemPrimDef } from './primitives/ShelfItem.primitive';

import { shelfCompDef } from './components/Shelf.component';
import { shelfItemCompDef } from './components/ShelfItem.component';
import { lockedPointerCompDef } from './components/LockedPointer.component';
import { slidingPointerCompDef } from './components/SlidingPointer.component';
import { snapCompDef } from './components/Snap.component';
import { dynamicCursorCompDef } from './components/DynamicCursor.component';
import { lockedTrackCompDef } from './components/LockedTrack.component';
import { constantScaleCompDef } from './components/ConstantScale.component';
import { velocityCompDef } from './components/Velocity.component';
import { copyRotationCompDef } from './components/CopyRotation.component';
import { hddCompDef } from './components/HDD.component';
import { editorControlsCompDef } from './components/EditorControls.component';
import { commandButtonCompDef } from './commands/CommandButton.component';
import { lineLinkCompDef } from './components/LineLink.component';
import { subdivisionCompDef } from './components/Subdivision.component';
import { gridMatCompDef } from './components/GridMaterial.component';
import { applyMatCompDef } from './components/ApplyMaterial.component';
import { haroldObjectCompDef } from './components/HaroldObject.component';

import { gridMatSysDef } from './systems/GridMaterial.system';
import { commandSysDef } from './commands/Command.system';
import { tickOrderSysDef, MakeTickComponent } from './systems/TickOrder.system';
import { uiSysDef } from './systems/UI.system';


const componentDefs = {
	'dynamic-cursor': dynamicCursorCompDef,
	'sliding-pointer': slidingPointerCompDef,
	'shelf': shelfCompDef,
	'shelf-item': shelfItemCompDef,
	'locked-pointer': lockedPointerCompDef,
	'snap': snapCompDef,
	'locked-track': lockedTrackCompDef,
	'constant-scale': constantScaleCompDef,
	'velocity': velocityCompDef,
	'copy-rotation': copyRotationCompDef,
	'hdd': hddCompDef,
	'editor-controls': editorControlsCompDef,
	'command-button': commandButtonCompDef,
	'line-link': lineLinkCompDef,
	'subdivision': subdivisionCompDef,
	'grid-mat': gridMatCompDef,
	'apply-mat': applyMatCompDef,
	'harold-object': haroldObjectCompDef
};

MakeTickComponent(lockedPointerCompDef, 200);
MakeTickComponent(lockedTrackCompDef, 200);
MakeTickComponent(slidingPointerCompDef, 200);

MakeTickComponent(snapCompDef, 400);

MakeTickComponent(lineLinkCompDef, 600);

MakeTickComponent(constantScaleCompDef, 800);

for (let name in componentDefs) {
	AFRAME.registerComponent(name, (componentDefs as {[name: string]: AFrame.ComponentDefinition})[name]);
}


const systemDefs = {
	'grid-mat': gridMatSysDef,
	'command': commandSysDef,
	'tick-order': tickOrderSysDef,
	'ui': uiSysDef
};

for (let name in systemDefs) {
	AFRAME.registerSystem(name, (systemDefs as {[name: string]: AFrame.SystemDefinition})[name]);
}


const primitiveDefs: {[name: string]: AFrame.PrimitiveDefinition} = {
	'a-shelf': shelfPrimDef,
	'a-shelf-item': shelfItemPrimDef
};

for (let name in primitiveDefs) {
	AFRAME.registerPrimitive(name, primitiveDefs[name]);
}

type systems = { [K in keyof typeof systemDefs]: typeof systemDefs[K]['_systemType'] };

declare global {
	namespace HAROLD {
		export type Entity = AFrame.Entity & { sceneEl: Scene };
		export type Component = AFrame.Component & { el: Entity };
		export interface Scene extends AFrame.Scene {
			systems: systems;
		}

		type components = { [K in keyof typeof componentDefs]: typeof componentDefs[K]['_componentType'] };

		export type States = ObjectStates;
	}

	interface Window {
		HAROLD: HAROLD;
	}

	var HAROLD: HAROLD;

	interface HAROLD {
		States: typeof ObjectStates;
	}
}

enum ObjectStates {
	hovered = 'hovered',
	baseEditing = 'baseEditing',
	modified = 'modified'
}

HAROLD = window.HAROLD = {
	States: ObjectStates
};

AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { TickOrderSys } from './TickOrder.system';
import { CommandComponent } from '../commands/CommandDecorators';
import { LockedState } from '../components/DynamicCursor.component';

import { DrawBoxCompDef } from '../commands/DrawBox.component';
import { DrawSphereCompDef } from '../commands/DrawSphere.component';


const tempObjects: AFrame.Entity[] = [];

const components = {
	draw_box: DrawBoxCompDef,
	draw_sphere: DrawSphereCompDef,
};

export interface CommandSystem extends AFrame.System {
	data: { };
	addAnchor: (this: CommandSystem, loc: THREE.Vector3) => void;
	startCommand: (this: CommandSystem, compDef: AFrame.ComponentDefinition<CommandComponent>) => void;
	endCommand: (this: CommandSystem, comp: AFrame.ComponentDefinition<CommandComponent>) => void;
	stopDrawing: (this: CommandSystem) => void;
	activeObject: AFrame.Entity;
	commands: typeof components;
	cursor: AFrame.Entity;
	cursorLoc: THREE.Vector3;
	pointer: AFrame.Entity;
	tickSystem: TickOrderSys;
}

export const CommandSystemDef: AFrame.SystemDefinition<CommandSystem> = {
	init: function() {
		window.setTimeout(() => {
			this.tickSystem = this.el.systems['tick-order'] as TickOrderSys;
		}, 0);

		this.commands = components;

		for (let key in this.commands) {
			const compDef: AFrame.ComponentDefinition<CommandComponent> = (this.commands as any)[key];

			AFRAME.registerComponent(compDef.name, compDef);

			if (compDef.NAFSchema) {
				NAF.schemas.add(compDef.NAFSchema);
			}
		}

		const onLoaded = () => {
			this.cursor = this.el.querySelector('#cursor');
			this.cursorLoc = this.cursor.object3D.position;
			this.pointer = this.el.querySelector('#pointer');
		};

		this.el.addEventListener('loaded', onLoaded.bind(this));

	},

	startCommand: function(compDef) {
		// Initialize current command on cursor.
		console.log(`Start command '${compDef.name}'.`);

		this.cursor.setAttribute(compDef.name, {});

		this.cursor.setAttribute('dynamic-cursor', 'isActive', true);
	},

	endCommand: function(compDef) {
		this.cursor.removeAttribute(compDef.name);
	},

	stopDrawing: function() {
		tempObjects.forEach((ob) => {
			ob.parentNode.removeChild(ob);
		});

		tempObjects.length = 0;

		this.cursor.setAttribute('dynamic-cursor', {
			locked: LockedState.none,
			isActive: false
		});
	},

	addAnchor: function(loc) {
		const anchor = htmlToElement<AFrame.Entity>(`<a-entity mixin="draw-anchor" position="${loc.x} ${loc.y} ${loc.z}"></a-entity>`);

		tempObjects.push(this.el.appendChild(anchor));
	}
};

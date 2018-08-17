import { htmlToElement } from '../tools';
import { TickOrderSys } from '../systems/TickOrder.system';
import { CommandComponent } from './CommandDecorators';
import { LockedState } from '../components/DynamicCursor.component';

import { DrawBoxCompDef } from './DrawBox.component';
import { DrawSphereCompDef } from './DrawSphere.component';
import { DeformCompDef } from './Deform.component';


const tempObjects: AFrame.Entity[] = [];

const commands = {
	draw_box: DrawBoxCompDef,
	draw_sphere: DrawSphereCompDef,
	edit_deform: DeformCompDef
};

export interface CommandSystem extends AFrame.System {
	data: { };
	addAnchor: (this: CommandSystem, loc: THREE.Vector3) => void;
	startCommand: (this: CommandSystem, compName: keyof this['commands']) => void;
	endCommand: (this: CommandSystem, compName: keyof this['commands']) => void;
	stopDrawing: (this: CommandSystem) => void;
	activeObject: AFrame.Entity;
	commands: typeof commands;
	cursor: AFrame.Entity;
	cursorLoc: THREE.Vector3;
	pointer: AFrame.Entity;
	tickSystem: TickOrderSys;
}

AFRAME.registerSystem<CommandSystem>('command', {
	init: function() {
		window.setTimeout(() => {
			this.tickSystem = this.el.systems['tick-order'] as TickOrderSys;
		}, 0);

		this.commands = commands;

		for (let key in this.commands) {
			const compDef: AFrame.ComponentDefinition<CommandComponent> = (this.commands as any)[key];

			compDef.name = key as keyof typeof commands;

			AFRAME.registerComponent(key, compDef);

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

	startCommand: function(compName) {
		// Initialize current command on cursor.
		console.log(`Start command '${compName}'.`);

		this.cursor.setAttribute(compName, {});

		this.cursor.setAttribute('dynamic-cursor', 'isActive', true);
	},

	endCommand: function(compName) {
		this.cursor.removeAttribute(compName);
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
});

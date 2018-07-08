AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { DrawBoxComp } from '../commands/DrawBox.component';
import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';
import { CommandCompDef } from '../commands/Command.component';
import { CommandBase } from '../commands/CommandBase.component';


AFRAME.registerComponent('command', CommandCompDef);

const tempObjects: AFrame.Entity[] = [];

export interface CommandSystem extends AFrame.System {
	data: { };
	addAnchor: (this: CommandSystem, loc: THREE.Vector3) => void;
	startCommand: (this: CommandSystem, comp: AFrame.ComponentDefinition<CommandBase>) => void;
	endCommand: (this: CommandSystem, comp: AFrame.ComponentDefinition<CommandBase>) => void;
	stopDrawing: (this: CommandSystem) => void;
	activeObject: AFrame.Entity;
	components: Map<string, {
		definition: AFrame.ComponentDefinition<CommandBase>;
		shortcut: string
	}>;
	cursor: AFrame.Entity;
	cursorLoc: THREE.Vector3;
	pointer: AFrame.Entity;
	tickSystem: TickOrderSys;
}

export const CommandSystemDef: AFrame.SystemDefinition<CommandSystem> = {
	init: function() {
		window.setTimeout(() => {
			this.tickSystem = document.querySelector('a-scene').systems['tick-order'] as TickOrderSys;
		}, 0);

		// List of all commands.
		this.components = new Map([
			['drawBox', { definition: DrawBoxComp, shortcut: 'b' }]
		]);

		this.components.forEach(comp => {
			AFRAME.registerComponent(comp.definition.name, comp.definition);

			if (comp.definition.NAFSchema) {
				NAF.schemas.add(comp.definition.NAFSchema);
			}

			Mousetrap.bind(comp.shortcut, () => this.startCommand(comp.definition));
		});

		const onLoaded = () => {
			this.cursor = this.el.querySelector('#cursor');
			this.cursorLoc = this.cursor.object3D.position;
			this.pointer = this.el.querySelector('#pointer');
		};

		document.querySelector('a-scene').addEventListener('loaded', () => onLoaded.call(this));
	},

	startCommand: function(comp) {
		// Initialize current command on cursor.
		console.log(`Start command '${comp.name}'.`);

		this.cursor.setAttribute(comp.name, {});
	},

	endCommand: function(comp) {
		this.cursor.removeAttribute(comp.name);

		this.stopDrawing();
	},

	stopDrawing: function() {
		tempObjects.forEach((ob) => {
			ob.parentNode.removeChild(ob);
		});

		tempObjects.length = 0;

		this.cursor.setAttribute('cursor-geo', 'state', 'inactive');

		this.cursor.components['locked-pointer'].pause();
		this.cursor.components['sliding-pointer'].play();
	},

	addAnchor: function(loc) {
		const anchor = htmlToElement<AFrame.Entity>(`<a-entity mixin="draw-anchor" position="${loc.x} ${loc.y} ${loc.z}"></a-entity>`);

		tempObjects.push(this.el.appendChild(anchor));
	}
};

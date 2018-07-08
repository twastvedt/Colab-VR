AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { DrawBoxComp } from '../commands/DrawBox.component';
import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';
import { CommandCompDef } from '../commands/Command.component';
import { CommandSystem } from '../systems/Command.system';


let cursor: AFrame.Entity,
	cursorLoc: THREE.Vector3;

const tempObjects: AFrame.Entity[] = [];


export interface CommandBase extends OrderedTickComponent {
	data: { };
	name: string;
	doStep: (this: CommandBase) => void;
	boundDoStep: (this: CommandBase) => void;
	currentStep: number;
	system: CommandSystem;
	NAFSchema: any;
}

export const CommandBaseCompDef: AFrame.ComponentDefinition<CommandBase> = {
	tickOrder: 600,

	init: function() {
		this.currentStep = 0;

		this.system = document.querySelector('a-scene').systems['command'] as CommandSystem;
		this.boundDoStep = this.doStep.bind(this);

		this.system.pointer.addEventListener('click', this.boundDoStep);

		this.el.setAttribute('cursor-geo', 'state', 'drawing-plane');
	},

	remove: function() {
		window.removeEventListener('click', this.boundDoStep);

		this.system.stopDrawing();
	},

	play: function() {
		this.system.tickSystem.playComp(this);
	}
};

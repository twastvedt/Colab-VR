AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { DrawBoxComp } from '../commands/DrawBox.component';
import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';
import { CommandSystem } from '../systems/Command.system';
import { UISystem, State } from '../systems/UI.system';


let cursor: AFrame.Entity,
	cursorLoc: THREE.Vector3,
	uiSystem: UISystem;

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

		uiSystem = this.el.sceneEl.systems['ui'] as UISystem;
		this.system = this.el.sceneEl.systems['command'] as CommandSystem;
		this.boundDoStep = (() => {
			if (uiSystem.state === State.None) {
				this.doStep();
			}
		}).bind(this);

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

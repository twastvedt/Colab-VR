AFRAME = require('aframe');

import { OrderedTickComponent } from '../systems/TickOrder.system';
import { CommandSystem } from '../systems/Command.system';
import { UISystem, State } from '../systems/UI.system';


let uiSystem: UISystem;

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
	},

	remove: function() {
		window.removeEventListener('click', this.boundDoStep);

		this.system.stopDrawing();
	},

	play: function() {
		this.system.tickSystem.playComp(this);
	}
};

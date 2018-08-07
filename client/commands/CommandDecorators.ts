AFRAME = require('aframe');

import { CommandSystem } from '../systems/Command.system';
import { UISystem } from '../systems/UI.system';


export interface CommandComponent extends AFrame.Component {
	data: { };
	name: keyof CommandSystem['commands'];
	system: CommandSystem;
	NAFSchema: any;
}

export interface ClickSequenceComponent extends CommandComponent {
	doStep: (this: ClickSequenceComponent, step: number) => void;
	boundDoStep: (this: ClickSequenceComponent) => void;
	currentStep: number;
}

export const MakeCommand: COMAP.ComponentDecorator<CommandComponent> = (component) => {
	const init = component.init;

	component.init = function(this: CommandComponent) {
		this.system = this.el.sceneEl.systems['command'] as CommandSystem;

		init.call(this);
	};
};

export const MakeClickSequence: COMAP.ComponentDecorator<ClickSequenceComponent> = (component) => {

	const init = component.init;
	const remove = component.remove;

	let uiSystem: UISystem;

	component.init = function(this: ClickSequenceComponent) {
		uiSystem = this.el.sceneEl.systems['ui'] as UISystem;

		this.currentStep = 0;

		this.boundDoStep = (() => {
			this.doStep(this.currentStep);

			this.currentStep++;
		}).bind(this);

		this.system.pointer.addEventListener('click', this.boundDoStep);
		init.call(this);
	};

	component.remove = function(this: ClickSequenceComponent) {
		remove.call(this);

		window.removeEventListener('click', this.boundDoStep);

		this.system.stopDrawing();
	};

	MakeCommand(component);
};

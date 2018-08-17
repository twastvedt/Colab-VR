import { CommandSystem } from './Command.system';


export interface CommandComponent extends HAROLD.Component {
	name: keyof CommandSystem['commands'];
	system: CommandSystem;
	NAFSchema: any;
}

export interface ClickSequenceComponent extends CommandComponent {
	doStep: (this: ClickSequenceComponent, step: number, event: AFrame.EntityEventMap['click']) => void;
	boundDoStep: (this: ClickSequenceComponent) => void;
	currentStep: number;
}

export const MakeCommand: HAROLD.ComponentDecorator<CommandComponent> = (component) => {
	const init = component.init;

	component.init = function(this: CommandComponent) {
		this.system = this.el.sceneEl.systems['command'] as CommandSystem;

		init.call(this);
	};
};

export const MakeClickSequence: HAROLD.ComponentDecorator<ClickSequenceComponent> = (component) => {

	const init = component.init;
	const remove = component.remove;

	component.init = function(this: ClickSequenceComponent) {
		this.currentStep = 0;

		this.boundDoStep = ((e: AFrame.EntityEventMap['click']) => {
			this.doStep(this.currentStep, e);

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

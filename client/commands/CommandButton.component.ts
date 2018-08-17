import { CommandSystem } from './Command.system';


interface CommandButtonComp extends HAROLD.Component {
	data: keyof CommandSystem['commands'];

	system: CommandSystem;

	onClick: (this: CommandButtonComp, event: AFrame.EntityEventMap['click']) => void;
	boundOnClick: (this: CommandButtonComp) => void;
}

/**
 * Make this entity into a button which runs the named command when clicked.
 */
export const commandButtonCompDef: AFrame.ComponentDefinition<CommandButtonComp> = {
	schema: { type: 'string' },

	init: function() {
		this.boundOnClick = this.onClick.bind(this);

		this.system = this.el.sceneEl.systems['command'] as CommandSystem;
	},

	onClick: function(e) {
		this.system.startCommand( this.data );

		e.stopPropagation();
	},

	play: function() {
		this.el.addEventListener('click', this.boundOnClick);
	},

	pause: function() {
		this.el.removeEventListener('click', this.boundOnClick);
	}
};

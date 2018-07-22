AFRAME = require('aframe');

import { CommandSystem, CommandNames } from '../systems/Command.system';
import { CommandBaseCompDef, CommandBase } from './CommandBase.component';


interface CommandComp extends CommandBase {
	data: CommandNames;

	system: CommandSystem;

	onClick: (this: CommandComp, event: AFrame.EntityEventMap['click']) => void;
	boundOnClick: (this: CommandComp) => void;
}

/**
 * Make this entity into a button which runs the named command when clicked.
 */
export const CommandCompDef: AFrame.ComponentDefinition<CommandComp> = {
	schema: { type: 'string' },

	init: function() {
		this.boundOnClick = this.onClick.bind(this);
	},

	onClick: function(e) {
		const command = this.system.components.get(this.data);

		this.system.startCommand(command);

		e.stopPropagation();
	},

	play: function() {
		this.el.addEventListener('click', this.boundOnClick);
	},

	pause: function() {
		this.el.removeEventListener('click', this.boundOnClick);
	}
};

AFRAME = require('aframe');

import { CommandSystem, CommandNames } from '../systems/Command.system';
import { CommandBaseCompDef, CommandBase } from './CommandBase.component';


interface CommandButtonComp extends CommandBase {
	data: CommandNames;

	system: CommandSystem;

	onClick: (this: CommandButtonComp, event: AFrame.EntityEventMap['click']) => void;
	boundOnClick: (this: CommandButtonComp) => void;
}

/**
 * Make this entity into a button which runs the named command when clicked.
 */
export const CommandButtonCompDef: AFrame.ComponentDefinition<CommandButtonComp> = {
	schema: { type: 'string' },

	init: function() {
		this.boundOnClick = this.onClick.bind(this);

		this.system = this.el.sceneEl.systems['command'] as CommandSystem;
	},

	onClick: function(e) {
		this.system.startCommand(this.data);

		e.stopPropagation();
	},

	play: function() {
		this.el.addEventListener('click', this.boundOnClick);
	},

	pause: function() {
		this.el.removeEventListener('click', this.boundOnClick);
	}
};

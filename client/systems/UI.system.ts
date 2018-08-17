import { CommandSystem } from '../commands/Command.system';
import { LockedState } from '../components/DynamicCursor.component';


let pointer: AFrame.Entity,
	player: AFrame.Entity,
	cursor: AFrame.Entity,
	commandSystem: CommandSystem;

enum UI {
	HMD = 'hmd',
	FPS = 'fps',
	Orbit = 'orbit'
}

enum Device {
	Mobile = 'mobile',
	Screen = 'screen',
	HMD = 'hmd'
}

enum Input {
	Mouse = 'mouse',
	Gamepad = 'gamepad',
	Positional = 'positional'
}

const keys = new Map<string, keyof CommandSystem['commands']>([
	['b', 'draw_box'],
	['o', 'draw_sphere'],
	['g', 'edit_deform']
]);

export enum State {
	None,
	Navigating
}

export interface UISystem extends AFrame.System {
	data: { };

	input: Input;
	device: Device;
	ui: UI;
	state: State;

	updateMode(this: UISystem): void;
	endMode(this: UISystem, mode: UI): void;
	startMode(this: UISystem, mode: UI): void;
	setKeys(this: UISystem): void;
}

export const uiSysDef: AFrame.SystemDefinition<UISystem> = {
	init: function() {
		this.state = State.None;

		this.el.addEventListener('loaded', () => {
			player = (this.el.querySelector('#player') as AFrame.Entity);
			pointer = (this.el.querySelector('#pointer') as AFrame.Entity);

			commandSystem = this.el.systems['command'] as CommandSystem;

			this.updateMode.call(this);

			if (this.ui !== UI.HMD) {
				this.setKeys();
			}

			cursor = this.el.querySelector('#cursor');
		});
	},

	updateMode: function() {
		if (this.ui) {
			this.endMode(this.ui);
		}

		if (AFRAME.utils.device.checkHeadsetConnected()) {
			this.device = Device.HMD;
		} else if (AFRAME.utils.device.isMobile()) {
			this.device = Device.Mobile;
		} else {
			this.device = Device.Screen;
		}

		if (navigator.getGamepads && navigator.getGamepads()[0] != null) {
			this.input = Input.Gamepad;
		} else {
			this.input = Input.Mouse;
		}

		if (this.device === Device.HMD) {
			this.ui = UI.HMD;
		} else if (this.input === Input.Gamepad) {
			this.ui = UI.FPS;
		} else {
			this.ui = UI.Orbit;
		}

		this.el.querySelectorAll('.ui').forEach((el: AFrame.Entity) => {
			if (el.classList.contains(`ui-${this.ui}`)) {
				el.play();
				el.object3D.visible = true;
			} else {
				el.pause();
				el.object3D.visible = false;
			}
		}, this);

		console.log(`Device: ${this.device}, Input: ${this.input}, UI: ${this.ui}`);

		this.startMode(this.ui);
	},

	endMode: function(mode: UI) {
		switch (mode) {
			case UI.Orbit:
				player.components['editor-controls'].pause();
				pointer.setAttribute('cursor', 'rayOrigin', 'entity');

				break;

			case UI.FPS:
				player.components['movement-controls'].pause();

				break;

			case UI.HMD:
				player.components['movement-controls'].pause();

				break;
		}

		player.removeAttribute('networked');
	},

	startMode: function(mode: UI) {
		switch (mode) {
			case UI.Orbit:
				pointer.setAttribute('cursor', 'rayOrigin', 'mouse');

				player.setAttribute('networked', {
					template: '#avatar-orbit-template',
					attachTemplateToLocal: false
				});

				player.object3D.position.set(0, 0, 0);

				if (player.hasAttribute('editor-controls')) {
					player.components['editor-controls'].play();

				} else {
					player.setAttribute('editor-controls', '');
				}

				break;

			case UI.FPS:
			case UI.HMD:

				player.setAttribute('networked', {
					template: '#avatar-fps-template',
					attachTemplateToLocal: false
				});

				if (player.hasAttribute('movement-controls')) {
					player.components['movement-controls'].play();

				} else {
					player.setAttribute('movement-controls', {
						controls: 'gamepad, trackpad, keyboard, touch',
						'fly': true
					});
				}

				break;
		}
	},

	setKeys: function() {
		for (let [key, command] of keys) {
			Mousetrap.bind( key, () => commandSystem.startCommand( command ) );
		}

		Mousetrap.bind( 'v', () => {
			cursor.setAttribute(
				'dynamic-cursor',
				'locked',
				cursor.getAttribute('dynamic-cursor').locked === LockedState.line ? LockedState.none : LockedState.line
			);
		});

		Mousetrap.bind( 's', () => {
			if (cursor.hasAttribute('snap')) {
				cursor.removeAttribute('snap');

			} else {
				cursor.setAttribute('snap', '');
			}
		});

		Mousetrap.bind( 'p', () => {
			cursor.setAttribute(
				'dynamic-cursor',
				'locked',
				cursor.getAttribute('dynamic-cursor').locked === LockedState.plane ? LockedState.none : LockedState.plane
			);
		});

		Mousetrap.bind('space', () => {
			if (this.el.isPlaying) {
				this.el.pause();
			}
			else {
				this.el.play();
			}
		});
	}
};

AFRAME = require('aframe');

import { CommandSystem } from './Command.system';
import { LockedState } from '../components/DynamicCursor.component';


let pointer: AFrame.Entity,
	camera: AFrame.Entity,
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

	updateUI(this: UISystem): void;
	endMode(this: UISystem, mode: UI): void;
	startMode(this: UISystem, mode: UI): void;
	setKeys(this: UISystem): void;
}

export const UISystemDef: AFrame.SystemDefinition<UISystem> = {
	init: function() {
		this.state = State.None;

		this.el.addEventListener('loaded', () => {
			player = (this.el.querySelector('#player') as AFrame.Entity);
			camera = (this.el.querySelector('#camera') as AFrame.Entity);
			pointer = (this.el.querySelector('#pointer') as AFrame.Entity);

			commandSystem = this.el.systems['command'] as CommandSystem;

			this.updateUI.call(this);

			if (this.ui !== UI.HMD) {
				this.setKeys();
			}

			cursor = this.el.querySelector('#cursor');
		});
	},

	updateUI: function() {
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
				camera.components['editor-controls'].pause();
				pointer.setAttribute('cursor', 'rayOrigin', 'entity');

				// (camera.components['camera'] as any).camera.rotation.set(0, 0, 0);
				// hud.object3D.rotation.set(0, 0, 0);

				break;

			case UI.FPS:
				player.components['movement-controls'].pause();

				break;

			case UI.HMD:
				player.components['movement-controls'].pause();

				break;
		}
	},

	startMode: function(mode: UI) {
		switch (mode) {
			case UI.Orbit:
				pointer.setAttribute('cursor', 'rayOrigin', 'mouse');

				player.object3D.position.set(0, 0, 0);
				// (camera.components['camera'] as any).camera.rotation.set(0, Math.PI, 0);
				// hud.object3D.rotation.set(0, Math.PI, 0);

				camera.components['editor-controls'].play();

				break;

			case UI.FPS:
				player.components['movement-controls'].play();

				break;

			case UI.HMD:
				player.components['movement-controls'].play();

				break;
		}
	},

	setKeys: function() {
		Mousetrap.bind( 'b', () => commandSystem.startCommand( commandSystem.commands.draw_box ) );
		Mousetrap.bind( 'o', () => commandSystem.startCommand( commandSystem.commands.draw_sphere ) );

		Mousetrap.bind( 'v', () => {
			cursor.setAttribute(
				'dynamic-cursor',
				'locked',
				cursor.getAttribute('dynamic-cursor').locked === LockedState.line ? LockedState.none : LockedState.line
			);
		});

		Mousetrap.bind( 'p', () => {
			cursor.setAttribute(
				'dynamic-cursor',
				'locked',
				cursor.getAttribute('dynamic-cursor').locked === LockedState.plane ? LockedState.none : LockedState.plane
			);
		});
	}
};

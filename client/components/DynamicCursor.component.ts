AFRAME = require('aframe');


let tempVec = new AFRAME.THREE.Vector3(),
	worldQuaternion = new AFRAME.THREE.Quaternion();

export enum LockedState {
	none = 'none',
	plane = 'plane',
	line = 'line'
}

export enum UIState {
	none = 'none',
	plane = 'plane',
	line = 'line'
}

export interface DynamicCursor extends AFrame.Component {
	data: {
		isActive: boolean,
		locked: LockedState,
		ui: UIState
	};
}

/**
 * Control appearance of dynamic cursor for colab-vr.
 * */
export const DynamicCursorComp: AFrame.ComponentDefinition<DynamicCursor> = {

	schema: {
		isActive: {default: false},
		locked: {default: LockedState.none},
		ui: {default: UIState.none}
	},

	dependencies: ['sliding-pointer', 'locked-pointer'],

	update: function(oldData) {
		const data = this.data;

		if (oldData.isActive !== data.isActive) {
			(this.el.querySelector('#cursor-active-ring') as AFrame.Entity).setAttribute('material', 'color', data.isActive ? 'cyan' : 'black');
		}

		if (oldData.locked !== data.locked) {
			if (data.locked === LockedState.none) {
				this.el.components['locked-pointer'].pause();
				this.el.components['sliding-pointer'].play();

				this.el.querySelector('#extension').removeAttribute('anchor');

				this.el.setAttribute('dynamic-cursor', 'ui', UIState.none);

			} else {
				this.el.object3D.getWorldQuaternion( worldQuaternion );
				tempVec.copy( this.el.object3D.up ).applyQuaternion( worldQuaternion );

				this.el.components['sliding-pointer'].pause();

				this.el.setAttribute('locked-pointer', {
					vector: tempVec,
					position: this.el.object3D.position.clone(),
					isPlane: data.locked === LockedState.plane,
					pointerSelector: '#pointer'
				});
				this.el.components['locked-pointer'].play();

				this.el.querySelector('#extension').setAttribute('anchor', 'line.end');

				this.el.setAttribute('dynamic-cursor', 'ui', data.ui = data.locked === LockedState.line ? UIState.line : UIState.plane);
			}
		}

		if (oldData.ui !== data.ui) {
			this.el.querySelectorAll('.state').forEach((child: AFrame.Entity) => {
				if (child.classList.contains('state-' + data.ui)) {
					child.setAttribute('visible', 'true');
					child.play();
				} else {
					child.setAttribute('visible', 'false');
					child.pause();
				}
			}, this);
		}
	}
};

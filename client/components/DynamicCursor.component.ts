import { SlidingPointerComp } from './SlidingPointer.component';
import { LockedPointerComp } from './LockedPointer.component';


const tempVec = new AFRAME.THREE.Vector3(),
	tempVec2 = new AFRAME.THREE.Vector3(),
	tempCoord = {x: 0, y: 0, z: 0},
	worldQuaternion = new AFRAME.THREE.Quaternion();

let extension: AFrame.Entity;

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

export interface DynamicCursorComp extends HAROLD.Component {
	data: {
		isActive: boolean,
		locked: LockedState,
		ui: UIState
	};

	slidingPointer: SlidingPointerComp;
	lockedPointer: LockedPointerComp;
	pointerEl: AFrame.Entity;
}

/**
 * Control appearance of dynamic cursor for colab-vr.
 * */
export const dynamicCursorCompDef: AFrame.ComponentDefinition<DynamicCursorComp> = {

	schema: {
		isActive: { default: false },
		locked: { default: LockedState.none },
		ui: { default: UIState.plane }
	},

	dependencies: ['sliding-pointer', 'locked-pointer'],

	init: function() {
		extension = this.el.sceneEl.querySelector('#extension');

		this.slidingPointer = this.el.components['sliding-pointer'];
		this.lockedPointer = this.el.components['locked-pointer'];
		this.pointerEl = this.el.sceneEl.querySelector('#pointer') as AFrame.Entity;

		// Initial state.
		window.setTimeout((() => {
			this.lockedPointer.pause();
		}).bind(this), 0);
	},

	update: function(oldData) {
		const data = this.data;

		if (oldData.isActive !== data.isActive) {
			(this.el.querySelector('#cursor-active-ring') as AFrame.Entity).setAttribute('material', 'color', data.isActive ? 'cyan' : 'black');
		}

		if (oldData.locked !== data.locked) {
			if (data.locked === LockedState.none) {
				this.lockedPointer.pause();
				this.slidingPointer.play();

				extension.object3D.visible = false;

				this.el.setAttribute('dynamic-cursor', 'ui', UIState.plane);

			} else {
				this.el.object3D.getWorldQuaternion( worldQuaternion );
				tempVec.copy( this.el.object3D.up ).applyQuaternion( worldQuaternion );

				this.slidingPointer.pause();

				this.el.setAttribute('locked-pointer', {
					vector: tempVec,
					position: this.el.object3D.position.clone(),
					isPlane: data.locked === LockedState.plane,
					pointerSelector: '#pointer'
				});
				this.lockedPointer.play();

				this.el.object3D.getWorldPosition(tempVec2);
				tempCoord.x = tempVec2.x;
				tempCoord.y = tempVec2.y;
				tempCoord.z = tempVec2.z;

				extension.setAttribute('line-link', {
					start: tempCoord,
					end: '#cursor',
					label: '[length]'
				});
				extension.object3D.visible = true;

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

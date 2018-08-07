import { CopyRotation } from './CopyRotation.component';


let cameraRotation: THREE.Euler;

interface HDD extends AFrame.Component {
	copyRotationComp: AFrame.Component<CopyRotation>;
}


AFRAME.registerComponent<HDD>('hdd', {
	schema: { },

	dependencies: ['copy-rotation'],

	init: function() {
		cameraRotation = document.querySelector('#camera').object3D.rotation;

		this.copyRotationComp = this.el.components['copy-rotation'];
	},

	tick: function() {
		if ( cameraRotation.x < -0.6 ) {
			if ( !this.el.is('focus') ) {

				this.el.addState('focus');

				this.copyRotationComp.pause();
			}

		} else if (this.el.is('focus')) {
			this.el.removeState('focus');

			this.copyRotationComp.play();
		}
	}
});

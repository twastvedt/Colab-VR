import { CopyRotationComp } from './CopyRotation.component';


let cameraRotation: THREE.Euler;

interface HDDComp extends HAROLD.Component {
	copyRotationComp: CopyRotationComp;
}


export const hddCompDef: AFrame.ComponentDefinition<HDDComp> = {
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
};

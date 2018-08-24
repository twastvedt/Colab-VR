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
			if ( !this.el.is(HAROLD.States.hovered) ) {

				this.el.addState(HAROLD.States.hovered);

				this.copyRotationComp.pause();
			}

		} else if (this.el.is(HAROLD.States.hovered)) {
			this.el.removeState(HAROLD.States.hovered);

			this.copyRotationComp.play();
		}
	}
};

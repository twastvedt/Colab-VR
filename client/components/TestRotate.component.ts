AFRAME = require('aframe');

let oldRot = new AFRAME.THREE.Euler(),
	speed = 0.01;

export const TestRotateComp: AFrame.ComponentDefinition = {
	schema: { },

	tick: function() {
		oldRot = this.el.object3D.rotation.clone();


		this.el.object3D.rotation.set(
			oldRot.x + speed,
			oldRot.y + speed,
			oldRot.z + speed
		);
	}
};

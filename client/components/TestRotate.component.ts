AFRAME = require('aframe');

const speed = 0.01;

export const TestRotateComp: AFrame.ComponentDefinition = {
	schema: { },

	tick: function() {
		const oldRot = this.el.object3D.rotation;

		this.el.object3D.rotation.set(
			oldRot.x + speed,
			oldRot.y + speed,
			oldRot.z + speed
		);
	}
};

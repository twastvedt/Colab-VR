AFRAME = require('aframe');

let tempScale = {x: 1, y: 1, z: 1};
let location = new AFRAME.THREE.Vector3();
let distance = 0;

interface ConstantScale extends AFrame.Component {
	data: { x: number, y: number, z: number };
	cameraLocation: THREE.Vector3;
}

export const ConstantScaleComp: AFrame.ComponentDefinition<ConstantScale> = {
	schema: { type: 'vec3' },

	init: function(this: ConstantScale) {
		this.cameraLocation = this.el.sceneEl.querySelector<AFrame.Entity>('#camera').object3D.position;
	},

	tick: function(this: ConstantScale) {
		this.el.object3D.getWorldPosition(location);
		distance = location.distanceTo(this.cameraLocation);

		tempScale.x = distance * this.data.x;
		tempScale.y = distance * this.data.y;
		tempScale.z = distance * this.data.z;

		this.el.setAttribute('scale', tempScale);
	}
};

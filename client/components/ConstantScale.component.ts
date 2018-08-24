const tempScale = {x: 1, y: 1, z: 1},
	location = new AFRAME.THREE.Vector3();

export interface ConstantScaleComp extends HAROLD.Component {
	data: { x: number, y: number, z: number };
	cameraLocation: THREE.Vector3;
}

export const constantScaleCompDef: AFrame.ComponentDefinition<ConstantScaleComp> = {
	schema: { type: 'vec3' },

	init: function() {
		this.cameraLocation = this.el.sceneEl.querySelector<AFrame.Entity>('#camera').object3D.position;
	},

	tick: function() {
		this.el.object3D.getWorldPosition(location);
		const distance = location.distanceTo(this.cameraLocation);

		tempScale.x = distance * this.data.x;
		tempScale.y = distance * this.data.y;
		tempScale.z = distance * this.data.z;

		this.el.setAttribute('scale', tempScale);
	}
};

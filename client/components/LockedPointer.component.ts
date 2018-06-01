AFRAME = require('aframe');

let pointer: THREE.Object3D,
	pointerVec = new AFRAME.THREE.Vector3(),
	pointerPos = new AFRAME.THREE.Vector3(),
	tempPos = new AFRAME.THREE.Vector3(),
	d = 0,
	W: THREE.Vector3,
	targetVec: AFrame.Coordinate,
	targetPos: AFrame.Coordinate;

interface LockedPointer extends AFrame.Component {
	data: {
		pointerSelector: string,
		vector: AFrame.Coordinate,
		position: AFrame.Coordinate,
		isPlane: boolean
	}
}

export const LockedPointerComp: AFrame.ComponentDefinition<LockedPointer> = {
	/**
	 * Eventually maybe add rotation to align with locked axis/axes.
	 * */

	schema: {
		pointerSelector: {default: '#camera'},
		// Default to y=0 ground plane.
		vector: {type: 'vec3', default: {x: 0, y: 1, z: 0}},
		position: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
		isPlane: {default: true}
	},

	updateSchema: function(newData) {
		targetVec = newData.vector;
		targetPos = newData.position;
	},

	init: function() {
		pointer = document.querySelector(this.data.pointerSelector).object3D;

		targetVec = this.data.vector;
		targetPos = this.data.position;
	},

	tick: function() {
		pointer.getWorldDirection(pointerVec);
		pointer.getWorldPosition(pointerPos);

		if (this.data.isPlane) {
			// Find intersection of pointer vector and target plane.

			d = ((targetPos.x - pointerPos.x) * targetVec.x
					+ (targetPos.y - pointerPos.y) * targetVec.y
					+ (targetPos.z - pointerPos.z) * targetVec.z)
				/ (pointerVec.x * targetVec.x
					+ pointerVec.y * targetVec.y
					+ pointerVec.z * targetVec.z);

			if (isFinite(d)) {
				tempPos = pointerVec.multiplyScalar(d).add(pointerPos);
				this.el.object3D.position.set(tempPos.x, tempPos.y, tempPos.z);
			}

		} else {
			// Find closest point between target line and pointer vector.

			// Cross product of target and pointer vectors.
			let V1 = {
				x: pointerVec.y * targetVec.z - pointerVec.z * targetVec.y,
				y: pointerVec.z * targetVec.x - pointerVec.x * targetVec.z,
				z: pointerVec.x * targetVec.y - pointerVec.y * targetVec.x
			}

			let t1 =
			(
				(((targetPos.y - pointerPos.y) / pointerVec.y - (targetPos.x - pointerPos.x) / pointerVec.x) / (V1.x / pointerVec.x - V1.y / pointerVec.y))
				- (((targetPos.z - pointerPos.z) / pointerVec.z - (targetPos.y - pointerPos.y) / pointerVec.y) / (V1.y / pointerVec.y - V1.z / pointerVec.z))
			) / (
				(targetVec.z / pointerVec.z - targetVec.y / pointerVec.y) / (V1.y / pointerVec.y - V1.z / pointerVec.z)
				- (targetVec.y / pointerVec.y - targetVec.x / pointerVec.x) / (V1.x / pointerVec.x - V1.y / pointerVec.y)
			);

			if (isFinite(t1)) {
				this.el.object3D.position.set(
					targetPos.x + t1 * targetVec.x,
					targetPos.y + t1 * targetVec.y,
					targetPos.z + t1 * targetVec.z
				);
			}
		}
	}
};

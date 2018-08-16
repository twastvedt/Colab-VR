import { OrderedTickComponent, MakeTickComponent } from '../systems/TickOrder.system';


let tempPos = new AFRAME.THREE.Vector3();

export interface LockedPointerComp extends OrderedTickComponent {
	data: {
		pointerSelector: AFrame.Entity,
		vector: AFrame.Coordinate,
		position: AFrame.Coordinate,
		isPlane: boolean
	};
	ray: THREE.Ray;
}

const lockedPointerCompDef: AFrame.ComponentDefinition<LockedPointerComp> = {
	/**
	 * Eventually maybe add rotation to align with locked axis/axes.
	 * */

	schema: {
		pointerSelector: {default: '#camera', type: 'selector'},
		// Default to y=0 ground plane.
		vector: {type: 'vec3', default: {x: 0, y: 1, z: 0}},
		position: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
		isPlane: {default: true}
	},

	init: function() {
		this.ray = (this.data.pointerSelector.components['raycaster'] as any).raycaster.ray;
	},

	tick: function() {
		const pointerVec = this.ray.direction,
			pointerPos = this.ray.origin,
			targetVec = this.data.vector,
			targetPos = this.data.position;

		if (this.data.isPlane) {
			// Find intersection of pointer vector and target plane.

			const d = ((targetPos.x - pointerPos.x) * targetVec.x
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
			};

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

MakeTickComponent(lockedPointerCompDef, 200);

AFRAME.registerComponent('locked-pointer', lockedPointerCompDef);

AFRAME = require('aframe');

import { OrderedTickComponent, TickOrderSys } from "../systems/TickOrder.system";


let pointer: AFrame.Entity,
	raycaster: AFrame.Component & {intersections: AFrame.RaycasterIntersectionDetail[]},
	intersection: AFrame.RaycasterIntersectionDetail,
	mat = new AFRAME.THREE.Matrix3,
	globalNormal = new AFRAME.THREE.Vector3();

interface SlidingPointer extends OrderedTickComponent {
	data: {
		pointerSelector: string,
		pause: boolean
	},
	getNearestIntersection: (this: SlidingPointer, intersections: AFrame.RaycasterIntersectionDetail[]) => AFrame.RaycasterIntersectionDetail
}

export const SlidingPointerComp: AFrame.ComponentDefinition<SlidingPointer> = {

	schema: {
		pointerSelector: {default: '#camera'},
		pause: {default: false}
	},

	tickOrder: 200,

	updateSchema: function(newData) {
		if (this.data && newData.pause !== this.data.pause) {
			if (newData.pause) {
				this.pause();
			} else {
				this.play();
			}
		}
	},

	init: function() {
		pointer = document.querySelector(this.data.pointerSelector);
		raycaster = pointer.components['raycaster'] as any;

		if (this.data.pause) {
			this.pause();
		}

		this.tickSystem = document.querySelector('a-scene').systems['tick-order'] as TickOrderSys;
	},

	play: function() {
		this.tickSystem.playComp(this);
	},

	tick: function() {

		if (!raycaster.intersections.length) { return; }
		intersection = raycaster.intersections[0];

		// a matrix which represents item's movement, rotation and scale on global world
		mat = new AFRAME.THREE.Matrix3().getNormalMatrix( intersection.object.matrixWorld );

		// change local normal into global normal
		globalNormal = intersection.face.normal.clone().applyMatrix3(mat).normalize();

		this.el.object3D.quaternion.setFromUnitVectors(this.el.object3D.up, globalNormal);

		this.el.object3D.position.set(intersection.point.x, intersection.point.y, intersection.point.z);
	}
};

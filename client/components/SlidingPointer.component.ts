AFRAME = require('aframe');

import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';


const quaternion = new AFRAME.THREE.Quaternion(),
	globalNormal = new AFRAME.THREE.Vector3();

interface SlidingPointer extends OrderedTickComponent {
	data: {
		pointerSelector: AFrame.Entity
	};
	raycaster: AFrame.Component & {intersections: AFrame.RaycasterIntersectionDetail[]};
}

export const SlidingPointerComp: AFrame.ComponentDefinition<SlidingPointer> = {

	schema: {
		pointerSelector: {default: '#camera', type: 'selector'}
	},

	tickOrder: 200,

	init: function() {
		this.raycaster = this.data.pointerSelector.components['raycaster'] as any;

		this.tickSystem = document.querySelector('a-scene').systems['tick-order'] as TickOrderSys;
	},

	play: function() {
		this.tickSystem.playComp(this);
	},

	tick: function() {

		if (!this.raycaster.intersections.length) { return; }
		const intersection = this.raycaster.intersections[0];

		intersection.object.getWorldQuaternion(quaternion);

		// change local normal into global normal
		globalNormal.copy(intersection.face.normal)
			.applyQuaternion(quaternion)
			.normalize();

		this.el.object3D.quaternion.setFromUnitVectors(this.el.object3D.up, globalNormal);

		const point = intersection.point;
		this.el.object3D.position.set(point.x, point.y, point.z);
	}
};

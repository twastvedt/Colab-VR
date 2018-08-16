import { OrderedTickComponent, MakeTickComponent } from '../systems/TickOrder.system';


const quaternion = new AFRAME.THREE.Quaternion(),
	globalNormal = new AFRAME.THREE.Vector3();

export interface SlidingPointerComp extends OrderedTickComponent {
	data: {
		pointerSelector: AFrame.Entity,
		classFilter: string
	};
	raycaster: AFrame.Component & {intersections: AFrame.RaycasterIntersectionDetail[]};
}

const slidingPointerCompDef: AFrame.ComponentDefinition<SlidingPointerComp> = {

	schema: {
		pointerSelector: {default: '#camera', type: 'selector'},
		classFilter: {default: ''}
	},

	init: function() {
		this.raycaster = this.data.pointerSelector.components['raycaster'] as any;
	},

	tick: function() {
		const intersections = this.raycaster.intersections;

		if ( !intersections.length
				|| (this.data.classFilter.length && !intersections[0].object.el.classList.contains(this.data.classFilter)) ) {
			return;
		}
		const intersection = intersections[0];

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

MakeTickComponent(slidingPointerCompDef, 200);

AFRAME.registerComponent('sliding-pointer', slidingPointerCompDef);

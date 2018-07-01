AFRAME = require('aframe');

import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';


const selfPos = new AFRAME.THREE.Vector3(),
	targetPos = new AFRAME.THREE.Vector3(),
	planeNormal = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	tempVec2 = new AFRAME.THREE.Vector3(),
	toVec = new AFRAME.THREE.Vector3();

interface LockedTrack extends OrderedTickComponent {
	data: {
		targetSelector: AFrame.Entity,
		to: number,
		reverse: boolean,
		lock: number
	};
	target: THREE.Object3D;
}

export const LockedTrackComp: AFrame.ComponentDefinition<LockedTrack> = {
	/**
	 * Note: Does not support outside rotation of element.
	 */

	schema: {
		targetSelector: {default: '#camera', type: 'selector'},
		// Default to only rotate around y axis.
		to: {default: 2},
		reverse: {default: true},
		lock: {default: 1}
	},

	tickOrder: 200,

	play: function() {
		planeNormal.set(0, 0, 0);
		planeNormal.setComponent( this.data.lock, 1 );
		planeNormal.transformDirection( this.el.object3D.matrixWorld );

		toVec.set(0, 0, 0);
		toVec.setComponent( this.data.to, this.data.reverse ? -1 : 1 );
		toVec.transformDirection( this.el.object3D.matrixWorld );

		this.tickSystem.playComp(this);
	},

	init: function() {
		this.target = this.data.targetSelector.object3D;

		this.tickSystem = document.querySelector('a-scene').systems['tick-order'] as TickOrderSys;
	},

	tick: function() {
		this.target.getWorldPosition(targetPos);
		this.el.object3D.getWorldPosition(selfPos);

		tempVec.subVectors(targetPos, selfPos);

		tempVec2.copy(planeNormal);

		tempVec2.multiplyScalar(tempVec.dot(planeNormal));

		tempVec.sub(tempVec2);

		this.el.object3D.quaternion.setFromUnitVectors( toVec, tempVec.normalize() );
	}
};

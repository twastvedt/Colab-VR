const selfPos = new AFRAME.THREE.Vector3(),
	targetPos = new AFRAME.THREE.Vector3(),
	planeNormal = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	tempVec2 = new AFRAME.THREE.Vector3(),
	toVec = new AFRAME.THREE.Vector3();

interface LockedTrackComp extends AFrame.Component {
	data: {
		targetSelector: AFrame.Entity,
		to: number,
		reverse: boolean,
		lock: number
	};
	target: THREE.Object3D;
}

export const lockedTrackCompDef: AFrame.ComponentDefinition<LockedTrackComp> = {
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

	play: function() {
		planeNormal.set(0, 0, 0);
		planeNormal.setComponent( this.data.lock, 1 );
		planeNormal.transformDirection( this.el.object3D.matrixWorld );

		toVec.set(0, 0, 0);
		toVec.setComponent( this.data.to, this.data.reverse ? -1 : 1 );
		toVec.transformDirection( this.el.object3D.matrixWorld );
	},

	init: function() {
		this.target = this.data.targetSelector.object3D;
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

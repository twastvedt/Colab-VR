AFRAME = require('aframe');

import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';


const oldPos = new AFRAME.THREE.Vector3();

interface Snap extends OrderedTickComponent {
	data: {
		gridSize: number
	};
	snap: (this: Snap) => void;
}

export const SnapComp: AFrame.ComponentDefinition<Snap> = {
	schema: {
		gridSize: {type: 'number', default: 1}
	},

	tickOrder: 400,

	init: function() {
		this.tickSystem = this.el.sceneEl.systems['tick-order'] as TickOrderSys;
	},

	play: function() {
		this.tickSystem.playComp(this);
	},

	tick: function() {
		const oldPos = this.el.object3D.position,
			gridSize = this.data.gridSize;

		this.el.object3D.position.set(
			Math.round(oldPos.x / gridSize) * gridSize,
			Math.round(oldPos.y / gridSize) * gridSize,
			Math.round(oldPos.z / gridSize) * gridSize
		);
	}
};

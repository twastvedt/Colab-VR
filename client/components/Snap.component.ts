AFRAME = require('aframe');

import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';

let oldPos = new AFRAME.THREE.Vector3(),
	gridSize = 1;

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
		gridSize = this.data.gridSize;

		this.tickSystem = document.querySelector('a-scene').systems['tick-order'] as TickOrderSys;
	},

	updateSchema: function(newData) {
		gridSize = newData.gridSize;
	},

	play: function() {
		this.tickSystem.playComp(this);
	},

	tick: function() {
		oldPos = this.el.object3D.position;


		this.el.object3D.position.set(
			Math.round(oldPos.x / gridSize) * gridSize,
			Math.round(oldPos.y / gridSize) * gridSize,
			Math.round(oldPos.z / gridSize) * gridSize
		);
	}
};

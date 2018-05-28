AFRAME = require('aframe');

let oldPos = new AFRAME.THREE.Vector3(),
	gridSize = 1;

interface Snap extends AFrame.Component {
	data: {
		gridSize: number
	},
	snap: (this: Snap) => void
}

export const SnapComp: AFrame.ComponentDefinition<Snap> = {
	schema: {
		gridSize: {type: 'number', default: 1}
	},

	init: function() {
		gridSize = this.data.gridSize;
	},

	updateSchema: function(newData) {
		gridSize = newData.gridSize;
	},

	tick: function() {
		oldPos = this.el.object3D.position.clone();


		this.el.object3D.position.set(
			Math.round(oldPos.x / gridSize) * gridSize,
			Math.round(oldPos.y / gridSize) * gridSize,
			Math.round(oldPos.z / gridSize) * gridSize
		);
	}
}

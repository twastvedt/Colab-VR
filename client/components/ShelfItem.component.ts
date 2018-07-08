AFRAME = require('aframe');

import { CommandSystem } from '../systems/Command.system';
import { CommandBase } from '../commands/CommandBase.component';


const boundingBox = new AFRAME.THREE.Box3(),
	tempVec = new AFRAME.THREE.Vector3();

interface ShelfItemComp extends AFrame.Component {
	data: {
		hoverScaleFactor: number
	};

	commandSystem: CommandSystem;
	iconObject: THREE.Object3D;
	hoverOffset: number;

	onHover: (this: ShelfItemComp) => void;
	onLeave: (this: ShelfItemComp) => void;

	boundOnHover: (this: ShelfItemComp) => void;
	boundOnLeave: (this: ShelfItemComp) => void;
}

/**
 * Shelf Item: Scale icon to a 1x1x1 cube. Increase scale of icon when hovering.
 */
export const ShelfItemCompDef: AFrame.ComponentDefinition<ShelfItemComp> = {

	schema: {
		hoverScaleFactor: { default: 1.125 }
	},

	init: function() {
		this.commandSystem = document.querySelector('a-scene').systems['command'] as CommandSystem;

		// When scaling we adjust the position so that the icon scales from its base.
		this.hoverOffset = (this.data.hoverScaleFactor - 1) / 2;

		this.iconObject = this.el.querySelector<AFrame.Entity>('.icon').object3D;
		const iconObject = this.iconObject;

		boundingBox.setFromObject( iconObject );
		boundingBox.getSize( tempVec );
		const max = Math.max( tempVec.x, tempVec.y, tempVec.z ),
			scale = 1 / max;

		iconObject.scale.setScalar( scale );

		this.boundOnHover = this.onHover.bind(this);
		this.boundOnLeave = this.onLeave.bind(this);
	},

	onHover: function() {
		if (this.iconObject !== undefined) {
			this.iconObject.scale.multiplyScalar(this.data.hoverScaleFactor);
			this.iconObject.position.y += this.hoverOffset;
		}
	},

	onLeave: function() {
		if (this.iconObject !== undefined) {
			this.iconObject.scale.divideScalar(this.data.hoverScaleFactor);
			this.iconObject.position.y -= this.hoverOffset;
		}
	},

	play: function() {
		this.el.addEventListener('raycaster-intersected', this.boundOnHover);
		this.el.addEventListener('raycaster-intersected-cleared', this.boundOnLeave);
	},

	pause: function() {
		this.el.removeEventListener('raycaster-intersected', this.boundOnHover);
		this.el.removeEventListener('raycaster-intersected-cleared', this.boundOnLeave);
	}
};

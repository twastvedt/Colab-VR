import { OrderedTickComponent, MakeTickComponent } from '../systems/TickOrder.system';


const tempVec = new AFRAME.THREE.Vector3(),
	matrix = new AFRAME.THREE.Matrix4(),
	tempCoord = {x: 0, y: 0, z: 0};

interface AnchorComp extends OrderedTickComponent {
	data: string;

	position: THREE.Vector3;

	component: string;
	property: string;
}

export const AnchorCompDef: AFrame.ComponentDefinition<AnchorComp> = {

	schema: {default: 'position'},

	init: function() {
		this.position = new AFRAME.THREE.Vector3();
	},

	update: function() {
		this.el.object3D.getWorldPosition(this.position);

		let vec: AFrame.Coordinate;

		let parts = this.data.split('.');

		this.component = parts[0];

		if (parts.length > 1) {
			this.property = parts[1];
		}

		if (this.property) {
			vec = this.el.getAttribute(this.component)[this.property];
		} else {
			vec = this.el.getAttribute(this.component);
		}

		this.position.x += vec.x;
		this.position.y += vec.y;
		this.position.z += vec.z;
	},

	tick: function() {
		tempVec.copy(this.position);
		tempVec.applyMatrix4( matrix.getInverse( this.el.object3D.matrixWorld ) );

		tempCoord.x = tempVec.x;
		tempCoord.y = tempVec.y;
		tempCoord.z = tempVec.z;

		if (this.property) {
			this.el.setAttribute(this.component, this.property, tempCoord);
		} else {
			this.el.setAttribute(this.component, tempVec);
		}
	}
};

MakeTickComponent(AnchorCompDef, 800);

AFRAME = require('aframe');

import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';


const coordinates = AFRAME.utils.coordinates,
	tempVec = new AFRAME.THREE.Vector3();

let camera: THREE.Camera;

const linkProperty = {
	default: '',
	parse: function (value: string | object) {
		// A static position.
		if (typeof value === 'object' || coordinates.isCoordinates(value)) {
			const c = coordinates.parse(value);
			return new AFRAME.THREE.Vector3(c.x, c.y, c.z);
		}
		// A selector to a target entity.
		return value;
	},

	stringify: function (data: AFrame.Coordinate | string) {
		if (typeof data === 'object') {
			return coordinates.stringify(data);
		}
		return data;
	}
};

interface LineLinkComp extends OrderedTickComponent {
	data: {
		start: THREE.Vector3 | string;
		end: THREE.Vector3 | string;
		color: string;
		opacity: number;
	};

	points: THREE.Vector3[];
	line: THREE.Line;

	startOb: THREE.Object3D;
	endOb: THREE.Object3D;
}

export const LineLinkCompDef: AFrame.ComponentDefinition<LineLinkComp> = {

	schema: {
		start: linkProperty,
		end: linkProperty,
		color: { default: 'black' },
		opacity: { default: 1 }
	},

	tickOrder: 600,

	init: function() {
		this.tickSystem = this.el.sceneEl.systems['tick-order'] as TickOrderSys;

		camera = this.el.sceneEl.camera;

		this.points = [new AFRAME.THREE.Vector3(), new AFRAME.THREE.Vector3()];

		const material = new AFRAME.THREE.LineDashedMaterial( {
			linewidth: 1,
			scale: 1,
			dashSize: 0.1,
			gapSize: 0.05,
		} );

		const geometry = new AFRAME.THREE.Geometry();
		geometry.vertices.push(this.points[0]);
		geometry.vertices.push(this.points[1]);

		this.line = new AFRAME.THREE.Line( geometry, material );

		this.el.setObject3D(this.attrName, this.line);
	},

	update: function(oldData) {
		const diff = AFRAME.utils.diff(oldData, this.data);

		for (let prop in diff) {
			switch (prop) {
				case 'start':
					if (typeof this.data.start === 'object') {
						this.points[0].copy( this.data.start );

						delete this.startOb;

					} else {
						this.startOb = (this.el.sceneEl.querySelector(this.data.start) as AFrame.Entity).object3D;
					}

					break;

				case 'end':
					if (typeof this.data.end === 'object') {
						this.points[1].copy( this.data.end );

						delete this.endOb;

					} else {
						this.endOb = (this.el.sceneEl.querySelector(this.data.end) as AFrame.Entity).object3D;
					}

					break;

				case 'color':
					(this.line.material as THREE.LineDashedMaterial).color = new AFRAME.THREE.Color(this.data.color);

					break;

				case 'opacity':
					this.line.material.transparent = this.data.opacity < 1;
					this.line.material.opacity = this.data.opacity;

					break;
			}
		}



	},

	play: function() {
		this.tickSystem.playComp(this);
	},

	remove: function() {
		this.el.removeObject3D(this.attrName);
	},

	tick: function() {
		if (this.startOb) {
			this.startOb.getWorldPosition(this.points[0]);
		}

		if (this.endOb) {
			this.endOb.getWorldPosition(this.points[1]);
		}

		if (this.startOb || this.endOb) {
			(this.line.geometry as THREE.Geometry).verticesNeedUpdate = true;
			this.line.geometry.computeBoundingSphere();
			this.line.computeLineDistances();
			(this.line.geometry as THREE.Geometry).lineDistancesNeedUpdate = true;
		}
	}
};

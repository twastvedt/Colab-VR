import { htmlToElement } from '../tools';
import { OrderedTickComponent, TickOrderSys } from '../systems/TickOrder.system';


const coordinates = AFRAME.utils.coordinates,
	tempVec = new AFRAME.THREE.Vector3();

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
		label: string;
	};

	line: THREE.Line;
	line3: THREE.Line3;

	startOb: THREE.Object3D;
	endOb: THREE.Object3D;
	labelEl: AFrame.Entity;

	labelFunctions: (() => string)[];
}

AFRAME.registerComponent<LineLinkComp>('line-link', {

	schema: {
		start: linkProperty,
		end: linkProperty,
		color: { default: 'black' },
		opacity: { default: 1 },
		label: { default: '' }
	},

	tickOrder: 600,

	init: function() {
		this.tickSystem = this.el.sceneEl.systems['tick-order'] as TickOrderSys;

		this.line3 = new AFRAME.THREE.Line3();

		const material = new AFRAME.THREE.LineDashedMaterial( {
			linewidth: 1,
			scale: 1,
			dashSize: 0.1,
			gapSize: 0.05,
		} );

		const geometry = new AFRAME.THREE.Geometry();
		geometry.vertices.push(this.line3.start);
		geometry.vertices.push(this.line3.end);

		this.line = new AFRAME.THREE.Line( geometry, material );

		this.el.setObject3D(this.attrName, this.line);
	},

	update: function(oldData) {
		const diff = AFRAME.utils.diff(oldData, this.data);

		for (let prop in diff) {
			switch (prop) {
				case 'start':
					if (typeof this.data.start === 'object') {
						this.line3.start.copy( this.data.start );

						delete this.startOb;

					} else {
						this.startOb = (this.el.sceneEl.querySelector(this.data.start) as AFrame.Entity).object3D;
					}

					break;

				case 'end':
					if (typeof this.data.end === 'object') {
						this.line3.end.copy( this.data.end );

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

				case 'label':
					if (this.data.label.length) {
						const parts = this.data.label.split(/[\[\]]/);

						this.labelFunctions = parts.map((part, i) => {
							if (i % 2) {
								// Odd index: inside square brackets.
								switch (part) {
									case 'length':
										return () => this.line3.distance().toFixed(1);

										break;

									default:
										return () => part;
								}

							} else {
								return () => part;
							}
						});

						if (!this.labelEl) {
							this.labelEl = htmlToElement<AFrame.Entity>(`
								<a-text
									constant-scale="0.08 0.08 0.08"
									look-at="#camera"
									class="label" id="label-${this.attrName}"
									position="0 0 0" rotation="0 0 0" scale="1 1 1"
									align="center" color="black" font="roboto" value="" z-offset="0.3">
								</a-text>
							`);

							this.el.appendChild(this.labelEl);
						}

					} else {
						delete this.labelFunctions;

						if (this.labelEl) {
							this.labelEl.remove();
							delete this.labelEl;
						}
					}

					break;
			}
		}

	},

	play: function() {
		this.tickSystem.playComp(this);
	},

	remove: function() {
		this.el.removeObject3D(this.attrName);

		// Remove label element from document, if present.
		if (this.labelEl) {
			this.labelEl.remove();
		}
	},

	tick: function() {
		if (this.startOb) {
			this.startOb.getWorldPosition(this.line3.start);
		}

		if (this.endOb) {
			this.endOb.getWorldPosition(this.line3.end);
		}

		if (this.startOb || this.endOb) {
			(this.line.geometry as THREE.Geometry).verticesNeedUpdate = true;
			this.line.geometry.computeBoundingSphere();
			this.line.computeLineDistances();
			(this.line.geometry as THREE.Geometry).lineDistancesNeedUpdate = true;
		}

		if (this.labelEl) {
			this.labelEl.setAttribute('text', 'value', this.labelFunctions.reduce<string>( (label, partFunc) => label + partFunc(), '' ));

			this.line3.getCenter(tempVec);
			this.labelEl.object3D.position.copy(tempVec);
		}
	}
});

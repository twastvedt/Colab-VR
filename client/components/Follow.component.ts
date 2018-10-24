AFRAME = require('aframe');

import { OrderedTickComponent, MakeTickComponent } from '../systems/TickOrder.system';


interface FollowComp extends OrderedTickComponent {
	data: {
		sourceSelector: AFrame.Entity,
		destProp: string,
		sourceProp: string,
		global: boolean
	};

	tickType: string;

	sourceObject: THREE.Vector3;
	destObject: THREE.Vector3;

	copyFunc: () => void;
}

export const FollowCompDef: AFrame.ComponentDefinition<FollowComp> = {

	schema: {
		sourceSelector: {type: 'selector'},
		destProp: {default: 'position'},
		sourceProp: {default: 'position'},
		global: {default: true}
	},

	init: function() {
		let parts = this.data.sourceProp.split('.'),
			sourceProp: string,
			destProp: string;

		const sourceComp = parts[0];

		if (parts.length > 1) {
			sourceProp = parts[1];
		}

		parts = this.data.destProp.split('.');

		const destComp = parts[0];

		if (parts.length > 1) {
			destProp = parts[1];
		}

		if (destComp in ['position', 'rotation', 'scale']) {
			if (sourceComp in ['position', 'rotation', 'scale']) {
				// Don't bother with the tick if we can just link the properties to the same object.

				(this.el.object3D as any)[destComp] = (this.data.sourceSelector.object3D as any)[sourceComp];

			} else {
				// AFrame property => three.js property

				const destObject = (this.el.object3D as any)[destComp];

				if (sourceProp) {
					this.copyFunc = () => {
						const vec: AFrame.Coordinate = this.el.getAttribute(sourceComp)[sourceProp];
						destObject.set(vec.x, vec.y, vec.z);
					};
				} else {
					this.copyFunc = () => {
						const vec: AFrame.Coordinate = this.el.getAttribute(sourceComp);
						destObject.set(vec.x, vec.y, vec.z);
					};
				}
			}

		} else {
			if (sourceComp in ['position', 'rotation', 'scale']) {
				// three.js property => AFrame property

				const sourceObject = (this.el.object3D as any)[sourceComp];

				if (destProp) {
					this.copyFunc = () => {
						this.el.setAttribute(destComp, destProp, sourceObject);
					};
				} else {
					this.copyFunc = () => {
						this.el.setAttribute(destComp, sourceObject);
					};
				}

			} else {
				// AFrame property => AFrame property.
				if (destProp) {
					if (sourceProp) {
						this.copyFunc = () => {
							const vec: AFrame.Coordinate = this.el.getAttribute(sourceComp)[sourceProp];

							this.el.setAttribute(destComp, destProp, vec);
						};

					} else {
						this.copyFunc = () => {
							const vec: AFrame.Coordinate = this.el.getAttribute(sourceComp);

							this.el.setAttribute(destComp, destProp, vec);
						};
					}
				} else {
					if (sourceProp) {
						this.copyFunc = () => {
							const vec: AFrame.Coordinate = this.el.getAttribute(sourceComp)[sourceProp];

							this.el.setAttribute(destComp, vec);
						};

					} else {
						this.copyFunc = () => {
							const vec: AFrame.Coordinate = this.el.getAttribute(sourceComp);

							this.el.setAttribute(destComp, vec);
						};
					}
				}
			}
		}
	},

	tick: this.copyFunc
};

MakeTickComponent(FollowCompDef, 200);

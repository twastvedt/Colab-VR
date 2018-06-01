AFRAME = require('aframe');

import { htmlToElement } from "../tools";

import { Drawing, DrawShape } from "../systems/Drawing.system";

let cursorPos = new AFRAME.THREE.Vector3(),
	tempVec: THREE.Vector3,
	step: number,
	startPoint: THREE.Vector3,
	newObject: AFrame.Entity,
	boundStep: () => void;

interface DrawBox extends DrawShape {

}

export const DrawBoxComp: AFrame.ComponentDefinition<DrawBox> = {
	schema: {
	},

	name: 'draw-box',

	init: function() {
		cursorPos = this.el.object3D.position;
		newObject = undefined;
		step = 0;

		this.system = document.querySelector('a-scene').systems['drawing'] as Drawing;
		boundStep = () => this.doStep();

		window.addEventListener('click', boundStep);
	},

	doStep: function() {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				newObject = htmlToElement<AFrame.Entity>(`<a-box mixin="shape" material="transparent: true"></a-box>`);

				this.system.el.appendChild(newObject);

				startPoint = cursorPos.clone();

				break;

			case 1:
				this.el.setAttribute('locked-pointer', {
					position: cursorPos.clone(),
					isPlane: false
				});

				break;

			case 2:
				newObject.setAttribute('material', {
					transparent: false,
					opacity: 1
				});

				newObject = undefined;

				this.system.endCommand(this);
		}

		step++;
	},

	remove: function() {
		window.removeEventListener('click', boundStep);

		this.el.setAttribute('locked-pointer', {
			position: {x: 0, y: 0, z: 0},
			isPlane: true
		});

		// Remove temp element if present.
		if (newObject) {
			newObject.parentNode.removeChild(newObject);
		}

		this.system.stopDrawing();
	},

	tick: function() {
		if (newObject && newObject.object3D) {
			tempVec = cursorPos.clone().add(startPoint).divideScalar(2);
			newObject.object3D.position.set(tempVec.x, tempVec.y, tempVec.z);

			tempVec.sub(startPoint).multiplyScalar(2);
			newObject.object3D.scale.set(tempVec.x, tempVec.y, tempVec.z);

			// If we're creating the base of the box, add a small height so that the box is visible.
			if (step === 1) {
				newObject.object3D.scale.setY(0.01);
			}
		}
	}
};

AFRAME = require('aframe');

import { htmlToElement } from "../tools";

import { Drawing, DrawShape } from "../systems/Drawing.system";

import { GridMatComp } from "../components/GridMaterial.component";

let cursorPos = new AFRAME.THREE.Vector3(),
	tempVec: THREE.Vector3,
	step: number,
	startPoint: THREE.Vector3,
	newParent: AFrame.Entity,
	newBox: AFrame.Entity,
	boundStep: () => void;

interface DrawBox extends DrawShape {

}

export const DrawBoxComp: AFrame.ComponentDefinition<DrawBox> = {
	schema: {
	},

	NAFSchema: {
		template: '#box-template',
		components: [
			'position',
			'rotation',
			'scale',
			{
				selector: '.box',
				component: 'grid-mat'
			},
			{
				selector: '.box',
				component: 'shadow'
			}
		]
	},

	name: 'draw-box',

	init: function() {
		cursorPos = this.el.object3D.position;
		newParent = undefined;
		step = 0;

		this.system = document.querySelector('a-scene').systems['drawing'] as Drawing;
		boundStep = () => this.doStep();

		window.addEventListener('click', boundStep);
	},

	doStep: function() {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				newParent = htmlToElement<AFrame.Entity>(`
					<a-entity
						class="drawn static"
						position="0 0 0" rotation="0 0 0" scale="0 0 0"
						networked="template:#box-template">
					</a-entity>
				`);

				this.system.el.appendChild(newParent);

				startPoint = cursorPos.clone();

				break;

			case 1:
				this.el.setAttribute('locked-pointer', {
					position: cursorPos.clone(),
					isPlane: false
				});

				newBox = newParent.children[0] as AFrame.Entity;

				break;

			case 2:
				newBox.setAttribute('grid-mat', 'opacity', 1);
				newBox.setAttribute('shadow', {
					cast: true,
					receive: true
				});

				newParent = undefined;

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
		if (newParent) {
			newParent.parentNode.removeChild(newParent);
		}

		this.system.stopDrawing();
	},

	tick: function() {
		if (newParent && newParent.object3D) {
			tempVec = cursorPos.clone().add(startPoint).divideScalar(2);
			newParent.object3D.position.set(tempVec.x, tempVec.y, tempVec.z);

			tempVec.sub(startPoint).multiplyScalar(2);
			newParent.object3D.scale.set(tempVec.x, tempVec.y, tempVec.z);

			// If we're creating the base of the box, add a small height so that the box is visible.
			if (step === 1) {
				newParent.object3D.scale.setY(0.01);
			}
		}
	}
};

AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { Drawing, DrawShape } from '../systems/Drawing.system';


let cursorPos = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	step: number,
	startPoint: THREE.Vector3,
	newParent: AFrame.Entity,
	newBox: AFrame.Entity,
	worldQuaternion = new AFRAME.THREE.Quaternion(),
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

	tickOrder: 600,

	name: 'draw-box',

	init: function() {
		cursorPos = this.el.object3D.position;
		newParent = undefined;
		step = 0;

		this.system = document.querySelector('a-scene').systems['drawing'] as Drawing;
		boundStep = () => this.doStep();

		window.addEventListener('click', boundStep);

		this.el.setAttribute('cursor-geo', 'state', 'drawing-plane');
	},

	doStep: function() {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.object3D.getWorldQuaternion( worldQuaternion );
				tempVec.copy( this.el.object3D.up ).applyQuaternion( worldQuaternion );

				this.el.components['sliding-pointer'].pause();

				this.el.setAttribute('locked-pointer', {
					vector: tempVec,
					position: this.el.object3D.position,
					isPlane: true,
					pointerSelector: '#pointer'
				});
				this.el.components['locked-pointer'].play();

				newParent = htmlToElement<AFrame.Entity>(`
					<a-entity
						class="drawn static collide"
						position="0 0 0" rotation="0 0 0" scale="0 0 0"
						networked="template:#box-template">
					</a-entity>
				`);

				this.system.el.appendChild(newParent);

				startPoint = cursorPos.clone();

				break;

			case 1:
				this.el.setAttribute('locked-pointer', {
					position: cursorPos,
					isPlane: false
				});

				this.el.setAttribute('cursor-geo', 'state', 'drawing-line');

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

		// Remove temp element if present.
		if (newParent) {
			newParent.parentNode.removeChild(newParent);
		}

		this.system.stopDrawing();
	},

	play: function() {
		this.system.tickSystem.playComp(this);
	},

	tick: function() {
		if (newParent && newParent.object3D) {
			tempVec = cursorPos.clone().add(startPoint).divideScalar(2);
			newParent.object3D.position.set(tempVec.x, tempVec.y, tempVec.z);

			tempVec.sub(startPoint).multiplyScalar(2);
			newParent.object3D.scale.set(Math.max(0.01, Math.abs(tempVec.x)), Math.max(0.01, Math.abs(tempVec.y)), Math.max(0.01, Math.abs(tempVec.z)));
		}
	}
};

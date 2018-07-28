AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { CommandBaseCompDef, CommandBase } from './CommandBase.component';
import { LockedState, UIState } from '../components/DynamicCursor.component';


let cursorPos = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	startPoint: THREE.Vector3,
	newParent: AFrame.Entity,
	newBox: AFrame.Entity;

interface DrawBox extends CommandBase {

}

const drawBoxExtension = Object.create(CommandBaseCompDef);

Object.assign(drawBoxExtension, {
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

	name: 'draw_box',

	init: function() {
		CommandBaseCompDef.init.bind(this)();

		cursorPos = this.el.object3D.position;
		newParent = undefined;

		this.el.setAttribute('dynamic-cursor', 'ui', UIState.plane);
	},

	doStep: function() {
		switch (this.currentStep) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.plane);

				newParent = htmlToElement<AFrame.Entity>(`
					<a-entity
						class="drawn static collidable"
						position="0 0 0" rotation="0 0 0" scale="0 0 0"
						networked="template:#box-template">
					</a-entity>
				`);

				this.system.el.appendChild(newParent);

				startPoint = cursorPos.clone();

				break;

			case 1:
				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.line);

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

		this.currentStep++;
	},

	remove: function() {
		// Remove temp element if present.
		if (newParent) {
			newParent.parentNode.removeChild(newParent);
		}

		CommandBaseCompDef.remove.bind(this)();
	},

	tick: function() {
		if (newParent && newParent.object3D) {
			tempVec = cursorPos.clone().add(startPoint).divideScalar(2);
			newParent.object3D.position.set(tempVec.x, tempVec.y, tempVec.z);

			tempVec.sub(startPoint).multiplyScalar(2);
			newParent.object3D.scale.set(Math.max(0.01, Math.abs(tempVec.x)), Math.max(0.01, Math.abs(tempVec.y)), Math.max(0.01, Math.abs(tempVec.z)));
		}
	}
} as AFrame.ComponentDefinition<DrawBox>);

export const DrawBoxComp: AFrame.ComponentDefinition<DrawBox> = drawBoxExtension;

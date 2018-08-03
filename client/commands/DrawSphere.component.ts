AFRAME = require('aframe');

import { htmlToElement } from '../tools';
import { CommandBaseCompDef, CommandBase } from './CommandBase.component';
import { LockedState, UIState } from '../components/DynamicCursor.component';


let cursorPos = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	startPoint: THREE.Vector3,
	newParent: AFrame.Entity,
	newSphere: AFrame.Entity;

interface DrawSphere extends CommandBase {

}

const drawSphereExtension = Object.create(CommandBaseCompDef);

Object.assign(drawSphereExtension, {
	schema: {
	},

	NAFSchema: {
		template: '#sphere-template',
		components: [
			'position',
			'rotation',
			'scale',
			{
				selector: '.sphere',
				component: 'grid-mat'
			},
			{
				selector: '.sphere',
				component: 'shadow'
			}
		]
	},

	init: function() {
		CommandBaseCompDef.init.bind(this)();

		cursorPos = this.el.object3D.position;
		newParent = undefined;
	},

	doStep: function() {
		switch (this.currentStep) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.plane);

				newParent = htmlToElement<AFrame.Entity>(`
					<a-entity
						class="drawn static"
						position="${cursorPos.x} ${cursorPos.y} ${cursorPos.z}" rotation="0 0 0" scale="0 0 0"
						networked="template:#sphere-template">
					</a-entity>
				`);

				this.el.sceneEl.appendChild(newParent);

				startPoint = cursorPos.clone();

				break;

			case 1:
				newSphere = newParent.children[0] as AFrame.Entity;

				newSphere.setAttribute('material', 'opacity', 0.4);
				newSphere.setAttribute('shadow', {
					cast: false,
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
			const radius = cursorPos.clone().sub(startPoint).length();
			newParent.object3D.scale.setScalar( radius );
		}
	}
} as AFrame.ComponentDefinition<DrawSphere>);

export const DrawSphereComp: AFrame.ComponentDefinition<DrawSphere> = drawSphereExtension;

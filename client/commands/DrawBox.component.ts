import { htmlToElement } from '../tools';
import { ClickSequenceComponent, MakeClickSequence } from './CommandDecorators';
import { LockedState } from '../components/DynamicCursor.component';


let cursorPos = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	startPoint: THREE.Vector3,
	newParent: AFrame.Entity,
	newBox: AFrame.Entity;

export const DrawBoxCompDef: AFrame.ComponentDefinition<ClickSequenceComponent> = {
	schema: {
	},

	NAFSchema: {
		template: '#box-template',
		components: [
			'position',
			'rotation',
			'scale',
			'grid-mat',
			'shadow'
		]
	},

	init: function() {
		cursorPos = this.el.object3D.position;
		newParent = undefined;
	},

	doStep: function(step) {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.plane);

				newParent = htmlToElement<AFrame.Entity>(`
					<a-entity
						position="0 0 0" rotation="0 0 0" scale="0 0 0"
						networked="template:#box-template">
					</a-entity>
				`);

				this.el.sceneEl.appendChild(newParent);

				startPoint = cursorPos.clone();

				// window.setTimeout(() => {
				// 	const mesh: THREE.Mesh = newParent.getObject3D('mesh') as any;

				// 	(mesh.geometry as THREE.Geometry).copy( mesh.geometry as THREE.Geometry );

				// 	const pointer = (document.querySelector('#pointer') as AFrame.Entity);
				// 	(pointer.components['raycaster'] as any).refreshObjects();
				// });

				break;

			case 1:
				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.line);

				break;

			case 2:
				newParent.setAttribute('grid-mat', 'opacity', 1);
				newParent.setAttribute('shadow', {
					cast: true,
					receive: true
				});

				newParent = undefined;

				this.system.endCommand( this.name );
		}
	},

	remove: function() {
		// Remove temp element if present.
		if (newParent) {
			newParent.parentNode.removeChild(newParent);
		}
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

MakeClickSequence(DrawBoxCompDef);

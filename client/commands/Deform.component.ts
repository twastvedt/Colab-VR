import { ClickSequenceComponent, MakeClickSequence } from './CommandDecorators';
import { LockedState, UIState, DynamicCursor } from '../components/DynamicCursor.component';
import { SubdivisionComp } from '../components/Subdivision.component';
import { OrderedTickComponent, MakeTickComponent } from '../systems/TickOrder.system';


const matrix = new AFRAME.THREE.Matrix4();

let target: THREE.Mesh & AFrame.Entity['object3D'],
	cursorPos: THREE.Vector3,
	newVert: THREE.Vector3,
	subdivision: SubdivisionComp,
	originalGeo: THREE.Geometry,
	geometry: THREE.Geometry;

type base = ClickSequenceComponent & OrderedTickComponent;

interface DeformComp extends base {

	doStep: (this: DeformComp, step: number, e: AFrame.EntityEventMap['click']) => void;
}

export const DeformCompDef: AFrame.ComponentDefinition<DeformComp> = {
	schema: {
	},

	init: function() {
		cursorPos = this.el.object3D.position;

		this.el.setAttribute('dynamic-cursor', {
			'target': 'base',
			'ui': UIState.line
		});
	},

	doStep: function(step, e) {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.line);

				target = e.detail.intersection.object as any;

				// Switch to geometry to facilitate vertex manipulation. SubdivisionModifier would do this anyway to the deformed mesh.
				if ( (target.geometry as any).isBufferGeometry ) {
					target.geometry = new AFRAME.THREE.Geometry().fromBufferGeometry( target.geometry as THREE.BufferGeometry );
				}

				geometry = target.geometry as any;

				const point = e.detail.intersection.point,
					face = geometry.faces[ e.detail.intersection.faceIndex ],
					newIndex = geometry.vertices.length,
					newUV = e.detail.intersection.uv,
					faceUVs = geometry.faceVertexUvs[0][ e.detail.intersection.faceIndex ];

				// Backup for cancellation of command.
				originalGeo = geometry.clone();

				// Add new vertex at clicked point on object.
				newVert = point.clone();
				newVert.applyMatrix4( matrix.getInverse( target.matrixWorld ) );
				geometry.vertices.push( newVert );

				// Create two new faces to complete the stellation.
				geometry.faces.push( new AFRAME.THREE.Face3(face.b, face.c, newIndex) );
				geometry.faces.push( new AFRAME.THREE.Face3(face.c, face.a, newIndex) );
				// Move third vertex of clicked face to clicked point.
				face.c = newIndex;

				if (faceUVs) {
					// Update face uvs to match.
					geometry.faceVertexUvs[0].push( [ faceUVs[1], faceUVs[2], newUV ] );
					geometry.faceVertexUvs[0].push( [ faceUVs[2], faceUVs[0], newUV ] );
					faceUVs[2] = newUV;

					geometry.uvsNeedUpdate = true;
				}

				geometry.elementsNeedUpdate = true;

				// Create a new edges geometry to include the new vertex.
				if (target.el.hasAttribute('subdivision')) {
					subdivision = target.el.components['subdivision'] as SubdivisionComp;

					target.el.setAttribute('subdivision', 'showWire', true);
					subdivision.updateWireframe();

				} else {
					target.el.setAttribute('subdivision', {
						levels: 3,
						showWire: true
					});

					window.setTimeout((() => {
						subdivision = target.el.components['subdivision'] as SubdivisionComp;
						subdivision.updateWireframe();
					}).bind(this), 0);
				}


				break;

			case 1:
				// Apply base mesh changes to the subdivided mesh.
				subdivision.updateSubdivision();
				target.el.setAttribute('subdivision', 'showWire', false);

				geometry.computeFaceNormals();
				// geometry.normalsNeedUpdate = true;

				originalGeo = undefined;

				this.system.endCommand( this.name );

				break;
		}
	},

	remove: function() {
		// Reset to original mesh.
		if (originalGeo) {
			target.geometry = originalGeo;
		}

		this.el.setAttribute('dynamic-cursor', 'target', 'main');
	},

	tick: function() {
		if (this.currentStep === 1 && subdivision !== undefined) {
			newVert.copy(cursorPos);
			newVert.applyMatrix4( matrix.getInverse( target.matrixWorld ) );

			subdivision.updateWireframe();
		}
	}
};

MakeClickSequence(DeformCompDef);
MakeTickComponent(DeformCompDef, 800);

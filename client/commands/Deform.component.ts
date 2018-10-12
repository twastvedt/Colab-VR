import { ClickSequenceComponent, MakeClickSequence } from './CommandDecorators';
import { LockedState, UIState } from '../components/DynamicCursor.component';
import { SubdivisionComp } from '../components/Subdivision.component';
import { UISystem } from '../systems/UI.system';
import { htmlToElement } from '../tools';


const matrix = new AFRAME.THREE.Matrix4();

let cursorPos: THREE.Vector3,
	subdivEl: AFrame.Entity,
	uiSystem: UISystem;

interface DeformComp extends ClickSequenceComponent {

	activeVertexId: number;
	clickedFaceIndex: number;
	newVert: THREE.Vector3;
	target: THREE.Mesh & AFrame.Entity['object3D'];
	originalGeo: THREE.Geometry;
	subdivision: SubdivisionComp;

	setUpDeform: (this: DeformComp, e: AFrame.EntityEventMap['click']) => void;
	doStep: (this: DeformComp, step: number, e: AFrame.EntityEventMap['click']) => void;
}

export const DeformCompDef: AFrame.ComponentDefinition<DeformComp> = {

	init: function() {
		cursorPos = this.el.object3D.position;
		uiSystem = this.el.sceneEl.systems['ui'];

		// Show face normal (direction of deformation).
		this.el.setAttribute('dynamic-cursor', {
			'ui': UIState.line
		});

		// Raycaster targets base objects, not modified (subdivided).
		uiSystem.d.target = 'base';
	},

	doStep: function(step, e) {
		switch (step) {
			case 0:
				this.target = e.detail.intersection.object as any;

				const el = this.target.el;

				// Ignore objects which aren't editable or aren't owned by us.
				if (!el.classList.contains('editable')) {
					this.currentStep --;
					return;
				}

				this.system.addAnchor(cursorPos);

				// Constrain deformation to line normal to clicked surface.
				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.line);

				el.addState(HAROLD.States.baseEditing);
				uiSystem.d.target = 'main';

				// Switch to geometry to facilitate vertex manipulation. SubdivisionModifier would do this anyway to the deformed mesh.
				if ( (this.target.geometry as any).isBufferGeometry ) {
					this.target.geometry = new AFRAME.THREE.Geometry().fromBufferGeometry( this.target.geometry as THREE.BufferGeometry );

					this.target.geometry.mergeVertices();
				}

				this.clickedFaceIndex = e.detail.intersection.faceIndex;

				// Create a new edges geometry to include the new vertex.
				if (el.classList.contains('subdivision')) {
					this.setUpDeform(e);

					subdivEl = el.querySelector('.subdivision') as AFrame.Entity;

					this.subdivision = subdivEl.components['subdivision'];

					subdivEl.setAttribute('subdivision', 'showWire', true);

					this.subdivision.reset(true);

				} else {
					// Start subdivision as owned by dummy other person so that the template isn't synced immediately.
					subdivEl = htmlToElement<AFrame.Entity>(`
						<a-entity
							networked="template:#subdivision-template; owner:dummy">
						</a-entity>
					`);

					el.appendChild(subdivEl);
					el.classList.add('subdivision');

					const that = this;

					window.setTimeout(() => {
						that.setUpDeform(e);
						this.subdivision = subdivEl.components['subdivision'];
						this.subdivision.reset(true);
						subdivEl.setAttribute('subdivision', 'showWire', true);
					}, 0);
				}

				break;

			case 1:
				// Now that the deform is done, take ownership of the subdivision entity so that it will sync.
				NAF.utils.takeOwnership(subdivEl);

				// Apply base mesh changes to the subdivided mesh.
				this.subdivision.updateSubdivision();
				subdivEl.setAttribute('subdivision', 'showWire', false);

				this.originalGeo = undefined;

				this.system.endCommand( this.name );

				if (this.target.el.hasAttribute('networked')) {
					// Compile changes made by deform, to be broadcast.

					const geometry = (this.target.geometry as THREE.Geometry);
					const faceCount = geometry.faces.length;

					const verticesDiff: DeformData['verticesDiff'] = {};
					verticesDiff[this.activeVertexId] = this.newVert;

					const facesDiff: DeformData['facesDiff'] = {};
					facesDiff[this.clickedFaceIndex] = geometry.faces[this.clickedFaceIndex];
					facesDiff[faceCount - 2] = geometry.faces[faceCount - 2];
					facesDiff[faceCount - 1] = geometry.faces[faceCount - 1];

					const uvsDiff: DeformData['uvsDiff'] = {};
					uvsDiff[this.clickedFaceIndex] = geometry.faceVertexUvs[0][this.clickedFaceIndex];
					uvsDiff[faceCount - 2] = geometry.faceVertexUvs[0][faceCount - 2];
					uvsDiff[faceCount - 1] = geometry.faceVertexUvs[0][faceCount - 1];

					const data: DeformData = {
						id: this.target.el.getAttribute('networked').networkId,
						verticesDiff,
						facesDiff,
						uvsDiff
					};

					NAF.connection.broadcastDataGuaranteed('deform', data);

				}

				break;
		}
	},

	setUpDeform: function(e) {
		const geometry = this.target.geometry as THREE.Geometry;

		const point = e.detail.intersection.point,
			face = geometry.faces[ this.clickedFaceIndex ],
			newIndex = geometry.vertices.length,
			newUV = e.detail.intersection.uv,
			faceUVs = geometry.faceVertexUvs[0][ this.clickedFaceIndex ];

		this.activeVertexId = newIndex;

		// Backup for cancellation of command.
		this.originalGeo = geometry.clone();

		// Add new vertex at clicked point on object.
		this.newVert = point.clone();
		this.newVert.applyMatrix4( matrix.getInverse( this.target.matrixWorld ) );
		geometry.vertices.push( this.newVert );

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

		geometry.computeFaceNormals();
		geometry.elementsNeedUpdate = true;
		geometry.normalsNeedUpdate = true;
	},

	remove: function() {
		// Reset to original mesh.
		if (this.originalGeo) {
			this.target.geometry = this.originalGeo;
		}

		this.target.el.removeState(HAROLD.States.baseEditing);
	},

	tick: function() {
		if (this.currentStep === 1 && this.subdivision !== undefined) {
			this.newVert.copy(cursorPos);
			this.newVert.applyMatrix4( matrix.getInverse( this.target.matrixWorld ) );

			this.subdivision.updateWireframe( [this.activeVertexId] );
		}
	}
};

MakeClickSequence(DeformCompDef);

interface DeformData {
	id: string;
	verticesDiff: {[key: number]: AFrame.Coordinate};
	facesDiff: {[key: number]: {a: number, b: number, c: number}};
	uvsDiff: {[key: number]: THREE.Vector2[]};
}

/**
 * Apply broadcast deform changes to corresponding object on other clients.
 */
function syncDeform(senderId: string, dataType: string, data: DeformData, targetId: string) {
	const localEntity = document.querySelector('#naf-' + data.id) as AFrame.Entity;

	if (!localEntity) return;

	const localGeo: THREE.Geometry = (localEntity.getObject3D('mesh') as any).geometry;

	for (const key in data.verticesDiff) {
		const v = data.verticesDiff[key];

		if (localGeo.vertices[key]) {
			localGeo.vertices[key].set(v.x, v.y, v.z);

		} else {
			localGeo.vertices[key] = new AFRAME.THREE.Vector3(v.x, v.y, v.z);
		}
	}

	for (const key in data.facesDiff) {
		const f = data.facesDiff[key];

		if (localGeo.faces[key]) {
			const face = localGeo.faces[key];
			face.a = f.a;
			face.b = f.b;
			face.c = f.c;

		} else {
			localGeo.faces[key] = new AFRAME.THREE.Face3(f.a, f.b, f.c);
		}
	}

	for (const key in data.uvsDiff) {
		if (localGeo.faceVertexUvs[0][key]) {
			data.uvsDiff[key].forEach((v, i) => {
				localGeo.faceVertexUvs[0][key][i].set( v.x, v.y);
			});

		} else {
			localGeo.faceVertexUvs[0][key] = data.uvsDiff[key].map((v) => new AFRAME.THREE.Vector2(v.x, v.y));
		}
	}

	localGeo.computeFaceNormals();

	localGeo.verticesNeedUpdate = true;
	localGeo.elementsNeedUpdate = true;
	localGeo.normalsNeedUpdate = true;
	localGeo.uvsNeedUpdate = true;

	subdivEl = localEntity.querySelector('.subdivision') as AFrame.Entity;

	if (subdivEl) {
		const subdivision = subdivEl.components['subdivision'];
		subdivision.reset(true);
	}
}

NAF.connection.subscribeToDataChannel('deform', syncDeform);

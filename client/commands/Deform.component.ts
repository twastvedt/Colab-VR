import { ClickSequenceComponent, MakeClickSequence } from './CommandDecorators';
import { LockedState, UIState } from '../components/DynamicCursor.component';
import { SubdivisionComp } from '../components/Subdivision.component';
import { UISystem } from '../systems/UI.system';
import { htmlToElement } from '../tools';


const matrix = new AFRAME.THREE.Matrix4();

let target: THREE.Mesh & AFrame.Entity['object3D'],
	cursorPos: THREE.Vector3,
	newVert: THREE.Vector3,
	subdivision: SubdivisionComp,
	subdivEl: AFrame.Entity,
	originalGeo: THREE.Geometry,
	geometry = new AFRAME.THREE.Geometry(),
	uiSystem: UISystem;

interface DeformComp extends ClickSequenceComponent {

	activeVertexId: number;
	clickedFaceIndex: number;

	doStep: (this: DeformComp, step: number, e: AFrame.EntityEventMap['click']) => void;
}

export const DeformCompDef: AFrame.ComponentDefinition<DeformComp> = {

	init: function() {
		cursorPos = this.el.object3D.position;
		uiSystem = this.el.sceneEl.systems['ui'];

		this.el.setAttribute('dynamic-cursor', {
			'ui': UIState.line
		});

		uiSystem.d.target = 'base';
	},

	doStep: function(step, e) {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.line);

				target = e.detail.intersection.object as any;
				target.el.addState(HAROLD.States.baseEditing);
				uiSystem.d.target = 'main';

				// Switch to geometry to facilitate vertex manipulation. SubdivisionModifier would do this anyway to the deformed mesh.
				if ( (target.geometry as any).isBufferGeometry ) {
					target.geometry = new AFRAME.THREE.Geometry().fromBufferGeometry( target.geometry as THREE.BufferGeometry );

					target.geometry.mergeVertices();
				}

				// If this is the first time a deform command has been run on this object, copy the geometry to dissociate it from the template.
				if (!target.el.classList.contains('deformed')) {
					geometry = (target.geometry as THREE.Geometry).clone();
					target.geometry = geometry;
					target.el.classList.add('deformed');

				} else {
					geometry = target.geometry as THREE.Geometry;
				}

				this.clickedFaceIndex = e.detail.intersection.faceIndex;

				const point = e.detail.intersection.point,
					face = geometry.faces[ this.clickedFaceIndex ],
					newIndex = geometry.vertices.length,
					newUV = e.detail.intersection.uv,
					faceUVs = geometry.faceVertexUvs[0][ this.clickedFaceIndex ];

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

				geometry.computeFaceNormals();
				geometry.elementsNeedUpdate = true;
				geometry.normalsNeedUpdate = true;

				// Create a new edges geometry to include the new vertex.
				if (target.el.classList.contains('subdivision')) {
					subdivEl = target.el.querySelector('.subdivision') as AFrame.Entity;

					subdivision = subdivEl.components['subdivision'];

					subdivEl.setAttribute('subdivision', 'showWire', true);

					subdivision.reset(true);

				} else {
					subdivEl = htmlToElement<AFrame.Entity>(`
						<a-entity
							networked="template:#subdivision-template; owner:dummy">
						</a-entity>
					`);

					target.el.appendChild(subdivEl);

					window.setTimeout(() => {
						subdivision = subdivEl.components['subdivision'];
					}, 0);
				}

				this.activeVertexId = newIndex;

				break;

			case 1:
				// Apply base mesh changes to the subdivided mesh.
				subdivision.updateSubdivision();
				subdivEl.setAttribute('subdivision', 'showWire', false);

				originalGeo = undefined;

				this.system.endCommand( this.name );

				if (target.el.hasAttribute('networked')) {
					const faceCount = geometry.faces.length;

					const verticesDiff: DeformData['verticesDiff'] = {};
					verticesDiff[this.activeVertexId] = newVert;

					const facesDiff: DeformData['facesDiff'] = {};
					facesDiff[this.clickedFaceIndex] = geometry.faces[this.clickedFaceIndex];
					facesDiff[faceCount - 2] = geometry.faces[faceCount - 2];
					facesDiff[faceCount - 1] = geometry.faces[faceCount - 1];

					const uvsDiff: DeformData['uvsDiff'] = {};
					uvsDiff[this.clickedFaceIndex] = geometry.faceVertexUvs[0][this.clickedFaceIndex];
					uvsDiff[faceCount - 2] = geometry.faceVertexUvs[0][faceCount - 2];
					uvsDiff[faceCount - 1] = geometry.faceVertexUvs[0][faceCount - 1];

					const data: DeformData = {
						id: target.el.getAttribute('networked').networkId,
						verticesDiff,
						facesDiff,
						uvsDiff
					};

					NAF.connection.broadcastDataGuaranteed('deform', data);

				}

				NAF.utils.takeOwnership(subdivEl);

				break;
		}
	},

	remove: function() {
		// Reset to original mesh.
		if (originalGeo) {
			target.geometry = originalGeo;
		}

		target.el.removeState(HAROLD.States.baseEditing);
	},

	tick: function() {
		if (this.currentStep === 1 && subdivision !== undefined) {
			newVert.copy(cursorPos);
			newVert.applyMatrix4( matrix.getInverse( target.matrixWorld ) );

			subdivision.updateWireframe( [this.activeVertexId] );
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

function syncDeform(senderId: string, dataType: string, data: DeformData, targetId: string) {
	const localEntity = document.querySelector('#naf-' + data.id) as AFrame.Entity;

	if (!localEntity) return;

	let localGeo: THREE.Geometry;

	// If this is the first time this object has been deformed, copy the geometry to dissociate it from the template.
	if (!localEntity.classList.contains('deformed')) {
		localGeo = (localEntity.getObject3D('mesh') as any).geometry.clone();
		(localEntity.getObject3D('mesh') as any).geometry = localGeo;
		localEntity.classList.add('deformed');

	} else {
		localGeo = (localEntity.getObject3D('mesh') as any).geometry;
	}

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
		subdivision = subdivEl.components['subdivision'];
		subdivision.reset(true);
	}
}

NAF.connection.subscribeToDataChannel('deform', syncDeform);

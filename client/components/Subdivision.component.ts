import { SubdivisionModifier } from '../lib/SubdivisionModifier';
import { ClickSequenceComponent } from '../commands/CommandDecorators';

export interface SubdivisionComp extends ClickSequenceComponent {
	data: {
		levels: number;
		showWire: boolean;
		edgeSharpness: number;
	};
	baseMesh: THREE.Mesh;
	subdivMesh: THREE.Mesh;
	wireObject: THREE.LineSegments;
	modifier: SubdivisionModifier;
	parentEl: AFrame.Entity;

	updateWireframe: (this: SubdivisionComp, vertexIds?: number[]) => void;
	updateSubdivision: (this: SubdivisionComp, vertexIds?: number[]) => void;
	reset: (this: SubdivisionComp, keepEdgeSharpness: boolean) => void;
	sharpenEdges: (this: SubdivisionComp, sharpness: number) => void;
}

interface StructureEdge {
	a: THREE.Vector3;
	b: THREE.Vector3;
	newEdgeVertexId?: number;
	aIndex: number;
	bIndex: number;
	faces: THREE.Face3[];
	sharpness: number;
}

export const subdivisionCompDef: AFrame.ComponentDefinition<SubdivisionComp> = {
	schema: {
		levels: { default: 3 },
		edgeSharpness: { default: 3 },
		showWire: { default: false }
	},

	NAFSchema: {
		template: '#subdivision-template',
		components: [
			{
				component: 'subdivision',
				property: 'levels'
			},
			{
				component: 'subdivision',
				property: 'edgeSharpness'
			}
		]
	},

	update: function(oldData) {
		const data = this.data;

		if (data.levels !== oldData.levels) {
			if (data.levels > oldData.levels) {

				while (this.modifier.subdivisions < data.levels) {
					this.modifier.smooth();
					this.modifier.subdivisions++;
				}

			} else {
				this.modifier.subdivisions = data.levels;

				// Fist time through this is redundant as subdivision is created in init.
				if (oldData.levels) {
					this.reset(true);
				}
			}
		}

		if (data.showWire !== oldData.showWire) {
			if (data.showWire) {
				this.wireObject.visible = true;
				this.el.setAttribute('grid-mat', 'opacity', 0.5);

			} else {
				this.wireObject.visible = false;
				this.el.setAttribute('grid-mat', 'opacity', 1);
			}
		}
	},

	reset: function(keepEdgeSharpness) {
		this.modifier.calculateStructure(keepEdgeSharpness);
		this.modifier.reset();
		this.modifier.modify();

		this.subdivMesh.geometry = this.modifier.geometry;
	},

	init: function() {

		this.parentEl = this.el.parentElement as AFrame.Entity;

		// Look for a mesh to use as the base.
		(this.parentEl as AFrame.Entity).object3D.traverse((object) => {
			if (!this.baseMesh && object instanceof AFRAME.THREE.Mesh) {
				this.baseMesh = object;
			}
		});

		if (this.baseMesh) {

			// Copy the geometry to dissociate it from the template.
			const geometry = this.baseMesh.geometry.clone();
			this.baseMesh.geometry = geometry;

			// Initialize subdivision modifier.
			this.modifier = new SubdivisionModifier( this.baseMesh.geometry as THREE.Geometry, this.data.levels );

			this.sharpenEdges( this.data.edgeSharpness );

			// Calculate subdivision.
			this.modifier.modify();

			// Copy mesh to this entity which will hold the subdivided object.
			this.subdivMesh = new AFRAME.THREE.Mesh( this.modifier.geometry );

			// Get transformation of mesh relative to the root element
			// (Usually no translation. Sometimes a gltf export creates one though.)
			const matrix = this.baseMesh.matrixWorld;
			const inverseThisMatrix = new AFRAME.THREE.Matrix4();
			inverseThisMatrix.getInverse(this.parentEl.object3D.matrixWorld);
			matrix.premultiply(inverseThisMatrix);

			// Set transform members using calculated matrix. (If we switch to disabling autoUpdate, we can assign the matrix directly.)
			matrix.decompose(this.subdivMesh.position, this.subdivMesh.quaternion, this.subdivMesh.scale);

			// Base mesh is now the frame. Display as wireframe, and make mesh transparent so raycasting still works.
			const geo = new AFRAME.THREE.EdgesGeometry( this.baseMesh.geometry, 1 );
			const mat = new AFRAME.THREE.LineBasicMaterial( { color: 0xdddddd, linewidth: 1 } );
			this.wireObject = new AFRAME.THREE.LineSegments( geo, mat );
			matrix.decompose(this.wireObject.position, this.wireObject.quaternion, this.wireObject.scale);

			this.baseMesh.material = new AFRAME.THREE.MeshBasicMaterial();
			this.baseMesh.material.visible = false;

			this.parentEl.classList.remove('hoverable');
			this.parentEl.classList.add('hoverable-base');

			this.parentEl.addState(HAROLD.States.modified);

			this.el.setObject3D('mesh', this.subdivMesh);
			this.el.components['grid-mat'].applyToMesh();

			window.setTimeout(() => {
				(this.el.querySelector('.edges') as AFrame.Entity).setObject3D('mesh', this.wireObject);
			}, 0);
		}
	},

	updateWireframe: function(vertexIds) {
		const geo = new AFRAME.THREE.EdgesGeometry( this.baseMesh.geometry, 1 );

		this.wireObject.geometry = geo;

		this.updateSubdivision(vertexIds);
	},

	updateSubdivision: function(vertexIds) {
		this.modifier.update(vertexIds);
	},

	sharpenEdges: function(sharpness: number) {
		for ( const key in this.modifier._baseStructure.edges ) {
			const edge: StructureEdge = this.modifier._baseStructure.edges[key];

			if (edge.faces.length === 1 ) {
				edge.sharpness = sharpness;

			} else if (edge.faces.length === 2) {
				const dihedral = edge.faces[0].normal.angleTo(edge.faces[1].normal);

				// Angle of more than 5 degrees.
				if (dihedral > 0.087 ) {
					edge.sharpness = sharpness;
				}
			}
		}
	}
};

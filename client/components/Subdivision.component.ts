import { SubdivisionModifier } from '../lib/SubdivisionModifier';
import { htmlToElement } from '../tools';

export interface SubdivisionComp extends AFrame.Component {
	data: {
		levels: number;
		showWire: boolean;
		edgeSharpness: number;
	};
	baseMesh: THREE.Mesh;
	subdivMesh: THREE.Mesh;
	edges: THREE.LineSegments;
	modifier: SubdivisionModifier;

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
				this.edges.visible = true;
				(this.subdivMesh.material as THREE.Material).transparent = true;
				(this.subdivMesh.material as THREE.Material).opacity = 0.5;

			} else {
				this.edges.visible = false;
				(this.subdivMesh.material as THREE.Material).opacity = 1;
				(this.subdivMesh.material as THREE.Material).transparent = false;
			}
		}
	},

	reset: function(keepEdgeSharpness) {
		this.modifier.init(keepEdgeSharpness);

		this.modifier.modify();

		this.subdivMesh.geometry = this.modifier.geometry;
	},

	init: function() {
		// Look for a mesh to use as the base.
		this.el.object3D.traverse((object) => {
			if (!this.baseMesh && object instanceof AFRAME.THREE.Mesh) {
				this.baseMesh = object;
			}
		});

		if (this.baseMesh) {
			// Initialize subdivision modifier.
			this.modifier = new SubdivisionModifier( this.baseMesh.geometry as THREE.Geometry, this.data.levels );

			this.sharpenEdges( this.data.edgeSharpness );

			// Calculate subdivision.
			this.modifier.modify();

			// Copy mesh to a child entity which will hold the subdivided object.
			this.subdivMesh = new AFRAME.THREE.Mesh( this.modifier.geometry );

			// Get transformation of mesh relative to the root element
			// (Usually no translation. Sometimes a gltf export creates one though.)
			const matrix = this.baseMesh.matrixWorld;
			const inverseThisMatrix = new AFRAME.THREE.Matrix4();
			inverseThisMatrix.getInverse(this.el.object3D.matrixWorld);
			matrix.premultiply(inverseThisMatrix);

			// Set transform members using calculated matrix. (If we switch to disabling autoUpdate, we can assign the matrix directly.)
			matrix.decompose(this.subdivMesh.position, this.subdivMesh.quaternion, this.subdivMesh.scale);

			const subdivEl = htmlToElement<AFrame.Entity>(`
				<a-entity
					class="hoverable-main modified subdivision collidable env-world"
					position="0 0 0" rotation="0 0 0" scale="1 1 1"
					grid-mat="opacity: 0.5"
				</a-entity>
			`);

			this.el.appendChild(subdivEl);

			subdivEl.setObject3D('mesh', this.subdivMesh);

			// Base mesh is now the frame. Display as wireframe, and make mesh transparent so raycasting still works.

			const geo = new AFRAME.THREE.EdgesGeometry( this.baseMesh.geometry, 1 ); // or WireframeGeometry( geometry ) for all triangles.
			const mat = new AFRAME.THREE.LineBasicMaterial( { color: 0xdddddd, linewidth: 1 } );
			this.edges = new AFRAME.THREE.LineSegments( geo, mat );
			matrix.decompose(this.edges.position, this.edges.quaternion, this.edges.scale);

			const wireEl = htmlToElement<AFrame.Entity>(`
				<a-entity
					class="edges"
					position="0 0 0" rotation="0 0 0" scale="1 1 1"
				</a-entity>
			`);

			this.el.appendChild(wireEl);

			wireEl.setObject3D('edges', this.edges);

			this.baseMesh.material = new AFRAME.THREE.MeshBasicMaterial();
			this.baseMesh.material.visible = false;

			this.el.classList.remove('hoverable');
			this.el.classList.add('hoverable-base');

			this.el.addState(HAROLD.States.modified);
		}
	},

	updateWireframe: function(vertexIds) {
		const geo = new AFRAME.THREE.EdgesGeometry( this.baseMesh.geometry, 1 );

		this.edges.geometry = geo;

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

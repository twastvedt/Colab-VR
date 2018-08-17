import { SubdivisionModifier } from '../lib/SubdivisionModifier';
import { htmlToElement } from '../tools';


interface SubdivisionModifier {
	new(subdivisions: number): SubdivisionModifier;

	modify(geometry: THREE.Geometry | THREE.BufferGeometry): THREE.Geometry;

	subdivisions: number;
}

export interface SubdivisionComp extends AFrame.Component {
	data: {
		levels: number;
		showWire: boolean;
	};
	baseMesh: THREE.Mesh;
	subdivMesh: THREE.Mesh;
	edges: THREE.LineSegments;
	modifier: SubdivisionModifier;

	updateWireframe: (this: SubdivisionComp) => void;
	updateSubdivision: (this: SubdivisionComp) => void;
}

AFRAME.registerComponent<SubdivisionComp>('subdivision', {
	schema: {
		levels: { default: 2 },
		showWire: { default: false }
	},

	update: function(oldData) {
		const data = this.data;

		if (data.levels !== oldData.levels) {
			this.modifier.subdivisions = data.levels;

			this.subdivMesh.geometry = this.modifier.modify( this.baseMesh.geometry );
		}

		if (data.showWire !== oldData.showWire) {
			this.edges.visible = data.showWire;
		}
	},

	init: function() {
		if (this.el.object3D.children[0] instanceof AFRAME.THREE.Mesh) {
			this.baseMesh = this.el.object3D.children[0] as THREE.Mesh;

			// Initialize subdivision modifier.
			this.modifier = (new SubdivisionModifier( this.data )) as any;

			// Copy mesh to a child entity which will hold the subdivided object.
			this.subdivMesh = this.baseMesh.clone();

			const subdivEl = htmlToElement<AFrame.Entity>(`
				<a-entity
					class="main modified subdivision hoverable collidable env-world"
					position="0 0 0" rotation="0 0 0" scale="1 1 1"
				</a-entity>
			`);

			this.el.appendChild(subdivEl);

			subdivEl.setObject3D('subdivision', this.subdivMesh);

			// Base mesh is now the frame. Display as wireframe, and make mesh transparent so raycasting still works.

			const geo = new AFRAME.THREE.EdgesGeometry( this.baseMesh.geometry, 1 ); // or WireframeGeometry( geometry ) for all triangles.
			const mat = new AFRAME.THREE.LineBasicMaterial( { color: 0xdddddd, linewidth: 1 } );
			this.edges = new AFRAME.THREE.LineSegments( geo, mat );

			const wireEl = htmlToElement<AFrame.Entity>(`
				<a-entity
					class="edges"
					position="0 0 0" rotation="0 0 0" scale="1 1 1"
				</a-entity>
			`);

			this.el.appendChild(wireEl);

			wireEl.setObject3D('edges', this.edges);

			this.baseMesh.material = new AFRAME.THREE.MeshBasicMaterial({
				transparent: true,
				opacity: 0
			});

			this.el.classList.add('base');
		}
	},

	updateWireframe: function() {
		const geo = new AFRAME.THREE.EdgesGeometry( this.baseMesh.geometry, 1 ); // or WireframeGeometry( geometry ) for all triangles.

		this.edges.geometry = geo;
	},

	updateSubdivision: function() {
		this.subdivMesh.geometry = this.modifier.modify( this.baseMesh.geometry );
	}
});

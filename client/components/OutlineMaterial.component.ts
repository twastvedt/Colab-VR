AFRAME = require('aframe');

import { htmlToElement } from '../tools';


interface OutlineMatComp extends AFrame.Component {
	data: {
		color: string;
		width: number;
	};

	material: THREE.ShaderMaterial;
	outlineEl: AFrame.Entity;

	applyOutline: (this: OutlineMatComp) => boolean;
	dilateGeo: (geometry: THREE.Geometry, width: number) => void;
}

AFRAME.registerComponent<OutlineMatComp>('outline-mat', {
	schema: {
		width: { default: 0.01 },
		color: { type: 'color', default: '#000000' }
	},

	dependencies: [ 'rotation', 'scale' ],

	init: function() {
		if (!this.applyOutline()) {
			this.el.addEventListener('model-loaded', () => this.applyOutline());
		}
	},

	applyOutline: function() {
		if (this.el.object3D.children.length > 0) {
			this.outlineEl = htmlToElement<AFrame.Entity>('<a-entity position="0 0 0" rotation="0 0 0" scale="1 1 1"></a-entity>');

			const outline = this.el.object3D.clone(),
			outlineMat = new AFRAME.THREE.MeshBasicMaterial({ color: this.data.color, side: AFRAME.THREE.BackSide }),
			that = this;

			outline.setRotationFromEuler(new AFRAME.THREE.Euler(0, 0, 0));
			outline.scale.set(1, 1, 1);
			outline.position.set(0, 0, 0);
			outline.visible = true;

			outline.traverse((node: THREE.Mesh) => {
				if (node.isMesh) {
					if ((node.geometry as any).isBufferGeometry) {
						node.geometry = new AFRAME.THREE.Geometry().fromBufferGeometry( node.geometry as THREE.BufferGeometry );
					}

					that.dilateGeo(node.geometry as THREE.Geometry, that.data.width);
					node.material = outlineMat;
				}
			});

			this.el.appendChild(this.outlineEl);

			window.setTimeout(() => {
				that.outlineEl.object3D.add(outline);
			}, 0);

			return true;
		}
		return false;
	},

	dilateGeo: function(geometry, length) {
		// https://github.com/jeromeetienne/threex.geometricglow/blob/master/threex.dilategeometry.js

		// gather vertexNormals from geometry.faces
		const vertexNormals	= new Array(geometry.vertices.length);

		geometry.faces.forEach(function(face) {
			if ( face instanceof AFRAME.THREE.Face3 ) {
				vertexNormals[face.a] = face.vertexNormals[0];
				vertexNormals[face.b] = face.vertexNormals[1];
				vertexNormals[face.c] = face.vertexNormals[2];
			} else {
				console.assert(false);
			}
		});
		// modify the vertices according to vertexNormal
		geometry.vertices.forEach(function(vertex, idx) {
			const vertexNormal = vertexNormals[idx];
			vertex.x += vertexNormal.x * length;
			vertex.y += vertexNormal.y * length;
			vertex.z += vertexNormal.z * length;
		});
	}
});

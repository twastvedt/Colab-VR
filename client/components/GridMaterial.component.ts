AFRAME = require('aframe');

import { GridMatSys } from '../systems/GridMaterial.system';

interface GridMatComp extends AFrame.Component {
	data: {
		map: string;
		opacity: number;
		diffuse: string;
		metalness: number;
		roughness: number;
		// texture parameters
		offset: { x: number, y: number };
		repeat: { x: number, y: number };
	};

	system: GridMatSys;

	material: THREE.ShaderMaterial;

	applyToMesh: () => void;
}

export const GridMatCompDef: AFrame.ComponentDefinition<GridMatComp> = {
	schema: {
		map: { type: 'map' },
		opacity: { default: 1 },
		diffuse: { type: 'color', default: '#EFEFEF' },
		metalness: { default: 0 },
		roughness: { default: 0.2 },
		offset: { type: 'vec2', default: {x: 0, y: 0} },
		repeat: { type: 'vec2', default: {x: 1, y: 1} }
	},

	dependencies: [ 'rotation', 'scale' ],

	init: function() {

		const uniforms = AFRAME.THREE.UniformsUtils.clone( this.system.shader.uniforms );

		uniforms['normalWorldMatrix'] = { value: new AFRAME.THREE.Matrix3().getNormalMatrix( this.el.object3D.matrixWorld ) };
		uniforms['gridMap'] = { value: this.system.gridMap };

		this.material = new AFRAME.THREE.ShaderMaterial({
			name: 'Global Grid',
			uniforms: uniforms,
			vertexShader: this.system.shader.vertexShader,
			fragmentShader: this.system.shader.fragmentShader,
			fog: false,
			lights: true
		});

		this.applyToMesh();
		this.el.addEventListener('model-loaded', () => this.applyToMesh());

		const that = this;
		window.setTimeout(() => {
			that.material.uniforms['normalWorldMatrix'].value = new AFRAME.THREE.Matrix3().getNormalMatrix( that.el.object3D.matrixWorld );
		}, 0);
	},

	update: function(oldData) {
		const diff = AFRAME.utils.diff(oldData, this.data),
			uniforms = this.material.uniforms;

		for (let key in diff) {
			switch (key) {
				case 'map':
					let map: THREE.Texture = undefined;

					if (this.data.map) {
						map = this.system.loader.load(this.data.map);
						this.material.defines['USE_MAP'] = '';
					} else {
						delete this.material.defines['USE_MAP'];
					}

					uniforms['map'].value = map;
					break;

				case 'diffuse':
					uniforms['diffuse'].value = new AFRAME.THREE.Color( this.data.diffuse );
					break;

				case 'metalness':
				case 'roughness':
					uniforms[key].value = this.data[key];
					break;

				case 'opacity':
					uniforms['opacity'].value = this.data.opacity;
					if (this.data.opacity < 1) {
						this.material.transparent = true;
					} else {
						this.material.transparent = false;
					}
					break;

				case 'repeat':
				case 'offset':
					if (uniforms['map'].value) {
						uniforms['map'].value[key] = this.data[key];
					}

					break;

				default:
					console.log(`Unhandled property: ${key}.`);
			}
		}
	},

	applyToMesh: function() {
		const mesh = this.el.getObject3D('mesh');
		const that = this;

		if (mesh) {
			mesh.traverse((node: any) => {
				if (node.isMesh) {
					node.material = that.material;
				}
			});
		}
	}
};

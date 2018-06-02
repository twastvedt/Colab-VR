AFRAME = require('aframe');

import { GridMat, GridMatSys } from '../systems/GridMaterial.system';

interface GridMaterial extends AFrame.Component {
	data: {
		texture: THREE.Texture;
		opacity: number;
		useTex: number;
		color: string;
		// texture parameters
		offset: { x: number, y: number };
		repeat: { x: number, y: number };
	};

	system: GridMat;

	gridMaterial: THREE.ShaderMaterial;

	applyToMesh: (this: GridMaterial) => void;
}

export const GridMaterial: AFrame.ComponentDefinition<GridMaterial> = {
	schema: {
		texture: { type: 'map' },
		opacity: { default: 1 },
		useTex: { default: 0 },
		color: { type: 'color', default: 'white' },
		offset: { type: 'vec2', default: {x: 0, y: 0} },
		repeat: { type: 'vec2', default: {x: 1, y: 1} }
	},

	init: function() {
		const uniforms = AFRAME.THREE.UniformsUtils.merge([
			//AFRAME.THREE.UniformsLib['lights'],
			{
				gridTex: { value: this.system.gridMap },
				gridSize: { value: this.system.data.gridSize },
				gridStrength: { value: this.system.data.gridStrength },
				texture: { value: this.data.texture },
				useTex: { value: this.data.useTex },
				color: { value: this.data.color },
				repeat: { value: this.data.repeat },
				offset: { value: this.data.offset }
			}
		]);

		this.gridMaterial = new AFRAME.THREE.ShaderMaterial({
			uniforms: {
				gridTex: { value: this.system.gridMap },
				gridSize: { value: this.system.data.gridSize },
				gridStrength: { value: this.system.data.gridStrength },
				gridColor: { value: new AFRAME.THREE.Color( this.system.data.gridColor ) },
				texture: { value: this.data.texture },
				useTex: { value: this.data.useTex },
				color: { value: new AFRAME.THREE.Color( this.data.color ) },
				opacity: { value: this.data.opacity },
				repeat: { value: this.data.repeat },
				offset: { value: this.data.offset }
			},
			vertexShader: this.system.gridVert,
			fragmentShader: this.system.gridFrag
		});

		this.applyToMesh();
		this.el.addEventListener('model-loaded', () => this.applyToMesh());
	},

	applyToMesh: function() {
		const mesh = this.el.getObject3D('mesh'),
			that = this;

		if (mesh) {
			mesh.traverse((node: any) => {
				if (node.isMesh) {
					node.material = that.gridMaterial;
				}
			});
		}
	}
};

import { shaderParse } from '../tools';

let gridVert = require('../shaders/grid.vert.glsl'),
	gridFrag = require('../shaders/grid.frag.glsl');

export interface GridMatSys extends AFrame.System {
	data: {
		gridSize: number,
		gridStrength: number,
		gridColor: string
	};
	shader: {
		uniforms: any;
		defines: any;
		vertexShader: string;
		fragmentShader: string;
	};
	loader: THREE.TextureLoader;
	gridMap: THREE.Texture;
}

AFRAME.registerSystem<GridMatSys>('grid-mat', {
	schema: {
		gridSize: { default: 1 },
		gridStrength: { default: 0.25 },
		gridColor: { type: 'color', default: 'black' }
	},

	init: function () {
		this.loader = new AFRAME.THREE.TextureLoader();
		this.gridMap = this.loader.load( 'assets/grid-128.png' );

		this.gridMap.wrapS = this.gridMap.wrapT = AFRAME.THREE.RepeatWrapping;

		gridVert = shaderParse(gridVert);
		gridFrag = shaderParse(gridFrag);

		const uniforms = AFRAME.THREE.UniformsUtils.merge([
			AFRAME.THREE.UniformsLib[ 'common' ],
			AFRAME.THREE.UniformsLib[ 'envmap' ],
			AFRAME.THREE.UniformsLib[ 'aomap' ],
			AFRAME.THREE.UniformsLib[ 'lightmap' ],
			AFRAME.THREE.UniformsLib[ 'emissivemap' ],
			AFRAME.THREE.UniformsLib[ 'bumpmap' ],
			AFRAME.THREE.UniformsLib[ 'normalmap' ],
			AFRAME.THREE.UniformsLib[ 'displacementmap' ],
			AFRAME.THREE.UniformsLib[ 'roughnessmap' ],
			AFRAME.THREE.UniformsLib[ 'metalnessmap' ],
			AFRAME.THREE.UniformsLib[ 'fog' ],
			AFRAME.THREE.UniformsLib[ 'lights' ]
		]);

		Object.assign(uniforms, {
			emissive: { value: new AFRAME.THREE.Color( 0x000000 ) },
			roughness: { value: 0.5 },
			metalness: { value: 0.5 },
			envMapIntensity: { value: 1 },
			gridMap: { value: this.gridMap },
			gridSize: { value: this.data.gridSize },
			gridStrength: { value: this.data.gridStrength },
			gridColor: { value: new AFRAME.THREE.Color( this.data.gridColor ) }
		});

		const defines = {
		};

		this.shader = {
			uniforms: uniforms,
			defines: defines,
			vertexShader: gridVert,
			fragmentShader: gridFrag
		};
	}
});

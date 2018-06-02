AFRAME = require('aframe');

const gridVert = require('../shaders/grid.vert.glsl');
const gridFrag = require('../shaders/grid.frag.glsl');

export interface GridMat extends AFrame.System {
	data: {
		gridSize: number,
		gridStrength: number,
		gridColor: string
	};
	gridMap: THREE.Texture;
	gridVert: string;
	gridFrag: string;
}

export const GridMatSys: AFrame.SystemDefinition<GridMat> = {
	schema: {
		gridSize: { default: 1 },
		gridStrength: { default: 0.25 },
		gridColor: { type: 'color', default: 'black' }
	},

	init: function () {
		const loader = new AFRAME.THREE.TextureLoader();
		this.gridMap = loader.load( '../assets/grid-64.png' );

		this.gridMap.wrapS = this.gridMap.wrapT = AFRAME.THREE.RepeatWrapping;

		this.gridVert = gridVert;
		this.gridFrag = gridFrag;
	}
};

AFRAME = require('aframe');

const gridVert = require('../shaders/grid.vert.glsl');
const gridFrag = require('../shaders/grid.frag.glsl');

export const GridMaterial: AFrame.ShaderDefinition = {
  schema: {
    // the texture source
    src: {type: 'map', is: 'uniform'},
    useTex: {type: 'int', default: 0, is: 'uniform'},
    color: {type: 'color', default: 'white', is: 'uniform'},
    // texture parameters
    offset: {type: 'vec2', default: {x: 0, y: 0}, is: 'uniform'},
    repeat: {type: 'vec2', default: {x: 1, y: 1}, is: 'uniform'}
  },
  vertexShader: gridVert,
  fragmentShader: gridFrag
};

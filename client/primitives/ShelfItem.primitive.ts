AFRAME = require('aframe');


export const ShelfItemPrimDef: AFrame.PrimitiveDefinition = {
	defaultComponents: {
		geometry: {
			primitive: 'plane',
			width: 1.25,
			height: 1.25
		},
		material: {
			visible: false
		},
		'shelf-item': { }
	}
};

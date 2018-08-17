export const shelfPrimDef: AFrame.PrimitiveDefinition = {
	defaultComponents: {
		geometry: {
			primitive: 'box',
			width: 0.1,
			depth: 0.1,
			height: 0.001
		},
		material: {
			color: '#666'
		},
		shelf: {
			size: 0.1
		}
	},
	mappings: {
		size: 'shelf.size'
	}
};

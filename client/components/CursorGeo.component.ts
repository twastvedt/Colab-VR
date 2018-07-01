AFRAME = require('aframe');

enum CursorStates {
	inactive = 'inactive',
	drawingPlane = 'drawing-plane',
	drawingLine = 'drawing-line'
}

interface CursorGeo extends AFrame.Component {
	data: {
		state: CursorStates
	};
}

export const CursorGeoComp: AFrame.ComponentDefinition<CursorGeo> = {
	/**
	 * Control appearance of dynamic cursor for colab-vr. Needs a better name!
	 * */

	schema: {
		state: {default: CursorStates.inactive}
	},

	updateSchema: function(newData) {

		for (const child of (Array.from(this.el.children))) {
			if (child.id === 'cursor-' + newData.state) {
				child.setAttribute('visible', 'true');
				(child as AFrame.Entity).play();
			} else {
				child.setAttribute('visible', 'false');
				(child as AFrame.Entity).pause();
			}
		}
	}
};

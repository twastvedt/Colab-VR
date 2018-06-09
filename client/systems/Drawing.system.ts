AFRAME = require('aframe');

import { htmlToElement } from "../tools";

import { DrawBoxComp } from "../commands/DrawBox.component";

let cursorLoc: THREE.Vector3,
	cursor: AFrame.Entity,
	tempObjects: AFrame.Entity[] = [];

export interface Drawing extends AFrame.System {
	data: {
	},
	addAnchor: (this: Drawing, loc: THREE.Vector3) => void,
	startCommand: (this: Drawing, comp: AFrame.ComponentDefinition<DrawShape>) => void,
	endCommand: (this: Drawing, comp: AFrame.ComponentDefinition<DrawShape>) => void,
	stopDrawing: (this: Drawing) => void,
	activeObject: AFrame.Entity,
	components: Map<string, AFrame.ComponentDefinition<DrawShape>>
}

export interface DrawShape extends AFrame.Component {
	data: { },
	name: string,
	doStep: (this: DrawShape) => void,
	system: Drawing,
	NAFSchema: any
}

export const DrawingSystem: AFrame.SystemDefinition<Drawing> = {

	schema: {
	},

	init: function() {

		// List of drawing components: [keyboard shortcut, component definition].
		this.components = new Map([
			['b', DrawBoxComp]
		]);

		this.components.forEach((comp, key) => {
			AFRAME.registerComponent(comp.name, comp);

			if (comp.NAFSchema) {
				NAF.schemas.add(comp.NAFSchema);
			}

			Mousetrap.bind(key, () => this.startCommand(comp));
		});

		document.querySelector('a-scene').addEventListener('loaded', function () {
			cursor = document.querySelector('#cursor');
			cursorLoc = cursor.object3D.position;
		});
	},

	startCommand: function(comp) {
		// Initialize current command on cursor.
		console.log(`Start command '${comp.name}'.`);

		cursor.setAttribute(comp.name, {});

		cursor.setAttribute('material', 'color', 'blue');
	},

	endCommand: function(comp) {
		cursor.removeAttribute(comp.name);

		this.stopDrawing();
	},

	stopDrawing: function() {
		tempObjects.forEach((ob) => {
			ob.parentNode.removeChild(ob);
		});

		tempObjects = [];

		cursor.setAttribute('material', 'color', 'gray');
	},

	addAnchor: function(loc) {
		const anchor = htmlToElement<AFrame.Entity>(`<a-entity mixin="draw-anchor" position="${loc.x} ${loc.y} ${loc.z}"></a-entity>`);

		tempObjects.push(this.el.appendChild(anchor));
	}
};

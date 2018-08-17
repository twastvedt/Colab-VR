import { OrderedTickComponent, MakeTickComponent } from '../systems/TickOrder.system';


export interface SnapComp extends OrderedTickComponent {
	data: {
		gridSize: number
	};
	snap: (this: SnapComp) => void;
}

export const snapCompDef: AFrame.ComponentDefinition<SnapComp> = {
	schema: {
		gridSize: {type: 'number', default: 1}
	},

	tick: function() {
		const oldPos = this.el.object3D.position,
			gridSize = this.data.gridSize;

		this.el.object3D.position.set(
			Math.round(oldPos.x / gridSize) * gridSize,
			Math.round(oldPos.y / gridSize) * gridSize,
			Math.round(oldPos.z / gridSize) * gridSize
		);
	}
};

MakeTickComponent(snapCompDef, 400);

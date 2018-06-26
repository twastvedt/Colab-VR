AFRAME = require('aframe');

export interface OrderedTickComponent extends AFrame.Component {
	tickOrder: number;
	tickSystem: TickOrderSys;
}

export interface TickOrderSys extends AFrame.System {
	playComp: (this: TickOrderSys, comp: OrderedTickComponent) => void;
}

export const TickOrderSysDef: AFrame.SystemDefinition<TickOrderSys> = {
	playComp: function(comp) {
		// Add behavior before first tick in list with a larger tickOrder. If none found, add to end.
		const index = this.el.behaviors.tick.indexOf(comp);
		if (index !== -1) { return; }

		if (
			this.el.behaviors.tick.every((c: OrderedTickComponent, i) => {
				if (c.tickOrder > comp.tickOrder) {
					this.el.behaviors.tick.splice(i, 0, comp);
					return false;
				}
				return true;
			}, this)
		) {

			this.el.behaviors.tick.push(comp);

		}
	}
};

AFRAME = require('aframe');

export interface OrderedTickComponent extends AFrame.Component {
	tickOrder: number,
	tickSystem: TickOrderSys
}

export interface TickOrderSys extends AFrame.System {
	playComp: (this: TickOrderSys, comp: OrderedTickComponent) => void
}

export const TickOrderSysDef: AFrame.SystemDefinition<TickOrderSys> = {
	playComp: function(comp) {
		this.el.behaviors.tick.forEach((c: OrderedTickComponent, i) => {
			if (c.tickOrder > comp.tickOrder) {
				this.el.behaviors.tick.splice(i, 0, comp);
				return;
			}
			this.el.behaviors.tick.push(comp);
		});
	}
};

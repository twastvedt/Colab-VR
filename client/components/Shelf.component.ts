export interface ShelfComp extends HAROLD.Component {
	data: {
		size: number;
	};

	observer: MutationObserver;
	spacing: number;
	count: number;

	placeItem: (this: ShelfComp, element: AFrame.Entity, index: number) => void;
	placeItems: (this: ShelfComp) => void;
}

export const shelfCompDef: AFrame.ComponentDefinition<ShelfComp> = {

	schema: {
		size: { default: 1 }
	},

	placeItem: function(element, index) {
		const size = this.data.size;

		element.object3D.scale.setScalar( size );
		element.object3D.position.set( (size + this.spacing) * (index - (this.count - 1) / 2), size / 2, 0 );
	},

	/**
	 * Update positions of child items and stretch the shelf to fit.
	 */
	placeItems: function() {
		this.count = this.el.children.length;

		for (let i = 0; i < this.count; i++) {
			const element = this.el.children.item(i) as AFrame.Entity;

			if (element.hasLoaded) {
				this.placeItem(element, i);
			} else {
				element.addEventListener('loaded', () => this.placeItem(element, i));
			}
		}

		this.el.setAttribute('geometry', 'width', this.count * this.data.size + (this.count - 1) * this.spacing + this.data.size );
	},

	init: function() {
		this.spacing = this.data.size * 0.25;

		// Watch for changes to this element.
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes.length || mutation.removedNodes.length) {
					this.placeItems();
				}
			}, this);
		});

		this.el.setAttribute('geometry', 'depth', this.data.size );
	},

	pause: function() {
		this.observer.disconnect();
	},

	play: function () {
		this.placeItems();

		this.observer.observe(this.el, {childList: true, subtree: false});
	}
};

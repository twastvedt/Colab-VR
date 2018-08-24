import { UISystem } from '../systems/UI.system';


let uiSystem: UISystem;

export interface HaroldObjectComp extends HAROLD.Component {
	data: { };

	isFocused: boolean;
}

export const haroldObjectCompDef: AFrame.ComponentDefinition<HaroldObjectComp> = {
	schema: { },

	update: function(oldData) {
		const diff = AFRAME.utils.diff(oldData, this.data);

		for (let key in diff) {
			switch (key) {

			}
		}
	},

	init: function() {
		uiSystem = this.el.sceneEl.systems.ui;

		this.el.addEventListener('stateadded', (e) => {
			switch (e.detail as any as HAROLD.States) {
				case HAROLD.States.hovered:
					if (this.el.is(HAROLD.States.modified)) {
						if (uiSystem.d.target === 'base') {
							this.el.setAttribute('subdivision', 'showWire', true);
						}
					}

					break;

				case HAROLD.States.baseEditing:
					if (this.el.is(HAROLD.States.modified)) {
						if (uiSystem.d.target === 'base') {
							this.el.setAttribute('subdivision', 'showWire', true);
						}
					}

					break;
			}
		});

		this.el.addEventListener('stateremoved', (e) => {
			switch (e.detail as any as HAROLD.States) {
				case HAROLD.States.hovered:
					if (this.el.is(HAROLD.States.modified) && !this.el.is(HAROLD.States.baseEditing)) {
						if (uiSystem.d.target === 'base') {
							this.el.setAttribute('subdivision', 'showWire', false);
						}
					}

					break;

				case HAROLD.States.baseEditing:
					if (this.el.is(HAROLD.States.modified) && !this.el.is(HAROLD.States.hovered)) {
						if (uiSystem.d.target === 'base') {
							this.el.setAttribute('subdivision', 'showWire', false);
						}
					}

					break;
			}
		});
	}
};

import { UISystem } from '../systems/UI.system';


let uiSystem: UISystem;

export interface HaroldObjectComp extends HAROLD.Component {
	data: { };

	handleEvent: (this: HaroldObjectComp, e: AFrame.DetailEvent<HAROLD.States>) => void;
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

	handleEvent: function(e) {
		// Currently this only shows the base wireframe when editing and hovering over subdivided entities.
		// If those entities are owned by someone else, or the command isn't targeting the base object, don't show anything.
		if (!this.el.classList.contains('editable') || uiSystem.d.target !== 'base') return;

		switch (e.type) {
			case 'stateadded':
				if (this.el.is(HAROLD.States.modified)) {
					(this.el.querySelector('.subdivision') as AFrame.Entity).setAttribute('subdivision', 'showWire', true);
				}

				break;

			case 'stateremoved':
				switch (e.detail) {
					case HAROLD.States.hovered:
						if (this.el.is(HAROLD.States.modified)
								&& !this.el.is(HAROLD.States.baseEditing)) {

							(this.el.querySelector('.subdivision') as AFrame.Entity).setAttribute('subdivision', 'showWire', false);
						}

						break;

					case HAROLD.States.baseEditing:
						if (this.el.is(HAROLD.States.modified)
								&& !this.el.is(HAROLD.States.hovered)) {

							(this.el.querySelector('.subdivision') as AFrame.Entity).setAttribute('subdivision', 'showWire', false);
						}

						break;
				}

				break;
		}
	},

	init: function() {
		uiSystem = this.el.sceneEl.systems.ui;

		this.el.addEventListener('stateadded', this);
		this.el.addEventListener('stateremoved', this);
	}
};

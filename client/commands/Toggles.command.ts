import { CommandComponent } from './CommandDecorators';
import { LockedState } from '../components/DynamicCursor.component';



() => {
	cursor.setAttribute(
		'dynamic-cursor',
		'locked',
		cursor.getAttribute('dynamic-cursor').locked === LockedState.line ? LockedState.none : LockedState.line
	);
};

Mousetrap.bind( 'p', () => {
	cursor.setAttribute(
		'dynamic-cursor',
		'locked',
		cursor.getAttribute('dynamic-cursor').locked === LockedState.plane ? LockedState.none : LockedState.plane
	);
});

Mousetrap.bind('space', () => {
	if (this.el.isPlaying) {
		this.el.pause();
	}
	else {
		this.el.play();
	}
});

export const DrawBoxCompDef: AFrame.ComponentDefinition<CommandComponent> = {
	init: function() {
		cursorPos = this.el.object3D.position;
		newParent = undefined;
	},

	doStep: function(step) {
		switch (step) {
			case 0:
				this.system.addAnchor(cursorPos);

				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.plane);

				newParent = htmlToElement<AFrame.Entity>(`
					<a-entity
						class="drawn static collidable"
						position="0 0 0" rotation="0 0 0" scale="0 0 0"
						networked="template:#box-template">
					</a-entity>
				`);

				this.el.sceneEl.appendChild(newParent);

				startPoint = cursorPos.clone();

				break;

			case 1:
				this.el.setAttribute('dynamic-cursor', 'locked', LockedState.line);

				newBox = newParent.children[0] as AFrame.Entity;

				break;

			case 2:
				newBox.setAttribute('grid-mat', 'opacity', 1);
				newBox.setAttribute('shadow', {
					cast: true,
					receive: true
				});

				newParent = undefined;

				this.system.endCommand( this.name );
		}
	},

	remove: function() {
		// Remove temp element if present.
		if (newParent) {
			newParent.parentNode.removeChild(newParent);
		}
	},

	tick: function() {
		if (newParent && newParent.object3D) {
			tempVec = cursorPos.clone().add(startPoint).divideScalar(2);
			newParent.object3D.position.set(tempVec.x, tempVec.y, tempVec.z);

			tempVec.sub(startPoint).multiplyScalar(2);
			newParent.object3D.scale.set(Math.max(0.01, Math.abs(tempVec.x)), Math.max(0.01, Math.abs(tempVec.y)), Math.max(0.01, Math.abs(tempVec.z)));
		}
	}
};

MakeClickSequence(DrawBoxCompDef);

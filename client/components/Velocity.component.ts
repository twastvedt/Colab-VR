AFRAME = require('aframe');


const obstacleClass = 'collidable',
	rayCaster = new AFRAME.THREE.Raycaster(),
	tempVec2 = new AFRAME.THREE.Vector3(),
	tempVec = new AFRAME.THREE.Vector3(),
	velocity = new AFRAME.THREE.Vector3(),
	collisionResults: THREE.Intersection[] = [],
	collisionFaces = new Set(),
	quaternion = new AFRAME.THREE.Quaternion();

let sceneEl: AFrame.Scene;

interface VelocityComp extends AFrame.Component {
	data: AFrame.Coordinate;

	collide: boolean;
	objects: THREE.Object3D[];
	collisionOb: THREE.Object3D;
	collisionVertices: THREE.Vertex[];
	collisionNormal: THREE.Vector3;
	observer: MutationObserver;

	slide: (this: VelocityComp) => void;
}

/**
 * A bit of a hack, to add simple collision to aframe-extras/movement-controls. If the 'velocity' component is present, movement-controls
 * sets its data rather than setting the entity's position. Normally 'velocity' is provided by aframe-physics, but here we co-opt that connection
 * to run simple collision detection. One fallout of this setup is that we have to hard code all settings since the schema needs to be a single vec3.
 */
export const VelocityCompDef: AFrame.ComponentDefinition<VelocityComp> = {
	schema: { type: 'vec3' },

	init: function() {
		this.collisionOb = this.el.querySelector<AFrame.Entity>('.collision').object3D;
		this.collisionVertices = ((this.collisionOb.children[0] as THREE.Mesh).geometry as THREE.Geometry).vertices;

		// Ideally 'collide' and 'obstacleClass' would be part of the schema.
		// Would need to fork aframe-extras to support a velocity component with a multi-property schema.
		this.collide = true;

		sceneEl = document.querySelector('a-scene');

		// Watch for changes to the scene and add them to the list of collision objects if they have the right class.
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes.length) {
					mutation.addedNodes.forEach((node: AFrame.Entity) => {
						if (node.classList.contains(obstacleClass) && node.object3D) {
							this.objects.push(node.object3D);
						}
					}, this);
				}
			}, this);
		});
	},

	tick: function(t, dt) {
		const data = this.data;

		if (data.x !== 0 || data.y !== 0 || data.z !== 0) {

			velocity.set( data.x * dt / 1000, data.y * dt / 1000, data.z * dt / 1000 );

			if (this.collide) {
				this.slide();
			}

			const position = this.el.object3D.position;

			position.x += velocity.x;
			position.y += velocity.y;
			position.z += velocity.z;

			data.x = 0;
			data.y = 0;
			data.z = 0;
		}
	},

	slide: function() {
		const lenSquared = velocity.lengthSq();
		collisionFaces.clear();

		// For accurate raycaster distance calculation.
		tempVec2.copy( velocity ).normalize();

		for (let v of this.collisionVertices) {
			tempVec.copy( v );
			tempVec.applyMatrix4(this.collisionOb.matrixWorld);

			rayCaster.set( tempVec, tempVec2 );
			collisionResults.length = 0;
			rayCaster.intersectObjects( this.objects, true, collisionResults );

			const result = collisionResults[0];

			if ( result !== undefined && Math.pow(result.distance, 2) <= lenSquared ) {

				const faceId = result.object.id.toString() + result.faceIndex;

				if (!collisionFaces.has( faceId ) ) {
					// Only adjust velocity if another vertex hasn't already collided with this face.
					collisionFaces.add( faceId );

					// Project velocity to plane of colliding face.
					tempVec.copy( result.face.normal );
					result.object.getWorldQuaternion( quaternion );
					tempVec.applyQuaternion( quaternion );

					velocity.sub( tempVec.multiplyScalar( velocity.dot( tempVec )));
				}
			}
		}
	},

	pause: function() {
		this.observer.disconnect();
	},

	play: function () {
		this.objects = [];

		// Update list of collidable objects.
		let els = document.querySelectorAll('.' + obstacleClass) as NodeListOf<AFrame.Entity>;

		els.forEach(el => {
			this.objects.push( el.object3D );
		});

		this.observer.observe(sceneEl, {childList: true, subtree: true});
	}
};

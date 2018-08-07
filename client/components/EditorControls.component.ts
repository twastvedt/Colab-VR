import { UISystem, State } from '../systems/UI.system';


let uiSystem: UISystem;

interface EditorControls extends AFrame.Component {
	data: {
		center: AFrame.Coordinate;
		panSpeed: number;
		zoomSpeed: number;
		rotationSpeed: number;
	};

	controls: EditorControls2;
}

AFRAME.registerComponent<EditorControls>('editor-controls', {

	schema: {
		center: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
		panSpeed: {default: 0.001},
		zoomSpeed: {default: 0.001},
		rotationSpeed: {default: 0.005}
	},

	init: function() {
		uiSystem = this.el.sceneEl.systems['ui'] as UISystem;

		this.controls = new EditorControls(this.el.object3D as any);
	},

	play: function() {
		this.controls.enabled = true;

		this.controls.center.copy( this.el.object3D.position );
		this.controls.center.z += 5;
	},

	pause: function() {
		this.controls.enabled = false;
	},

	update: function() {
		this.controls.panSpeed = this.data.panSpeed;
		this.controls.zoomSpeed = this.data.zoomSpeed;
		this.controls.rotationSpeed = this.data.rotationSpeed;
	}
});


/* Modified from three/examples/js/controls/EditorControls.js */

const THREE = AFRAME.THREE;

declare class EditorControls2 extends THREE.EventDispatcher {

	constructor(object: THREE.Camera, domElement?: HTMLElement);

	enabled: boolean;
	center: THREE.Vector3;
	panSpeed: number;
	zoomSpeed: number;
	rotationSpeed: number;

	focus(target: THREE.Object3D, frame: boolean): void;

	pan(delta: THREE.Vector3): void;

	zoom(delta: THREE.Vector3): void;

	rotate(delta: THREE.Vector3): void;

	dispose(): void;
}


/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

const EditorControls = function ( object: THREE.Object3D, domElement?: Node ) {

	domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;
	this.center = new THREE.Vector3();
	this.panSpeed = 0.001;
	this.zoomSpeed = 0.001;
	this.rotationSpeed = 0.005;

	// internals

	const scope = this,
		vector = new THREE.Vector3(),

		STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	let state = STATE.NONE;

	const center = this.center,
		normalMatrix = new THREE.Matrix3(),
		pointer = new THREE.Vector2(),
		pointerOld = new THREE.Vector2(),
		spherical = new THREE.Spherical(),

	// events

		changeEvent = { type: 'change' };

	this.focus = function ( target: THREE.Object3D ) {

		const box = new THREE.Box3().setFromObject( target );
		object.lookAt( box.getCenter(center) );
		object.rotateY( Math.PI );

		scope.dispatchEvent( changeEvent );

	};

	this.pan = function ( delta: THREE.Vector3 ) {

		const distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * scope.panSpeed );
		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		object.position.add( delta );
		center.add( delta );

		scope.dispatchEvent( changeEvent );

	};

	this.zoom = function ( delta: THREE.Vector3 ) {

		const distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * scope.zoomSpeed );

		if ( delta.length() > distance ) return;

		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		object.position.add( delta );

		scope.dispatchEvent( changeEvent );

	};

	this.rotate = function ( delta: THREE.Vector3 ) {

		vector.copy( object.position ).sub( center );

		spherical.setFromVector3( vector );

		spherical.theta += delta.x;
		spherical.phi += delta.y;

		spherical.makeSafe();

		vector.setFromSpherical( spherical );

		object.position.copy( center ).add( vector );

		object.lookAt( center );
		object.rotateY( Math.PI );

		scope.dispatchEvent( changeEvent );

	};

	// mouse

	function onMouseDown( event: MouseEvent ) {

		if ( scope.enabled === false ) return;

		if ( event.button === 0 ) {

			state = STATE.ROTATE;

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

		} else if ( event.button === 2 ) {

			state = STATE.PAN;

		}

		pointerOld.set( event.clientX, event.clientY );

		domElement.addEventListener( 'mousemove', onMouseMove, false );
		domElement.addEventListener( 'mouseup', onMouseUp, false );
		domElement.addEventListener( 'mouseout', onMouseUp, false );
		domElement.addEventListener( 'dblclick', onMouseUp, false );

	}

	function onMouseMove( event: MouseEvent ) {

		if ( scope.enabled === false ) return;

		pointer.set( event.clientX, event.clientY );

		const movementX = pointer.x - pointerOld.x,
			movementY = pointer.y - pointerOld.y;

		if (Math.abs(movementX) + Math.abs(movementY) > 2 && uiSystem.state === State.None ) {
			uiSystem.state = State.Navigating;
		}

		if ( state === STATE.ROTATE ) {

			scope.rotate( new THREE.Vector3( - movementX * scope.rotationSpeed, - movementY * scope.rotationSpeed, 0 ) );

		} else if ( state === STATE.ZOOM ) {

			scope.zoom( new THREE.Vector3( 0, 0, movementY ) );

		} else if ( state === STATE.PAN ) {

			scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

		}

		pointerOld.set( event.clientX, event.clientY );

	}

	function onMouseUp() {

		domElement.removeEventListener( 'mousemove', onMouseMove, false );
		domElement.removeEventListener( 'mouseup', onMouseUp, false );
		domElement.removeEventListener( 'mouseout', onMouseUp, false );
		domElement.removeEventListener( 'dblclick', onMouseUp, false );

		state = STATE.NONE;

		window.setTimeout(() => uiSystem.state = State.None, 0);

	}

	function onMouseWheel( event: WheelEvent ) {

		event.preventDefault();

		if ( scope.enabled === false ) return;

		scope.zoom( new THREE.Vector3( 0, 0, event.deltaY ) );

	}

	function contextmenu( event: MouseEvent ) {

		event.preventDefault();

	}

	this.dispose = function() {

		domElement.removeEventListener( 'contextmenu', contextmenu, false );
		domElement.removeEventListener( 'mousedown', onMouseDown, false );
		domElement.removeEventListener( 'wheel', onMouseWheel, false );

		domElement.removeEventListener( 'mousemove', onMouseMove, false );
		domElement.removeEventListener( 'mouseup', onMouseUp, false );
		domElement.removeEventListener( 'mouseout', onMouseUp, false );
		domElement.removeEventListener( 'dblclick', onMouseUp, false );

		domElement.removeEventListener( 'touchstart', touchStart, false );
		domElement.removeEventListener( 'touchmove', touchMove, false );

	};

	domElement.addEventListener( 'contextmenu', contextmenu, false );
	domElement.addEventListener( 'mousedown', onMouseDown, false );
	domElement.addEventListener( 'wheel', onMouseWheel, false );

	// touch

	const touches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ],
		prevTouches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

	let prevDistance: number = null;

	function touchStart( event: TouchEvent ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				prevDistance = touches[ 0 ].distanceTo( touches[ 1 ] );
				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}


	function touchMove( event: TouchEvent ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		function getClosest( touch: THREE.Vector3, touches: THREE.Vector3[] ) {

			let closest = touches[ 0 ];

			for ( let i in touches ) {

				if ( closest.distanceTo( touch ) > touches[ i ].distanceTo( touch ) ) closest = touches[ i ];

			}

			return closest;

		}

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				scope.rotate( touches[ 0 ].sub( getClosest( touches[ 0 ], prevTouches ) ).multiplyScalar( - scope.rotationSpeed ) );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				const distance = touches[ 0 ].distanceTo( touches[ 1 ] );
				scope.zoom( new THREE.Vector3( 0, 0, prevDistance - distance ) );
				prevDistance = distance;


				const offset0 = touches[ 0 ].clone().sub( getClosest( touches[ 0 ], prevTouches ) ),
					offset1 = touches[ 1 ].clone().sub( getClosest( touches[ 1 ], prevTouches ) );
				offset0.x = - offset0.x;
				offset1.x = - offset1.x;

				scope.pan( offset0.add( offset1 ).multiplyScalar( 0.5 ) );

				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}

	domElement.addEventListener( 'touchstart', touchStart, false );
	domElement.addEventListener( 'touchmove', touchMove, false );

} as any as { new ( object: THREE.Object3D, domElement?: Node ): EditorControls2; };

EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
EditorControls.prototype.constructor = THREE.EditorControls;

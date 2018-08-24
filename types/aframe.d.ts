// Type definitions for AFRAME 0.7
// Project: https://aframe.io/
// Definitions by: Paul Shannon <https://github.com/devpaul>
//                 Roberto Ritger <https://github.com/bertoritger>
//                 Trygve Wastvedt <https://github.com/twastvedt>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

/**
 * Extended tests available at https://github.com/devpaul/aframe-typings.git
 */

/// <reference types="three" />
/// <reference types="tween.js" />


// Globals
declare var AFRAME: AFrame.AFrameGlobal;
declare var hasNativeWebVRImplementation: boolean;

interface Document {
    createElement(tagName: string): AFrame.Entity;
    querySelector(selectors: 'a-scene'): AFrame.Scene;
	querySelector(selectors: string): AFrame.Entity<any>;
	querySelectorAll(selectors: string): NodeListOf<AFrame.Entity<any> | Element>;
}

// Interfaces
declare namespace AFrame {
	interface ObjectMap<T = any> {
		[ key: string ]: T;
	}

	interface AFrameGlobal {
		AEntity: Entity;
		ANode: ANode;
		AScene: Scene;
		components: { [ key: string ]: ComponentDescriptor };
		geometries: { [ key: string ]: GeometryDescriptor };
		primitives: { [ key: string ]: Entity };
		registerComponent<T extends Component>(name: string, component: ComponentDefinition<T>): ComponentConstructor<T>;
		registerElement(name: string, element: ANode): void;
		registerGeometry<T extends Geometry>(name: string, geometry: GeometryDefinition<T>): GeometryConstructor<T>;
		registerPrimitive(name: string, primitive: PrimitiveDefinition): void;
		registerShader<T extends Shader>(name: string, shader: ShaderDefinition<T>): ShaderConstructor<T>;
		registerSystem<T extends System>(name: string, definition: SystemDefinition<T>): SystemConstructor<T>;
		schema: SchemaUtils;
		shaders: { [ key: string ]: ShaderDescriptor };
		systems: { [key: string]: SystemConstructor };
		THREE: typeof THREE;
		TWEEN: typeof TWEEN;
		utils: Utils;
		version: string;
	}

	interface Animation {
		attribute: string;
		begin: string | number;
		delay: number;
		direction: 'alternate' | 'alternateReverse' | 'normal' | 'reverse';
		dur: number;
		easing(): void;
		end: string;
		fill: 'backwards' | 'both' | 'forwards' | 'none';
		from: any; // TODO type
		repeat: number | 'indefinite';
		to: number;
	}

	type MultiPropertyComponents<T extends ObjectMap<Component> = ObjectMap<Component>> = {
		[key in keyof T]: T[key] extends { data: MultiPropertySchema<any> } ? T[key] : never
	};

	type SinglePropertyComponents<T extends ObjectMap<Component> = ObjectMap<Component>> = {
		[key in keyof T]: T[key] extends { data: SinglePropertySchema<any> } ? T[key] : never
	};

	interface ANode<C extends ObjectMap<Component> = ObjectMap<Component>> extends HTMLElement {
		components: C & DefaultComponents;
		isPlaying: boolean;
		object3D: THREE.Object3D;
		object3DMap: ObjectMap<Object>;
		sceneEl?: Scene;
		hasLoaded: boolean;

		addState(name: string): void;
		flushToDOM(recursive?: boolean): void;
		/**
		 * @deprecated since 0.4.0
		 */
		getComputedAttribute(attr: string): Component;
		getDOMAttribute(attr: string): any;
		getObject3D(type: string): Object;
		getOrCreateObject3D(type: string, construct: any): Object;
		is(stateName: string): boolean;
		pause(): void;
		play(): void;
		setObject3D(type: string, obj: THREE.Object3D): void;
		removeAttribute(attr: string, property?: string): void;
		removeObject3D(type: string): void;
		removeState(stateName: string): void;

		// getAttribute specific usages
		getAttribute(type: string): any;
		getAttribute(type: 'position' | 'rotation' | 'scale'): Coordinate;

		// setAttribute specific usages
		// setAttribute(attr: string, value: any): void;
		// setAttribute(attr: string, property: string, componentAttrValue?: any): void;
		setAttribute<K extends keyof T, T extends SinglePropertyComponents = SinglePropertyComponents<DefaultComponents>>(
			component: K,
			value: T[K]['data']
		): void;
		setAttribute<K extends keyof T, P extends keyof T[K]['data'], T extends MultiPropertyComponents = MultiPropertyComponents<DefaultComponents>>(
			component: K,
			property: P,
			value: T[K]['data'][P]
		): void;
		setAttribute<K extends keyof T, T extends MultiPropertyComponents = MultiPropertyComponents<DefaultComponents>>(
			component: K,
			values: Partial<T[K]['data']>
		): void;

		// addEventListener specific usages
		addEventListener<K extends keyof EntityEventMap>(type: K, listener: (event: Event & EntityEventMap[K]) => void, useCapture?: boolean): void;
		addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;

		closestScene(): Scene;
		closest(selector: string): ANode;
		load(cb?: () => void, childFilter?: (el: Element) => boolean): void;
		registerMixin(id: string): void;
		unregisterMixin(id: string): void;
		removeMixinListener(id: string): void;
		attachMixinListener(mixin: HTMLElement): void;
		emit(name: string, detail?: any, bubbles?: boolean): void;
		emitter(name: string, detail?: any, bubbles?: boolean): () => void;
	}

	interface Component<T extends any = any, S extends System = System> {
		attrName?: string;
		data: T;
		dependencies?: string[];
		el: Entity;
		id: string;
		multiple?: boolean;
		name: string;
		schema: Schema<this['data']>;
		system: S | undefined;
		isPlaying: boolean;

		init(this: this, data?: this['data']): void;
		pause(this: this): void;
		play(this: this): void;
		remove(this: this): void;
		tick?(this: this, time: number, timeDelta: number): void;
		update(this: this, oldData: this['data']): void;
		updateSchema?(this: this, newData: this['data']): void;

		extendSchema(this: this, update: Schema): void;
		flushToDOM(this: this): void;
	}

	interface ComponentConstructor<T extends Component> {
		new (el: Entity, attrValue: string, id: string): T;
	}

	type ComponentDefinition<T extends Component = Component> = Partial<T> & { _componentType?: T };

	interface ComponentDescriptor<T extends Component = Component> {
		Component: ComponentConstructor<T>;
		dependencies: string[] | undefined;
		multiple: boolean | undefined;

		// internal APIs2
		// parse
		// parseAttrValueForCache
		// schema
		// stringify
		// type
	}

	interface Coordinate {
		x: number;
		y: number;
		z: number;
	}

	interface DefaultComponents extends ObjectMap<Component> {
		position: Component<Coordinate>;
		rotation: Component<Coordinate>;
		scale: Component<Coordinate>;
	}

	interface Entity<C extends ObjectMap<Component> = ObjectMap<Component>> extends ANode<C> {
		object3D: Object
	}

	type DetailEvent<D> = Event & {
		detail: D;
		target: EventTarget & Entity;
	};

	interface EntityEventMap {
		'child-attached': DetailEvent<{ el: Element | Entity }>;
		'child-detached': DetailEvent<{ el: Element | Entity }>;
		'componentchanged': DetailEvent<{
			name: string,
			id: string
		}>;
		'componentremoved': DetailEvent<{
			name: string,
			id: string,
			newData: any,
			oldData: any
		}>;
		'loaded': EventListener;
		'pause': EventListener;
		'play': EventListener;
		'stateadded': DetailEvent<string>;
		'stateremoved': DetailEvent<string>;
		'schemachanged': DetailEvent<{ componentName: string }>;
		'raycaster-intersection': DetailEvent<{
			els: Entity[],
			intersections: RaycasterIntersectionDetail[],
			target: Entity
		}>;
		'raycaster-intersection-cleared': DetailEvent<{
			clearedEls: Entity[],
		}>;
		'raycaster-intersected': DetailEvent<{
			el: Entity,
			intersection: RaycasterIntersectionDetail
		}>;
		'raycaster-intersected-cleared': DetailEvent<{
			el: Entity
		}>;
		'click': DetailEvent<{
			intersection: RaycasterIntersectionDetail
		}>;
		'fusing': DetailEvent<{
			intersection: RaycasterIntersectionDetail
		}>;
		'mousedown': DetailEvent<{
			intersection: RaycasterIntersectionDetail
		}>;
		'mouseenter': DetailEvent<{
			intersection: RaycasterIntersectionDetail
		}>;
		'mouseleave': DetailEvent<{
			intersection: RaycasterIntersectionDetail
		}>;
		'mouseup': DetailEvent<{
			intersection: RaycasterIntersectionDetail
		}>;
	}

	interface RaycasterIntersectionDetail {
		distance: number,
		face: THREE.Face3,
		faceIndex: number,
		index: number,
		object: Object,
		point: THREE.Vector3,
		uv: THREE.Vector2
	}

	type Object = THREE.Object3D & {el: Entity};

	interface Geometry {
		name: string;
		geometry: THREE.Geometry;
		schema: Schema<any>;

		init(this: this, data: { [P in keyof this['schema']]: any }): void;
		// Would like the above to be:
		//  init?(this: this, data?: { [P in keyof T['schema']]: T['schema'][P]['default'] } ): void;
		//  I think this is prevented by the following issue: https://github.com/Microsoft/TypeScript/issues/21760.
	}

	interface GeometryConstructor<T extends Geometry> {
		new (): T;
	}

	type GeometryDefinition<T extends Geometry = Geometry> = Partial<T>;

	interface GeometryDescriptor<T extends Geometry = Geometry> {
		Geometry: GeometryConstructor<T>;
		schema: Schema;
	}

	type MultiPropertySchema<T extends ObjectMap<any> = ObjectMap<any>> = {
		[P in keyof T]: SinglePropertySchema<T[P]> | T[P];
	};

	interface PrimitiveDefinition {
		defaultComponents?: DefaultComponents | { [key: string]: { [key: string]: any } };
		deprecated?: boolean;
		mappings?: { [key: string]: string };
	}

	type PropertyTypes = 'array' | 'asset' | 'audio' | 'boolean' | 'color' |
		'int' | 'map' | 'model' | 'number' | 'selector' | 'selectorAll' |
		'string' | 'vec2' | 'vec3' | 'vec4';

	type SceneEvents = 'enter-vr' | 'exit-vr' | 'loaded' | 'renderstart';

	interface Scene extends ANode {
		behaviors: {
			tick: Component[],
			tock: Component[]
		};
		camera: THREE.Camera;
		canvas: HTMLCanvasElement;
		effect: THREE.VREffect;
		isMobile: boolean;
		object3D: THREE.Scene;
		renderer: THREE.WebGLRenderer;
		renderStarted: boolean;
		systems: ObjectMap<System>;
		time: number;

		enterVR(): Promise<void> | void;
		exitVR(): Promise<void> | void;
		reload(): void;

		addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
		addEventListener(type: SceneEvents, listener: EventListener, useCapture?: boolean): void;
	}

	type Schema<T = any> = T extends { [key: string]: any } ? MultiPropertySchema<T> | SinglePropertySchema<T> : SinglePropertySchema<T>;

	interface SchemaUtils {
		isSingleProperty(schema: Schema): boolean;
		process(schema: Schema): boolean;
	}

	interface Shader {
		name: string;
		data: { [key: string]: any };
		schema: Schema<this['data']>;
		material: THREE.Material;
		vertexShader: string;
		fragmentShader: string;

		init(this: this, data?: this['data']): void;
		tick?(this: this, time: number, timeDelta: number): void;
		update(this: this, oldData: this['data']): void;
	}

	interface ShaderConstructor<T extends Shader> {
		new (): T;
	}

	type ShaderDefinition<T extends Shader = Shader> = Partial<T>;

	interface ShaderDescriptor<T extends Shader = Shader> {
		Shader: ShaderConstructor<T>;
		schema: Schema;
	}

	interface SinglePropertySchema<T> {
		type?: PropertyTypes;
		'default'?: string | T;
		parse?(value: string): T;
		stringify?(value: T): string;
	}

	interface System<T extends any = any> {
		data: T;
		el: Scene;
		schema: Schema<this['data']>;
		init(this: this): void;
		pause(this: this): void;
		play(this: this): void;
		tick?(this: this, t: number, dt: number): void;
	}

	interface SystemConstructor<T extends System = System> {
		new (scene: Scene): T;
	}

	type SystemDefinition<T extends System = System> = Partial<T> & { _systemType?: T };

	interface Utils {
		coordinates: {
			isCoordinates(value: string): boolean;
			parse(value: string | object): Coordinate;
			stringify(c: Coordinate): string;
		};
		entity: {
			getComponentProperty(entity: Entity, componentName: string, delimiter?: string): any;
			setComponentProperty(entity: Entity, componentName: string, value: any, delimiter?: string): void;
		};
		styleParser: {
			parse(value: string): object;
			stringify(data: object): string;
		};
		device: {
			/**
			 * Checks if a VR headset is connected by looking for orientation data.
			 */
			checkHeadsetConnected(): boolean;

			/**
			 * Checks if there is positional tracking available.
			 */
			checkHasPositionalTracking(): boolean;

			/**
			 * Checks if device is Gear VR.
			 */
			isGearVR(): boolean;

			/**
			 * Checks if device is a smartphone.
			 */
			isMobile(): boolean;
		}
		deepEqual(a: any, b: any): boolean;
		diff(a: object, b: object): object;
		extend(target: object, ... source: object[]): object;
		extendDeep(target: object, ... source: object[]): object;

		throttle(tickFunction: () => void, minimumInterval: number, optionalContext?: {}): (t: number, dt: number) => void;
		throttleTick(tickFunction: (t: number, dt: number) => void, minimumInterval: number, optionalContext?: {}): (t: number, dt: number) => void;

		/**
		 * Returns whether we should capture this keyboard event for keyboard shortcuts.
		 * @param {Event} event Event object.
		 * @returns {Boolean} Whether the key event should be captured.
		 */
		shouldCaptureKeyEvent(event: KeyboardEvent): boolean;
	}
}

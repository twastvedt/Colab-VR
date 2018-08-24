export interface ApplyMatComp extends AFrame.Component {
	material: THREE.Material;

	applyToMesh: () => void;
}

export const applyMatCompDef: AFrame.ComponentDefinition<ApplyMatComp> = {
	dependencies: [ 'material' ],

	init: function() {

		this.material = (this.el.components['material'] as any).material;

		this.applyToMesh();
		this.el.addEventListener('model-loaded', () => this.applyToMesh());
	},

	applyToMesh: function() {
		const mesh = this.el.getObject3D('mesh');
		const that = this;

		if (mesh) {
			mesh.traverse((node: any) => {
				if (node.isMesh) {
					node.material = that.material;
				}
			});
		}
	}
};

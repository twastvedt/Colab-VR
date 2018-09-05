export class SubdivisionModifier {
	constructor(geometry: THREE.Geometry, subdivisions?: number);

	reset(): void;
	update(vertexIds?: number[]): void;
	smooth(): void;

	subdivisions: number;
	geometry: THREE.Geometry;
	baseGeometry: THREE.Geometry;
}

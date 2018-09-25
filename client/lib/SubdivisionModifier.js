/* Modified from three/examples/js/modifiers/SubdivisionModifier.js */


/*
 *	@author zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 *	@author centerionware / http://www.centerionware.com
 *  @author twastvedt / http://www.trygvewastvedt.com
 *
 *	Subdivision Geometry Modifier
 *		using Loop Subdivision Scheme
 *
 *	References:
 *		http://graphics.stanford.edu/~mdfisher/subdivision.html
 *		http://www.holmes3d.net/graphics/subdivision/
 *		http://www.cs.rutgers.edu/~decarlo/readings/subdiv-sg00c.pdf
 *		https://github.com/PixarAnimationStudios/OpenSubdiv
 *		http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.94.6876&rep=rep1&type=pdf
 *
 *	Todo:
 *		Use Chaikin's algorithm to smooth out differences in edge sharpness along creases.
 *
 */

/**
 * A class to hold information about the structure of a mesh.
 * Like a half-edge data structure, but with only the info we need for subdivision.
 */
class MeshStructure {

	constructor( geometry, oldStructure ) {

		var i, il, key, edge;

		this.edges = {};

		if ( geometry !== undefined ) {

			this.geometry = geometry;

			this.connectingEdges = new Array( geometry.vertices.length );

			for ( i = 0, il = geometry.vertices.length; i < il; i ++ ) {

				this.connectingEdges[ i ] = [];

			}

			for ( i = 0, il = geometry.faces.length; i < il; i ++ ) {

				this.addFace( geometry.faces[ i ] );

			}

		} else {

			this.connectingEdges = [];

		}

		if ( oldStructure !== undefined ) {

			for ( key in oldStructure.edges ) {

				edge = oldStructure.edges[ key ];

				this.setSharpness( edge.aIndex, edge.bIndex, edge.sharpness );

			}

		}

	}

	/////////////////////////////
	// Private methods

	/**
	 * Set the sharpness of a new edge given the old edge's sharpness.
	 * A sharpness of 10 or more is considered infinitely sharp and doesn't decay.
	 * @param {number} a Index of first edge vertex.
	 * @param {number} b Index of second edge vertex.
	 * @param {number} oldSharpness Sharpness of source edge [0-10].
	 */
	_setNextSharpness( a, b, oldSharpness ) {

		if ( oldSharpness >= 10 ) {

			this.setSharpness( a, b, 10 );

		} else {

			this.setSharpness( a, b, oldSharpness - 1 );

		}

	}

	/////////////////////////////
	// Public methods

	getEdge( a, b ) {

		return this.edges[ a + '_' + b ] || this.edges[ b + '_' + a ];

	}

	addFace( face ) {

		this.addEdge( face.a, face.b, face );
		this.addEdge( face.b, face.c, face );
		this.addEdge( face.c, face.a, face );

	}

	addEdge( a, b, face ) {

		var vertexIndexA = Math.min( a, b );
		var vertexIndexB = Math.max( a, b );

		var key = vertexIndexA + '_' + vertexIndexB;

		var edge;

		if ( key in this.edges ) {

			edge = this.edges[ key ];

		} else {

			edge = {

				a: this.geometry.vertices[ vertexIndexA ], // pointer reference
				b: this.geometry.vertices[ vertexIndexB ],
				newEdgeVertexId: null,
				aIndex: vertexIndexA, // numbered reference
				bIndex: vertexIndexB,
				faces: [], // pointers to face
				sharpness: 0

			};

			this.edges[ key ] = edge;

			if ( ! this.connectingEdges[ a ] ) {

				this.connectingEdges[ a ] = [];

			}

			if ( ! this.connectingEdges[ b ] ) {

				this.connectingEdges[ b ] = [];

			}

			this.connectingEdges[ a ].push( edge );
			this.connectingEdges[ b ].push( edge );

		}

		edge.faces.push( face );

	}

	/**
	 * Set the sharpness of an edge described by two vertex ids.
	 * @param {number} a Index of first edge vertex.
	 * @param {number} b Index of second edge vertex.
	 * @param {number} sharpness Sharpness of edge [0-10].
	 * @returns {boolean} False if successful.
	 */
	setSharpness( a, b, sharpness ) {

		var edge = this.getEdge( a, b );

		if ( edge ) {

			edge.sharpness = Math.min( Math.max( 0, sharpness ), 10 );

			return false;

		}

		return true;

	}

}

/**
 * Calculate a subdivided surface from a base mesh.
 */
export class SubdivisionModifier {

	get baseGeometry() {

		return this._baseGeometry;

	}

	/**
	 * When the base geometry changes, convert it from a buffer geometry if necessary, clean it up, and initialize the subdivision modifier.
	 */
	set baseGeometry( geometry ) {

		// Create this.baseGeometry as cleaned-up copy of input geometry.
		if ( geometry.isBufferGeometry ) {

			this._baseGeometry = new THREE.Geometry().fromBufferGeometry( geometry );

		} else {

			this._baseGeometry = geometry;

		}

		this._baseGeometry.mergeVertices();

		this.calculateStructure( false );

		this.reset();

	}

	constructor( geometry, subdivisions = 1 ) {

		// Some constants
		this.WARNINGS = false; // Set to true for development
		this.ABC = [ 'a', 'b', 'c' ];

		// Store the base geometry and initialize.
		this.baseGeometry = geometry;

		this.subdivisions = subdivisions;
		this.activeSubdivisions = 0;

	}

	/////////////////////////////
	// Private methods

	_newFace( a, b, c, materialIndex ) {

		return new THREE.Face3( a, b, c, undefined, undefined, materialIndex );

	}

	_newUv( newUvs, a, b, c ) {

		newUvs.push( [ a.clone(), b.clone(), c.clone() ] );

	}

	/**
	 * Weighted addition of (sparse) arrays.
	 * @param {number[]} baseArray Array to modify.
	 * @param {number[]} newArray Array of numbers to add to baseArray.
	 * @param {number} newArrayWeight Multiplier to newArray before adding to baseArray.
	 */
	_addArray( baseArray, newArray, newArrayWeight ) {

		// Use forEach to loop through only defined elements in newArray.

		newArray.forEach( function ( el, i ) {

			baseArray[ i ] = ( baseArray[ i ] || 0 ) + ( el * newArrayWeight );

		} );

	}

	/**
	 * Scale each element in a (sparse) array.
	 * @param {number[]} array Array to scale.
	 * @param {number} arrayWeight Array multiplier.
	 */
	_scaleArray( array, arrayWeight ) {

		if ( arrayWeight !== 1 ) {

			// Use forEach to loop through only defined elements in array.

			array.forEach( function ( el, i ) {

				array[ i ] = el * arrayWeight;

			} );

		}

	}

	/////////////////////////////
	// Public methods

	/**
	 * Set the sharpness of an edge described by two vertex ids. Must call this.reset() to apply changes.
	 * @param {number} a Index of first edge vertex.
	 * @param {number} b Index of second edge vertex.
	 * @param {number} sharpness Sharpness of edge [0-1].
	 * @returns {boolean} False if successful.
	 */
	setSharpness( a, b, sharpness ) {

		return this._baseStructure.setSharpness( a, b, sharpness );

	}

	/**
	 * Create model of base mesh structure.
	 * @param {boolean} keepEdgeSharpness Retain edge sharpeness from current edge structure? Otherwise set all edges to smooth.
	 */
	calculateStructure( keepEdgeSharpness ) {

		if ( this.WARNINGS ) console.info( 'init: create base geometry structure.' );


		if ( keepEdgeSharpness ) {

			this._baseStructure = new MeshStructure( this._baseGeometry, this._baseStructure );

		} else {

			this._baseStructure = new MeshStructure( this._baseGeometry );

		}

		this.geometry = this.geometry || new THREE.Geometry();

	}

	/**
	 * [Re]initialize subdivision. Keep base geometry and structure.
	 */
	reset() {

		if ( this.WARNINGS ) console.info( 'Reset: initialize subdivision.' );

		this.activeSubdivisions = 0;

		this._subdivStructure = this._baseStructure;

		this.geometry.copy( this._baseGeometry );

		// Initialize vertex weights, for quick updating. Initially, each vertex is solely dependent on itself.
		this.vertexWeights = [];

		// Initialize base vertex influences, also for quick updating.
		this.vertexInfluences = [];

		// Initialize weight and influence arrays to un-subdivided status.
		for ( var i = 0, il = this._baseGeometry.vertices.length; i < il; i ++ ) {

			this.vertexWeights[ i ] = [];
			this.vertexWeights[ i ][ i ] = 1;

			this.vertexInfluences[ i ] = new Set( [ i ] );

		}

	}

	modify() {

		if ( this.WARNINGS ) console.info( 'Apply modifier: ', this.subdivisions, ' subdivisions.' );

		if ( this.activeSubdivisions > this.subdivisions ) {

			this.reset();

		}

		if ( this.subdivisions > 0 ) {

			while ( this.activeSubdivisions < this.subdivisions ) {

				this.smooth();

			}

		}

		this.geometry.elementsNeedUpdate = true;
		this.geometry.verticesNeedUpdate = true;
		this.geometry.computeVertexNormals();

		if ( this.geometry.faceVertexUvs[ 0 ] !== undefined ) {

			this.geometry.uvsNeedUpdate = true;

		}

	}

	/**
	 * Update the subdivided geometry to match changes in the base geometry.
	 * Does not handle changes in topology (added/deleted vertices, modified faces) or edge sharpness.
	 * @param {number[]} baseGeoVertexIds Vertex ids in base geometry that have changed. If unspecified, check all.
	 */
	update( baseGeoVertexIds ) {

		var vertexIdsToMove;

		var i, il;

		if ( baseGeoVertexIds !== undefined ) {

			vertexIdsToMove = new Set();

			// For each base geometry vertex to update, get all related subdivided geometry vertices.
			for ( i = 0, il = baseGeoVertexIds.length; i < il; i ++ ) {

				this.vertexInfluences[ baseGeoVertexIds[ i ] ].forEach( vertexIdsToMove.add, vertexIdsToMove );

			}

		} else {

			// Update position of all vertices.
			vertexIdsToMove = new Set( this.geometry.vertices.keys() );

		}

		var baseVertices = this.baseGeometry.vertices;
		var vertices = this.geometry.vertices;
		var vertexWeights = this.vertexWeights;
		var tmp = new THREE.Vector3();

		for ( var vertexId of vertexIdsToMove ) {

			tmp.setScalar( 0 );

			vertexWeights[ vertexId ].forEach( function ( el, i ) {

				tmp.addScaledVector( baseVertices[ i ], el );

			} );

			vertices[ vertexId ].copy( tmp );

		}

		this.geometry.verticesNeedUpdate = true;
		this.geometry.computeVertexNormals();

	}

	/**
	 * Perform one iteration of subdivision.
	 */
	smooth() {

		var tmp = new THREE.Vector3();

		var newUVs = [];

		var n, i, il, j, k;

		var oldVertices = this.geometry.vertices; // { x, y, z}
		var oldFaces = this.geometry.faces; // { a: oldVertex1, b: oldVertex2, c: oldVertex3 }
		var oldUvs = this.geometry.faceVertexUvs[ 0 ];

		var hasUvs = oldUvs !== undefined && oldUvs.length > 0;

		var oldStructure = this._subdivStructure;

		/******************************************************
		 *
		 *	Step 1.
		 *	For each edge, create a new Edge Vertex,
		 *	then position it.
		 *
		 *******************************************************/

		var newEdgeVertices = [], newVertexWeights = [];
		var otherId, currentEdge, newEdgeVertex, oldFace;
		var edgeVertexWeight, adjacentVertexWeight, connectedFaces, newEdgeVertexWeight, newEdgeVertexId;

		for ( i in oldStructure.edges ) {

			currentEdge = oldStructure.edges[ i ];

			newEdgeVertex = new THREE.Vector3();
			newEdgeVertexWeight = [];
			newEdgeVertexId = this.vertexWeights.length + newEdgeVertices.length;

			connectedFaces = currentEdge.faces.length;

			if ( currentEdge.sharpness >= 1 ) {

				// Sharp edge - no influence from adjacent face vertices.

				edgeVertexWeight = 0.5;
				adjacentVertexWeight = 0;

			} else if ( currentEdge.sharpness > 0 ) {

				// Semi-sharp edge - linearly interpolate between smooth and sharp.

				edgeVertexWeight = 0.5 * currentEdge.sharpness + 0.375 * ( 1 - currentEdge.sharpness );
				adjacentVertexWeight = 0.125 * ( 1 - currentEdge.sharpness );

			} else if ( connectedFaces === 2 ) {

				// Smooth interior edge.

				edgeVertexWeight = 3 / 8;
				adjacentVertexWeight = 1 / 8;

			} else {

				// Exterior edge (or non-manifold).

				edgeVertexWeight = 0.5;
				adjacentVertexWeight = 0;

			}

			if ( connectedFaces !== 1 && connectedFaces !== 2 ) {

				// Non-manifold edge.

				if ( this.WARNINGS ) console.warn( 'Subdivision Modifier: Number of connected faces != 2, is: ', connectedFaces, currentEdge );

			}

			// Add influence of edge endpoints to edge's new vertex.
			newEdgeVertex.addVectors( currentEdge.a, currentEdge.b ).multiplyScalar( edgeVertexWeight );

			// Merge weights for edge vertices into weights for edge's new vertex.
			this._addArray( newEdgeVertexWeight, this.vertexWeights[ currentEdge.aIndex ], edgeVertexWeight );
			this._addArray( newEdgeVertexWeight, this.vertexWeights[ currentEdge.bIndex ], edgeVertexWeight );

			// Record that the ends of this edge influence the position of the new vertex.
			this.vertexWeights[ currentEdge.aIndex ].forEach( ( el, j ) => {

				this.vertexInfluences[ j ].add( newEdgeVertexId );

			}, this );

			this.vertexWeights[ currentEdge.bIndex ].forEach( ( el, j ) => {

				this.vertexInfluences[ j ].add( newEdgeVertexId );

			}, this );

			if ( adjacentVertexWeight !== 0 ) {

				// Find vertices (2, usually) not on edge but on adjacent faces.

				tmp.set( 0, 0, 0 );

				for ( j = 0; j < connectedFaces; j ++ ) {

					oldFace = currentEdge.faces[ j ];

					for ( k = 0; k < 3; k ++ ) {

						otherId = oldFace[ this.ABC[ k ] ];
						if ( ! ( otherId === currentEdge.aIndex ) && ! ( otherId === currentEdge.bIndex ) ) break;

					}

					// Add in weights from this vertex.
					this._addArray( newEdgeVertexWeight, this.vertexWeights[ otherId ], adjacentVertexWeight );

					tmp.add( oldVertices[ otherId ] );

				}

				// Add contribution of adjacent vertices to new vertex.
				tmp.multiplyScalar( adjacentVertexWeight );
				newEdgeVertex.add( tmp );

			}

			currentEdge.newEdgeVertexId = newEdgeVertexId;
			newEdgeVertices.push( newEdgeVertex );
			newVertexWeights.push( newEdgeVertexWeight );

		}

		/******************************************************
		 *
		 *	Step 2.
		 *	Reposition each source vertex.
		 *
		 *******************************************************/

		var beta, sourceVertexWeight, connectingVertexWeight, influencingEdges, connectingSharpEdges, numSharpEdges;
		var connectingEdge, oldVertex, newSourceVertex, vertexWeight, otherEnd;
		var newSourceVertices = [];

		for ( i = 0, il = oldVertices.length; i < il; i ++ ) {

			oldVertex = oldVertices[ i ];
			vertexWeight = this.vertexWeights[ i ];
			influencingEdges = oldStructure.connectingEdges[ i ];

			n = oldStructure.connectingEdges[ i ].length;

			// Connecting edges which are sharp.
			connectingSharpEdges = oldStructure.connectingEdges[ i ].filter( ( edge ) => edge.sharpness > 0 );
			numSharpEdges = connectingSharpEdges.length;

			// Treat as corner - don't move.
			if ( numSharpEdges > 2 ) {

				sourceVertexWeight = 1;
				connectingVertexWeight = 0;

			} else if ( numSharpEdges === 2 ) {

				// Crease vertex - ignore smooth connecting edges.

				influencingEdges = connectingSharpEdges;

				sourceVertexWeight = 6 / 8;
				connectingVertexWeight = 1 / 8;

			} else if ( n > 2 ) {

				// Complex case for smooth vertex.

				if ( n === 3 ) {

					beta = 3 / 16;

				} else {

					// Warren's modified formula

					beta = 3 / ( 8 * n );

				}

				// Loop's original beta formula
				// beta = 1 / n * ( 5/8 - Math.pow( 3/8 + 1/4 * Math.cos( 2 * Math. PI / n ), 2) );

				sourceVertexWeight = 1 - n * beta;
				connectingVertexWeight = beta;

			} else if ( n === 2 ) {

				// Boundary and corner.

				if ( this.WARNINGS ) console.warn( '2 connecting edges', oldStructure.connectingEdges[ i ] );

				// sourceVertexWeight = 3 / 4;
				// connectingVertexWeight = 1 / 8;

				sourceVertexWeight = 1;
				connectingVertexWeight = 0;

			} else if ( n === 1 ) {

				if ( this.WARNINGS ) console.warn( 'only 1 connecting edge' );
				sourceVertexWeight = 3 / 4;
				connectingVertexWeight = 1 / 4;

			} else if ( n === 0 ) {

				if ( this.WARNINGS ) console.warn( '0 connecting edges' );
				sourceVertexWeight = 1;
				connectingVertexWeight = 0;

			}

			newSourceVertex = oldVertex.clone().multiplyScalar( sourceVertexWeight );

			if ( connectingVertexWeight !== 0 ) {

				// Add influence from vertices connected to this vertex by an edge.

				tmp.set( 0, 0, 0 );

				this._scaleArray( vertexWeight, sourceVertexWeight );

				n = influencingEdges.length;

				for ( j = 0; j < n; j ++ ) {

					// Get connected vertex.
					connectingEdge = influencingEdges[ j ];
					otherEnd = connectingEdge.aIndex !== i;
					otherId = otherEnd ? connectingEdge.a : connectingEdge.b;

					// Add influence of connected vertex.
					tmp.add( otherId );
					this._addArray( vertexWeight, this.vertexWeights[ otherEnd ? connectingEdge.aIndex : connectingEdge.bIndex ], connectingVertexWeight );

					// Merge influences on connected vertex into influences on this vertex.
					this.vertexWeights[ otherEnd ? connectingEdge.aIndex : connectingEdge.bIndex ].forEach( ( el, k ) => {

						this.vertexInfluences[ k ].add( i );

					}, this );

				}

				tmp.multiplyScalar( connectingVertexWeight );
				newSourceVertex.add( tmp );

			}

			newSourceVertices.push( newSourceVertex );

		}


		/******************************************************
		 *
		 *	Step 3.
		 *	Generate Faces between source vertices
		 *	and edge vertices.
		 *
		 *******************************************************/

		this.geometry.vertices = newSourceVertices.concat( newEdgeVertices );

		var newStructure = new MeshStructure();
		newStructure.geometry = this.geometry;

		var newEdgeVertexId1, newEdgeVertexId2, newEdgeVertexId3, newFace;
		var oldEdge1, oldEdge2, oldEdge3;
		var newFaces = [];

		var uv, x0, x1, x2;
		var x3 = new THREE.Vector2();
		var x4 = new THREE.Vector2();
		var x5 = new THREE.Vector2();

		for ( i = 0, il = oldFaces.length; i < il; i ++ ) {

			oldFace = oldFaces[ i ];

			// Find the 3 new edge vertices of each old face

			oldEdge1 = oldStructure.getEdge( oldFace.a, oldFace.b );
			oldEdge2 = oldStructure.getEdge( oldFace.b, oldFace.c );
			oldEdge3 = oldStructure.getEdge( oldFace.c, oldFace.a );

			newEdgeVertexId1 = oldEdge1.newEdgeVertexId;
			newEdgeVertexId2 = oldEdge2.newEdgeVertexId;
			newEdgeVertexId3 = oldEdge3.newEdgeVertexId;

			// Create 4 faces.

			newFace = this._newFace( newEdgeVertexId1, newEdgeVertexId2, newEdgeVertexId3, oldFace.materialIndex );
			newStructure.addFace( newFace );
			newFaces.push( newFace );

			newFace = this._newFace( oldFace.a, newEdgeVertexId1, newEdgeVertexId3, oldFace.materialIndex );
			newStructure.addFace( newFace );
			newFaces.push( newFace );

			newFace = this._newFace( oldFace.b, newEdgeVertexId2, newEdgeVertexId1, oldFace.materialIndex );
			newStructure.addFace( newFace );
			newFaces.push( newFace );

			newFace = this._newFace( oldFace.c, newEdgeVertexId3, newEdgeVertexId2, oldFace.materialIndex );
			newStructure.addFace( newFace );
			newFaces.push( newFace );

			// Set sharpness of new edges. (New edges default to smooth.)

			if ( oldEdge1.sharpness > 1 ) {

				newStructure._setNextSharpness( oldFace.a, newEdgeVertexId1, oldEdge1.sharpness );
				newStructure._setNextSharpness( newEdgeVertexId1, oldFace.b, oldEdge1.sharpness );

			}

			if ( oldEdge2.sharpness > 1 ) {

				newStructure._setNextSharpness( oldFace.b, newEdgeVertexId2, oldEdge2.sharpness );
				newStructure._setNextSharpness( newEdgeVertexId2, oldFace.c, oldEdge2.sharpness );

			}

			if ( oldEdge3.sharpness > 1 ) {

				newStructure._setNextSharpness( oldFace.c, newEdgeVertexId3, oldEdge3.sharpness );
				newStructure._setNextSharpness( newEdgeVertexId3, oldFace.a, oldEdge3.sharpness );

			}

			// Create new UV for each new face (4).

			if ( hasUvs ) {

				uv = oldUvs[ i ];

				x0 = uv[ 0 ];
				x1 = uv[ 1 ];
				x2 = uv[ 2 ];

				x3.addVectors( x0, x1 ).multiplyScalar( 0.5 );
				x4.addVectors( x1, x2 ).multiplyScalar( 0.5 );
				x5.addVectors( x0, x2 ).multiplyScalar( 0.5 );

				this._newUv( newUVs, x3, x4, x5 );
				this._newUv( newUVs, x0, x3, x5 );
				this._newUv( newUVs, x1, x4, x3 );
				this._newUv( newUVs, x2, x5, x4 );

			}

		}

		// Overwrite old objects
		this._subdivStructure = newStructure;
		this.geometry.faces = newFaces;

		if ( hasUvs ) this.geometry.faceVertexUvs[ 0 ] = newUVs;

		this.vertexWeights = this.vertexWeights.concat( newVertexWeights );

		this.activeSubdivisions ++;

		if ( this.WARNINGS ) console.info( 'Smoothed to ', this.activeSubdivisions, ' subdivisions.' );

	}

}

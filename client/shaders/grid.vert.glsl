#define STANDARD

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif


// Custom variables.
uniform mat3 normalWorldMatrix;
varying vec4 vWPos;
varying vec3 vNormalA;


// chunk(common);
// chunk(uv_pars_vertex);
// chunk(uv2_pars_vertex);
// chunk(displacementmap_pars_vertex);
// chunk(color_pars_vertex);
// chunk(fog_pars_vertex);
// chunk(morphtarget_pars_vertex);
// chunk(skinning_pars_vertex);
// chunk(shadowmap_pars_vertex);
// chunk(logdepthbuf_pars_vertex);
// chunk(clipping_planes_pars_vertex);

void main() {

	// chunk(uv_vertex);
	// chunk(uv2_vertex);
	// chunk(color_vertex);

	// chunk(beginnormal_vertex);
	// chunk(morphnormal_vertex);
	// chunk(skinbase_vertex);
	// chunk(skinnormal_vertex);
	// chunk(defaultnormal_vertex);

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

#endif

	// chunk(begin_vertex);
	// chunk(morphtarget_vertex);
	// chunk(skinning_vertex);
	// chunk(displacementmap_vertex);
	// chunk(project_vertex);
	// chunk(logdepthbuf_vertex);
	// chunk(clipping_planes_vertex);

	vViewPosition = - mvPosition.xyz;

	// chunk(worldpos_vertex);
	// chunk(shadowmap_vertex);
	// chunk(fog_vertex);

	// Custom shader code.
	#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )

		vWPos = worldPosition;

	#else

		vWPos = modelMatrix * vec4( transformed, 1.0 );

	#endif

	vNormalA = abs(normalWorldMatrix * objectNormal);
}

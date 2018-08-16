// Based on  three.js/src/renderers/shaders/ShaderLib/meshphysical_frag.glsl. When updating three, check for changes to this file.

#define PHYSICAL

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifndef STANDARD
	uniform float clearCoat;
	uniform float clearCoatRoughness;
#endif

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif


// Custom variables
uniform sampler2D gridMap;
uniform float gridSize;
uniform float gridStrength;
uniform vec3 gridColor;

varying vec4 vWPos;
varying vec3 vNormalA;


// chunk(common);
// chunk(packing);
// chunk(dithering_pars_fragment);
// chunk(color_pars_fragment);
// chunk(uv_pars_fragment);
// chunk(uv2_pars_fragment);
// chunk(map_pars_fragment);
// chunk(alphamap_pars_fragment);
// chunk(aomap_pars_fragment);
// chunk(lightmap_pars_fragment);
// chunk(emissivemap_pars_fragment);
// chunk(bsdfs);
// chunk(cube_uv_reflection_fragment);
// chunk(envmap_pars_fragment);
// chunk(envmap_physical_pars_fragment);
// chunk(fog_pars_fragment);
// chunk(lights_pars_begin);
// chunk(lights_physical_pars_fragment);
// chunk(shadowmap_pars_fragment);
// chunk(bumpmap_pars_fragment);
// chunk(normalmap_pars_fragment);
// chunk(roughnessmap_pars_fragment);
// chunk(metalnessmap_pars_fragment);
// chunk(logdepthbuf_pars_fragment);
// chunk(clipping_planes_pars_fragment);


void setColor(float x, float y) {
	vec4 gridMap = texture2D(gridMap, vec2(x / gridSize, y / gridSize)) * vec4(gridColor, 1.0);

	gl_FragColor = mix(gl_FragColor, gridMap, gridStrength);
}

void main() {

	// chunk(clipping_planes_fragment);

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	// chunk(logdepthbuf_fragment);
	// chunk(map_fragment);
	// chunk(color_fragment);
	// chunk(alphamap_fragment);
	// chunk(alphatest_fragment);
	// chunk(roughnessmap_fragment);
	// chunk(metalnessmap_fragment);
	// chunk(normal_fragment_begin);
	// chunk(normal_fragment_maps);
	// chunk(emissivemap_fragment);

	// accumulation
	// chunk(lights_physical_fragment);
	// chunk(lights_fragment_begin);
	// chunk(lights_fragment_maps);
	// chunk(lights_fragment_end);

	// modulation
	// chunk(aomap_fragment);

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	if (vNormalA.x > vNormalA.y) {
		if (vNormalA.x > vNormalA.z) {
			setColor(vWPos.z, vWPos.y);
		} else {
			setColor(vWPos.x, vWPos.y);
		}
	} else if (vNormalA.y > vNormalA.z) {
		setColor(vWPos.x, vWPos.z);
	} else {
		setColor(vWPos.x, vWPos.y);
	}


	// chunk(tonemapping_fragment);
	// chunk(encodings_fragment);
	// chunk(fog_fragment);
	// chunk(premultiplied_alpha_fragment);
	// chunk(dithering_fragment);

}

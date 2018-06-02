uniform sampler2D gridTex;
uniform float gridSize;
uniform float gridStrength;
uniform vec3 gridColor;

uniform sampler2D texture;
uniform vec2 repeat;
uniform vec2 offset;
uniform int useTex;
uniform vec3 color;
uniform float opacity;

varying vec2 vUV;
varying vec4 vWPos;
varying vec4 vNormal;
varying vec4 vNormalA;

void setColor(float x, float y) {
	vec4 baseTex = vec4(color, opacity);

	if (useTex == 1) {
		baseTex *= texture2D(texture, vec2(vUV.x / repeat.x + offset.x, vUV.y / repeat.y + offset.y));
	}

	vec4 gridTex = texture2D(gridTex, vec2(x / gridSize, y / gridSize)) * vec4(gridColor, 1.0);

	gl_FragColor = mix(baseTex, gridTex, gridStrength);
}

void main() {
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
}

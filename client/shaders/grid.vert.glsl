varying vec4 vWPos;
varying vec4 vNormal;
varying vec4 vNormalA;
varying vec2 vUV;

void main() {
	vWPos = modelMatrix * vec4(position, 1.0);
	vNormal = modelMatrix * vec4(normal, 0.0);
	vNormalA = abs(vNormal);
	vUV = uv;

	gl_Position = projectionMatrix * viewMatrix * vWPos;
}

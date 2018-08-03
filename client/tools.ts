AFRAME = require('aframe');

export function htmlToElement<T extends Node>(html: string) {
	// Never return a text node of whitespace as the result.
	html = html.trim();

	return document.createRange().createContextualFragment(html).firstChild as T;
}

function replaceThreeChunk(a: string, b: string) {
	const chunk = AFRAME.THREE.ShaderChunk[b];

	if (chunk) {
		return chunk + '\n';
	} else {
		console.log(`Missing chunk: ${b}.`);
	}
}

export function shaderParse(glsl: string) {
	return glsl.replace(/\/\/\s?chunk\(\s?(\w+)\s?\);/g, replaceThreeChunk);
}

export function htmlToElement<T extends Node>(html: string) {
	// Never return a text node of whitespace as the result.
	html = html.trim();

    return document.createRange().createContextualFragment(html) as T & DocumentFragment;
}

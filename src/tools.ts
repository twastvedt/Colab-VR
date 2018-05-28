export function htmlToElement<T extends Node>(html: string) {
	const template: HTMLTemplateElement = document.createElement('template') as any;

	// Never return a text node of whitespace as the result.
	html = html.trim();

    template.innerHTML = html;
    return template.content.firstChild as T;
}

declare var NAF: any;

interface NodeListOf<TNode extends Node> {
	forEach: (callback: (currentValue?: TNode, currentIndex?: number, listObj?: NodeListOf<TNode>) => any, thisArg?: any) => void;
}

interface NodeList {
	forEach: (callback: (currentValue?: Node, currentIndex?: number, listObj?: NodeList) => any, thisArg?: any) => void;
}

declare namespace COMAP {
	type ComponentDecorator<T extends AFrame.Component = AFrame.Component> = {(componentDef: AFrame.ComponentDefinition<T>, ...rest: any[]): void};
}

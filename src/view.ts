import {ClassName, Value, View, ViewProps} from '@tweakpane/core';

interface Config {
	value: Value<object>;
	viewProps: ViewProps;
}

// Create a class name generator from the view name
// ClassName('object-editor') will generate a CSS class name like tp-object-editorv
const className = ClassName('object-editor');

// Custom view class should implement View interface
export class PluginView implements View {
	public readonly element: HTMLElement;
	private value_: Value<object>
	private editorInited: boolean = false
	private onValueChangeCB: OmitThisParameter<() => void>

	constructor(
		private readonly doc: Document,
		private readonly config: Config
	) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);

		// Receive the bound value from the controller
		this.value_ = config.value;
		// Handle 'change' event of the value
		this.onValueChangeCB = this.onValueChange_.bind(this)
		this.value_.emitter.on('change', this.onValueChangeCB);

		config.viewProps.handleDispose(this.dispose.bind(this));

		setTimeout(() => {
			this.refresh_();
			this.editorInited = true
		})
	}

	private refresh_(): void {
		const parent = this.element.parentElement
		if (parent && parent.parentElement) {
			parent.parentElement.style.flexDirection = 'column'
			parent.parentElement.style.alignItems = 'flex-start'
			parent.style.width = '100%'
			this.element.style.height = 'max-content'
		}

		this.closedObject(this.value_.rawValue, this.element)
	}

	private closedObject(object: object, element: HTMLElement): void {
		const button = this.doc.createElement('button')
		button.classList.add(className('button'))
		button.innerHTML = `▼`
		element.appendChild(button)

		button.addEventListener('click', () => {
			element.classList.toggle(className('opened'))
			if(element.classList.contains(className('opened'))) {
				button.innerHTML = `►`
			} else {
				button.innerHTML = `▼`
			}
		})

		const innerClass = className('inner')
		const inner = this.doc.createElement('div')
		inner.classList.add(innerClass)
		element.appendChild(inner)

		const openingBrace = this.doc.createElement('span')
		openingBrace.classList.add(innerClass + '_brace')
		openingBrace.innerHTML = '{'
		inner.appendChild(openingBrace)

		const content = this.doc.createElement('span')
		content.classList.add(innerClass + '_content')
		Object.entries(object).forEach(([key, value], index, arr) => {
			const lineEl = this.doc.createElement('span')
			lineEl.classList.add(innerClass + '_line')

			const keyEl = this.doc.createElement('span')
			keyEl.classList.add(innerClass + '_key')
			keyEl.innerHTML = key + ': '
			lineEl.appendChild(keyEl)

			const keyElWidth = keyEl.getBoundingClientRect().width
			console.log(keyElWidth)
			const valueEl = this.parseValue(value, lineEl, keyElWidth)
			lineEl.appendChild(valueEl)

			const hyphen = this.doc.createElement('span')
			hyphen.classList.add(innerClass + '_hyphen')
			hyphen.innerHTML = index < arr.length - 1 ? ', ' : ''
			lineEl.appendChild(hyphen)

			content.appendChild(lineEl)
		})
		inner.appendChild(content)

		const closingBrace = this.doc.createElement('span')
		closingBrace.classList.add(innerClass + '_brace')
		closingBrace.innerHTML = '}'
		inner.appendChild(closingBrace)
	}

	private closedArray(array: any[], element: HTMLElement): void {
		const button = this.doc.createElement('button')
		button.classList.add(className('button'))
		button.innerHTML = `▼`
		element.appendChild(button)

		button.addEventListener('click', () => {
			element.classList.toggle(className('opened'))
			if(element.classList.contains(className('opened'))) {
				button.innerHTML = `►`
			} else {
				button.innerHTML = `▼`
			}
		})

		const innerClass = className('inner')
		const inner = this.doc.createElement('div')
		inner.classList.add(innerClass)
		element.appendChild(inner)

		const openingBrace = this.doc.createElement('span')
		openingBrace.classList.add(innerClass + '_brace')
		openingBrace.innerHTML = '['
		inner.appendChild(openingBrace)

		const content = this.doc.createElement('span')
		content.classList.add(innerClass + '_content')
		array.forEach((value, index, arr) => {
			const lineEl = this.doc.createElement('span')
			lineEl.classList.add(innerClass + '_line')

			const valueEl = this.parseValue(value, lineEl)
			lineEl.appendChild(valueEl)

			const hyphen = this.doc.createElement('span')
			hyphen.classList.add(innerClass + '_hyphen')
			hyphen.innerHTML = index < arr.length - 1 ? ', ' : ''
			lineEl.appendChild(hyphen)

			content.appendChild(lineEl)
		})
		inner.appendChild(content)

		const closingBrace = this.doc.createElement('span')
		closingBrace.classList.add(innerClass + '_brace')
		closingBrace.innerHTML = ']'
		inner.appendChild(closingBrace)
	}

	private parseValue(value: any, element: HTMLElement, offsetPx: number = 0): HTMLElement {
		if(Array.isArray(value)) {
			const span = this.doc.createElement('span')
			element.appendChild(span)
			span.classList.add(className('array'))
			span.style.width = `calc(100% - ${offsetPx + 14}px)`
			this.closedArray(value, span)
			return span
		} else if(typeof value === 'object') {
			const span = this.doc.createElement('span')
			element.appendChild(span)
			span.classList.add(className('object'))
			span.style.width = `calc(100% - ${offsetPx + 14}px)`
			this.closedObject(value, span)
			return span
		} else if(typeof value === 'function') {
			const span = this.doc.createElement('span')
			span.classList.add(className('function'))
			span.innerHTML = `f()`
			return span
		} else {
			const span = this.doc.createElement('span')
			span.classList.add(className(typeof value))
			span.innerHTML = value
			return span
		}
	}

	private onValueChange_() {
		this.refresh_();
	}

	public dispose(): void {
		this.value_.emitter.off('change', this.onValueChangeCB);
	}
}
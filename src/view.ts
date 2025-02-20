import {ClassName, Value, View, ViewProps} from '@tweakpane/core';

interface Config {
	value: Value<object>;
	viewProps: ViewProps;
}

type onChangeFnType = (value: {
													object: object,
													objPath: string,
													propPath: string,
													propName: string,
													newValue: string,
											 }) => void

// Create a class name generator from the view name
// ClassName('object-editor') will generate a CSS class name like tp-object-editorv
const className = ClassName('object-editor');

// Custom view class should implement View interface
export class PluginView implements View {
	public readonly element: HTMLElement;
	private value_: Value<object>;
	private editorInited: boolean = false;
	private readonly onValueChangeCB: OmitThisParameter<() => void>;
	private activeEditingElement: { el: HTMLElement, onChange: (value: any) => void } | null = null;

	constructor(private readonly doc: Document, private readonly config: Config) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);

		// Receive the bound value from the controller
		this.value_ = config.value;
		// Handle 'change' event of the value
		this.onValueChangeCB = this.onValueChange_.bind(this);
		this.value_.emitter.on('change', this.onValueChangeCB);

		config.viewProps.handleDispose(this.dispose.bind(this));

		setTimeout(() => {
			this.refresh_();
			this.editorInited = true;
		});
	}

	private refresh_(): void {
		this.element.innerHTML = '';
		const parent = this.element.parentElement;
		if (parent && parent.parentElement) {
			parent.parentElement.style.flexDirection = 'column';
			parent.parentElement.style.alignItems = 'flex-start';
			parent.style.width = '100%';
			this.element.style.height = 'max-content';
		}

		let rawValue = this.value_.rawValue;
		if('__tweakpane_object_editor_plugin_magic__' in rawValue) {
			rawValue = (rawValue as any).object;
		}
		this.closedObject(rawValue, false, this.element, true, (v) => {
			console.log('hello from view')
			this.value_.setRawValue({
				...v,
				__tweakpane_object_editor_plugin_magic__: true,
			}, {
				forceEmit: true,
				last: true
			});
		});
	}

	private closedObject(
		obj: Array<any> | Object,
		expanded: boolean = false,
		element: HTMLElement | null = null,
		firstInChain: boolean = true,
		onChange?: onChangeFnType,
		path: string = '',
	) {
		this.toggleObject(
			obj,
			expanded,
			element || this.element,
			true,
			firstInChain,
			onChange,
			path
		);
	}

	private toggleObject<T extends object>(
		obj: T,
		expanded: boolean = false,
		element: HTMLElement,
		create: boolean = false,
		firstInChain: boolean = true,
		onChange?: onChangeFnType,
		path: string = '',
	) {
		const keys = Object.keys(obj) as (keyof T)[];
		const values = Object.values(obj);
		if (create) {
			const button = document.createElement('button');
			button.innerText = '▼';
			const parent = document.createElement('span');
			let expanded: boolean = false;

			button.addEventListener('click', () => {
				if (expanded) {
					button.classList.add(className('expandable-btn'));
					button.classList.remove(className('button-opened'));
					button.innerText = '▼';
					this.toggleObject(obj, false, element, false, firstInChain, onChange, path);
					element.classList.remove(className('logs_first-object'));
					expanded = false;
				} else {
					button.classList.add(className('button-opened'));
					button.innerHTML = '';
					this.toggleObject(obj, true, element, false, firstInChain, onChange, path);
					button.appendChild(
						this.styleCollabsedKey(
							Object.getPrototypeOf(obj).constructor.name + ' ►',
						),
					);
					expanded = true;
				}
			});

			if (keys.length) {
				element.appendChild(button);
				parent.addEventListener('click', (event: MouseEvent) => {
					event.stopImmediatePropagation();
					if (!expanded) {
						button.classList.add(className('button-opened'));
						this.toggleObject(obj, true, element, false, firstInChain, onChange, path);
						button.appendChild(
							this.styleCollabsedKey(
								Object.getPrototypeOf(obj).constructor.name + ' ►',
							),
						);
						expanded = true;
					}
				});
			}
			element.appendChild(parent);
			element = parent;
		}
		element.innerHTML = '';
		if (!expanded) {
			// for shortened version
			element.classList.remove(className('logs_data-area'));
			const openingBraceText = this.doc.createTextNode(
				Array.isArray(obj) ? '[ ' : '{ ',
			);
			element.appendChild(openingBraceText);

			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const value = values[i];
				if (i > 3) {
					element.appendChild(this.styleCollabsedKey('...'));
					break;
				}
				if (Array.isArray(value)) {
					element.appendChild(this.styleCollabsedKey(key));
					element.appendChild(
						this.doc.createTextNode(': Array(' + value.length + ')'),
					);
				} else if (typeof value === 'object' && value !== null) {
					element.appendChild(this.styleCollabsedKey(key));
					element.appendChild(this.doc.createTextNode(': {...}'));
				} else {
					element.appendChild(this.styleCollabsedKey(key));
					element.appendChild(this.doc.createTextNode(': '));
					let valueElement = this.styleFieldValue(value, (newValue: any) => {
						obj[key] = newValue;
						onChange?.({
							object: obj,
							propName: String(key),
							objPath: path ?? '',
							propPath: path ? path + '.' + String(key): String(key),
							newValue,
						});
						const replaceEl = this.styleFieldValue(newValue, (newValue: any) => {
							obj[key] = newValue;
							onChange?.({
								object: obj,
								propName: String(key),
								objPath: path ?? '',
								propPath: path ? path + '.' + String(key): String(key),
								newValue,
							});
						})

						valueElement.parentElement?.replaceChild(replaceEl, valueElement)
						valueElement = replaceEl;
					})
					element.appendChild(valueElement);
				}
				element.appendChild(
					this.doc.createTextNode(i !== keys.length - 1 ? ', ' : ''),
				);
			}
			element.appendChild(
				this.doc.createTextNode(Array.isArray(obj) ? ' ]' : ' }'),
			);
			element.appendChild(this.doc.createElement('br'));
		} else {
			// for expanded version
			element.classList.add(className('logs_data-area'));
			if (firstInChain) element.classList.add(className('logs_first-object'));

			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const value = values[i];
				if (value instanceof Object && typeof value !== 'function') {
					// for objects and arrays
					const innerText = document.createElement('span');
					innerText.appendChild(this.styleFieldKey(key));
					innerText.appendChild(this.doc.createTextNode(': '));
					element.appendChild(innerText);
					this.closedObject(value, false, element, false, onChange);
				} else {
					const text = document.createElement('div');
					text.appendChild(this.styleFieldKey(key));
					text.appendChild(this.doc.createTextNode(': '));
					let valueElement = this.styleFieldValue(value, (newValue: any) => {
						obj[key] = newValue;
						onChange?.({
							object: obj,
							propName: String(key),
							objPath: path ?? '',
							propPath: path ? path + '.' + String(key): String(key),
							newValue,
						});
						const replaceEl = this.styleFieldValue(newValue, (newValue: any) => {
							obj[key] = newValue;
							onChange?.({
								object: obj,
								propName: String(key),
								objPath: path ?? '',
								propPath: path ? path + '.' + String(key): String(key),
								newValue,
							});
						})

						valueElement.parentElement?.replaceChild(replaceEl, valueElement)
						valueElement = replaceEl;
					})
					text.appendChild(valueElement);
					text.appendChild(this.doc.createTextNode(', '));
					text.appendChild(this.doc.createElement('br'));
					element.appendChild(text);
				}
			}
		}
	}
	private styleFieldKey(key: unknown): HTMLElement {
		const span = this.doc.createElement('span');
		span.classList.add(className('logs_field-key'));
		span.innerText = String(key);
		return span;
	}
	private styleCollabsedKey(key: unknown): HTMLElement {
		const span = this.doc.createElement('span');
		span.classList.add(className('logs_collapsed-key'));
		span.innerText = String(key);
		return span;
	}
	private styleFieldValue(
		value: any,
		onChange?: (value: any) => void,
	): HTMLElement {
		let classes: string[] = [className(`logs_field-value`)];
		const span = this.doc.createElement('span');

		if (typeof value === 'function') {
			classes.push(className('logs-field-value-function'));
			span.classList.add(...classes);
			span.innerText = 'f()';
		} else if (typeof value === 'number') {
			classes.push(className('logs_field-value-number'));
			span.classList.add(...classes);
			span.innerText = String(value);
		} else if (typeof value === 'boolean') {
			classes.push(className('logs_field-value-boolean'));
			span.classList.add(...classes);
			span.innerText = String(value);
		} else if (typeof value === 'string') {
			classes.push(className('logs_field-value-string'));
			span.classList.add(...classes);
			span.innerText = `"` + value + `"`;
		} else if (value === null) {
			classes.push(className('logs_field-value-null'));
			span.classList.add(...classes);
			span.innerText = 'null';
		} else {
			span.classList.add(...classes);
			span.innerText = value;
		}

		span.addEventListener('dblclick', () => {
			if(this.activeEditingElement) {
				this.activeEditingElement.el.contentEditable = 'false';
				onChange?.(this.parseEditedValue(this.activeEditingElement.el.innerText));
			}
			span.contentEditable = 'true';
			span.focus();
			this.activeEditingElement = { el: span, onChange: onChange || (() => {}) };
		});

		span.addEventListener('blur', () => {
			if(this.activeEditingElement) {
				this.activeEditingElement.el.contentEditable = 'false';
				onChange?.(this.parseEditedValue(this.activeEditingElement.el.innerText));
				this.activeEditingElement = null;
			}
		})

		return span;
	}

	private onValueChange_() {
		this.refresh_();
	}

	private parseEditedValue(value: string): any {
		if(value === 'f()') {
			return () => {}
		}

		return JSON.parse(value);
	}

	public dispose(): void {
		this.value_.emitter.off('change', this.onValueChangeCB);
	}
}

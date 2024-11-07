import {
	Controller,
	Value,
	ViewProps,
} from '@tweakpane/core';

import {PluginView} from './view.js';

interface Config {
	value: Value<object>;
	viewProps: ViewProps;
}

// Custom controller class should implement Controller interface
export class PluginController implements Controller<PluginView> {
	public readonly value: Value<object>;
	public readonly view: PluginView;
	public readonly viewProps: ViewProps;

	constructor(doc: Document, config: Config) {
		// Receive the bound value from the plugin
		this.value = config.value;

		// and also view props
		this.viewProps = config.viewProps;
		this.viewProps.handleDispose(() => {
			this.view?.dispose();
		});

		// Create a custom view
		this.view = new PluginView(doc, {
			value: this.value,
			viewProps: this.viewProps,
		});

		// You can use PointerHandler to handle pointer events in the same way as Tweakpane do
	}
}
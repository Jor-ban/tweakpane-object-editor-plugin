import {
	BaseInputParams,
	BindingTarget,
	CompositeConstraint,
	createPlugin,
	createRangeConstraint,
	createStepConstraint,
	InputBindingPlugin,
	parseRecord,
} from '@tweakpane/core';

import {PluginController} from './controller.js';

export interface PluginInputParams extends BaseInputParams {
	view: 'object-editor';
}

// NOTE: JSDoc comments of InputBindingPlugin can be useful to know details about each property
//
// InputBindingPlugin<In, Ex, P> means...
// - The plugin receives the bound value as Ex,
// - converts Ex into In and holds it
// - P is the type of the parsed parameters
//
export const ObjectEditorPlugin: InputBindingPlugin<
	object,
	object,
	PluginInputParams
> = createPlugin({
	id: 'object-editor',

	// type: The plugin type.
	// - 'input': Input binding
	// - 'monitor': Monitor binding
	// - 'blade': Blade without binding
	type: 'input',

	accept(exValue: any, params: Record<string, unknown>) {
		if (typeof exValue !== 'object') {
			// Return null to deny the user input
			return null;
		}

		// Parse parameters object
		const result = parseRecord<PluginInputParams>(params, (p) => ({
			// view option may be useful to provide a custom control for primitive values
			view: p.required.constant('object-editor'),
		}));

		if (!result) {
			return null;
		}

		// Return a typed value and params to accept the user input
		return {
			initialValue: exValue,
			params: result,
		};
	},

	binding: {
		reader(_args) {
			return (exValue: unknown): object => {
				// Convert an external unknown value into the internal value
				return typeof exValue === 'object' && exValue !== null ? exValue : {};
			};
		},

		writer(_args) {
			return (target: BindingTarget, inValue) => {
				// Use target.write() to write the primitive value to the target,
				// or target.writeProperty() to write a property of the target
				target.write(inValue);
			};
		},
	},

	controller(args) {
		// Create a controller for the plugin
		return new PluginController(args.document, {
			value: args.value,
			viewProps: args.viewProps,
		});
	},
});
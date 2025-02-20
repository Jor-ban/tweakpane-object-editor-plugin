# Tweakpane Object Editor Plugin
Object editor plugin for [Tweakpane][tweakpane].

## Installation
```shell
$ npm install tweakpane-object-editor-plugin
```


## Usage
```js
import {Pane} from 'tweakpane';
import * as ObjectEditorPlugin from 'tweakpane-object-editor-plugin';

const parent = {
  a: 'bruh',
  b: 1,
  sayHello: function() {
    console.log('Hello');
  },
  isAuthenticated: false,
  params: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  child: {
    parent: null
  }
}

setTimeout(() => {
  parent.child.parent = parent;
});

const params = { parent };

const pane = new Pane();
// Register plugin
pane.registerPlugin(ObjectEditorPlugin);

// TODO: Update parameters for your plugin
pane.addBinding(params, 'parent', {
  view: 'object-editor',
}).on('change', (ev) => {
  console.log(ev.value);
});
```


[tweakpane]: https://github.com/cocopon/tweakpane/

import wypst from 'wypst';
import wasm from 'wypst/core/core_bg.wasm';
import '@logseq/libs';

import { settings } from "./settings.ts";

import 'katex/dist/katex.css';

const React = logseq.Experiments.React;

interface WypstSettings {
	fallbackToLatexOnError: boolean
}

const DEFAULT_SETTINGS: Partial<WypstSettings> = {
	fallbackToLatexOnError: false,
};

var wypstSettings: WypstSettings = DEFAULT_SETTINGS;

function onSettingsChanged(a: settings, b: settings) {
	wypstSettings.fallbackToLatexOnError = b["wypst:fallbackOnTypstError"];
}

await wypst.init(wasm);

// Actual katex object
var katex = undefined;

// Original katex functions
var unmodifiedKatexFunctions: {
	render: any,
	renderToString: any
} = {};


function hasLatexCommand(expr: string) {
	const regex = /\\\S/;
	return regex.test(expr);
}

// Renders maths to string, supports typst and latex, preferrs typst
const renderToString = function(expression, options): string {
	if (!hasLatexCommand(expression)) {
		try {
			return wypst.renderToString(expression, options);
		} catch (error) {
			if (wypstSettings.fallbackToLatexOnError) {
				return unmodifiedKatexFunctions.renderToString(expression, options);
			}

			return '<span style="color: red;">${error}</span>';
		}
	} else {
		return unmodifiedKatexFunctions.renderToString(expression, options);
	}
}
// Renders maths to dom, supports typst and latex, preferrs typst
const render = function(expression, baseNode, options) {
	if (!hasLatexCommand(expression)) {
		try {
			wypst.render(expression, baseNode, options);
		} catch (error) {
			if (wypstSettings.fallbackToLatexOnError) {
				unmodifiedKatexFunctions.render(expression, baseNode, options);
			}
		}
	} else {
		unmodifiedKatexFunctions.render(expression, baseNode, options);
	}
}

// DO NOT CALL TWICE!!!!!
function overrideKatexRendering() {
	const host = logseq.Experiments.ensureHostScope();
	// store the original functions for use on fallback and to reset when the plugin is disabled at runtime
	unmodifiedKatexFunctions.render = host.katex.render;
	unmodifiedKatexFunctions.renderToString = host.katex.renderToString;
	// override katex rendering functions with custom ones
	host.katex.render = render;
	host.katex.renderToString = renderToString;
}

async function load(): Promise<void> {
	const host = logseq.Experiments.ensureHostScope();

	// I did not find a clean way to do this, so I am modifying the katex object directly
	// Katex apparently gets loaded after plugins
	// This lays a trap to catch when katex gets initialized to instantly modify it; if it isn't yet initialized
	if (host["katex"] === undefined) {
		console.log("Waiting for katex to be initialized...");

		Object.defineProperty(host, "katex", {
			configurable: true,
			enumerable: true,
			get() {
				return katex;
			},
			set(value) {
				console.log("Katex appeared!");
				katex = value;

				overrideKatexRendering();

				console.log("Katex overridden!");
			}
		});
	} else {
		overrideKatexRendering();
		console.log("Katex overridden - LaTeX images may persist until reload");
	}
}

// Renders a string as typst
function renderWypst(probs: { content: string }): React.Element {
	const options = {
		output: 'html',
		displayMode: true,
	};
	const res = renderToString(probs.content, options);
	return React.createElement('div', {
		dangerouslySetInnerHTML: { __html: res }
	});
}

function main() {
	logseq.onSettingsChanged<settings>(onSettingsChanged);

	// Set up fenced code renderer
	logseq.Experiments.registerFencedCodeRenderer(
		'typst', {
			edit: false,
			render: renderWypst
		}
	);

	// Set up inline renderer
	load().then(() => {
		
	}).catch(err => {
		logseq.App.showMsg(err);
	});

	// Set up unload callback
	logseq.beforeunload(async () => {
		const host = logseq.Experiments.ensureHostScope();
		// Return katex to it's original state 
	 	host.katex.render = unmodifiedKatexFunctions.render;
		host.katex.renderToString = unmodifiedKatexFunctions.renderToString;

		console.log("Katex reset to original.");	
	});
}

logseq.useSettingsSchema(settings).ready(main).catch(console.error);

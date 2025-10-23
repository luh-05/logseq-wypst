// import { App, MarkdownView, Plugin, PluginSettingTab, Setting, loadMathJax } from 'obsidian';
import wypst from 'wypst';
import wasm from 'wypst/core/core_bg.wasm';
import '@logseq/libs';
// import * as React from 'react';

import { settings } from "./settings.ts";



import 'katex/dist/katex.css';
// import 'default.css';

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

var unmodifiedKatexFunctions: {
	render: any,
	renderToString: any
} = {};

await wypst.init(wasm);

async function waitForProperty<T, K extends keyof T>(obj: T, prop: K, interval = 10): Promise<T[K]> {
	return new Promise(resolve => {
        const handle = setInterval(() => {
            if (obj[prop] !== undefined) {
                clearInterval(handle);
                resolve(obj[prop]);
            }
        }, interval);
    });
}

var katex = undefined;

const renderToString = function(expression, options): string {
	try {
		return wypst.renderToString(expression, options);
	} catch (error) {
		if (wypstSettings.fallbackToLatexOnError) {
			return unmodifiedKatexFunctions.renderToString(expression, options);
		}

		return '<span style="color: red;">${error}</span>';
	}
}
const render = function(expression, baseNode, options) {
	try {
		wypst.render(expression, baseNode, options);
	} catch (error) {
		if (wypstSettings.fallbackToLatexOnError) {
			unmodifiedKatexFunctions.render(expression, baseNode, options);
		}
	}
}

function overrideKatexRendering() {
	const host = logseq.Experiments.ensureHostScope();
	unmodifiedKatexFunctions.render = host.katex.render;
	unmodifiedKatexFunctions.renderToString = host.katex.renderToString;
	host.katex.render = render;
	host.katex.renderToString = renderToString;
}

async function load(): Promise<void> {
	const host = logseq.Experiments.ensureHostScope();

	if (host["katex"] === undefined) {
		console.log("Waiting for katex to be initialized...");

		Object.defineProperty(host, "katex", {
			configurable: true,
			enumerable: true,
			get() {
				return katex;
			},
			set(value) {
				console.log("Katex Appeared!");
				katex = value;

				overrideKatexRendering();

				console.log("Katex overridden!");
			}
		});
	} else {
		overrideKatexRendering();
		console.log("Katex overridden - LaTeX images will persist until reload");
	}
}

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

	logseq.Experiments.registerFencedCodeRenderer(
		'typst', {
			edit: false,
			render: renderWypst
		}
	);

	load().then(() => {
		
	}).catch(err => {
		logseq.App.showMsg(err);
	});

	logseq.beforeunload(async () => {
		const host = logseq.Experiments.ensureHostScope();
	 	host.katex.render = unmodifiedKatexFunctions.render;
		host.katex.renderToString = unmodifiedKatexFunctions.renderToString;

		Object.defineProperty(host, "katex", katex);		
	});

}


logseq.useSettingsSchema(settings).ready(main).catch(console.error);

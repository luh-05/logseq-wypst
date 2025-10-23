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

// export default class Wypst extends Plugin {
// 	settings: WypstSettings
// 	_tex2chtml: any;

// 	async onload() {
// 		await this.loadSettings();
// 		this.addSettingTab(new WypstSettingTab(this.app, this));

// 		await loadMathJax();

// 		if (!globalThis.MathJax) {
// 			throw new Error("MathJax failed to load.");
// 		}

// 		await wypst.init(wasm);

// 		const parser = new DOMParser();
// 		this._tex2chtml = globalThis.MathJax.tex2chtml;

// 		globalThis.MathJax.tex2chtml = (e, r) => {
// 			if (!hasLatexCommand(e)) {
// 				const renderSettings = {
// 					displayMode: r.display,
// 				}
// 				let renderedString = '';

// 				try {
// 					renderedString = wypst.renderToString(e, renderSettings);
// 				} catch (error) {
// 					if (this.settings.fallbackToLatexOnError) {
// 						return this._tex2chtml(e, r);
// 					}
// 					renderedString = `<span style="color: red;">${error}</span>`;
// 				}
// 				return parser.parseFromString(renderedString, "text/html").body.firstChild;
// 			} else {
// 				return this._tex2chtml(e, r);
// 			}
// 		};

// 		this.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode.rerender(true);
// 	}

// 	async loadSettings() {
// 		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
// 	}

// 	async saveSettings() {
// 		await this.saveData(this.settings);
// 	}

// 	onunload() {
// 		globalThis.MathJax.tex2chtml = this._tex2chtml;
// 		this.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode.rerender(true);
// 	}
// }

// export class WypstSettingTab extends PluginSettingTab {
// 	plugin: Wypst;

// 	constructor(app: App, plugin: Wypst) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const { containerEl } = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName("Fallback to LaTeX on error")
// 			.setDesc("Always fallback to LaTeX when Wypst fails to render an expression (experimental)")
// 			.addToggle(toggle => {
// 				toggle
// 					.setValue(this.plugin.settings.fallbackToLatexOnError)
// 					.onChange(async value => {
// 						this.plugin.settings.fallbackToLatexOnError = value;
// 						await this.plugin.saveSettings();
// 					})
// 			})
// 	}
// }

var wypstSettings: WypstSettings = DEFAULT_SETTINGS;

// function hasLatexCommand(expr: string) {
// 	const regex = /\\\S/;
// 	return regex.test(expr);
// }

function onSettingsChanged(a: settings, b: settings) {
	// logseq.App.showMsg("Changed settings!");
	console.log(a);
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

function overrideKatexRendering() {
	const host = logseq.Experiments.ensureHostScope();
	unmodifiedKatexFunctions.render = host.katex.render;
	unmodifiedKatexFunctions.renderToString = host.katex.renderToString;
	host.katex.render = wypst.render;
	host.katex.renderToString = wypst.renderToString;
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
	const res = wypst.renderToString(probs.content, options);
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

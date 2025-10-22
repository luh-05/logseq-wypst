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

function hasLatexCommand(expr: string) {
	const regex = /\\\S/;
	return regex.test(expr);
}

function onSettingsChanged(a: settings, b: settings) {
	logseq.App.showMsg("Changed settings!");
	console.log(a);
	wypstSettings.fallbackToLatexOnError = b["wypst:fallbackOnTypstError"];
}

class SearchServices implements IPluginsSearchServiceHooks {
	name: string = "logseq-wypst";
	async onBlocksChanged(graph: string, changes: {
		added: Array<SearchBlockItem>,
		removed: Array<BlockEntity>
	}): Promise<void> {
		console.log("blocks changed: ", changes, " on ", graph);
	}
}

function handleChange(e: any) {
	console.log("db, changed", e);
}

var changeHook: IUserOffHook;

async function load(): Promise<void> {
	await wypst.init(wasm);
	// const parser = new DOMParser();
	// await new Promise(resolve => setTimeout(resolve, 1000));

	// logseq.onBlocksChanged((graph: string, changes: {
	// 	added: SearchBlockItem[];
	// 	removed: BlockEntity[];
	// }) => {
	// 		console.log("changed block");
	// 	});

	// var s = new SearchServices();
	// logseq.App.registerSearchService(s);

	// logseq.Editor.onBlockChanged

	// logseq.DB.onChanged(new IUserHook<ChangeData, () => {
	// 		console.log("db changed");
	// 	}>
	// 	);
	
}

function renderWypst(probs: { content: string }): React.Element {
	const host = logseq.Experiments.ensureHostScope();
	// const React = logseq.Experiments.React;

	// React.useEffect(() => {
	// 	// loadCSS(host.document, '')

		
	// }, []);
	const options = {
		output: 'html',
		displayMode: true,
	};
	// console.log(options.displayMode);
	const res = wypst.renderToString(probs.content, options);
	// return ( <div dangerouslySetInnerHTML={{ __html: res }} /> )
	// return (
	// 	<h1>test</h1>
	// );
	return React.createElement('div', {
		dangerouslySetInnerHTML: { __html: res }
	});
}

function main() {
	logseq.onSettingsChanged<settings>(onSettingsChanged);
	logseq.App.showMsg("Loading typst plugin...");

	load().then(() => {
		
	}).catch(err => {
		logseq.App.showMsg(err);
	});
	// changeHook = logseq.DB.onChanged(handleChange);

	// const enhancer = async (v) => { console.log(v); return "test"; };
	// logseq.Experiments.registerExtensionsEnhancer("katex", enhancer);
	// logseq.Experiments.invokeExperMethod(
	// 	'registerExtensionsEnhancer',
	// 	logseq.baseInfo.id,
	// 	'katex',
	// 	enhancer
	// );
	logseq.Experiments.registerFencedCodeRenderer(
		'typst', {
			edit: false,
			render: renderWypst
		}
	);

	logseq.beforeunload(async () => {
		// changeHook();
	});
	
	logseq.App.showMsg("Typst plugin loaded!");
}


logseq.useSettingsSchema(settings).ready(main).catch(console.error);
// logser.onSettingsChanged<settings>((a,b) => {logseq.App.showMsg("Changed settings!");}).useSettingsSchema(settings).ready(main).catch(console.error);

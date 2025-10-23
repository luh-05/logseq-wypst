import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";

export const fallbackOnTypstError: SettingSchemaDesc = {
  key: "wypst:fallbackOnTypstError",
  title: "Fall back on Latex on Error (experimental)?",
  description: "Always fall back on LaTeX when Typst fails.",
  type: "boolean",
  default: false,
};
export const renderCodeBlocks: SettingSchemaDesc = {
  key: "wypst:renderCodeBlocks",
  title: "Render fenced code blocks as Math?",
  description: "When enabled, will render fenced typst codeblocks as maths. Disabling will restart Logseq.",
  type: "boolean",
  default: false,
};

export const settings: SettingSchemaDesc[] = [
  fallbackOnTypstError,
  renderCodeBlocks
];


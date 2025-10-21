import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";

export const fallbackOnLatexError: SettingSchemaDesc = {
  key: "",
  title: "Fall back on Latex on Error (experimental)?",
  description: "Always fall back on LaTeX when Typst fails",
  type: "boolean",
  default: false,
}

export const settings: SettingSchemaDesc[] = [
  fallbackOnLatexError
];


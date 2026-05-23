import type {ESLint} from 'eslint'

import {collapseExportBlockRule, collapseSingleMemberRule, normalizeCommentsRule, removeEmptyExportRule, stripLineCommentsRule} from './rules/index.ts'

export const minifyDtsPluginName = 'minify-dts' as const

export const minifyDtsRules = {
  'collapse-export-block': collapseExportBlockRule,
  'collapse-single-member': collapseSingleMemberRule,
  'normalize-comments': normalizeCommentsRule,
  'remove-empty-export': removeEmptyExportRule,
  'strip-line-comments': stripLineCommentsRule,
} satisfies NonNullable<ESLint.Plugin['rules']>

export type MinifyDtsRuleName = keyof typeof minifyDtsRules

const eslintPluginMinifyDts = {
  meta: {
    name: minifyDtsPluginName,
    version: '0.1.0',
  },
  rules: minifyDtsRules,
} satisfies ESLint.Plugin

export {collapseExportBlockRule, collapseSingleMemberRule, normalizeCommentsRule, removeEmptyExportRule, stripLineCommentsRule}
export default eslintPluginMinifyDts

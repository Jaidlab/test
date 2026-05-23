import type {ESLint} from 'eslint'

import stylistic from '@stylistic/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import {Linter} from 'eslint'
import eslintPluginMinifyDts, {minifyDtsPluginName} from 'eslint-plugin-minify-dts'

export const createMinifyDtsConfig = (): Array<Linter.Config> => {
  return [
    {
      name: 'minify-dts',
      files: ['**/*.d.ts'],
      languageOptions: {
        parser: tsParser,
      },
      plugins: {
        '@stylistic': stylistic as ESLint.Plugin,
        [minifyDtsPluginName]: eslintPluginMinifyDts,
      },
      rules: {
        '@stylistic/semi': ['error', 'never'] as const,
        '@stylistic/indent': ['error', 0] as const,
        '@stylistic/member-delimiter-style': [
          'error', {
            multiline: {
              delimiter: 'none' as const,
              requireLast: false,
            },
            singleline: {
              delimiter: 'comma' as const,
              requireLast: false,
            },
          },
        ] as const,
        '@stylistic/comma-dangle': ['error', 'never'] as const,
        'no-multiple-empty-lines': [
          'error', {
            max: 0,
          },
        ] as const,
        [`${minifyDtsPluginName}/collapse-single-member`]: 'error' as const,
        [`${minifyDtsPluginName}/collapse-export-block`]: 'error' as const,
        [`${minifyDtsPluginName}/remove-empty-export`]: 'error' as const,
        [`${minifyDtsPluginName}/strip-line-comments`]: 'error' as const,
        [`${minifyDtsPluginName}/normalize-comments`]: 'error' as const,
      },
    },
  ]
}

export const minifyDts = (code: string): string => {
  const linter = new Linter({configType: 'flat'})
  const result = linter.verifyAndFix(code, createMinifyDtsConfig(), 'input.d.ts')
  return result.output
}

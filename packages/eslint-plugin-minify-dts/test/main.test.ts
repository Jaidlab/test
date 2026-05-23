import {describe, expect, test} from 'bun:test'

import tsParser from '@typescript-eslint/parser'
import {Linter} from 'eslint'

import eslintPluginMinifyDts, {minifyDtsPluginName, minifyDtsRules} from '../src/main.ts'

const runRule = (ruleName: keyof typeof minifyDtsRules, code: string): Linter.FixReport => {
  const linter = new Linter({configType: 'flat'})
  return linter.verifyAndFix(code, [
    {
      files: ['**/*.d.ts'],
      languageOptions: {
        parser: tsParser,
      },
      plugins: {
        [minifyDtsPluginName]: eslintPluginMinifyDts,
      },
      rules: {
        [`${minifyDtsPluginName}/${ruleName}`]: 'error',
      },
    },
  ], 'fixture.d.ts')
}
describe('eslintPluginMinifyDts', () => {
  test('exports plugin metadata and rules', () => {
    expect(minifyDtsPluginName).toBe('minify-dts')
    expect(eslintPluginMinifyDts.meta).toEqual({
      name: 'minify-dts',
      version: '0.1.0',
    })
    expect(eslintPluginMinifyDts.rules).toBe(minifyDtsRules)
    expect(Object.keys(minifyDtsRules).toSorted()).toEqual([
      'collapse-export-block',
      'collapse-single-member',
      'normalize-comments',
      'remove-empty-export',
      'strip-line-comments',
    ])
  })
  test('collapses a single-member class body', () => {
    const result = runRule('collapse-single-member', ['declare class Foo {', '\tconstructor(input: string);', '}'].join('\n'))
    expect(result.output).toBe('declare class Foo {constructor(input: string)}')
  })
  test('collapses a multi-line named export block', () => {
    const result = runRule('collapse-export-block', ['export {', '\tfoo as default,', '\tbar,', '}'].join('\n'))
    expect(result.output).toBe('export {foo as default, bar}')
  })
  test('removes an empty export marker', () => {
    const result = runRule('remove-empty-export', 'export {}')
    expect(result.output).toBe('')
  })
  test('strips line comments', () => {
    const result = runRule('strip-line-comments', ['// #region', 'export declare const answer: number'].join('\n'))
    expect(result.output).not.toContain('// #region')
    expect(result.output).toContain('export declare const answer: number')
  })
  test('normalizes block comments', () => {
    const result = runRule('normalize-comments', ['/**', ' * Hello world  ', ' *  ', ' */'].join('\n'))
    expect(result.output).toBe(['/**', '* Hello world', '*', '*/'].join('\n'))
  })
})

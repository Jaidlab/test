import {describe, expect, test} from 'bun:test'

import {Linter} from 'eslint'
import eslintPluginMinifyDts, {minifyDtsPluginName} from 'eslint-plugin-minify-dts'

import {createMinifyDtsConfig} from '../src/main.ts'

const runMinify = (code: string): Linter.FixReport => {
  const linter = new Linter({configType: 'flat'})
  return linter.verifyAndFix(code, createMinifyDtsConfig(), 'fixture.d.ts')
}
describe('createMinifyDtsConfig', () => {
  test('config has correct shape', () => {
    const config = createMinifyDtsConfig()
    expect(config).toBeArray()
    expect(config[0]?.files).toEqual(['**/*.d.ts'])
    expect(config[0]?.plugins?.[minifyDtsPluginName]).toBe(eslintPluginMinifyDts)
    expect(config[0]?.rules?.['@stylistic/semi']).toEqual(['error', 'never'])
    expect(config[0]?.rules?.['@stylistic/indent']).toEqual(['error', 0])
    expect(config[0]?.rules?.['@stylistic/member-delimiter-style']).toEqual([
      'error', {
        multiline: {
          delimiter: 'none',
          requireLast: false,
        },
        singleline: {
          delimiter: 'comma',
          requireLast: false,
        },
      },
    ])
    expect(config[0]?.rules?.['@stylistic/comma-dangle']).toEqual(['error', 'never'])
    expect(config[0]?.rules?.['no-multiple-empty-lines']).toEqual(['error', {max: 0}])
    expect(config[0]?.rules?.[`${minifyDtsPluginName}/collapse-single-member`]).toBe('error')
    expect(config[0]?.rules?.[`${minifyDtsPluginName}/collapse-export-block`]).toBe('error')
    expect(config[0]?.rules?.[`${minifyDtsPluginName}/remove-empty-export`]).toBe('error')
    expect(config[0]?.rules?.[`${minifyDtsPluginName}/strip-line-comments`]).toBe('error')
    expect(config[0]?.rules?.[`${minifyDtsPluginName}/normalize-comments`]).toBe('error')
  })
  test('removes semicolons, indentation and empty markers', () => {
    const result = runMinify(['declare class Foo {', '\tbar(): void;', '\tbaz(): number;', '}', ''].join('\n'))
    expect(result.output).not.toContain(';')
    expect(result.output).not.toContain('\t')
    expect(result.output).toContain('bar(): void')
    expect(result.output).toContain('baz(): number')
  })
  test('removes indentation and trailing semicolons', () => {
    const result = runMinify('export declare function foo(): void;')
    expect(result.output).toBe('export declare function foo(): void')
  })
  test('removes member delimiter semicolons', () => {
    const result = runMinify(['declare interface Foo {', '\tx: string;', '\ty: number;', '}'].join('\n'))
    expect(result.output).not.toContain(';')
    expect(result.output).toContain('x: string')
    expect(result.output).toContain('y: number')
  })
  test('removes trailing commas and indentation', () => {
    const result = runMinify(['export {', '\tfoo,', '\tbar,', '};'].join('\n'))
    expect(result.output).toBe('export {foo, bar}')
  })
  test('removes blank lines', () => {
    const result = runMinify(['export declare const x: number;', '', 'export declare const y: string;'].join('\n'))
    expect(result.output).not.toContain('\n\n')
    expect(result.output).toContain('x: number')
    expect(result.output).toContain('y: string')
  })
  test('collapses single-member class body', () => {
    const result = runMinify(['declare class Foo {', '\tconstructor(x: string);', '}'].join('\n'))
    expect(result.output).toBe('declare class Foo {constructor(x: string)}')
  })
  test('collapses single-member interface body', () => {
    const result = runMinify(['export interface TypedFactory extends SchemaMethods {', '\t<SetupGeneric extends Setup = {}>(): Schema<SetupGeneric>;', '}'].join('\n'))
    expect(result.output).toContain('<SetupGeneric extends Setup')
    expect(result.output).not.toContain('\n')
  })
  test('collapses multi-line export block', () => {
    const result = runMinify(['export {', '\tcomposeId as default,', '};'].join('\n'))
    expect(result.output).toBe('export {composeId as default}')
  })
  test('removes empty export {}', () => {
    const result = runMinify(['export declare const x: number;', '', 'export {};'].join('\n'))
    expect(result.output).not.toContain('export {}')
    expect(result.output).toContain('x: number')
  })
  test('normalizes comment whitespace', () => {
    const result = runMinify(['declare class Foo {', '\t/**', '\t * JSDoc', '\t */', '\tbar(): void', '}'].join('\n'))
    expect(result.output).toContain('/**')
    expect(result.output).toContain('* JSDoc')
    expect(result.output).toContain('*/')
    expect(result.output).not.toContain(' *')
  })
  test('matches compose-id fixture', async () => {
    const before = await Bun.file(new URL('fixture/compose-id/before.d.ts', import.meta.url)).text()
    const expected = await Bun.file(new URL('fixture/compose-id/after.d.ts', import.meta.url)).text()
    const result = runMinify(before)
    expect(result.output).toBe(expected)
  })
  test('minifies optis fixture', async () => {
    const before = await Bun.file(new URL('fixture/optis/before.d.ts', import.meta.url)).text()
    const result = runMinify(before)
    const {default: typescript} = await import('typescript')
    const sourceFile = typescript.createSourceFile('optis.d.ts', result.output, typescript.ScriptTarget.Latest, false, typescript.ScriptKind.TS)
    const diagnostics = (sourceFile as {parseDiagnostics?: Array<unknown>}).parseDiagnostics ?? []
    expect(diagnostics).toHaveLength(0)
    expect(result.output).not.toContain('\t')
    expect(result.output.length).toBeLessThan(before.length)
    expect(result.output).not.toContain('export {}')
  })
})

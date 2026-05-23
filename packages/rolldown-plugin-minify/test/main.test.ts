import {describe, expect, test} from 'bun:test'

import createMinifyJavaScriptPlugin, {minifyJavaScript} from '../src/main.ts'

describe('minifyJavaScript', () => {
  test('removes comments and unnecessary whitespace', async () => {
    const originalCode = [
      '// a comment',
      'export const answer = () => {',
      '  return 42',
      '}',
    ].join('\n')
    const result = await minifyJavaScript(originalCode)
    expect(result.originalSize).toBeGreaterThan(result.minifiedSize)
    expect(result.code.trim()).toBe('export const answer=()=>42')
  })
  test('exports a plugin factory', () => {
    expect(createMinifyJavaScriptPlugin()).toHaveProperty('name', 'minify-javascript')
  })
})

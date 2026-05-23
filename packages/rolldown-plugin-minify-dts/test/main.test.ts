import {describe, expect, test} from 'bun:test'

import createMinifyTypeDeclarationsPlugin, {minifyTypeDeclarations} from '../src/main.ts'

describe('minifyTypeDeclarations', () => {
  test('removes trivia while keeping declarations valid', () => {
    const originalCode = [
      '// a comment',
      'export declare const answer:',
      '  () => number',
    ].join('\n')
    const result = minifyTypeDeclarations(originalCode)
    expect(result.originalSize).toBeGreaterThan(result.minifiedSize)
    expect(result.code).toBe('export declare const answer:()=>number')
  })
  test('exports a plugin factory', () => {
    expect(createMinifyTypeDeclarationsPlugin()).toHaveProperty('name', 'minify-type-declarations')
  })
})

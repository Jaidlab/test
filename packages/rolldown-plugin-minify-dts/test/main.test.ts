import {describe, expect, test} from 'bun:test'

import createMinifyTypeDeclarationsPlugin from '../src/main.ts'

describe('createMinifyTypeDeclarationsPlugin', () => {
  test('plugin has correct name', () => {
    const plugin = createMinifyTypeDeclarationsPlugin()
    expect(plugin.name).toBe('minify-type-declarations')
  })
})

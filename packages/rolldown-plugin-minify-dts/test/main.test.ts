import {describe, expect, test} from 'bun:test'

import rolldownPluginMinifyDts from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(rolldownPluginMinifyDts).toBeDefined()
  })
})
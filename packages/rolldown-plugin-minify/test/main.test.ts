import {describe, expect, test} from 'bun:test'

import rolldownPluginMinify from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(rolldownPluginMinify).toBeDefined()
  })
})
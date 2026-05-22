import {describe, expect, test} from 'bun:test'

import rolldownPluginBundil from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(rolldownPluginBundil).toBeDefined()
  })
})
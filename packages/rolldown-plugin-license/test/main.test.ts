import {describe, expect, test} from 'bun:test'

import rolldownPluginLicense from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(rolldownPluginLicense).toBeDefined()
  })
})
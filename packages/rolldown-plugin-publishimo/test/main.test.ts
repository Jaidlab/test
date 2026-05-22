import {describe, expect, test} from 'bun:test'

import rolldownPluginPublishimo from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(rolldownPluginPublishimo).toBeDefined()
  })
})
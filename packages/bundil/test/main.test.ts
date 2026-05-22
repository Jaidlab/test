import {describe, expect, test} from 'bun:test'

import bundil from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(bundil).toBeDefined()
  })
})
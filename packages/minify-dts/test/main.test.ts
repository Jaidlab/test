import {describe, expect, test} from 'bun:test'

import eslintConfigMinifyDts from '../src/main.ts'

describe('undefined', () => {
  test('placeholder test', () => {
    expect(eslintConfigMinifyDts).toBeDefined()
  })
})
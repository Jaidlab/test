import {expect, it} from 'bun:test'

import {getMainModuleDefault} from 'zeug'

const {default: test} = await import('#src/main.ts')
it('should run', () => {
  expect(test).toBe(1) // TODO Test actual functionality
})

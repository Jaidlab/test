import {expect, it} from 'bun:test'

import {getMainModuleDefault} from 'zeug'

const test = await getMainModuleDefault<typeof import('test')>('test')

it('should run', () => {
  expect(test).toBe(1) // TODO Test actual functionality
})

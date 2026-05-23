import {expect, test} from 'bun:test'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import fs from 'fs-extra'
import {rolldown} from 'rolldown'

import readmePlugin from '../src/main.ts'

test('copies readme.md to README.md', async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), 'rolldown-plugin-readme-'))
  await fs.mkdir(join(cwd, 'src'), {recursive: true})
  await Bun.write(join(cwd, 'package.json'), JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    type: 'module',
  }))
  await Bun.write(join(cwd, 'src/main.ts'), 'export default 1\n')
  await Bun.write(join(cwd, 'readme.md'), '# Fixture\n')
  const bundle = await rolldown({
    cwd,
    input: 'src/main.ts',
    plugins: [readmePlugin()],
  })
  await bundle.write({
    dir: join(cwd, 'dist'),
    format: 'es',
  })
  await bundle.close()
  expect(await Bun.file(join(cwd, 'dist/README.md')).text()).toBe('# Fixture\n')
})

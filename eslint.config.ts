import type {Linter} from 'eslint'

import {makeEslintConfig} from 'eslint-config-jaid'

const eslintConfig: Array<Linter.Config> = [
  {
    ignores: ['private/**'],
  },
  ...makeEslintConfig(),
]

export default eslintConfig

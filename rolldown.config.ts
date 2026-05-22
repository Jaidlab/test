import type {RolldownOptions} from 'rolldown'

import bundilPlugin from 'rolldown-plugin-bundil'

const config: RolldownOptions = {
  plugins: [bundilPlugin()],
}

export default config

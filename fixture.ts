import assert from 'node:assert/strict'
import {rm} from 'node:fs/promises'
import pc from 'picocolors'

const stage = process.argv[2]
const out = 'site/out', record = `${out}/.well-known/build.json`, moduleFile = `${out}/marker.js`
const sha = (await Bun.$`git rev-parse HEAD`.text()).trim()
if (stage === 'build') {
  assert.equal(process.env.RUN_LINT, 'false')
  assert.equal(process.env.PACKAGE_SCRIPTS, 'build')
  assert.ok(await Bun.file(`${out}/stale.txt`).exists())
  await rm(out, {recursive: true})
  const {run, nonce} = {run: process.env.GITHUB_RUN_ID, nonce: crypto.randomUUID()}
  await Bun.write(record, JSON.stringify({sha, run, nonce}))
  await Bun.write(moduleFile, `export default '${nonce}'\n`)
  await Bun.write(`${out}/index.html`, '<!doctype html><h1>Shared build</h1><p></p><script type="module">import nonce from "/marker.js"; document.querySelector("p").textContent=nonce; document.body.id="ready"</script>')
} else {
  assert.ok(['lint', 'test'].includes(stage))
  assert.equal(process.env.RUN_LINT, stage === 'lint' ? 'true' : 'false')
  assert.equal(process.env.PACKAGE_SCRIPTS, stage === 'lint' ? '' : 'test')
  assert.equal(await Bun.file(`${out}/stale.txt`).exists(), false)
  const build = await Bun.file(record).json()
  assert.equal(build.sha, sha)
  assert.equal(build.run, process.env.GITHUB_RUN_ID)
  assert.equal((await import(`./${moduleFile}`)).default, build.nonce)
}
const hash = Bun.CryptoHasher.hash('sha256', await Bun.file(moduleFile).arrayBuffer(), 'hex')
console.log(pc.green(`Shared build: ${stage} ${process.platform} ${sha} ${hash}`))

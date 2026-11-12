import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const FILE = process.env.DATA_FILE || path.join(dir, 'data.json')
let data

export function load() {
  if (fs.existsSync(FILE)) data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  else data = { meta: {}, users: [], products: [], orders: [], otps: {}, seq: { user: 0, product: 0, order: 1000 } }
  data.reviews ??= []
  data.messages ??= []
  for (const k of ['user', 'product', 'order', 'review', 'message']) data.seq[k] ??= k === 'order' ? 1000 : 0
  return data
}
export const db = () => data
export function save() {
  const tmp = FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, FILE)
}
export const nextId = (k) => ++data.seq[k]

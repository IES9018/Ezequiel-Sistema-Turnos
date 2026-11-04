import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const PRESUPUESTO_KB = 200
const dir = join(process.cwd(), 'dist', 'assets')

let archivos
try {
  archivos = readdirSync(dir).filter((f) => f.endsWith('.js'))
} catch {
  console.error('No existe dist/assets. Ejecutá "npm run build" antes de "npm run budget".')
  process.exit(1)
}

let total = 0
for (const archivo of archivos) {
  const gz = gzipSync(readFileSync(join(dir, archivo))).length
  total += gz
  console.log(`${archivo}: ${(gz / 1024).toFixed(1)} KB gzip`)
}

const totalKb = total / 1024
console.log(`Total JS: ${totalKb.toFixed(1)} KB gzip (presupuesto ${PRESUPUESTO_KB} KB)`)

if (totalKb > PRESUPUESTO_KB) {
  console.error(`FALLA: presupuesto excedido en ${(totalKb - PRESUPUESTO_KB).toFixed(1)} KB gzip`)
  process.exit(1)
}

console.log('OK: dentro del presupuesto de peso inicial JS')

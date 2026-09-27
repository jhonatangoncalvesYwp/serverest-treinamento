// Volta a base ao estado de instalação. Rode com o ServeRest parado:
// a API guarda os dados em memória e regravaria o arquivo por cima.

const fs = require('fs')
const path = require('path')

const origem = path.join(__dirname, 'dados-iniciais')
const destino = path.join(__dirname, 'node_modules', 'serverest', 'src', 'data')

for (const arquivo of fs.readdirSync(origem)) {
  fs.copyFileSync(path.join(origem, arquivo), path.join(destino, arquivo))
}
console.log('Base zerada. Rode npm start.')

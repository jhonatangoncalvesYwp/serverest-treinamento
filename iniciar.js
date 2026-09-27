// Sobe a API do ServeRest (porta 3000) e a loja (porta 3001) juntas.
// Ctrl+C encerra as duas.

const { spawn } = require('child_process')
const path = require('path')
const net = require('net')
const http = require('http')

const PORTA_API = 3000
const PORTA_LOJA = 3001

// Chamar os scripts pelo próprio Node evita os .cmd do Windows, que exigem shell.
const binDo = (pacote, arquivo) => path.join(__dirname, 'node_modules', pacote, arquivo)

const SERVICOS = [
  {
    nome: 'API',
    porta: PORTA_API,
    args: [binDo('serverest', 'src/server.js'), '--nodoc', '--porta', String(PORTA_API),
      // O padrão é 600 s. O cy.obterToken guarda o token em cache, e um token
      // vencido no meio da aula viraria um 401 difícil de explicar.
      '--timeout', '43200']
  },
  {
    nome: 'Loja',
    porta: PORTA_LOJA,
    // -s: a loja usa rotas do navegador (/login, /home); toda rota devolve o index.html.
    args: [binDo('serve', 'build/main.js'), '-s', path.join(__dirname, 'loja'),
      '-l', String(PORTA_LOJA), '--no-clipboard', '--no-request-logging', '--no-port-switching']
  }
]

let processos = []
let encerrando = false

function encerrar (codigo = 0) {
  encerrando = true
  processos.forEach(p => p.kill())
  process.exit(codigo)
}
process.on('SIGINT', () => encerrar())
process.on('SIGTERM', () => encerrar())

// Conferir antes de subir: com a porta ocupada, a checagem de "pronto" seria
// respondida pelo outro programa e o aluno veria uma mensagem enganosa.
function portaLivre (porta) {
  return new Promise(resolve => {
    const teste = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => teste.close(() => resolve(true)))
      .listen(porta)
  })
}

function responde (porta) {
  return new Promise(resolve => {
    http.get({ host: 'localhost', port: porta, path: '/', timeout: 1000 }, res => {
      res.resume()
      resolve(true)
    }).on('error', () => resolve(false))
  })
}

// Os testes do treinamento entram com este administrador. O ServeRest só traz
// o fulano@qa.com; sem este passo, todo login do material falharia.
const ADMIN = {
  nome: 'Administrador do Treinamento',
  email: 'admin.treinamento@qa.com',
  password: 'treino123',
  administrador: 'true'
}

async function garantirAdmin () {
  const api = `http://localhost:${PORTA_API}`
  const { usuarios } = await (await fetch(`${api}/usuarios?email=${ADMIN.email}`)).json()
  const atual = usuarios[0]
  if (atual && atual.password === ADMIN.password && atual.administrador === 'true') return
  // Alterado por algum teste: exclui e recria, como o preparar-ambiente do treinamento.
  if (atual) await fetch(`${api}/usuarios/${atual._id}`, { method: 'DELETE' })
  await fetch(`${api}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN)
  })
}

function subir ({ nome, args }) {
  const filho = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  filho.stderr.on('data', dado => {
    // Aviso inofensivo do ServeRest (métrica opcional ausente); só assustaria o aluno.
    if (String(dado).includes('event-loop-stats')) return
    process.stderr.write(`[${nome}] ${dado}`)
  })
  filho.on('exit', (codigo, sinal) => {
    if (encerrando) return
    // Ctrl+C chega aos filhos junto com o pai; às vezes eles saem primeiro.
    if (sinal || codigo === 130 || codigo === 143) return encerrar(0)
    console.error(`\n[${nome}] parou inesperadamente (código ${codigo}). Rode npm start de novo.`)
    encerrar(1)
  })
  return filho
}

;(async () => {
  for (const { nome, porta } of SERVICOS) {
    if (!await portaLivre(porta)) {
      console.error(`
  A porta ${porta} (${nome}) já está em uso.

  Provavelmente há outro "npm start" aberto em algum terminal.
  Feche-o, ou reinicie a máquina, e rode npm start de novo.
`)
      process.exit(1)
    }
  }

  processos = SERVICOS.map(subir)

  for (let tentativa = 0; tentativa < 60; tentativa++) {
    if (await responde(PORTA_API) && await responde(PORTA_LOJA)) {
      await garantirAdmin()
      console.log(`
  ServeRest local pronto

  Loja:  http://localhost:${PORTA_LOJA}
  API:   http://localhost:${PORTA_API}
  Admin: ${ADMIN.email} / ${ADMIN.password}

  Deixe este terminal aberto durante a aula. Ctrl+C encerra.
`)
      return
    }
    await new Promise(r => setTimeout(r, 500))
  }
  console.error('A API ou a loja não respondeu em 30 s.')
  encerrar(1)
})()

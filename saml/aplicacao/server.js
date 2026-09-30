// Aplicação mínima com login SAML 2.0. Faz o papel do sistema da empresa:
// quem não está logado vai para a tela de login do IdP.

const express = require('express')
const session = require('express-session')
const { SAML } = require('@node-saml/node-saml')

const APP_URL = process.env.APP_URL // endereço da aplicação, visto pelo navegador
const IDP_URL = process.env.IDP_URL // endereço do IdP, visto pelo navegador
const IDP_METADATA = process.env.IDP_METADATA // endereço do IdP, visto deste contêiner

// O certificado do IdP vem dos metadados dele. É com ele que a aplicação
// confere que a resposta SAML foi mesmo assinada pelo IdP.
async function certificadoDoIdp() {
  for (let tentativa = 1; tentativa <= 30; tentativa++) {
    try {
      const xml = await (await fetch(IDP_METADATA)).text()
      const cert = xml.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/)
      if (cert) return cert[1].replace(/\s/g, '')
    } catch (erro) {
      // o IdP ainda está subindo
    }
    await new Promise((resolver) => setTimeout(resolver, 2000))
  }
  throw new Error(`IdP não respondeu em ${IDP_METADATA}`)
}

async function iniciar() {
  const saml = new SAML({
    entryPoint: `${IDP_URL}/simplesaml/saml2/idp/SSOService.php`,
    issuer: APP_URL,
    audience: APP_URL,
    callbackUrl: `${APP_URL}/login/callback`,
    idpCert: await certificadoDoIdp(),
    wantAuthnResponseSigned: false
  })

  const app = express()
  app.use(express.urlencoded({ extended: false }))
  app.use(session({ secret: 'somente-para-o-treinamento', resave: false, saveUninitialized: false }))

  const exigirLogin = (req, res, next) => {
    if (req.session.usuario) return next()
    res.redirect('/login')
  }

  // Tela de entrada da própria aplicação, como a maioria dos sistemas com SSO.
  app.get('/login', (req, res) => {
    res.send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Entrar</title></head>
<body>
  <h1>Sistema da Empresa</h1>
  <a href="/login/sso" data-testid="entrar-sso">Entrar com SSO</a>
</body></html>`)
  })

  // Monta o pedido de login SAML (AuthnRequest) e manda o navegador ao IdP.
  app.get('/login/sso', async (req, res) => {
    res.redirect(await saml.getAuthorizeUrlAsync('', undefined, {}))
  })

  // ACS: o IdP devolve a asserção SAML aqui, pelo navegador (HTTP-POST).
  app.post('/login/callback', async (req, res) => {
    try {
      const { profile } = await saml.validatePostResponseAsync(req.body)
      req.session.usuario = { id: profile.nameID, email: profile.email }
      res.redirect('/painel')
    } catch (erro) {
      res.status(401).send(`Resposta SAML recusada: ${erro.message}`)
    }
  })

  app.get('/', exigirLogin, (req, res) => res.redirect('/painel'))

  app.get('/painel', exigirLogin, (req, res) => {
    res.send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Painel</title></head>
<body>
  <h1>Painel</h1>
  <p>Logado como <strong data-testid="usuario-logado">${req.session.usuario.email}</strong></p>
  <a href="/sair" data-testid="sair">Sair</a>
</body></html>`)
  })

  // Responde 200 só para quem está logado: é o que o validate do cy.session consulta.
  app.get('/api/usuario-logado', (req, res) => {
    if (!req.session.usuario) return res.status(401).json({ mensagem: 'Não autenticado' })
    res.json(req.session.usuario)
  })

  app.get('/sair', (req, res) => req.session.destroy(() => res.send('Sessão encerrada')))

  app.listen(4000, () => console.log(`Aplicação SAML em ${APP_URL}`))
}

iniciar()

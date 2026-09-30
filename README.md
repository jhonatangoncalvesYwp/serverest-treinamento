# ServeRest local — Treinamento Cypress

A loja e a API do [ServeRest](https://github.com/ServeRest/ServeRest) rodando
**na sua máquina**, para o treinamento de Cypress.

Por que não usar o site público? Ele é compartilhado com o mundo inteiro:
a base é apagada a cada poucos minutos, qualquer pessoa pode alterar os
usuários que o seu teste usa, e com a turma inteira rodando ao mesmo tempo
ele bloqueia por excesso de requisições (HTTP 429). Aqui, a base é só sua.

## Na primeira aula (uma vez)

Funciona em **Windows, Mac e Linux**. Precisa do **Node.js 20 ou mais novo**
(o mesmo que o Cypress 15 exige; no Linux, instale pelo
[nvm](https://github.com/nvm-sh/nvm)) e do **Git**. O passo a passo completo,
com a instalação dos dois nos três sistemas, está na apostila do treinamento,
seção 1.3.

Num terminal, uma linha de cada vez.

**Windows** (PowerShell):

```powershell
mkdir C:\treinamento
cd C:\treinamento
git clone https://github.com/jhonatangoncalvesYwp/serverest-treinamento.git
cd serverest-treinamento
npm install
```

**Mac e Linux** (Terminal):

```bash
mkdir ~/treinamento
cd ~/treinamento
git clone https://github.com/jhonatangoncalvesYwp/serverest-treinamento.git
cd serverest-treinamento
npm install
```

## Em toda aula

```bash
cd C:\treinamento\serverest-treinamento     # Windows
cd ~/treinamento/serverest-treinamento      # Mac e Linux
npm start
```

Quando aparecer:

```
  ServeRest local pronto

  Loja:  http://localhost:3001
  API:   http://localhost:3000
  Admin: admin.treinamento@qa.com / treino123
```

abra a loja no navegador e entre com o admin: aparece **Bem Vindo
Administrador do Treinamento**.

**Deixe esta janela aberta** durante a aula inteira: ela é a loja. Minimize,
não feche. Os comandos do Cypress rodam no terminal do VS Code. `Ctrl+C`
encerra.

> Rode a loja numa janela de terminal própria, **não** no terminal do VS
> Code: abrir outra pasta no VS Code fecha os terminais da janela, e a loja
> morreria junto.

## No projeto Cypress

No `cypress.config.js`, as duas URLs apontam para a sua máquina:

```js
baseUrl: 'http://localhost:3001',
env: {
  apiUrl: 'http://localhost:3000',
  // ...
}
```

## Usuários administradores

| E-mail | Senha | |
|---|---|---|
| `admin.treinamento@qa.com` | `treino123` | **O do treinamento.** O `npm start` garante que ele existe e está correto — se algum teste o alterou, é recriado |
| `fulano@qa.com` | `teste` | O que o ServeRest traz de fábrica |

## Começar do zero

Os dados ficam salvos entre uma execução e outra. Para apagar tudo e voltar
ao estado de instalação, **com o `npm start` parado**:

```bash
npm run zerar
```

## Extra: login SAML 2.0

Para praticar o login de empresa (SSO por SAML 2.0) no Cypress. Não faz parte
da loja: é um provedor de identidade (IdP) de teste e uma aplicação que exige
login por ele, em dois contêineres. Precisa do
[Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto.

```bash
npm run saml:subir
```

| | Endereço | |
|---|---|---|
| Aplicação | `http://localhost:4000` | Tela "Entrar com SSO" |
| IdP | `http://127.0.0.1:8180` | Usuários `user1` / `user1pass` e `user2` / `user2pass` |

Abra a aplicação no navegador, clique em **Entrar com SSO**, entre com o
`user1`: você volta para o **Painel**, logado. Para desligar:

```bash
npm run saml:parar
```

A configuração do Cypress para esse login (`cy.origin` + `cy.session`) está na
pasta do treinamento, em `exemplos/saml-2.0/`.

## Se der errado

| Sintoma | O que fazer |
|---|---|
| `A porta 3000 (API) já está em uso` ou `3001 (Loja)` | Há outro `npm start` aberto em algum terminal. Feche-o, ou reinicie a máquina |
| A loja abre, mas o login não faz nada | A API não está no ar. Confira se a janela do `npm start` continua aberta |
| Login com o admin do treinamento falha | Algum teste alterou o admin. `Ctrl+C` e `npm start` de novo: ele é recriado |
| `npm install` falha na rede da empresa | Proxy corporativo. Rode o `npm install` de casa, antes da aula |
| `saml:subir` falha com `dockerDesktopLinuxEngine` ou `Cannot connect to the Docker daemon` | O Docker Desktop está fechado. Abra-o, espere ficar verde e rode de novo |
| `saml:subir` falha com `port is already allocated` | A porta 4000 ou 8180 está em uso por outro programa |

## De onde vem cada parte

- **API**: o pacote [`serverest`](https://www.npmjs.com/package/serverest)
  (GPL-3.0), instalado pelo `npm install`, sem alteração.
- **Loja** (pasta `loja/`): build do [ServeRest/Front](https://github.com/ServeRest/Front),
  commit `ff2464a`, com **uma** linha alterada em `src/services/utils.js` — a
  URL da API, que no original é fixa em `https://serverest.dev`:

  ```js
  return `${window.location.protocol}//${window.location.hostname}:3000`
  ```

  Ou seja: a loja procura a API na porta 3000 **da mesma máquina** que a
  serviu. Funciona em `localhost` e também numa máquina da rede.

- **SAML** (pasta `saml/`): o IdP é a imagem
  [kristophjunge/test-saml-idp](https://hub.docker.com/r/kristophjunge/test-saml-idp)
  (SimpleSAMLphp); a aplicação é deste repositório, feita só para o exemplo,
  com [`@node-saml/node-saml`](https://www.npmjs.com/package/@node-saml/node-saml).

Todo o crédito do ServeRest é de [Paulo Gonçalves](https://github.com/PauloGoncalvesBH)
e dos contribuidores do projeto.

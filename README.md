# ServeRest local — Treinamento Cypress

A loja e a API do [ServeRest](https://github.com/ServeRest/ServeRest) rodando
**na sua máquina**, para o treinamento de Cypress.

Por que não usar o site público? Ele é compartilhado com o mundo inteiro:
a base é apagada a cada poucos minutos, qualquer pessoa pode alterar os
usuários que o seu teste usa, e com a turma inteira rodando ao mesmo tempo
ele bloqueia por excesso de requisições (HTTP 429). Aqui, a base é só sua.

## Antes da aula (uma vez)

Precisa do **Node.js 18 ou mais novo** — o mesmo que o Cypress já exige.

```bash
git clone https://github.com/jhonatangoncalvesYwp/serverest-treinamento.git
cd serverest-treinamento
npm install
```

## Em toda aula

```bash
npm start
```

Quando aparecer:

```
  ServeRest local pronto

  Loja:  http://localhost:3001
  API:   http://localhost:3000
```

abra a loja no navegador e confira que a tela de login aparece.

**Deixe este terminal aberto** durante a aula inteira. Os comandos do Cypress
rodam em **outro** terminal. `Ctrl+C` encerra.

## No projeto Cypress

No `cypress.config.js`, as duas URLs apontam para a sua máquina:

```js
baseUrl: 'http://localhost:3001',
env: {
  apiUrl: 'http://localhost:3000',
  // ...
}
```

## Usuário administrador

Toda base nova vem com um administrador:

| E-mail | Senha |
|---|---|
| `fulano@qa.com` | `teste` |

## Começar do zero

Os dados ficam salvos entre uma execução e outra. Para apagar tudo e voltar
ao estado de instalação, **com o `npm start` parado**:

```bash
npm run zerar
```

## Se der errado

| Sintoma | O que fazer |
|---|---|
| `A porta 3000 (API) já está em uso` ou `3001 (Loja)` | Há outro `npm start` aberto em algum terminal. Feche-o, ou reinicie a máquina |
| A loja abre, mas o login não faz nada | A API não está no ar. Confira se o terminal do `npm start` continua aberto |
| `npm install` falha na rede da empresa | Proxy corporativo. Rode o `npm install` de casa, antes da aula |

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

Todo o crédito do ServeRest é de [Paulo Gonçalves](https://github.com/PauloGoncalvesBH)
e dos contribuidores do projeto.

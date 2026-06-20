# Refatoração de Code Smells — AgroShop

Projeto da disciplina de **Clean Code**. Este documento descreve a refatoração
aplicada ao marketplace AgroShop (Next.js / React + Firebase + Stripe), tomando
como base o relatório de análise de _code smells_.

Para cada smell estão indicados: **o que era o problema**, **o que foi feito** e
**onde** (arquivos criados ou alterados).

---

## Visão geral das mudanças

### Arquivos novos (base compartilhada)

| Arquivo | Responsabilidade |
| --- | --- |
| `src/constants/index.js` | Constantes nomeadas (rotas, taxas, prazos, config de toast) |
| `src/utils/vacinas.js` | Regras de domínio da notificação de vacina |
| `src/utils/notificacoes.js` | Feedback ao usuário padronizado (toast) |
| `src/utils/stripe.js` | Carregamento do SDK do Stripe |
| `src/utils/checkout.js` | Fluxo de checkout (criar sessão + redirecionar) |
| `src/hooks/useNavegacao.js` | Navegação e regra "logado vai para X, senão login" |
| `src/hooks/useNotificacoesVacina.js` | Busca pets e monta notificações de vacina |
| `src/hooks/useProdutos.js` | Lista de produtos + filtro de busca |
| `src/hooks/useEnderecoUsuario.js` | Endereço do usuário logado |
| `src/hooks/useCarrinho.js` | Toda a lógica de dados do carrinho |
| `src/components/Header.js` + `Header.module.css` | Cabeçalho reutilizável |
| `src/components/carrinho/ListaCarrinho.js` | Lista de itens do carrinho |
| `src/components/carrinho/ModalConfirmacao.js` | Modal de confirmação de compra |
| `.env.example` | Modelo de variáveis de ambiente (versionado) |

### Páginas refatoradas (redução de tamanho)

| Página | Antes | Depois |
| --- | --- | --- |
| `src/pages/cart.js` | 565 linhas | ~95 linhas |
| `src/pages/produtos/[id].js` | 465 linhas | ~213 linhas |
| `src/pages/agendamento.js` | 379 linhas | ~209 linhas |
| `src/pages/index.js` | 222 linhas | ~64 linhas |

---

## 1. Credenciais e segredos expostos — **CRÍTICA**

**Problema:** `src/serviceAccount.json` (chave privada do Firebase Admin) e
`src/cloudFuncion.js` (e-mail e senha do Gmail em texto puro) estavam
versionados no Git. Além disso, `src/components/firebaseConfig.js` tinha a
configuração do Firebase fixa no código.

**O que foi feito:**

- Os segredos foram migrados para `.env.local` (ignorado pelo Git pelo padrão `.env*`).
- Criado `.env.example` (versionado, apenas com placeholders) documentando todas
  as variáveis necessárias.
- `src/components/firebaseConfig.js` agora lê `NEXT_PUBLIC_FIREBASE_*` do ambiente.
- `src/cloudFuncion.js` (com erro de digitação) foi **substituído** por
  `src/cloudFunction.js`, que lê e-mail/senha de `process.env`.
- A Cloud Function de webhook (`src/pages/api/webhook.js`) deixou de depender de
  um arquivo de segredo (`config/firebaseSecret.json`) e passou a usar o
  `src/firebaseAdmin.js`, que já carregava as credenciais via `process.env`
  (esse era "o jeito certo que já existia no projeto").
- `src/serviceAccount.json` foi removido do projeto (não era importado por
  nenhum código — era apenas um segredo vazado).
- `.gitignore` reforçado para ignorar `serviceAccount.json` e a pasta `config/`.

> ### ⚠️ Ações manuais obrigatórias (não podem ser feitas pelo código)
>
> Os segredos **já estão no histórico do Git** (repositório público). Remover os
> arquivos agora **não** apaga o que já foi commitado. É necessário:
>
> 1. **Rotacionar (trocar) todos os segredos vazados:**
>    - Gerar uma nova chave do Firebase Admin SDK e revogar a antiga.
>    - Trocar a senha do Gmail (e migrar para uma "Senha de app").
>    - Regenerar as chaves do Stripe, se também tiverem vazado.
> 2. **Limpar o histórico do Git** com `git filter-repo` ou BFG Repo-Cleaner e
>    forçar o push. Exemplo com filter-repo:
>    ```bash
>    git filter-repo --path src/serviceAccount.json --path src/cloudFuncion.js --invert-paths
>    ```

---

## 2. Componente gigante (God Component) — **ALTA**

**Problema:** `cart.js` tinha 565 linhas e acumulava responsabilidades não
relacionadas (notificação de vacina, busca de produtos, logout, navegação,
carrinho, endereço, total, Stripe e toda a renderização).

**O que foi feito:** a responsabilidade foi distribuída segundo o
**Princípio da Responsabilidade Única**:

- **Lógica de dados** → `src/hooks/useCarrinho.js` (buscar itens, endereço,
  ajustar quantidade, remover item, calcular subtotal).
- **Renderização** → `src/components/carrinho/ListaCarrinho.js` e
  `src/components/carrinho/ModalConfirmacao.js`.
- **Cabeçalho** → `src/components/Header.js`.
- **Checkout/Stripe** → `src/utils/checkout.js` e `src/utils/stripe.js`.
- A página `cart.js` ficou apenas como **orquestradora** (~95 linhas).

O mesmo padrão de hooks + componentes foi aplicado em `produtos/[id].js`,
`agendamento.js` e `index.js`.

---

## 3. Código duplicado — **ALTA**

**Problema:** o cabeçalho estava copiado em 4 páginas e o padrão
"se logado vá para X, senão vá para o login" se repetia 12 vezes. O mesmo bug
`className={'styles.Agenda'}` (string literal em vez da classe do CSS Module)
fora copiado nas 4 páginas.

**O que foi feito:**

- Criado o componente **`<Header/>`** (`src/components/Header.js`), usado pelas 4
  páginas. (Bônus: a página `agendamento` nem tinha as classes do cabeçalho no
  seu CSS — agora ela usa o cabeçalho estilizado e consistente.)
- Criado o hook **`useNavegacao`** com `irParaSeAutenticado(rota)` e atalhos
  (`irParaHome`, `irParaCarrinho`, etc.), eliminando os 12 `if (currentUser)`.
- A lógica de busca de pets/produtos, que também estava duplicada, virou os hooks
  `useNotificacoesVacina` e `useProdutos`.
- O fluxo de Stripe/checkout duplicado entre `cart` e `produtos` virou
  `utils/stripe.js` + `utils/checkout.js`.
- O bug `'styles.Agenda'` foi removido (a classe nem existia no CSS).

---

## 4. Números e strings mágicos — **MÉDIA**

**Problema:** valores soltos sem nome (taxa de entrega `10`, prazos de vacina
`10`/`20`, `1000 * 60 * 60 * 24`, `autoClose: 2000`) e rotas escritas como texto,
com inconsistência (`'Autenticacao/login'` sem barra x `'/cart'` com barra).

**O que foi feito:** criado `src/constants/index.js` com nomes que comunicam a
intenção:

- `ROTAS` (todas começando com `/`, corrigindo a inconsistência).
- `TAXA_ENTREGA`, `VALOR_TOSA_COMPLETA`.
- `MS_POR_DIA` (no lugar de `1000 * 60 * 60 * 24`).
- `DIAS_VACINA` (`URGENTE`/`PROXIMA`) e `COR_VACINA`.
- `TOAST_PADRAO` (config única dos toasts).

Strings de domínio como `'banho_e_tosa_completo'` e `'delivery'` viraram
constantes nomeadas (`SERVICO_COMPLETO`, `OPCAO_ENTREGA`).

---

## 5. Código morto e comentários redundantes — **MÉDIA**

**Problema:** estado `frete` declarado e nunca usado, estado `produto` inútil no
carrinho, comentário duplicado ("Função para ajustar a quantidade..."),
comentário solto "// Função para carregar o Stripe" sem código, e comentários
óbvios.

**O que foi feito:**

- Removidos os estados não usados (`frete`, `produto`) de `cart.js`.
- Removidas as buscas de produtos/notificações que eram feitas em `cart`,
  `agendamento` e `produtos/[id]` mas **nunca renderizadas**.
- Removido o `if (item.quantity < item.quantity)` (sempre falso) da API.
- Removidos comentários óbvios; os que restaram explicam o **porquê**, não o quê.

---

## 6. Debug em produção e tratamento de erro inconsistente — **MÉDIA**

**Problema:** ~103 `console.log`/`alert` espalhados, e erros tratados de 3 formas
diferentes (`console.error`, `alert()`, `toast.error()`).

**O que foi feito:**

- Criado `src/utils/notificacoes.js` com `notificarSucesso` e `notificarErro`,
  padronizando todo o feedback em **toast**.
- Os `alert()` (ex.: controle de estoque no carrinho) e os `console.log` de
  depuração foram removidos das páginas/rotas refatoradas.
- `console.error` foi mantido **apenas** para diagnóstico real de exceções.
- A API `criarCheckoutSession.js` e o `webhook.js` foram limpos (dezenas de
  `console.log` de depuração como "Chegou", "Chegou2"... removidos).

---

## 7. Nomenclatura inconsistente — **BAIXA**

**Problema:** mistura de português e inglês no mesmo escopo
(`cartItems` x `carrinhoRef`, `deliveryFee` x `frete`) e o arquivo com erro de
digitação `cloudFuncion.js`.

**O que foi feito:**

- Convenção única adotada: **português em camelCase**, coerente com o domínio e
  com os nomes das coleções do Firestore (`Carrinho`, `Produtos`, `Agendamentos`).
- Variáveis renomeadas (`deliveryFee`/`frete` → `taxaEntrega`,
  `cartItems` → `itens`, `selectedPets` → `petsSelecionados`, etc.).
- Arquivo `cloudFuncion.js` corrigido para `cloudFunction.js`.

---

## Como rodar o projeto

1. Copie o modelo de ambiente e preencha com as suas chaves:
   ```bash
   cp .env.example .env.local
   ```
2. Instale as dependências e rode:
   ```bash
   npm install
   npm run dev
   ```

> O `npm run build` foi validado e passa com sucesso após a refatoração
> (antes, falhava por causa do arquivo de segredo ausente no `webhook.js`).

---

## Resumo

| # | Code smell | Severidade | Status |
| --- | --- | --- | --- |
| 1 | Segredos expostos | Crítica | ✅ Código corrigido (+ rotação/limpeza de histórico manual) |
| 2 | Componente gigante | Alta | ✅ Quebrado em hooks + componentes |
| 3 | Código duplicado | Alta | ✅ `<Header/>` + `useNavegacao` + hooks/utils |
| 4 | Números e strings mágicos | Média | ✅ `constants/index.js` |
| 5 | Código morto e comentários | Média | ✅ Removidos |
| 6 | Debug e erro inconsistente | Média | ✅ Toast centralizado |
| 7 | Nomenclatura inconsistente | Baixa | ✅ Padronizado em PT camelCase |

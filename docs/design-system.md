# Design System — FEMHELP

Guia de identidade visual do app FEMHELP. Fonte de verdade no código: [`public/css/tokens.css`](../public/css/tokens.css).

**Linear:** issues com label `layout` no epic [TCC-7](https://linear.app/tcc-femhelp/issue/TCC-7/epic-identidade-ux-e-navegacao).

---

## Princípios de design

1. **Discrição** — aparência de app de organização ou bem-estar; sem símbolos que denunciem segurança à primeira vista.
2. **Rapidez em emergência** — SOS acessível em poucos toques, com contraste alto.
3. **Privacidade por design** — dados sensíveis só quando necessários; saída rápida para página neutra.
4. **Mobile-first** — uso com uma mão, alvos de toque grandes, layout vertical.
5. **Acessibilidade** — contraste WCAG AA, foco visível, ícones com texto.

---

## Paleta de cores

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-rosa-claro` | `#f2c4d6` | Destaques suaves, banners |
| `--color-rosa` | `#e8a4bc` | Acentos secundários |
| `--color-nude` | `#e8d5c4` | Fundos alternativos, hover |
| `--color-bege` | `#f5ebe0` | Fundos de cards secundários, tags |
| `--color-branco-gelo` | `#faf8f6` | Fundo principal do app |
| `--color-lilas` | `#c9b8d9` | Botões primários, mensagens próprias |
| `--color-lilas-escuro` | `#9b87b8` | Ícones de atalho, estado ativo da nav |
| `--color-cinza-claro` | `#e8e4e0` | Bordas, divisores |
| `--color-cinza` | `#6b6560` | Texto secundário, hover neutro |
| `--color-cinza-escuro` | `#3d3835` | — |
| `--color-texto` | `#3d3835` | Texto principal, links |
| `--color-texto-suave` | `#6b6560` | Subtítulos, legendas |
| `--color-branco` | `#ffffff` | Cards, header, nav |
| `--color-sos` | `#c0392b` | Botão SOS |
| `--color-sos-hover` | `#a93226` | Hover do SOS |
| `--color-sos-text` | `#ffffff` | Texto no botão SOS |
| `--color-sucesso` | `#27ae60` | Confirmações |
| `--color-alerta` | `#e67e22` | Avisos |
| `--color-erro` | `#c0392b` | Erros de formulário |
| `--color-info` | `#5b7c99` | Informações |

### Regras de uso

- Tons suaves predominam; destaque forte **apenas** no SOS e alertas críticos.
- Texto principal sempre `--color-texto` sobre fundos claros.
- Links no conteúdo usam `--color-texto` com sublinhado lilás (não usar lilás escuro como cor de link em fundo claro — ver acessibilidade).

---

## Tipografia

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-family` | Inter, system-ui, sans-serif | Todo o app |
| `--font-size-xs` | 0.75rem (12px) | Labels da nav, notas |
| `--font-size-sm` | 0.875rem (14px) | Texto auxiliar, cards |
| `--font-size-base` | 1rem (16px) | Corpo |
| `--font-size-lg` | 1.125rem (18px) | Títulos de seção |
| `--font-size-xl` | 1.25rem (20px) | Saudação home |
| `--font-size-2xl` | 1.5rem (24px) | Títulos de página |
| `--font-size-3xl` | 1.875rem (30px) | Destaques raros |

| Peso | Token | Uso |
|------|-------|-----|
| 400 | `--font-weight-regular` | Parágrafos |
| 500 | `--font-weight-medium` | Labels, nav |
| 600 | `--font-weight-semibold` | Títulos, botões |
| 700 | `--font-weight-bold` | Alertas, timer SOS |

Fonte carregada em [`public/css/base.css`](../public/css/base.css) via Google Fonts (pesos 400–700).

---

## Espaçamento, raios e sombras

| Categoria | Tokens | Valores |
|-----------|--------|---------|
| Espaçamento | `--space-xs` … `--space-2xl` | 4px → 48px |
| Raios | `--radius-sm/md/lg/full` | 8px, 12px, 16px, pill |
| Sombras | `--shadow-sm/md/lg` | Elevação sutil em cards e SOS |

### Layout

| Token | Valor | Uso |
|-------|-------|-----|
| `--max-width` | 480px | Largura máxima do conteúdo |
| `--touch-min` | 44px | Altura mínima de toque (WCAG) |
| `--header-height` | 56px | Header fixo |
| `--nav-height` | 64px | Bottom navigation |

---

## Marca e ícones

### Logo

| Arquivo | Descrição |
|---------|-----------|
| `public/assets/logo/femhelp-wordmark.svg` | Wordmark tipográfico discreto |
| `public/assets/logo/femhelp-icon.svg` | Ícone “F” em fundo lilás (favicon/PWA) |
| `public/assets/favicon.svg` | Favicon do site |

Wordmark no header via [`public/js/nav.js`](../public/js/nav.js). Favicon injetado por [`public/js/bootstrap.js`](../public/js/bootstrap.js).

### Ícones SVG

Biblioteca em `public/assets/icons/` e helper JS [`public/js/icons.js`](../public/js/icons.js).

| Nome | Arquivo | Uso |
|------|---------|-----|
| home | `home.svg` | Nav início |
| sos | `sos.svg` | Nav SOS, botão emergência |
| contacts | `contacts.svg` | Nav contatos |
| map | `map.svg` | Nav mapa |
| menu | `menu.svg` | Nav mais |
| settings | `settings.svg` | Atalho configurações |
| books | `books.svg` | Atalho educativo |
| wrench | `wrench.svg` | Atalho vídeos |
| graduation | `graduation.svg` | Atalho cursos |
| heart | `heart.svg` | Atalho mães solo |
| chat | `chat.svg` | Atalho chat |
| check | `check.svg` | Status SOS sucesso |

**Padrão técnico:** stroke 2px, `viewBox="0 0 24 24"`, cor via `currentColor`.

Classes CSS: `.icon`, `.icon--nav`, `.icon--shortcut`, `.icon--sos`, `.icon--status`.

Uso em HTML: `<span data-icon="home" data-icon-class="icon icon--shortcut"></span>`.

---

## Componentes

Referência completa em [`public/css/components.css`](../public/css/components.css).

| Componente | Classes principais | Quando usar |
|------------|-------------------|-------------|
| Header | `.app-header`, `.app-header__brand`, `.app-header__logo` | Todas as telas (exceto saída rápida) |
| Bottom nav | `.bottom-nav`, `.bottom-nav__item`, `.bottom-nav__item--active` | Navegação principal |
| Botão primário | `.btn`, `.btn--primary` | Ações principais |
| Botão secundário | `.btn`, `.btn--secondary` | Ações alternativas |
| Botão SOS | `.btn`, `.btn--sos` | Emergência apenas |
| Botão ghost | `.btn`, `.btn--ghost` | Sair, cancelar |
| Card | `.card`, `.card__title`, `.card__text` | Blocos de conteúdo |
| Atalho | `.shortcut-card`, `.shortcut-grid` | Home e grids 2 colunas |
| Formulário | `.form-group`, `.form-label`, `.form-input` | Login, cadastro, contatos |
| Alerta | `.alert`, `.alert--info/success/warning/error` | Feedback ao usuário |
| Modal | `.modal-overlay`, `.modal` | Confirmações (SOS) |
| Lista contatos | `.contact-list`, `.contact-item` | Tela de contatos |
| Configurações | `.settings-list`, `.settings-item` | Menu de configurações |

### Estrutura de página padrão

```html
<main class="app-shell">
  <h1 class="page-title">Título</h1>
  <p class="page-subtitle">Descrição opcional</p>
  <!-- conteúdo -->
</main>
```

Bootstrap: `<script src="js/bootstrap.js" data-depth="N"></script>` onde `N` = níveis abaixo de `public/`.

---

## Acessibilidade (WCAG AA)

Auditoria da paleta FEMHELP (texto normal ≥ 4.5:1, texto grande ≥ 3:1).

| Par de cores | Ratio | Status | Notas |
|--------------|-------|--------|-------|
| `#3d3835` sobre `#faf8f6` | ~11.7:1 | Passa AAA | Texto principal |
| `#3d3835` sobre `#ffffff` | ~12.6:1 | Passa AAA | Cards |
| `#6b6560` sobre `#faf8f6` | ~4.6:1 | Passa AA | Texto suave |
| `#6b6560` sobre `#ffffff` | ~5.0:1 | Passa AA | Legendas em cards |
| `#ffffff` sobre `#c0392b` | ~5.9:1 | Passa AA | Botão SOS |
| `#ffffff` sobre `#a93226` | ~6.8:1 | Passa AA | SOS hover |
| `#3d3835` sobre `#c9b8d9` | ~5.8:1 | Passa AA | Botão primário |
| `#3d3835` sobre `#f5ebe0` | ~9.5:1 | Passa AAA | Fundo bege |
| `#9b87b8` sobre `#faf8f6` | ~3.2:1 | Falha AA texto normal | **Não usar como cor de link** |

### Correções aplicadas

- Links de conteúdo usam `--color-texto` com sublinhado lilás (não lilás escuro como cor de texto).
- Ícones de atalho usam lilás escuro sobre fundo branco do card (decorativo, com label textual).
- Touch targets mínimos de 44px em botões e nav.
- `:focus-visible` com outline lilás de 3px.

---

## Figma

> **Link do protótipo:** _cole aqui após criar o arquivo — veja [`figma-guide.md`](figma-guide.md)._

| Recurso | Caminho |
|---------|---------|
| Passo a passo completo | [`figma-guide.md`](figma-guide.md) |
| Tokens para importar (JSON) | [`figma-tokens.json`](figma-tokens.json) |
| Ícones SVG | [`public/assets/icons/`](../public/assets/icons/) |
| Logo | [`public/assets/logo/`](../public/assets/logo/) |

**Issue:** [TCC-67](https://linear.app/tcc-femhelp/issue/TCC-67/criar-arquivo-figma-com-design-tokens-e-componentes-base)

---

## Referências

- Plano do TCC: [`conteudo-plano.md`](conteudo-plano.md) §6–7
- Checklist de testes: [`testes-checklist.md`](testes-checklist.md)

# Receitas de implementação e tradução para a stack

Use para transformar decisões em código. Trechos são exemplos isolados: adapte tokens, nomes, contratos, versões e testes ao projeto. Não são uma aplicação completa nem uma certificação de acessibilidade.

## 1. Campo com label, ajuda e erro

```html
<div class="field">
  <label for="contact-email">Email de contato</label>
  <p id="contact-email-hint">Usaremos este endereço para responder ao pedido.</p>
  <input id="contact-email" name="email" type="email"
         autocomplete="email" required
         aria-describedby="contact-email-hint contact-email-error">
  <p id="contact-email-error" hidden></p>
</div>
```

O estado inicial não contém erro. Após validação aplicável, preencha a mensagem, remova `hidden` e use `aria-invalid="true"`; ao corrigir, restaure o estado coerente. Para erro geral de submissão, use resumo quando ele facilitar descoberta. Não mova foco ou anuncie erro a cada tecla sem necessidade.

## 2. Disclosure nativo

```html
<details class="shipping-details">
  <summary>Como funciona a entrega?</summary>
  <p>O prazo será informado após a escolha do endereço e da modalidade.</p>
</details>
```

É apropriado quando o comportamento nativo atende ao caso. Personalize aparência mantendo foco e área de acionamento. Não use se o conteúdo essencial precisar estar sempre visível; não esconda preço ou condição principal em um disclosure por conveniência estética.

## 3. Dialog nativo ou primitiva do projeto

Use a solução já adotada, ou `<dialog>` quando compatível com os navegadores e necessidades do projeto. `showModal()` e `show()` têm comportamentos diferentes; não reproduza modalidade apenas com um backdrop visual. Nomeie o dialog, escolha foco inicial adequado e confira retorno de foco. Veja [dialog na MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

Uma mudança visual não deve remover atributos ou handlers necessários da primitiva. Ao trocar tag, wrapper ou portal, verifique foco, labels, fechamento, stacking e scroll novamente.

## 4. Busca assíncrona sem resposta antiga sobrescrever a atual

```js
function createLatestSearch(request, showState) {
  let revision = 0;
  let controller;

  return {
    async run(query) {
      const current = ++revision;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      showState({ status: 'loading', query });

      try {
        const items = await request(query, signal);
        if (current !== revision) return;
        showState({ status: items.length ? 'ready' : 'empty', query, items });
      } catch (error) {
        if (current !== revision || signal.aborted) return;
        showState({ status: 'error', query, error });
      }
    },
    dispose() {
      revision += 1;
      controller?.abort();
    }
  };
}
```

Contrato: `request` retorna uma lista, respeita o signal quando possível e não atualiza a UI por conta própria. `showState` adapta dados à UI e usa mensagem segura, sem expor erro interno bruto. O número de revisão protege inclusive contra requests que ignoram cancelamento. Chame `dispose` ao desmontar. Debounce, se necessário, é uma decisão adicional; não está implícito.

Esse exemplo serve a leitura, não a cancelamento de transações. Cancelar requisição não garante que uma mutação no servidor foi desfeita.

## 5. Mapeamento explícito de variantes

```js
const actionClasses = {
  primary: 'action action--primary',
  secondary: 'action action--secondary',
  destructive: 'action action--destructive'
};
function classesForAction(variant) {
  return actionClasses[variant] ?? actionClasses.secondary;
}
```

Mapas explícitos ajudam a manter variantes reconhecíveis e, em sistemas de utilities compiladas, classes descobríveis. Defina o fallback segundo o contrato do componente; em código com tipos, restrinja variantes válidas. Não misture intenção destrutiva com aparência secundária se isso ocultar consequência.

## 6. Layout de ações que suporta texto longo

```css
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.actions > * { max-inline-size: 100%; }
.action { white-space: normal; overflow-wrap: anywhere; }
```

É um ponto de partida para um conjunto de ações. Avalie se quebrar uma palavra ajuda a leitura; muitas vezes encurtar rótulo ou empilhar botões é melhor. Não aplique `overflow-wrap: anywhere` globalmente a números e textos que precisam ser lidos como uma unidade.

## 7. Estados de lista sem confundir vazio com carregamento

Modele `status` separadamente de `items`. Um array vazio não distingue primeiro carregamento, filtro sem resultados e falha. Se mantiver dados antigos durante atualização, indique que estão sendo atualizados e preserve contexto; não mostre resultados antigos como se correspondessem a um filtro novo.

## 8. Layout estável de mídia

Reserve dimensão ou proporção e forneça tamanhos adequados ao local de uso. Um recorte de 4:3 e um de 1:1 podem precisar de assets ou pontos focais distintos. Imagem do topo que determina LCP normalmente não deve ser tratada como mídia distante abaixo da dobra. Não preloade todas as variações.

## 9. Tradução por arquitetura

| Ambiente do projeto | Aproveitar | Evitar |
|---|---|---|
| HTML/CSS/JS | Semântica nativa, CSS pequeno e estado local explícito | Instalar framework para um disclosure |
| React e derivados | Componentes existentes, estado com dono claro, chaves estáveis e cleanup | Estado derivado duplicado e efeitos para toda transformação |
| Vue e derivados | Reatividade e composição já estabelecidas, props e eventos claros | Copiar padrões de React sem adaptação |
| Svelte e derivados | Mecanismos da versão instalada e estado local proporcional | Misturar sintaxe e modelo de reatividade de versões diferentes |
| Astro ou site com ilhas | Conteúdo renderizado e interatividade localizada | Hidratar tudo por causa de um controle |
| Tailwind | Tokens e classes da versão instalada, mapas explícitos | Misturar configurações de versões e classes dinâmicas invisíveis ao build |
| Primitivas acessíveis | Preservar anatomia e comportamento documentados | Trocar wrappers quebrando foco ou semântica |
| SSR | HTML inicial coerente e fronteiras interativas necessárias | Depender de viewport ou storage na renderização inicial sem estratégia |

Esta matriz orienta inspeção; confirme APIs na documentação oficial da versão antes de implementá-las. Não constitui recomendação para migrar a stack.

## 10. Como verificar os trechos no projeto

Teste o comportamento que motivou a receita. Para busca: resposta antiga chega por último, consulta vazia e falha. Para campo: inválido, correção e submissão falha. Para dialog: teclado, conteúdo longo e fechamento. Para layout: rótulo longo e container estreito. Verificação sintática isolada não demonstra funcionamento no navegador.

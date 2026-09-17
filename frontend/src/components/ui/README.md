# Controles compartilhados

As telas usam os componentes desta pasta. Mantenha os elementos HTML de controle dentro dos componentes base, sem criar novos buttons, selects, inputs ou textareas diretamente nas páginas.

- `Button`: variantes primary, secondary, danger, ghost e unstyled (para controles com layout próprio, como a barra do editor). Preserve `type="submit"` nos botões que enviam formulários e use `type="button"` nas ações auxiliares.
- `Input` e `Textarea`: encaminham atributos HTML e refs. `Input type="checkbox"` usa o desenho compartilhado com foco visível. `Checkbox` adiciona o texto clicável e recebe `onChange(checked)`.
- `Select`: opções JSX, `value`, `onChange`, `disabled`, `required` e `loading`. A lista visível é um componente em portal, com busca sem distinção de acentos, seleção por teclado e posicionamento na janela. O select interno serve apenas à integração de formulários e eventos.
- `MultiSelect`: mesma API, com `value` em array; leia os valores de `event.target.selectedOptions`. O menu permanece aberto durante a seleção.
- `Combobox`: sugestões com entrada livre, usado para nichos personalizados.
- `Field`, `Label` e `ToggleChip`: rótulos, ajuda, erros e opções de filtro.

Sempre forneça um rótulo associado por `id`/`htmlFor`, um label envolvendo o campo, ou `aria-label`. As cores vêm de `theme.css`; o estilo dos menus fica em `controls.css`.

```tsx
<MultiSelect aria-label="Estados" value={states}
  onChange={event => setStates(Array.from(event.target.selectedOptions, option => option.value))}>
  <option value="MT">Mato Grosso</option>
  <option value="SP">São Paulo</option>
</MultiSelect>
```

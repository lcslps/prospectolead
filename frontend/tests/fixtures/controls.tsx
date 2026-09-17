import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Select, MultiSelect } from '../../src/components/ui/Select';
import { Checkbox } from '../../src/components/ui/Checkbox';
import { Button } from '../../src/components/ui/Button';
import '../../src/theme.css';
function Fixture() {
  const [value, setValue] = useState('');
  const [multi, setMulti] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState('');
  return <form style={{ maxWidth: 400, padding: 20 }} onSubmit={e => { e.preventDefault(); setSubmitted(JSON.stringify([...new FormData(e.currentTarget)])); }}>
    <Select aria-label="Estado" name="state" required value={value} onChange={e => setValue(e.target.value)}><option value="">Selecione</option><option value="SP">São Paulo</option><option value="MT">Mato Grosso</option><option value="RJ" disabled>Rio de Janeiro</option></Select>
    <MultiSelect aria-label="Estados" name="states" value={multi} onChange={e => setMulti(Array.from(e.target.selectedOptions, o => o.value))}><option value="SP">São Paulo</option><option value="MT">Mato Grosso</option></MultiSelect>
    <Select aria-label="Desativado" disabled><option>Indisponível</option></Select>
    <Checkbox checked={checked} onChange={setChecked}>Receber avisos</Checkbox>
    <Button type="submit">Salvar</Button><output>{submitted}</output>
  </form>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);

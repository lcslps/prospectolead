const BR_AREAS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function isBrArea(area: string): boolean {
  return BR_AREAS.has(area);
}

export function normalizePhoneBr(
  national?: string | null,
  international?: string | null,
): { national: string | null; international: string | null } {
  const result = { national: national ?? null, international: international ?? null };

  if (international && digitsOnly(international).startsWith('55')) {
    const d = digitsOnly(international);
    result.international = d;
    if (!result.national) {
      result.national = formatBrFromDigits(d);
    }
    return result;
  }

  if (national) {
    const d = digitsOnly(national);
    if (d.length === 10 || d.length === 11) {
      const intl = `55${d}`;
      result.international = result.international || intl;
      result.national = formatBrFromDigits(intl);
    } else {
      result.national = national.trim();
    }
  }

  return result;
}

function formatBrFromDigits(d: string): string {
  let body = d;
  if (body.startsWith('55') && body.length > 11) {
    body = body.slice(2);
  }
  if (body.startsWith('0')) {
    body = body.slice(1);
  }
  if ((body.length === 10 || body.length === 11) && !isBrArea(body.slice(0, 2))) {
    return body;
  }
  if (body.length < 10) {
    return body;
  }
  const ddd = body.slice(0, 2);
  const rest = body.slice(2);
  const hasNine = rest.length === 9;
  const part1 = rest.slice(0, hasNine ? 5 : 4);
  const part2 = rest.slice(hasNine ? 5 : 4);
  return `(${ddd}) ${part1}-${part2}`;
}

export function phoneForWhatsApp(lead: {
  telefone?: string | null;
  telefoneInternacional?: string | null;
}): string | null {
  if (lead.telefoneInternacional && digitsOnly(lead.telefoneInternacional).length >= 12) {
    return digitsOnly(lead.telefoneInternacional);
  }

  if (lead.telefone) {
    const d = digitsOnly(lead.telefone);
    if (d.length === 10 || d.length === 11) {
      return `55${d}`;
    }
    if (d.length >= 12) {
      return d;
    }
  }

  return null;
}
#!/usr/bin/env python3
"""Search the bundled Code Makers design library. Offline, standard library only."""
import argparse
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = ('styles', 'palettes', 'typography', 'patterns', 'studies')
ALIASES = {
    'dark': 'escuro', 'light': 'claro', 'dashboard': 'painel',
    'fonts': 'fontes', 'font': 'fonte', 'color': 'cor',
    'search': 'busca', 'form': 'formulario', 'forms': 'formulario',
    'motion': 'movimento', 'animation': 'movimento', 'chart': 'dados',
    'commerce': 'ecommerce', 'portfolio': 'portfolio', 'accessibility': 'acessibilidade',
}


def tokens(value):
    text = unicodedata.normalize('NFKD', str(value).lower())
    text = ''.join(c for c in text if not unicodedata.combining(c))
    return {ALIASES.get(t, t) for t in re.findall(r'[a-z0-9]+', text)}


def flatten(value):
    if isinstance(value, dict):
        return ' '.join(flatten(v) for v in value.values())
    if isinstance(value, list):
        return ' '.join(flatten(v) for v in value)
    return str(value)


def load_records(domain='all', root=ROOT):
    selected = DOMAINS if domain == 'all' else (domain,)
    if any(name not in DOMAINS for name in selected):
        raise ValueError('Unknown domain')
    result = []
    for name in selected:
        payload = json.loads((root / 'data' / f'{name}.json').read_text(encoding='utf-8'))
        if payload['schema_version'] != 1 or payload['kind'] != name:
            raise ValueError(f'Unsupported dataset schema: {name}')
        for record in payload['records']:
            result.append({'domain': name, **record})
    return result


def search(query, domain='all', limit=5):
    wanted = tokens(query)
    if not wanted:
        raise ValueError('Provide a query containing letters or numbers')
    if not 1 <= limit <= 20:
        raise ValueError('limit must be between 1 and 20')
    ranked = []
    for record in load_records(domain):
        identity = tokens(record['id'] + ' ' + record['name'])
        tags = tokens(' '.join(record.get('tags', [])))
        body = tokens(flatten({k:v for k,v in record.items() if k not in ('id','name','tags')}))
        matched = wanted & (identity | tags | body)
        if not matched:
            continue
        score = 6 * len(wanted & identity) + 4 * len(wanted & tags) + len(wanted & body)
        coverage = len(matched) / len(wanted)
        ranked.append({**record, 'match_score': score, 'query_coverage': coverage})
    ranked.sort(key=lambda r: (-r['query_coverage'], -r['match_score'], r['domain'], r['id']))
    return ranked[:limit]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('query', nargs='?')
    parser.add_argument('--domain', choices=('all',) + DOMAINS, default='all')
    parser.add_argument('--limit', type=int, default=5)
    parser.add_argument('--id', dest='record_id')
    parser.add_argument('--list-domains', action='store_true')
    parser.add_argument('--json', action='store_true', dest='as_json')
    args = parser.parse_args()
    if args.list_domains:
        counts = {name: len(load_records(name)) for name in DOMAINS}
        print(json.dumps(counts, ensure_ascii=True))
        return 0
    if bool(args.query) == bool(args.record_id):
        parser.error('Provide either a query or --id, not both')
    if not 1 <= args.limit <= 20:
        parser.error('--limit must be between 1 and 20')
    try:
        if args.record_id:
            result = [r for r in load_records(args.domain) if r['id'] == args.record_id]
        else:
            result = search(args.query, args.domain, args.limit)
    except (ValueError, OSError, KeyError) as exc:
        parser.error(str(exc))
    note = 'Relevance matches, not quality scores. Verify fit, assets, contrast and behavior in context.'
    if args.as_json:
        print(json.dumps({'query': args.query, 'matches': result, 'note': note}, ensure_ascii=True, indent=2))
    else:
        print(note)
        if not result:
            print('No matches. Try fewer or different keywords.')
        for record in result:
            print(f"\n[{record['domain']}] {record['name']} ({record['id']})")
            for key, value in record.items():
                if key not in ('domain', 'name', 'id'):
                    print(f'{key}: {json.dumps(value, ensure_ascii=True) if isinstance(value, (dict,list)) else value}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

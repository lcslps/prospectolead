"""Validate search behavior, palette data and export safety."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from contrast_check import contrast_ratio
import export_palette
import search_design


class LibraryTests(unittest.TestCase):
    def test_ids_unique_per_domain(self):
        for domain in search_design.DOMAINS:
            records = search_design.load_records(domain)
            self.assertTrue(records)
            self.assertEqual(len(records), len({r['id'] for r in records}))

    def test_palette_pairs_recomputed(self):
        for palette in search_design.load_records('palettes'):
            for pair in palette['verified_pairs']:
                colors = palette['colors']
                ratio = contrast_ratio(colors[pair['foreground']], colors[pair['background']])
                self.assertAlmostEqual(ratio, pair['ratio'])
                self.assertGreaterEqual(ratio, 4.5, palette['id'])

    def test_studies_discoverable(self):
        for identity in ('apple', 'bmw', 'flying-papers', 'lunch', 'slush', 'air'):
            with self.subTest(study=identity):
                self.assertEqual(search_design.search(identity, 'studies')[0]['id'], identity)
                self.assertEqual(search_design.search(identity, 'all')[0]['id'], identity)

    def test_study_resources_and_provenance(self):
        root = search_design.ROOT
        manifest = json.loads((root / 'data/reference-sources.json').read_text(encoding='utf-8'))
        sources = {item['id']: item for item in manifest['sources']}
        records = search_design.load_records('studies')
        self.assertEqual(set(sources), {r['id'] for r in records})
        for record in records:
            source = sources[record['id']]
            for key in ('guide', 'source_file'):
                path = (root / record[key]).resolve()
                self.assertTrue(path.is_relative_to(root))
                self.assertTrue(path.is_file())
            content = (root / record['source_file']).read_bytes()
            self.assertEqual(record['source_file'], source['source_file'])
            self.assertEqual(len(content), source['bytes'])
            digest = hashlib.sha256(content).hexdigest()
            self.assertEqual(digest, source['sha256'])
            self.assertEqual(digest, record['source_sha256'])

    def test_study_contrast_claims(self):
        manifest = json.loads((search_design.ROOT / 'data/reference-sources.json').read_text(encoding='utf-8'))
        known = {r['id'] for r in search_design.load_records('studies')}
        self.assertEqual({pair['study'] for pair in manifest['contrast_checks']}, known)
        for pair in manifest['contrast_checks']:
            ratio = contrast_ratio(pair['foreground'], pair['background'])
            self.assertAlmostEqual(ratio, pair['ratio'])
            self.assertEqual(ratio >= 4.5, pair['normal_text_aa'])
            self.assertEqual(ratio >= 3.0, pair['large_text_aa'])

    def test_cli_study_lookup(self):
        result = subprocess.run([sys.executable, '-B', str(Path(search_design.__file__)), '--domain', 'studies',
                                 '--id', 'flying-papers', '--json'], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        parsed = json.loads(result.stdout)
        self.assertEqual([r['id'] for r in parsed['matches']], ['flying-papers'])
        self.assertEqual(parsed['matches'][0]['guide'], 'references/study-flying-papers.md')

    def test_accents_and_case(self):
        a = search_design.search('MÚSICA', 'styles')
        b = search_design.search('musica', 'styles')
        self.assertEqual(a, b)
        self.assertEqual(a[0]['id'], 'musical-ritmico')

    def test_domain_isolation(self):
        result = search_design.search('escuro', 'palettes')
        self.assertTrue(result)
        self.assertTrue(all(r['domain'] == 'palettes' for r in result))

    def test_alias(self):
        self.assertEqual(search_design.search('dark', 'palettes'), search_design.search('escuro', 'palettes'))

    def test_no_fabricated_matches(self):
        self.assertEqual(search_design.search('zzzzunmatchablezzzz', 'all'), [])

    def test_empty_and_invalid_limit(self):
        for query, limit in [('', 5), ('!!!', 5), ('editorial', 0), ('editorial', 21)]:
            with self.assertRaises(ValueError):
                search_design.search(query, limit=limit)

    def test_search_limit(self):
        self.assertEqual(len(search_design.search('claro', 'palettes', 2)), 2)

    def test_css_matches_selected_palette(self):
        palette = search_design.load_records('palettes')[0]
        css = export_palette.render_css(palette['id'])
        for key, value in palette['colors'].items():
            self.assertIn(f'--color-{key.replace("_", "-")}: {value};', css)

    def test_unknown_palette_fails(self):
        with self.assertRaises(ValueError):
            export_palette.render_css('not-a-palette')

    def test_export_does_not_overwrite(self):
        script = str(Path(export_palette.__file__))
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'tokens.css'
            target.write_text('original', encoding='utf-8')
            result = subprocess.run([sys.executable, '-B', script, 'oceano-claro', '--output', str(target)],
                                    capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(target.read_text(encoding='utf-8'), 'original')

    def test_export_creates_exact_output(self):
        script = str(Path(export_palette.__file__))
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'tokens.css'
            result = subprocess.run([sys.executable, '-B', script, 'oceano-claro', '--output', str(target)],
                                    capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(target.read_text(encoding='utf-8'), export_palette.render_css('oceano-claro'))

    def test_cli_json_exact_id(self):
        result = subprocess.run([sys.executable, '-B', str(Path(search_design.__file__)), '--domain', 'patterns',
                                 '--id', 'autosave-revisao', '--json'], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        parsed = json.loads(result.stdout)
        self.assertEqual([r['id'] for r in parsed['matches']], ['autosave-revisao'])


if __name__ == '__main__':
    unittest.main()

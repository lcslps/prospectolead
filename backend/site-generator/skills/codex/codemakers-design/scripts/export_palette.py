#!/usr/bin/env python3
"""Export a bundled palette to CSS tokens, without installing packages or overwriting by default."""
import argparse
from pathlib import Path
from contrast_check import contrast_ratio
from search_design import load_records


def render_css(identifier):
    palette = next((r for r in load_records('palettes') if r['id'] == identifier), None)
    if palette is None:
        raise ValueError(f'Unknown palette id: {identifier}')
    colors = palette['colors']
    for fg, bg in [('text','background'),('text','surface'),('on_action','action')]:
        if contrast_ratio(colors[fg], colors[bg]) < 4.5:
            raise ValueError(f'Palette pair does not meet 4.5:1: {fg}/{bg}')
    lines = [f'/* CodeMakers-Design / Code Makers: {palette["name"]}.',
             '   Three opaque pairs checked. Add and verify focus, borders, states and secondary text. */', ':root {']
    for key, value in colors.items():
        lines.append(f'  --color-{key.replace("_", "-")}: {value};')
    lines.append('}')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('palette_id')
    parser.add_argument('--output', type=Path, help='Output CSS file; stdout when omitted')
    parser.add_argument('--force', action='store_true', help='Allow replacing the named output file')
    args = parser.parse_args()
    try:
        css = render_css(args.palette_id)
        if args.output:
            # Exclusive creation avoids silently replacing an existing token file.
            with args.output.open('w' if args.force else 'x', encoding='utf-8', newline='\n') as output:
                output.write(css)
            print(f'Written: {args.output}')
        else:
            print(css, end='')
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

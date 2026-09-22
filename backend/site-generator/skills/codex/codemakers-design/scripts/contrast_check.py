#!/usr/bin/env python3
"""CodeMakers-Design / Code Makers: contrast of two opaque sRGB hex colors.

No network or third-party packages. Does not inspect a page or certify WCAG.
Exit: 0 selected threshold met, 1 not met, 2 invalid CLI input.
"""

import argparse
import json
import re


def parse_hex(value):
    """Accept #RGB / RGB / #RRGGBB / RRGGBB, never alpha or CSS expressions."""
    match = re.fullmatch(r"#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})", value.strip())
    if not match:
        raise ValueError("Use an opaque sRGB hex color: #RGB or #RRGGBB.")
    digits = match.group(1)
    if len(digits) == 3:
        digits = "".join(c * 2 for c in digits)
    return tuple(int(digits[i:i + 2], 16) / 255 for i in (0, 2, 4))


def luminance(rgb):
    linear = tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb)
    return sum(c * weight for c, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast_ratio(foreground, background):
    first, second = luminance(parse_hex(foreground)), luminance(parse_hex(background))
    return (max(first, second) + 0.05) / (min(first, second) + 0.05)


def check(foreground, background, kind="normal"):
    thresholds = {"normal": 4.5, "large": 3.0, "non-text": 3.0}
    if kind not in thresholds:
        raise ValueError("kind must be normal, large, or non-text")
    ratio = contrast_ratio(foreground, background)
    threshold = thresholds[kind]
    return {
        "foreground": foreground,
        "background": background,
        "kind": kind,
        "ratio": ratio,
        "threshold": threshold,
        "passes": ratio >= threshold,
        "scope": "Opaque sRGB pair only; category applicability and full accessibility are not assessed.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("foreground", help="Opaque sRGB foreground, e.g. '#334155'")
    parser.add_argument("background", help="Opaque sRGB background, e.g. '#FFFFFF'")
    parser.add_argument("--kind", choices=("normal", "large", "non-text"), default="normal")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()
    try:
        result = check(args.foreground, args.background, args.kind)
    except ValueError as exc:
        parser.error(str(exc))
    if args.as_json:
        print(json.dumps(result, ensure_ascii=True))
    else:
        status = "PASS" if result["passes"] else "FAIL"
        print(f"{status}: {result['ratio']:.6f}:1; required {result['threshold']}:1 ({args.kind}).")
        print("Pass/fail uses the unrounded ratio. " + result["scope"])
    return 0 if result["passes"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

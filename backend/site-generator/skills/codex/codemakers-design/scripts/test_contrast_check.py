"""Regression checks for the included contrast utility; run with Python 3."""

import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

import contrast_check as contrast


class ContrastTests(unittest.TestCase):
    def test_black_white_extremes(self):
        self.assertAlmostEqual(contrast.contrast_ratio("#000", "#fff"), 21.0)

    def test_same_color(self):
        self.assertAlmostEqual(contrast.contrast_ratio("#3b82f6", "#3b82f6"), 1.0)

    def test_order_symmetry(self):
        self.assertAlmostEqual(contrast.contrast_ratio("#123456", "#fedcba"),
                               contrast.contrast_ratio("#fedcba", "#123456"))

    def test_short_and_long_forms(self):
        self.assertEqual(contrast.parse_hex("aBc"), contrast.parse_hex("#aabbcc"))

    def test_known_normal_threshold_pairs(self):
        self.assertFalse(contrast.check("#777777", "#ffffff")["passes"])
        self.assertTrue(contrast.check("#767676", "#ffffff")["passes"])

    def test_large_and_non_text_are_different_categories(self):
        self.assertTrue(contrast.check("#777", "#fff", "large")["passes"])
        self.assertTrue(contrast.check("#777", "#fff", "non-text")["passes"])

    def test_invalid_input(self):
        for value in ("", "red", "#ffff", "#11223344", "transparent", "rgb(1,2,3)", "#ggg"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                contrast.parse_hex(value)

    def test_never_round_into_a_pass(self):
        with patch.object(contrast, "contrast_ratio", return_value=4.4999999):
            self.assertFalse(contrast.check("#000", "#fff")["passes"])

    def test_threshold_equality(self):
        with patch.object(contrast, "contrast_ratio", return_value=4.5):
            self.assertTrue(contrast.check("#000", "#fff")["passes"])

    def test_cli_contract(self):
        script = str(Path(__file__).with_name("contrast_check.py"))
        for fg, bg, expected in (("#000", "#fff", 0), ("#777", "#fff", 1), ("#ffff", "#fff", 2)):
            with self.subTest(fg=fg):
                result = subprocess.run([sys.executable, "-B", script, fg, bg, "--json"],
                                        capture_output=True, text=True, check=False)
                self.assertEqual(result.returncode, expected, result.stderr)
                if expected != 2:
                    self.assertEqual(json.loads(result.stdout)["passes"], expected == 0)


if __name__ == "__main__":
    unittest.main()

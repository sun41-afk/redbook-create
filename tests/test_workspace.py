import subprocess
import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

class WorkspaceTest(unittest.TestCase):
    def test_source_archived_without_modification(self):
        with tempfile.TemporaryDirectory() as d:
            source = Path(d)/'material.txt'
            source.write_text('原始材料')
            out = Path(d)/'post'
            subprocess.run([sys.executable, str(ROOT/'scripts/new_post.py'), '--out', str(out), '--title', '问题？', '--source', str(source)], check=True, capture_output=True)
            self.assertEqual((out/'sources/material.txt').read_text(), source.read_text())

    def test_library_preserves_existing_records(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d)/'library'
            args = [sys.executable, str(ROOT/'scripts/init_library.py'), '--out', str(out)]
            subprocess.run(args, check=True, capture_output=True)
            self.assertTrue((out/'posts').is_dir())
            bank = out/'topic-bank.csv'
            bank.write_text('my personal records')
            self.assertNotEqual(subprocess.run(args, capture_output=True).returncode, 0)
            self.assertEqual(bank.read_text(), 'my personal records')

    def test_creation_and_refusal_to_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d)/'post'
            args = [sys.executable, str(ROOT/'scripts/new_post.py'), '--out', str(out), '--title', '封面问题？']
            subprocess.run(args, check=True, capture_output=True)
            self.assertTrue((out/'evidence.json').exists())
            (out/'keep.txt').write_text('user content')
            second = subprocess.run(args, capture_output=True)
            self.assertNotEqual(second.returncode, 0)
            self.assertEqual((out/'keep.txt').read_text(), 'user content')

if __name__ == '__main__': unittest.main()

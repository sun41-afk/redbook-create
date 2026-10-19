import subprocess
import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

class WorkspaceTest(unittest.TestCase):
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

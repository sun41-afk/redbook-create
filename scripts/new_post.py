#!/usr/bin/env python3
"""Create a separate post workspace without overwriting prior work."""
import argparse
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = ('foundations', 'food-movement', 'behavior', 'monitoring')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--title', required=True)
    parser.add_argument('--category', choices=CATEGORIES, default='foundations')
    parser.add_argument('--issue', default='001')
    parser.add_argument('--source', type=Path, help='Copy one source screenshot, PDF or text file into the workspace.')
    args = parser.parse_args()
    if args.out.exists():
        parser.error('Output directory already exists; select a new directory.')
    if args.source and not args.source.is_file():
        parser.error('Source must be an existing file.')
    args.out.mkdir(parents=True)
    (args.out / 'assets').mkdir()
    if args.source:
        (args.out / 'sources').mkdir()
        shutil.copyfile(args.source, args.out / 'sources' / args.source.name)
    data = json.loads((ROOT / 'templates/post.template.json').read_text())
    data.update(title=args.title, category=args.category, issue=args.issue)
    data['pages'][0]['title'] = args.title
    (args.out / 'post.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    for src, dest in [('evidence.template.json', 'evidence.json'),
                      ('review.template.json', 'review.json'),
                      ('series-profile.json', 'series-profile.json')]:
        shutil.copyfile(ROOT / 'templates' / src, args.out / dest)
    print(args.out.resolve())

if __name__ == '__main__':
    main()

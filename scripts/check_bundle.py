#!/usr/bin/env python3
"""Offline structural validation for this skill package."""
import csv
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

def main():
    errors = []
    required = ['SKILL.md', 'agents/openai.yaml', 'assets/topic-bank.csv',
                'templates/series-profile.json', 'templates/post.template.json',
                'templates/evidence.template.json', 'templates/review.template.json',
                'scripts/render.cjs', 'scripts/new_post.py', 'examples/post.example.json']
    for name in required:
        if not (ROOT / name).is_file(): errors.append(f'Missing {name}')
    skill = (ROOT / 'SKILL.md').read_text()
    if not skill.startswith('---\nname: redbook-create\ndescription: '):
        errors.append('Invalid skill frontmatter')
    with (ROOT / 'assets/topic-bank.csv').open(newline='') as f:
        rows = list(csv.DictReader(f))
    categories = {'foundations', 'food-movement', 'behavior', 'monitoring'}
    if len({r['id'] for r in rows}) != len(rows): errors.append('Duplicate topic IDs')
    if {r['category'] for r in rows} != categories: errors.append('Missing or invalid categories')
    if any(r['status'] != 'idea' for r in rows): errors.append('Seed topics should be ideas, not reviewed claims')
    for file in ROOT.rglob('*'):
        if not file.is_file() or any(p in {'node_modules','.git','__pycache__'} for p in file.parts): continue
        if file.suffix == '.json':
            try: json.loads(file.read_text())
            except Exception as exc: errors.append(f'{file.relative_to(ROOT)}: {exc}')
        if file.suffix in {'.md','.json','.yaml','.cjs','.py','.csv'}:
            content = file.read_text()
            if re.search(r'/(?:Users|home)/[A-Za-z0-9_.-]+/', content):
                errors.append(f'Personal absolute path: {file.relative_to(ROOT)}')
            if file.suffix == '.md':
                for target in re.findall(r'\]\(([^)]+)\)', content):
                    if target.startswith(('http:', 'https:', '#')): continue
                    if not (file.parent / target.split('#')[0]).exists():
                        errors.append(f'Broken link in {file.relative_to(ROOT)}: {target}')
    if errors: raise SystemExit('\n'.join(errors))
    print(f'Bundle OK: {len(rows)} seed topics, 4 categories, local links and JSON valid.')

if __name__ == '__main__': main()

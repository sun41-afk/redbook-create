#!/usr/bin/env python3
"""Initialize a personal library outside the installed skill; never overwrite one."""
import argparse
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    target = args.out.resolve()
    if target == ROOT or ROOT in target.parents:
        parser.error('Keep the personal library outside the skill package.')
    if target.exists():
        parser.error('Library already exists; use its existing topic-bank.csv.')
    target.mkdir(parents=True)
    for directory in ('posts', 'inbox'):
        (target / directory).mkdir()
    shutil.copyfile(ROOT / 'assets/topic-bank.csv', target / 'topic-bank.csv')
    shutil.copyfile(ROOT / 'templates/series-profile.json', target / 'series-profile.json')
    (target / 'README.md').write_text(
        '# 我的内容库\n\n'
        'topic-bank.csv 是持续维护的选题记录；inbox 存放待整理素材；posts 按选题ID存放笔记。\n'
        '以后使用 Redbook Create 时指定本目录，沿用已有记录、期数和系列配置。\n'
        '技能更新不替换本目录；公开分享技能时不上传这个个人内容库。\n', encoding='utf-8')
    print(target)

if __name__ == '__main__':
    main()

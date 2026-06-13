import os, re

path = 'C:/Users/hiros/OneDrive/ドキュメント/Time Regulus_v3.1.2_Renovation_/style-main.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all trailing scale(var(...)) inside and outside comments
content = re.sub(r'(\/\*.*?\*\/)\s*scale\(var\(--scale-(?:analog|info),\s*1\.0\)\);?', r'\1', content)
content = re.sub(r'(scale\(var\(--scale-(?:analog|info),\s*1\.0\)\)\s*)+', r'', content)

# Clean up any leftover trailing scales before semicolon just in case
content = re.sub(r'\s*scale\(var\(--scale-(?:analog|info),\s*1\.0\)\)', '', content)

# Inject correctly before the semicolon
content = re.sub(r'(transform:\s*translate\([^;]+?var\(--drag-analog-[^;]+?\))\s*;', r'\1 scale(var(--scale-analog, 1.0));', content)
content = re.sub(r'(transform:\s*translate\([^;]+?var\(--drag-info-[^;]+?\))\s*;', r'\1 scale(var(--scale-info, 1.0));', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed clean CSS")

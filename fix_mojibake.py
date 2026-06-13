import os

def fix_mojibake(text):
    try:
        # The text is currently mojibake in Python's unicode string.
        # It was originally UTF-8 bytes, incorrectly interpreted as Shift-JIS (cp932).
        # So we encode it back to cp932 to get the original UTF-8 bytes.
        original_bytes = text.encode('cp932')
        # Then decode those bytes properly as UTF-8.
        return original_bytes.decode('utf-8')
    except Exception as e:
        return text

css_path = 'C:/Users/hiros/OneDrive/ドキュメント/Time Regulus_v3.1.2_Renovation_/style-main.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

fixed_content = fix_mojibake(content)

# Fix the repeated scales
import re
fixed_content = re.sub(r'(scale\(var\(--scale-(?:analog|info), 1\.0\)\)\s*)+', r'scale(var(--scale-\g<1>, 1.0))', fixed_content)
# Wait, \g<1> won't work easily like this if I don't capture the type properly.
fixed_content = re.sub(r'(scale\(var\(--scale-analog, 1\.0\)\)\s*)+', r'scale(var(--scale-analog, 1.0))', fixed_content)
fixed_content = re.sub(r'(scale\(var\(--scale-info, 1\.0\)\)\s*)+', r'scale(var(--scale-info, 1.0))', fixed_content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("Fixed!")

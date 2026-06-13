import os

css_path = 'C:/Users/hiros/OneDrive/ドキュメント/Time Regulus_v3.1.2_Renovation_/style-main.css'

with open(css_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'transform: translate' in line:
        if 'var(--drag-analog' in line:
            # find the last semicolon
            parts = line.rsplit(';', 1)
            if len(parts) == 2:
                lines[i] = parts[0] + ' scale(var(--scale-analog, 1.0));' + parts[1]
        elif 'var(--drag-info' in line:
            parts = line.rsplit(';', 1)
            if len(parts) == 2:
                lines[i] = parts[0] + ' scale(var(--scale-info, 1.0));' + parts[1]

with open(css_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done python script")

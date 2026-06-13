with open('C:/Users/hiros/OneDrive/ドキュメント/Time Regulus_v3.1.2_Renovation_/style-main.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'transform: translate' in line:
        if 'var(--drag-analog' in line:
            lines[i] = line.rstrip().replace(';', ' scale(var(--scale-analog, 1.0));') + '\n'
        elif 'var(--drag-info' in line:
            lines[i] = line.rstrip().replace(';', ' scale(var(--scale-info, 1.0));') + '\n'

with open('C:/Users/hiros/OneDrive/ドキュメント/Time Regulus_v3.1.2_Renovation_/style-main.css', 'w', encoding='utf-8') as f:
    f.writelines(lines)

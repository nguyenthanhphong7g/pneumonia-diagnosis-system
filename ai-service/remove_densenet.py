import sys

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
out = []
skip = False
for line in lines:
    if line.startswith('def densenet_infer('):
        skip = True
    if skip and line.startswith('# ========================================================='):
        skip = False
    
    if not skip:
        out.append(line)

with open('main.py', 'w', encoding='utf-8') as f:
    f.writelines(out)

import sys
from pathlib import Path
for candidate in (Path('reports/service.log'), Path('service.log')):
    if candidate.exists():
        p = candidate
        break
else:
    print('service.log not found')
    sys.exit(0)
b=p.read_bytes()
for enc in ('utf-8','utf-16','latin1'):
    try:
        s=b.decode(enc)
        break
    except Exception:
        s=None
if s is None:
    print('Could not decode service.log')
    sys.exit(0)
keys=['Gated Fusion','Loaded LR','Loaded Gated Fusion','PCA WST','PCA ViT','Fusion model manager initialized','Initializing Fusion model manager','Loaded LR classifier','Loaded PCA','✅ Loaded']
for i,l in enumerate(s.splitlines()):
    for k in keys:
        if k in l:
            print(l)
            break

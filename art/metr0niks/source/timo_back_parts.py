# Cuts a transparent Tim-o parts sheet into one PNG per part (torso, thigh, shin, pack top row; armR, armL bottom row).
# Usage: python3 timo_back_parts.py <sheet.png> <outdir>. Used for the back 3/4 sheet (29 Oct 2026).
import sys,numpy as np
from PIL import Image
from scipy import ndimage
im=np.array(Image.open(sys.argv[1]).convert('RGBA'))
al=im[...,3]; m=al>40
lab,n=ndimage.label(ndimage.binary_closing(m,iterations=3))
objs=ndimage.find_objects(lab)
comps=[]
for i,sl in enumerate(objs):
    area=(lab[sl]==i+1).sum()
    if area<3000: continue
    comps.append((sl,i+1,area))
comps.sort(key=lambda c:(c[0][0].start>500, c[0][1].start))
names=['torso','thigh','shin','pack','armR','armL']
for (sl,k,area),nm in zip(comps,names):
    y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
    c=im[y0:y1,x0:x1].copy(); mask=lab[y0:y1,x0:x1]==k
    a=c[...,3].astype(float); a[~mask]=0; a=np.where(a>200,255,a)
    c[...,3]=a.astype(np.uint8)
    Image.fromarray(c).save(f'{sys.argv[2]}/{nm}.png'); print(nm,x0,y0,x1-x0,y1-y0,area)
print(len(comps))

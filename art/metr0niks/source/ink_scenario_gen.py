import json,sys,time,urllib.request,os
API="https://api.cloud.scenario.com/v1"
def req(method,path,body=None):
    r=urllib.request.Request(API+path,method=method,data=json.dumps(body).encode() if body is not None else None,headers={"content-type":"application/json"})
    return json.load(urllib.request.urlopen(r,timeout=120))
def gen(model,params,out,ext="png"):
    j=req("POST",f"/generate/custom/{model}",params)
    jid=j["job"]["jobId"]
    while True:
        time.sleep(4)
        s=req("GET",f"/jobs/{jid}")["job"]
        if s["status"] in("success","failure","canceled"): break
    if s["status"]!="success": print("FAIL",out,json.dumps(s)[:600]);return None
    ids=s["metadata"]["assetIds"]
    outs=[]
    for i,a in enumerate(ids):
        u=req("GET",f"/assets/{a}")["asset"]["url"]
        fn=out if len(ids)==1 else out.replace("."+ext,f"_{i}."+ext)
        urllib.request.urlretrieve(u,fn);outs.append((fn,a))
    print("OK",out,ids,s.get("metadata",{}).get("creativeUnitsCost") or "");return outs
if __name__=="__main__":
    model,params,out=sys.argv[1],json.loads(sys.argv[2]),sys.argv[3]
    gen(model,params,out,out.rsplit(".",1)[1])

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from app.core.database import engine, Base
from app.api import auth, portals, groups
import os
import httpx

Base.metadata.create_all(bind=engine)

app = FastAPI(title="X-Portals", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(portals.router)
app.include_router(groups.router)

@app.get("/api/favicon")
async def get_favicon(domain: str = ""):
    if not domain:
        return Response(status_code=400)
    sources = [
        f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
        f"https://favicon.im/{domain}",
        f"https://{domain}/favicon.ico",
    ]
    async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
        for src in sources:
            try:
                resp = await client.get(src)
                if resp.status_code == 200 and len(resp.content) > 100:
                    ct = resp.headers.get("content-type", "")
                    if "image" in ct or "octet" in ct or src.endswith(".ico"):
                        return Response(
                            content=resp.content,
                            media_type="image/png",
                            headers={"Cache-Control": "public, max-age=86400"},
                        )
            except Exception:
                continue
    return Response(status_code=404)


static_dir = os.path.join(os.path.dirname(__file__), "..", "static")


@app.get("/api/{full_path:path}")
async def api_not_found(full_path: str):
    return JSONResponse(status_code=404, content={"detail": "Not Found"})


if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))

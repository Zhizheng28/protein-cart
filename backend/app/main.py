"""FastAPI app: JSON API under /api, built React app for everything else."""

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import APP_NAME, FRONTEND_DIST, get_settings
from app.routers import cart, plan, stores


class Health(BaseModel):
    status: str
    app: str
    demo_mode: bool


api = APIRouter(prefix="/api")


@api.get("/health", response_model=Health)
def health() -> Health:
    """Liveness check used by Render."""
    return Health(status="ok", app=APP_NAME, demo_mode=get_settings().demo_mode)


api.include_router(plan.router)
api.include_router(stores.router)
api.include_router(cart.router)

app = FastAPI(title=APP_NAME)
app.include_router(api)

if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False, response_model=None)
def spa(path: str) -> FileResponse | HTMLResponse:
    """Serve built files: the landing page at /, the app at /app/."""
    if path.startswith("api/"):
        raise HTTPException(404, "Not found")
    root = FRONTEND_DIST.resolve()
    candidate = (root / path).resolve()
    if root != candidate and root not in candidate.parents:
        raise HTTPException(404, "Not found")
    if candidate.is_dir():
        candidate = candidate / "index.html"
    if candidate.is_file():
        return FileResponse(candidate)
    page = "app/index.html" if path.startswith("app") else "index.html"
    if (root / page).is_file():
        return FileResponse(root / page)
    return HTMLResponse(
        f"<h1>{APP_NAME}</h1><p>Frontend not built. Run npm run build in frontend/.</p>",
        status_code=503,
    )

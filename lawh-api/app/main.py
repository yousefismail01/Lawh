from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum


class Riwayah(str, Enum):
    """
    Supported riwayah (recitation traditions).
    All endpoints accept riwayah as an explicit typed parameter.
    Currently only Hafs is active; others are validated but return 422 for unsupported operations.
    This enum must match the TypeScript Riwayah union type in lawh-mobile/types/riwayah.ts.
    """
    hafs    = "hafs"
    warsh   = "warsh"
    qalun   = "qalun"
    ad_duri = "ad_duri"


SUPPORTED_RIWAYAT = {Riwayah.hafs}

app = FastAPI(
    title="Lawh Inference API",
    description="AI-powered Quran recitation analysis",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production to app domain
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint. Returns ok when service is running."""
    return {"status": "ok", "service": "lawh-inference"}


# -- Pattern for all Phase 2+ endpoints -------------------------------------------
# Every inference endpoint MUST include riwayah as explicit parameter.
# Example (uncomment in Phase 2):
#
# from fastapi import HTTPException
# @app.post("/inference/recitation")
# async def run_inference(riwayah: Riwayah, ...):
#     if riwayah not in SUPPORTED_RIWAYAT:
#         raise HTTPException(422, f"Riwayah '{riwayah}' not yet supported. Currently supported: hafs")
#     ...

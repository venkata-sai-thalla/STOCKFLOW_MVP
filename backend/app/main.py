from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, Base
import app.db.base  # ensure all models are registered

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create tables if not existing (ideal for demo/internal MVP)
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables verified/created successfully.")
    except Exception as e:
        print(f"Error connecting to DB or creating tables: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Parse CORS origins flexibly
cors_origins = []
raw_cors = settings.BACKEND_CORS_ORIGINS
if isinstance(raw_cors, str):
    if raw_cors == "*":
        cors_origins = ["*"]
    elif raw_cors.startswith("["):
        try:
            cors_origins = json.loads(raw_cors)
        except Exception:
            cors_origins = [raw_cors]
    else:
        cors_origins = [c.strip() for c in raw_cors.split(",") if c.strip()]
elif isinstance(raw_cors, list):
    cors_origins = raw_cors

# Always allow Vercel domain or fallback to wildcard
if not cors_origins:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],
    allow_credentials=True if "*" not in cors_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "StockFlow SaaS MVP API is online",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

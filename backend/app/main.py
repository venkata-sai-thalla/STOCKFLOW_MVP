from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, Base
import app.db.base  

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning on DB table creation (check DB connection): {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)


if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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

# Robust CORS middleware: allow regex pattern for any vercel.app and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stockflow-mvp-plum.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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

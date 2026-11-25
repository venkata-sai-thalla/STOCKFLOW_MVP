from fastapi import APIRouter
from app.api.v1.endpoints import auth, products, inventory, settings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])

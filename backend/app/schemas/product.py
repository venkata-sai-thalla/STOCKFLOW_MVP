from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    quantity_on_hand: int = Field(default=0, ge=0)
    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    selling_price: Optional[Decimal] = Field(default=None, ge=0)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    quantity_on_hand: Optional[int] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    selling_price: Optional[Decimal] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)

class StockAdjustment(BaseModel):
    adjustment: int = Field(description="Units to add or subtract, e.g. +5 or -3")
    note: Optional[str] = Field(None, description="Reason or note for adjustment")

class ProductResponse(ProductBase):
    id: int
    organization_id: int
    is_low_stock: bool = False
    effective_threshold: int = 5
    last_updated_by: Optional[str] = None
    last_adjustment_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    total_products: int
    total_quantity_on_hand: int
    low_stock_count: int
    default_low_stock_threshold: int
    low_stock_products: list[ProductResponse]

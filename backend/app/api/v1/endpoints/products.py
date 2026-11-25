from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.user import User, Organization
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    StockAdjustment,
)
from app.api.deps import get_current_user, get_current_org

router = APIRouter()

def serialize_product(product: Product, default_threshold: int) -> dict:
    threshold = product.low_stock_threshold if product.low_stock_threshold is not None else default_threshold
    return {
        "id": product.id,
        "organization_id": product.organization_id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,
        "quantity_on_hand": product.quantity_on_hand,
        "cost_price": product.cost_price,
        "selling_price": product.selling_price,
        "low_stock_threshold": product.low_stock_threshold,
        "effective_threshold": threshold,
        "is_low_stock": product.quantity_on_hand <= threshold,
        "last_updated_by": product.last_updated_by,
        "last_adjustment_note": getattr(product, "last_adjustment_note", None),
        "created_at": product.created_at,
        "updated_at": product.updated_at
    }

# ----------------- PRODUCTS CRUD ----------------- #

@router.get("", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search by Name or SKU"),
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_org)
):
    query = db.query(Product).filter(Product.organization_id == current_org.id)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(or_(Product.name.ilike(search_term), Product.sku.ilike(search_term)))
    
    products = query.order_by(Product.name.asc()).all()
    default_th = current_org.default_low_stock_threshold or 5
    return [serialize_product(p, default_th) for p in products]

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_org: Organization = Depends(get_current_org)
):
    # Check if SKU is unique within this organization
    existing = db.query(Product).filter(
        Product.organization_id == current_org.id,
        Product.sku.ilike(data.sku.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{data.sku}' already exists in your organization."
        )

    product = Product(
        organization_id=current_org.id,
        name=data.name.strip(),
        sku=data.sku.strip(),
        description=data.description,
        quantity_on_hand=data.quantity_on_hand,
        cost_price=data.cost_price,
        selling_price=data.selling_price,
        low_stock_threshold=data.low_stock_threshold,
        last_updated_by=current_user.email
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return serialize_product(product, current_org.default_low_stock_threshold)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_org)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_org.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return serialize_product(product, current_org.default_low_stock_threshold)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_org: Organization = Depends(get_current_org)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_org.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_dict = data.model_dump(exclude_unset=True)
    
    # If updating SKU, check uniqueness
    if "sku" in update_dict and update_dict["sku"]:
        new_sku = update_dict["sku"].strip()
        existing = db.query(Product).filter(
            Product.organization_id == current_org.id,
            Product.sku.ilike(new_sku),
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another product with SKU '{new_sku}' already exists."
            )
        update_dict["sku"] = new_sku

    for key, value in update_dict.items():
        setattr(product, key, value)
    
    product.last_updated_by = current_user.email
    db.commit()
    db.refresh(product)
    return serialize_product(product, current_org.default_low_stock_threshold)

@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    product_id: int,
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_org: Organization = Depends(get_current_org)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_org.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    new_quantity = product.quantity_on_hand + data.adjustment
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock cannot be negative. Current stock is {product.quantity_on_hand}."
        )

    product.quantity_on_hand = new_quantity
    product.last_updated_by = current_user.email
    if data.note:
        product.last_adjustment_note = data.note.strip()
    db.commit()
    db.refresh(product)
    return serialize_product(product, current_org.default_low_stock_threshold)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_org)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_org.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    db.delete(product)
    db.commit()
    return None

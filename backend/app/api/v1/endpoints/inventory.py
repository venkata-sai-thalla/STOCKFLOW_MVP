from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import Organization
from app.models.product import Product
from app.schemas.product import DashboardSummaryResponse
from app.api.deps import get_current_org
from app.api.v1.endpoints.products import serialize_product

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_org)
):
    products = db.query(Product).filter(Product.organization_id == current_org.id).all()
    default_th = current_org.default_low_stock_threshold or 5
    
    total_products = len(products)
    total_quantity = sum(p.quantity_on_hand for p in products)
    
    serialized = [serialize_product(p, default_th) for p in products]
    low_stock_items = [p for p in serialized if p["is_low_stock"]]
    
    return {
        "total_products": total_products,
        "total_quantity_on_hand": total_quantity,
        "low_stock_count": len(low_stock_items),
        "default_low_stock_threshold": default_th,
        "low_stock_products": low_stock_items
    }

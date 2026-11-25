from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import Organization
from app.schemas.user import OrganizationResponse, OrganizationUpdateSettings
from app.api.deps import get_current_org

router = APIRouter()

@router.get("", response_model=OrganizationResponse)
def get_settings(current_org: Organization = Depends(get_current_org)):
    return current_org

@router.put("", response_model=OrganizationResponse)
def update_settings(
    data: OrganizationUpdateSettings,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_org)
):
    current_org.default_low_stock_threshold = data.default_low_stock_threshold
    db.commit()
    db.refresh(current_org)
    return current_org

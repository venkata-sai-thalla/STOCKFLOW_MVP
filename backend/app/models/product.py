from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    quantity_on_hand = Column(Integer, default=0, nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)
    selling_price = Column(Numeric(10, 2), nullable=True)
    low_stock_threshold = Column(Integer, nullable=True)
    
    last_updated_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="products")

    __table_args__ = (
        UniqueConstraint('organization_id', 'sku', name='uix_org_product_sku'),
    )

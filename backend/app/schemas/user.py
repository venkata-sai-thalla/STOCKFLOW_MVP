from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdateSettings(BaseModel):
    default_low_stock_threshold: int = Field(ge=0, description="Default low stock threshold for org")

class OrganizationResponse(OrganizationBase):
    id: int
    default_low_stock_threshold: int
    created_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    organization_name: str = Field(min_length=1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    organization_id: int
    created_at: datetime
    organization: Optional[OrganizationResponse] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

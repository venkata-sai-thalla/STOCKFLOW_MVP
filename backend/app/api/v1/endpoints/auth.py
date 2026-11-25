from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, Organization
from app.schemas.user import UserSignup, UserLogin, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email.ilike(data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # 1. Create Organization
    org = Organization(
        name=data.organization_name.strip(),
        default_low_stock_threshold=5
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    # 2. Create User linked to Org
    user = User(
        email=data.email.strip().lower(),
        hashed_password=get_password_hash(data.password),
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(data.email.strip())).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

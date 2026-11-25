import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

# Use an in-memory SQLite database for fast, isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_signup_creates_org_and_user(client):
    res = client.post("/api/v1/auth/signup", json={
        "email": "owner@tenant1.com",
        "password": "securepassword",
        "organization_name": "Tenant One"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "owner@tenant1.com"
    assert data["user"]["organization"]["name"] == "Tenant One"

def test_login_flow(client):
    client.post("/api/v1/auth/signup", json={
        "email": "user@test.com",
        "password": "mypassword123",
        "organization_name": "Test Org"
    })
    
    # Successful login
    res = client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "mypassword123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

    # Bad password
    bad = client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "wrongpassword"
    })
    assert bad.status_code == 401

def test_multi_tenant_data_isolation(client):
    # 1. Signup Tenant A
    res_a = client.post("/api/v1/auth/signup", json={
        "email": "alice@company-a.com",
        "password": "passwordA",
        "organization_name": "Company A"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Signup Tenant B
    res_b = client.post("/api/v1/auth/signup", json={
        "email": "bob@company-b.com",
        "password": "passwordB",
        "organization_name": "Company B"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Tenant A creates product with SKU "SKU-100"
    prod_a = client.post("/api/v1/products", headers=headers_a, json={
        "name": "Widget A",
        "sku": "SKU-100",
        "quantity_on_hand": 10,
        "cost_price": 5.0,
        "selling_price": 10.0,
        "low_stock_threshold": 3
    })
    assert prod_a.status_code == 201
    prod_a_id = prod_a.json()["id"]

    # Tenant B creates same SKU "SKU-100" (should succeed because SKU uniqueness is per org)
    prod_b = client.post("/api/v1/products", headers=headers_b, json={
        "name": "Widget B",
        "sku": "SKU-100",
        "quantity_on_hand": 2,
        "cost_price": 7.0,
        "selling_price": 15.0
    })
    assert prod_b.status_code == 201

    # Tenant B tries to get Tenant A's product -> 404
    cross_read = client.get(f"/api/v1/products/{prod_a_id}", headers=headers_b)
    assert cross_read.status_code == 404

    # Tenant B lists products -> only sees their own product
    list_b = client.get("/api/v1/products", headers=headers_b)
    assert list_b.status_code == 200
    items_b = list_b.json()
    assert len(items_b) == 1
    assert items_b[0]["name"] == "Widget B"

def test_stock_adjustment_and_low_stock_calculation(client):
    res = client.post("/api/v1/auth/signup", json={
        "email": "manager@store.com",
        "password": "password",
        "organization_name": "My Store"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create product with default org threshold (5)
    create_res = client.post("/api/v1/products", headers=headers, json={
        "name": "Keyboard",
        "sku": "KB-01",
        "quantity_on_hand": 8,
        "selling_price": 49.99
    })
    assert create_res.status_code == 201
    prod = create_res.json()
    assert prod["is_low_stock"] is False
    assert prod["effective_threshold"] == 5

    # Adjust stock: subtract 4 units (8 - 4 = 4 units <= 5 threshold -> low stock triggers)
    adj_res = client.post(f"/api/v1/products/{prod['id']}/adjust-stock", headers=headers, json={
        "adjustment": -4,
        "note": "Damaged goods deduction"
    })
    assert adj_res.status_code == 200
    updated_prod = adj_res.json()
    assert updated_prod["quantity_on_hand"] == 4
    assert updated_prod["is_low_stock"] is True

    # Dashboard reflects 1 product and 1 low stock item
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["total_products"] == 1
    assert dash["total_quantity_on_hand"] == 4
    assert dash["low_stock_count"] == 1
    assert len(dash["low_stock_products"]) == 1

def test_org_settings_low_stock_threshold_update(client):
    res = client.post("/api/v1/auth/signup", json={
        "email": "admin@org.com",
        "password": "password",
        "organization_name": "Threshold Org"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update org threshold from 5 to 10
    put_settings = client.put("/api/v1/settings", headers=headers, json={
        "default_low_stock_threshold": 10
    })
    assert put_settings.status_code == 200
    assert put_settings.json()["default_low_stock_threshold"] == 10

    # Create product with 8 units and no custom threshold
    p = client.post("/api/v1/products", headers=headers, json={
        "name": "Monitor",
        "sku": "MON-01",
        "quantity_on_hand": 8
    })
    assert p.status_code == 201
    p_data = p.json()
    assert p_data["effective_threshold"] == 10
    assert p_data["is_low_stock"] is True  # 8 <= 10

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

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

def test_signup_creates_org_and_owner_user(client):
    res = client.post("/api/v1/auth/signup", json={
        "email": "owner@acme.com",
        "password": "password123",
        "organization_name": "Acme Retail"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "owner@acme.com"
    assert data["user"]["organization"]["name"] == "Acme Retail"
    assert data["user"]["organization"]["default_low_stock_threshold"] == 5

def test_login_flow(client):
    client.post("/api/v1/auth/signup", json={
        "email": "user@retail.com",
        "password": "password123",
        "organization_name": "Retail Store"
    })
    # Valid login
    res = client.post("/api/v1/auth/login", json={
        "email": "user@retail.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

    # Invalid login
    res_bad = client.post("/api/v1/auth/login", json={
        "email": "user@retail.com",
        "password": "wrongpassword"
    })
    assert res_bad.status_code == 401

def test_tenant_data_scoping_and_org_unique_sku(client):
    # Setup Tenant A
    res_a = client.post("/api/v1/auth/signup", json={
        "email": "a@tenant.com",
        "password": "password",
        "organization_name": "Org A"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup Tenant B
    res_b = client.post("/api/v1/auth/signup", json={
        "email": "b@tenant.com",
        "password": "password",
        "organization_name": "Org B"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Org A creates product SKU-01
    create_a = client.post("/api/v1/products", headers=headers_a, json={
        "name": "Org A Item",
        "sku": "SKU-01",
        "quantity_on_hand": 10
    })
    assert create_a.status_code == 201
    prod_a_id = create_a.json()["id"]

    # Duplicate SKU within Org A fails
    dup_a = client.post("/api/v1/products", headers=headers_a, json={
        "name": "Org A Duplicate",
        "sku": "SKU-01",
        "quantity_on_hand": 5
    })
    assert dup_a.status_code == 400
    assert "already exists in your organization" in dup_a.json()["detail"]

    # Org B creates identical SKU-01 (must succeed due to tenant isolation)
    create_b = client.post("/api/v1/products", headers=headers_b, json={
        "name": "Org B Item",
        "sku": "SKU-01",
        "quantity_on_hand": 20
    })
    assert create_b.status_code == 201

    # Cross-tenant read is blocked
    cross_read = client.get(f"/api/v1/products/{prod_a_id}", headers=headers_b)
    assert cross_read.status_code == 404

    # Cross-tenant update is blocked
    cross_update = client.put(f"/api/v1/products/{prod_a_id}", headers=headers_b, json={
        "name": "Hacked Name"
    })
    assert cross_update.status_code == 404

    # Cross-tenant stock adjust is blocked
    cross_adjust = client.post(f"/api/v1/products/{prod_a_id}/adjust-stock", headers=headers_b, json={
        "adjustment": -5
    })
    assert cross_adjust.status_code == 404

    # Cross-tenant delete is blocked
    cross_delete = client.delete(f"/api/v1/products/{prod_a_id}", headers=headers_b)
    assert cross_delete.status_code == 404

def test_stock_adjustment_and_reason_persistence(client):
    res = client.post("/api/v1/auth/signup", json={
        "email": "stock@test.com",
        "password": "password",
        "organization_name": "Stock Org"
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    create = client.post("/api/v1/products", headers=headers, json={
        "name": "Coffee Beans",
        "sku": "CB-01",
        "quantity_on_hand": 15
    })
    prod_id = create.json()["id"]

    # Valid positive adjustment with reason note
    adj_pos = client.post(f"/api/v1/products/{prod_id}/adjust-stock", headers=headers, json={
        "adjustment": 5,
        "note": "Restocked 5 bags from supplier"
    })
    assert adj_pos.status_code == 200
    assert adj_pos.json()["quantity_on_hand"] == 20
    assert adj_pos.json()["last_adjustment_note"] == "Restocked 5 bags from supplier"

    # Negative adjustment resulting in negative stock is rejected
    adj_invalid = client.post(f"/api/v1/products/{prod_id}/adjust-stock", headers=headers, json={
        "adjustment": -25,
        "note": "Invalid deduction"
    })
    assert adj_invalid.status_code == 400
    assert "Stock cannot be negative" in adj_invalid.json()["detail"]

    # Verify stock remained 20
    get_prod = client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert get_prod.json()["quantity_on_hand"] == 20

def test_threshold_fallback_and_boundary_conditions(client):
    res = client.post("/api/v1/auth/signup", json={
        "email": "thresh@test.com",
        "password": "password",
        "organization_name": "Threshold Testing"
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Org default starts at 5. Create product with no custom threshold at 5 units
    p1 = client.post("/api/v1/products", headers=headers, json={
        "name": "Item at boundary",
        "sku": "BOUND-01",
        "quantity_on_hand": 5
    }).json()
    assert p1["effective_threshold"] == 5
    assert p1["is_low_stock"] is True  # 5 <= 5 is low stock

    # Create product at 6 units (not low stock)
    p2 = client.post("/api/v1/products", headers=headers, json={
        "name": "Item above boundary",
        "sku": "BOUND-02",
        "quantity_on_hand": 6
    }).json()
    assert p2["is_low_stock"] is False

    # Product with explicit custom threshold (e.g. 10)
    p3 = client.post("/api/v1/products", headers=headers, json={
        "name": "Custom threshold item",
        "sku": "BOUND-03",
        "quantity_on_hand": 8,
        "low_stock_threshold": 10
    }).json()
    assert p3["effective_threshold"] == 10
    assert p3["is_low_stock"] is True  # 8 <= 10

    # Dashboard aggregates
    dash = client.get("/api/v1/dashboard/summary", headers=headers).json()
    assert dash["total_products"] == 3
    assert dash["total_quantity_on_hand"] == 19  # 5 + 6 + 8
    assert dash["low_stock_count"] == 2  # p1 and p3

    # Update org settings threshold to 8
    client.put("/api/v1/settings", headers=headers, json={"default_low_stock_threshold": 8})
    dash2 = client.get("/api/v1/dashboard/summary", headers=headers).json()
    # Now p2 (6 units) is <= 8 default threshold, so low_stock_count becomes 3
    assert dash2["low_stock_count"] == 3

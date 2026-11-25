import sys
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

def run_all_tests():
    Base.metadata.create_all(bind=engine)
    client = TestClient(app)
    
    print("Running StockFlow Test Suite...")
    
    # Test 1: Signup & Org Creation
    res = client.post("/api/v1/auth/signup", json={
        "email": "owner@tenant1.com",
        "password": "securepassword",
        "organization_name": "Tenant One"
    })
    assert res.status_code == 201, f"Signup failed: {res.text}"
    token_1 = res.json()["access_token"]
    print(" [PASS] Signup & Organization context creation")

    # Test 2: Login validation
    login_res = client.post("/api/v1/auth/login", json={
        "email": "owner@tenant1.com",
        "password": "securepassword"
    })
    assert login_res.status_code == 200
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "owner@tenant1.com",
        "password": "wrong"
    })
    assert bad_login.status_code == 401
    print(" [PASS] Authentication & invalid credential rejection")

    # Test 3: Multi-tenant data scoping
    res_b = client.post("/api/v1/auth/signup", json={
        "email": "owner@tenant2.com",
        "password": "securepassword2",
        "organization_name": "Tenant Two"
    })
    token_2 = res_b.json()["access_token"]

    headers_1 = {"Authorization": f"Bearer {token_1}"}
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    # Tenant 1 creates product
    p1 = client.post("/api/v1/products", headers=headers_1, json={
        "name": "Widget Tenant 1",
        "sku": "WIDGET-01",
        "quantity_on_hand": 10,
        "cost_price": 5.0,
        "selling_price": 10.0
    })
    assert p1.status_code == 201
    p1_id = p1.json()["id"]

    # Tenant 2 creates product with identical SKU
    p2 = client.post("/api/v1/products", headers=headers_2, json={
        "name": "Widget Tenant 2",
        "sku": "WIDGET-01",
        "quantity_on_hand": 2,
        "selling_price": 12.0
    })
    assert p2.status_code == 201, "SKU uniqueness should be scoped per organization"

    # Cross-tenant isolation verification
    cross = client.get(f"/api/v1/products/{p1_id}", headers=headers_2)
    assert cross.status_code == 404, "Tenant 2 should not be able to read Tenant 1 product"

    t2_list = client.get("/api/v1/products", headers=headers_2).json()
    assert len(t2_list) == 1 and t2_list[0]["name"] == "Widget Tenant 2"
    print(" [PASS] Multi-tenant data scoping & per-org SKU uniqueness")

    # Test 4: Stock Adjustment & Low-Stock status logic
    adj = client.post(f"/api/v1/products/{p1_id}/adjust-stock", headers=headers_1, json={
        "adjustment": -6
    })
    assert adj.status_code == 200
    updated_p1 = adj.json()
    assert updated_p1["quantity_on_hand"] == 4
    assert updated_p1["is_low_stock"] is True  # 4 <= default threshold 5
    print(" [PASS] Inline stock adjustment & dynamic low-stock calculation")

    # Test 5: Dashboard Overview metrics
    dash = client.get("/api/v1/dashboard/summary", headers=headers_1).json()
    assert dash["total_products"] == 1
    assert dash["total_quantity_on_hand"] == 4
    assert dash["low_stock_count"] == 1
    print(" [PASS] Dashboard overview metrics")

    # Test 6: Settings threshold update
    settings_put = client.put("/api/v1/settings", headers=headers_1, json={
        "default_low_stock_threshold": 3
    })
    assert settings_put.status_code == 200
    # After threshold changes to 3, 4 units is no longer low stock
    dash_updated = client.get("/api/v1/dashboard/summary", headers=headers_1).json()
    assert dash_updated["low_stock_count"] == 0
    print(" [PASS] Organization settings threshold update & reactive low-stock evaluation")

    # Test 7: Delete product with tenant check
    del_res = client.delete(f"/api/v1/products/{p1_id}", headers=headers_1)
    assert del_res.status_code == 204
    assert len(client.get("/api/v1/products", headers=headers_1).json()) == 0
    print(" [PASS] Product deletion flow")

    print("\nALL 7 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"Test failed: {e}", file=sys.stderr)
        sys.exit(1)

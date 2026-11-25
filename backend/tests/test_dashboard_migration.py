from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.api.v1.endpoints.inventory import get_dashboard_summary
from app.db.migrations import migrate_product_adjustment_note
from app.db.session import Base
from app.models.user import Organization


def test_existing_products_table_gets_adjustment_note_column():
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE products ("
                "id INTEGER PRIMARY KEY, "
                "organization_id INTEGER NOT NULL, "
                "name VARCHAR(255) NOT NULL, "
                "sku VARCHAR(100) NOT NULL, "
                "description TEXT, "
                "quantity_on_hand INTEGER NOT NULL, "
                "cost_price NUMERIC(10, 2), "
                "selling_price NUMERIC(10, 2), "
                "low_stock_threshold INTEGER, "
                "last_updated_by VARCHAR(255), "
                "created_at DATETIME NOT NULL, "
                "updated_at DATETIME NOT NULL)"
            )
        )

    Base.metadata.create_all(bind=engine, tables=[Organization.__table__])
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO organizations (id, name, default_low_stock_threshold, created_at, updated_at) "
                "VALUES (1, 'Test Org', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO products "
                "(id, organization_id, name, sku, quantity_on_hand, created_at, updated_at) "
                "VALUES (1, 1, 'Test Product', 'SKU-1', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
        )

    migrate_product_adjustment_note(engine)
    migrate_product_adjustment_note(engine)

    with Session(engine) as session:
        organization = session.get(Organization, 1)
        summary = get_dashboard_summary(session, organization)

    assert summary["total_products"] == 1
    assert summary["total_quantity_on_hand"] == 2
    assert summary["low_stock_count"] == 1
    engine.dispose()

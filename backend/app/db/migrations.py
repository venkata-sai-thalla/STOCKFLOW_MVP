from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def migrate_product_adjustment_note(engine: Engine) -> None:
    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE products "
                    "ADD COLUMN IF NOT EXISTS last_adjustment_note VARCHAR(255)"
                )
            )
        return

    columns = {column["name"] for column in inspect(engine).get_columns("products")}
    if "last_adjustment_note" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE products ADD COLUMN last_adjustment_note VARCHAR(255)")
            )

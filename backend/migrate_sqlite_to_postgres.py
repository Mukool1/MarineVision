"""One-time copy of rows from the old SQLite file into PostgreSQL.

Run once from the backend/ directory, AFTER the Postgres role and database
exist and DATABASE_URL is set:

    cd backend
    python migrate_sqlite_to_postgres.py

Env:
    DATABASE_URL  postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME (from .env)
    SQLITE_PATH   path to the old sqlite file (default: ./marinevision_dev.db)
"""
import os
import sqlite3

from dotenv import load_dotenv

load_dotenv()

import psycopg
from sqlalchemy.engine.url import make_url

TABLES = ("users", "scans", "scan_feedback")

def main():
    sqlite_path = os.getenv("SQLITE_PATH", "./marinevision_dev.db")
    if not os.path.exists(sqlite_path):
        raise SystemExit(f"SQLite file not found: {sqlite_path}")

    url = make_url(os.environ["DATABASE_URL"])  # decodes %-encoded password chars
    src = sqlite3.connect(sqlite_path)
    src.row_factory = sqlite3.Row
    try:
        with psycopg.connect(
            host=url.host,
            port=url.port or 5432,
            dbname=url.database,
            user=url.username,
            password=url.password,
        ) as dst:
            for table in TABLES:
                rows = [dict(row) for row in src.execute(f"SELECT * FROM {table}")]
                if not rows:
                    print(f"{table}: nothing to copy")
                    continue
                columns = list(rows[0].keys())
                col_list = ", ".join(f'"{c}"' for c in columns)
                placeholders = ", ".join(["%s"] * len(columns))
                with dst.cursor() as cur:
                    cur.executemany(
                        f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders}) '
                        "ON CONFLICT DO NOTHING",
                        [[row[c] for c in columns] for row in rows],
                    )
                    print(f"{table}: {cur.rowcount} row(s) inserted")
            # Advance the id sequences past the copied rows, so new inserts
            # don't collide with existing primary keys.
            with dst.cursor() as cur:
                for table, id_col in (("users", "id"), ("scan_feedback", "id")):
                    cur.execute(
                        f"SELECT setval(pg_get_serial_sequence('\"{table}\"', '{id_col}'), "
                        f"COALESCE((SELECT MAX({id_col}) FROM \"{table}\"), 1))"
                    )
    finally:
        src.close()
    print("Migration complete. Verify with: psql $DATABASE_URL -c 'SELECT count(*) FROM scans;'")

if __name__ == "__main__":
    main()

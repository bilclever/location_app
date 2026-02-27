import sqlite3
import sys
from pathlib import Path

def main(db_path):
    db = Path(db_path)
    if not db.exists():
        print(f"DB not found: {db}")
        return 1
    con = sqlite3.connect(str(db))
    cur = con.cursor()
    cur.execute("PRAGMA table_info('api_appartement')")
    cols = cur.fetchall()
    if not cols:
        print("Table api_appartement not found or has no columns.")
        return 1
    print('Columns for api_appartement:')
    for c in cols:
        # PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
        print(c)
    return 0

if __name__ == '__main__':
    db = sys.argv[1] if len(sys.argv) > 1 else 'db.sqlite3'
    sys.exit(main(db))

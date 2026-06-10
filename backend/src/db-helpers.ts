import initSqlJs from 'sql.js';

type Database = any;
type Row = Record<string, any>;

export function queryAll(db: Database, sql: string, params: any[] = []): Row[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: Row[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(db: Database, sql: string, params: any[] = []): Row | undefined {
  const rows = queryAll(db, sql, params);
  return rows[0];
}

export function execute(db: Database, sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] as number || 0;
  const changes = db.getRowsModified();
  return { changes, lastInsertRowid: lastId };
}

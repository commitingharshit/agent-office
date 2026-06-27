use anyhow::{Context, Result};
use rusqlite::Connection;
use std::path::Path;

pub fn init_db(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    
    conn.execute("PRAGMA journal_mode = WAL;", [])?;
    conn.execute("PRAGMA synchronous = NORMAL;", [])?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS doc_nodes (
            node_id TEXT PRIMARY KEY,
            parent_id TEXT,
            node_type TEXT NOT NULL,
            part_name TEXT NOT NULL,
            stable_id TEXT,
            xpath TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            start_offset INTEGER,
            end_offset INTEGER,
            text TEXT,
            text_hash TEXT NOT NULL,
            xml_hash TEXT NOT NULL,
            structure_hash TEXT NOT NULL,
            merkle_hash TEXT NOT NULL
        );",
        [],
    )?;

    conn.execute("CREATE INDEX IF NOT EXISTS idx_xpath ON doc_nodes(xpath);", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_stable_id ON doc_nodes(stable_id) WHERE stable_id IS NOT NULL;", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_part_order ON doc_nodes(part_name, order_index);", [])?;

    // FTS5 Virtual Table for Search
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS doc_fts USING fts5(
            text, 
            content='doc_nodes', 
            content_rowid='rowid'
        );",
        [],
    )?;

    // Bloom Filter table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS doc_bloom (
            doc_id TEXT PRIMARY KEY,
            filter_data BLOB NOT NULL
        );",
        [],
    )?;

    Ok(conn)
}

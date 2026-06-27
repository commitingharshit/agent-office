use anyhow::Result;
use rusqlite::Connection;

pub fn search(conn: &Connection, query: &str) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT node_id FROM doc_fts WHERE text MATCH ? ORDER BY rank;"
    )?;
    
    let rows = stmt.query_map([query], |row| row.get::<_, String>(0))?;
    
    let mut results = Vec::new();
    for node_id in rows {
        results.push(node_id?);
    }
    Ok(results)
}

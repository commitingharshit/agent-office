use anyhow::{Result, anyhow};
use rusqlite::Connection;
use serde::Serialize;

#[derive(Serialize)]
pub struct LocateResult {
    pub status: String,
    pub node_id: Option<String>,
    pub xpath: Option<String>,
    pub char_start: Option<usize>,
    pub char_end: Option<usize>,
}

pub fn locate_quote(conn: &Connection, quote: &str) -> Result<LocateResult> {
    let mut stmt = conn.prepare(
        "SELECT node_id, xpath, text FROM doc_nodes WHERE text LIKE ? LIMIT 2"
    )?;
    
    let mut rows = stmt.query_map([format!("%{}%", quote)], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
    })?;

    let mut matches = Vec::new();
    while let Some(row) = rows.next() {
        matches.push(row?);
    }

    if matches.is_empty() {
        return Ok(LocateResult { status: "not_found".to_string(), node_id: None, xpath: None, char_start: None, char_end: None });
    }

    if matches.len() > 1 {
        return Ok(LocateResult { status: "ambiguous".to_string(), node_id: None, xpath: None, char_start: None, char_end: None });
    }

    let (node_id, xpath, text) = &matches[0];
    let start = text.find(quote).unwrap_or(0);
    let end = start + quote.len();

    Ok(LocateResult {
        status: "resolved".to_string(),
        node_id: Some(node_id.clone()),
        xpath: Some(xpath.clone()),
        char_start: Some(start),
        char_end: Some(end),
    })
}

use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use crate::docmap::DocMap;

pub fn persist_docmap(conn: &mut Connection, docmap: &DocMap) -> Result<()> {
    let tx = conn.transaction()?;

    {
        let mut stmt = tx.prepare(
            "INSERT INTO doc_nodes (
                node_id, parent_id, node_type, part_name, stable_id, xpath, 
                order_index, start_offset, end_offset, text, text_hash, 
                xml_hash, structure_hash, merkle_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )?;

        for node in docmap.nodes.values() {
            stmt.execute(params![
                node.node_id,
                node.parent_id,
                node.node_type,
                node.part_name,
                node.stable_id,
                node.xpath,
                node.order_index as i64,
                node.start_offset.map(|v| v as i64),
                node.end_offset.map(|v| v as i64),
                node.text,
                node.text_hash,
                node.xml_hash,
                node.structure_hash,
                node.merkle_hash
            ])?;
        }
    }

    tx.commit().context("Failed to commit DocMap transaction")
}

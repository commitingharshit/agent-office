use anyhow::{Context, Result};
use rusqlite::Connection;
use std::path::Path;
use walkdir::WalkDir;

pub struct FolderIndexer {
    conn: Connection,
}

impl FolderIndexer {
    pub fn new(conn: Connection) -> Self {
        Self { conn }
    }

    pub fn index_folder(&self, folder_path: &Path) -> Result<()> {
        for entry in WalkDir::new(folder_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy();
                    if ["docx", "txt", "xml"].contains(&ext_str.as_ref()) {
                        self.process_file(path)?;
                    }
                }
            }
        }
        Ok(())
    }

    fn process_file(&self, path: &Path) -> Result<()> {
        let content = std::fs::read_to_string(path).unwrap_or_default();
        let doc_id = path.to_string_lossy().to_string();
        
        // Simplified indexing for Phase 4
        self.conn.execute(
            "INSERT INTO doc_nodes (node_id, node_type, part_name, xpath, order_index, text, text_hash, xml_hash, structure_hash, merkle_hash) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (&doc_id, "file", "root", "/", 0, &content, "hash", "hash", "hash", "hash"),
        )?;
        
        self.conn.execute(
            "INSERT INTO doc_fts (text) VALUES (?)",
            [&content],
        )?;

        Ok(())
    }
}

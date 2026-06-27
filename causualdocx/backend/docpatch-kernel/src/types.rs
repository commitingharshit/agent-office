use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DocNode {
    pub node_id: String,
    pub parent_id: Option<String>,
    pub node_type: String, // package, part, body, paragraph, run, table, row, cell, comment
    pub part_name: String,
    pub stable_id: Option<String>,
    pub xpath: String,
    pub order_index: usize,
    pub start_offset: Option<usize>,
    pub end_offset: Option<usize>,
    pub text: Option<String>,
    pub text_hash: String,
    pub xml_hash: String,
    pub structure_hash: String,
    pub merkle_hash: String,
    pub children: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PartNode {
    pub part_name: String,
    pub content_type: String,
    pub rels_hash: Option<String>,
    pub root_node_id: String,
    pub part_hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FolderDoc {
    pub doc_id: String,
    pub path: String,
    pub file_name: String,
    pub file_type: String,
    pub modified_at: u64,
    pub size_bytes: u64,
    pub package_hash: String,
    pub text_hash: String,
    pub summary: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TargetAddress {
    pub doc_id: String,
    pub file_path: String,
    pub part_name: String,
    pub node_id: String,
    pub stable_id: Option<String>,
    pub xpath: String,
    pub quote: Option<String>,
    pub prefix: Option<String>,
    pub suffix: Option<String>,
    pub expected_text_hash: String,
    pub expected_xml_hash: Option<String>,
}

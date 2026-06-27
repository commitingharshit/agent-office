use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::path::Path;
use zip::ZipArchive;

/// Robust inspection result capturing the essential OCP package structure.
#[derive(Debug, Serialize, Deserialize)]
pub struct InspectResult {
    pub parts: Vec<String>,
    pub relationships: Vec<String>,
    pub content_types: Vec<String>,
    pub package_manifest_hash: String, // Added for robustness
}

/// Inspects a DOCX package with error handling and manifest hashing for verification.
pub fn inspect_docx(path: &Path) -> Result<InspectResult> {
    let file = File::open(path).context(format!("Failed to open DOCX at {:?}", path))?;
    let mut archive = ZipArchive::new(file).context("Invalid ZIP structure in DOCX package")?;

    let mut parts = Vec::new();
    let mut relationships = Vec::new();
    let mut content_types = Vec::new();

    // Use a deterministic order for hashes
    let mut sorted_files: Vec<String> = archive.file_names().map(|s| s.to_string()).collect();
    sorted_files.sort();

    let mut hasher = blake3::Hasher::new();

    for name in sorted_files {
        parts.push(name.clone());
        hasher.update(name.as_bytes());

        if name.ends_with(".rels") {
            relationships.push(name);
        } else if name == "[Content_Types].xml" {
            content_types.push(name);
        }
    }

    Ok(InspectResult {
        parts,
        relationships,
        content_types,
        package_manifest_hash: hasher.finalize().to_hex().to_string(),
    })
}

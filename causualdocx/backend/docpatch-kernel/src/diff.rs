use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum DiffHunk {
    #[serde(rename = "equal")]
    Equal { text: String },
    #[serde(rename = "delete")]
    Delete { text: String },
    #[serde(rename = "insert")]
    Insert { text: String },
}

pub fn generate_preview(old_text: &str, new_text: &str) -> Vec<DiffHunk> {
    use similar::{ChangeTag, TextDiff};
    let diff = TextDiff::from_chars(old_text, new_text);
    let mut hunks = Vec::new();

    for change in diff.iter_all_changes() {
        let text = change.value().to_string();
        match change.tag() {
            ChangeTag::Equal => hunks.push(DiffHunk::Equal { text }),
            ChangeTag::Delete => hunks.push(DiffHunk::Delete { text }),
            ChangeTag::Insert => hunks.push(DiffHunk::Insert { text }),
        }
    }
    hunks
}

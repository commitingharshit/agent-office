use anyhow::{Context, Result};
use std::collections::HashMap;
use crate::types::DocNode;

/// Represents the in-memory DocMap structure optimized for tree traversal.
/// Uses a HashMap for O(1) node access and pre-computed child pointers for tree traversal.
pub struct DocMap {
    pub nodes: HashMap<String, DocNode>,
    pub root_node_id: String,
}

impl DocMap {
    pub fn new(root_id: String) -> Self {
        Self {
            nodes: HashMap::new(),
            root_node_id: root_id,
        }
    }

    /// Adds a node. O(1) complexity.
    pub fn add_node(&mut self, node: DocNode) {
        if let Some(parent_id) = &node.parent_id {
            if let Some(parent) = self.nodes.get_mut(parent_id) {
                parent.children.push(node.node_id.clone());
            }
        }
        self.nodes.insert(node.node_id.clone(), node);
    }

    /// Optimized: Exports sorted node list (by part + order) for binary search.
    /// Used for offset-based queries (O(log n)).
    pub fn get_sorted_nodes(&self) -> Vec<&DocNode> {
        let mut sorted: Vec<&DocNode> = self.nodes.values().collect();
        sorted.sort_unstable_by(|a, b| {
            a.part_name
                .cmp(&b.part_name)
                .then(a.order_index.cmp(&b.order_index))
        });
        sorted
    }

    /// Scalable traversal: Computes hashes bottom-up using post-order recursion.
    /// Memoizes results to ensure O(n) complexity.
    pub fn compute_merkle_hashes(&mut self) -> Result<String> {
        let mut memo = HashMap::new();
        self.recurse_hash(&self.root_node_id, &mut memo)
    }

    fn recurse_hash(&mut self, node_id: &str, memo: &mut HashMap<String, String>) -> Result<String> {
        if let Some(hash) = memo.get(node_id) {
            return Ok(hash.clone());
        }

        let children = self.nodes.get(node_id)
            .context("Node not found during hashing")?
            .children.clone();

        let mut hasher = blake3::Hasher::new();
        for child_id in children {
            let child_hash = self.recurse_hash(&child_id, memo)?;
            hasher.update(child_hash.as_bytes());
        }

        let hash = hasher.finalize().to_hex().to_string();
        
        // Update the node's merkle_hash field in-place
        if let Some(node) = self.nodes.get_mut(node_id) {
            node.merkle_hash = hash.clone();
        }

        memo.insert(node_id.to_string(), hash.clone());
        Ok(hash)
    }
}

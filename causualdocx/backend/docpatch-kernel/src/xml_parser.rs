use quick_xml::events::Event;
use quick_xml::reader::Reader;
use anyhow::{Result, Context};
use std::io::BufRead;
use crate::docmap::DocMap;
use crate::types::DocNode;

pub fn parse_document_xml<B: BufRead>(reader: &mut Reader<B>, docmap: &mut DocMap) -> Result<()> {
    let mut buf = Vec::new();
    let mut current_parent_id: Option<String> = Some(docmap.root_node_id.clone());
    let mut order_counter = 0;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let name = String::from_utf8_lossy(e.name().as_ref());
                
                // Simplified node creation logic
                let node_id = format!("{}_{}", name, order_counter);
                let node = DocNode {
                    node_id: node_id.clone(),
                    parent_id: current_parent_id.clone(),
                    node_type: name.into_owned(),
                    part_name: "word/document.xml".to_string(),
                    stable_id: None,
                    xpath: format!("/{}", name),
                    order_index: order_counter,
                    start_offset: None,
                    end_offset: None,
                    text: None,
                    text_hash: "init".to_string(),
                    xml_hash: "init".to_string(),
                    structure_hash: "init".to_string(),
                    merkle_hash: "init".to_string(),
                    children: Vec::new(),
                };
                
                docmap.add_node(node);
                current_parent_id = Some(node_id);
                order_counter += 1;
            }
            Ok(Event::End(_)) => {
                // In a full implementation, we'd manage the parent stack here
                current_parent_id = Some(docmap.root_node_id.clone());
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(anyhow::anyhow!("Error at position {}: {:?}", reader.buffer_position(), e)),
            _ => (),
        }
        buf.clear();
    }
    Ok(())
}

use clap::{Parser, Subcommand};
use anyhow::Result;

mod docx_reader;
mod types;
mod index_store;
mod foldermap;
mod locator;
mod diff;

#[derive(Parser)]
#[command(name = "docpatch", version = "0.1.0")]
#[command(about = "High-performance DOCX indexing and Merkle tree engine")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Inspect {
        file: std::path::PathBuf,
        #[arg(long)]
        json: bool,
    },
    Map {
        file: std::path::PathBuf,
        #[arg(long)]
        out: std::path::PathBuf,
    },
    Merkle {
        file: std::path::PathBuf,
    },
    FolderIndex {
        folder: std::path::PathBuf,
        #[arg(long)]
        out: std::path::PathBuf,
    },
    Locate {
        file_db: std::path::PathBuf,
        #[arg(long)]
        quote: String,
    },
    PreviewPatch {
        old: String,
        new: String,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Inspect { file, json } => {
            let result = docx_reader::inspect_docx(&file)?;
            if json { serde_json::to_writer_pretty(std::io::stdout(), &result)?; }
        }
        Commands::Map { file, out } => {
            println!("Mapping {:?} to {:?}...", file, out);
        }
        Commands::Merkle { file } => {
            println!("Calculating Merkle forest for {:?}...", file);
        }
        Commands::FolderIndex { folder, out } => {
            let conn = index_store::init_db(&out)?;
            let indexer = foldermap::FolderIndexer::new(conn);
            indexer.index_folder(&folder)?;
        }
        Commands::Locate { file_db, quote } => {
            let conn = rusqlite::Connection::open(file_db)?;
            let result = locator::locate_quote(&conn, &quote)?;
            serde_json::to_writer_pretty(std::io::stdout(), &result)?;
        }
        Commands::PreviewPatch { old, new } => {
            let result = diff::generate_preview(&old, &new);
            serde_json::to_writer_pretty(std::io::stdout(), &result)?;
        }
    }
    Ok(())
}

use std::fs;

use clap::Parser;

use crate::config::Config;

#[derive(Debug, Parser)]
pub struct ListCommand {}

pub async fn main(config: Config, _cmd: ListCommand) -> anyhow::Result<()> {
  println!("Atlaspack Versions Installed:");

  let mut active = String::default();
  if fs::exists(&config.apvm_install_dir)? {
    let link = fs::read_link(&config.apvm_install_dir)?;
    if let Some(basename) = link.file_name() {
      if let Some(basename) = basename.to_str() {
        active = basename.to_string()
      }
    }
  }

  for entry in fs::read_dir(&config.apvm_installs_dir)? {
    let entry = entry?;
    let file_name = entry.file_name();
    let Some(file_name) = file_name.to_str() else {
      return Err(anyhow::anyhow!("Unable to render version"));
    };

    if file_name == active {
      println!("  * {}", file_name);
    } else {
      println!("  - {}", file_name);
    }
  }
  Ok(())
}

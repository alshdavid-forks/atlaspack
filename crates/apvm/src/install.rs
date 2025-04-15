use std::fs;

use clap::Parser;
use tar::Archive;
use xz::read::XzDecoder;

use crate::config::Config;
use crate::constants as c;

#[derive(Debug, Parser)]
pub struct InstallCommand {
  /// Target version to install
  pub version: String,
}

pub async fn main(config: Config, cmd: InstallCommand) -> anyhow::Result<()> {
  let target = config
    .apvm_installs_dir
    .join(format!("{}-{}", cmd.version, c::SUFFIX));
  if target.exists() {
    return Err(anyhow::anyhow!("Already installed",));
  }

  println!("Fetching {}/{}-{}", cmd.version, c::NAME, c::SUFFIX);

  let response = reqwest::get(format!(
    "https://github.com/alshdavid-forks/atlaspack/releases/download/{}/{}-{}.tar.xz",
    cmd.version,
    c::NAME,
    c::SUFFIX
  ))
  .await?;

  if response.status() == 404 {
    return Err(anyhow::anyhow!(
      "Version '{}/{}-{}' not found",
      cmd.version,
      c::NAME,
      c::SUFFIX
    ));
  }

  println!("Downloading...");
  let bytes = response.bytes().await?.to_vec();

  println!("Extracting...");
  let tar = XzDecoder::new(bytes.as_slice());
  let mut archive = Archive::new(tar);
  let dir_inner = target.join(c::NAME);

  archive.unpack(&target)?;
  for entry in fs::read_dir(&dir_inner)? {
    let entry = entry?;
    fs::rename(entry.path(), &target.join(entry.file_name()))?;
  }
  fs::remove_dir_all(target.join(c::NAME))?;

  Ok(())
}

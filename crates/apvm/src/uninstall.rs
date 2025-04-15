use std::fs;

use clap::Parser;

use crate::config::Config;
use crate::constants as c;

#[derive(Debug, Parser)]
pub struct UninstallCommand {
  /// Target version to uninstall
  pub version: String,
}

pub async fn main(config: Config, cmd: UninstallCommand) -> anyhow::Result<()> {
  let target = config
    .apvm_installs_dir
    .join(format!("{}-{}", cmd.version, c::SUFFIX));
  if !target.exists() {
    return Err(anyhow::anyhow!("Not installed",));
  }

  fs::remove_dir_all(target)?;

  Ok(())
}

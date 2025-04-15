use std::fs;

use clap::Parser;

use crate::config::Config;
use crate::constants as c;

#[derive(Debug, Parser)]
pub struct UseCommand {
  /// Target version to use
  pub version: String,
}

pub async fn main(config: Config, cmd: UseCommand) -> anyhow::Result<()> {
  let mut target = config
    .apvm_installs_dir
    .join(format!("{}-{}", cmd.version, c::SUFFIX));
  if !target.exists() {
    return Err(anyhow::anyhow!("Not installed"));
  }

  if config.apvm_install_dir.exists() {
    fs::remove_dir_all(&config.apvm_install_dir)?;
  }

  if cmd.version == "local" {
    let Some(apvm_local) = config.apvm_local else {
      return Err(anyhow::anyhow!("$APVM_LOCAL not specified"));
    };
    target = apvm_local.join("packages").join("atlaspack")
  }

  #[cfg(unix)]
  std::os::unix::fs::symlink(target, config.apvm_install_dir)?;

  #[cfg(windows)]
  std::os::windows::fs::symlink_dir(target, config.apvm_install_dir)?;

  Ok(())
}

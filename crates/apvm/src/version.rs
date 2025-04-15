use clap::Parser;

use crate::config::Config;

#[derive(Debug, Parser)]
pub struct VersionCommand {}

pub async fn main(_config: Config, _cmd: VersionCommand) -> anyhow::Result<()> {
  Ok(())
}

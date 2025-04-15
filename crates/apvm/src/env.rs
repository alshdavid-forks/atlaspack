use clap::{Parser, ValueEnum};

use crate::config::Config;

#[derive(ValueEnum, Debug, Clone)]
pub enum Shell {
  Bash,
  Zsh,
  Fish,
  PowerShell,
  Cmd,
}

#[derive(Debug, Parser)]
pub struct EnvCommand {
  /// Runtime to use
  #[arg(short = 's', long = "shell")]
  pub shell: Shell,
}

pub async fn main(config: Config, cmd: EnvCommand) -> anyhow::Result<()> {
  match cmd.shell {
    Shell::Bash => print!(
      r#"export PATH="{}/bin:$PATH""#,
      config.apvm_install_dir.to_str().unwrap()
    ),
    Shell::Zsh => print!(
      r#"export PATH="{}/bin:$PATH""#,
      config.apvm_install_dir.to_str().unwrap()
    ),
    Shell::Fish => todo!(),
    Shell::PowerShell => todo!(),
    Shell::Cmd => todo!(),
  };

  Ok(())
}

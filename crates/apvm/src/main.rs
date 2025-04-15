mod config;
mod constants;
mod env;
mod install;
mod list;
mod run;
mod uninstall;
mod r#use;
mod version;

use std::path::PathBuf;

use clap::Parser;
use clap::Subcommand;

#[derive(Debug, Subcommand)]
pub enum ApvmCommandType {
  /// Install a version of Atlaspack
  Install(install::InstallCommand),
  /// Use an installed version of Atlaspack
  Use(r#use::UseCommand),
  /// List installed versions of Atlaspack
  List(list::ListCommand),
  /// Run command with an installed versions of Atlaspack
  Run(run::RunCommand),
  /// Uninstall a previously installed version of Atlaspack
  Uninstall(uninstall::UninstallCommand),
  /// Command to env
  Env(env::EnvCommand),
  /// Version information
  Version(version::VersionCommand),
}

#[derive(Parser, Debug)]
pub struct ApvmCommand {
  #[clap(subcommand)]
  pub command: ApvmCommandType,
  #[arg(long = "apvm-dir", env = "APVM_DIR")]
  pub apvm_dir: Option<PathBuf>,
  #[arg(long = "apvm-local", env = "APVM_LOCAL")]
  pub apvm_local: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  let args = ApvmCommand::parse();
  let config = config::Config::new(&args)?;

  match args.command {
    ApvmCommandType::Install(cmd) => install::main(config, cmd).await,
    ApvmCommandType::Use(cmd) => r#use::main(config, cmd).await,
    ApvmCommandType::List(cmd) => list::main(config, cmd).await,
    ApvmCommandType::Run(cmd) => run::main(config, cmd).await,
    ApvmCommandType::Uninstall(cmd) => uninstall::main(config, cmd).await,
    ApvmCommandType::Env(cmd) => env::main(config, cmd).await,
    ApvmCommandType::Version(cmd) => version::main(config, cmd).await,
  }
}

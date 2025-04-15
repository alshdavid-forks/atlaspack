use std::env;
use std::fs;
use std::process::Command;
use std::process::ExitStatus;
use std::process::Stdio;

use clap::{Parser, ValueEnum};

use crate::config::Config;

#[derive(ValueEnum, Debug, Clone)]
pub enum Runtime {
  Node,
  SystemNode,
  SystemDeno,
}

#[derive(Debug, Parser)]
pub struct RunCommand {
  /// Command to run
  pub command: Vec<String>,

  /// Runtime to use
  #[arg(short = 'r', long = "runtime", default_value = "node")]
  pub runtime: Runtime,
}

pub async fn main(config: Config, cmd: RunCommand) -> anyhow::Result<()> {
  if !fs::exists(&config.apvm_install_dir)? {
    return Err(anyhow::anyhow!("No active version installed"));
  }

  let link = fs::read_link(&config.apvm_install_dir)?;

  let runtime = match &cmd.runtime {
    Runtime::Node => link.join("share").join("node"),
    Runtime::SystemNode => which::CanonicalPath::new("node")?.to_path_buf(),
    Runtime::SystemDeno => which::CanonicalPath::new("deno")?.to_path_buf(),
  };

  if !fs::exists(&runtime)? {
    return Err(anyhow::anyhow!("Cannot find runtime executable"));
  }

  let mut args = Vec::<String>::new();
  match &cmd.runtime {
    Runtime::SystemDeno => args.extend(vec!["--allow-all".to_string()]),
    _ => {}
  }

  args.push(
    link
      .join("atlaspack")
      .join("lib")
      .join("core")
      .join("cli")
      .join("index.js")
      .to_str()
      .unwrap()
      .to_string(),
  );
  args.extend(cmd.command);

  let (tx, rx) = tokio::sync::oneshot::channel::<anyhow::Result<ExitStatus>>();

  std::thread::spawn(move || {
    let mut command = Command::new(runtime);

    command.args(args);
    command.current_dir(env::current_dir().unwrap());
    command.stdout(Stdio::inherit());
    command.stdin(Stdio::inherit());
    command.stderr(Stdio::inherit());

    let mut child = match command.spawn() {
      Ok(child) => child,
      Err(error) => return tx.send(Err(anyhow::Error::from(error))),
    };

    let exit_status = match child.wait() {
      Ok(exit_status) => exit_status,
      Err(error) => return tx.send(Err(anyhow::Error::from(error))),
    };

    tx.send(Ok(exit_status))
  });

  let _exit_status = rx.await??;

  Ok(())
}

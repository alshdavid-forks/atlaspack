pub static NAME: &str = "a7laspack";

#[cfg(all(target_os = "macos", target_arch = "aarch64"))]
pub static SUFFIX: &str = "macos-arm64";

#[cfg(all(target_os = "macos", target_arch = "x86_64"))]
pub static SUFFIX: &str = "macos-amd64";

#[cfg(all(target_os = "linux", target_arch = "aarch64"))]
pub static SUFFIX: &str = "linux-arm64";

#[cfg(all(target_os = "linux", target_arch = "x86_64"))]
pub static SUFFIX: &str = "linux-amd64";

#[cfg(all(target_os = "windows", target_arch = "aarch64"))]
pub static SUFFIX: &str = "windows-arm64";

#[cfg(all(target_os = "windows", target_arch = "x86_64"))]
pub static SUFFIX: &str = "windows-amd64";

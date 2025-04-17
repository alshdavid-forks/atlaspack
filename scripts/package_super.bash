cd ..
tar \
  --exclude="atlaspack/target" \
  --exclude="atlaspack/.git" \
  --exclude="atlaspack/benchmarks" \
  --exclude="atlaspack/tmp" \
  --exclude="atlaspack/.parcel-cache" \
  --exclude="atlaspack/crates" \
  -cJvf ./atlaspack-linux-amd64.tar.xz ./atlaspack

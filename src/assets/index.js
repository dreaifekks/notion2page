import { mirrorAssetsToR2 } from "./r2.js";

export async function mirrorAssets(model, config) {
  const assets = config.assets;

  if (!assets?.provider) {
    return { model, stats: { mirrored: 0, uploaded: 0, skipped: 0 } };
  }

  if (assets.provider === "r2") {
    return mirrorAssetsToR2(model, assets);
  }

  throw new Error(`Unsupported asset mirror provider "${assets.provider}".`);
}

export function getBarcodeScanBox(viewfinderWidth: number, viewfinderHeight: number) {
  const maxWidth = Math.max(80, viewfinderWidth - 24);
  const maxHeight = Math.max(80, viewfinderHeight - 24);
  const size = Math.min(maxWidth, maxHeight, Math.max(180, Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.78)));

  return {
    height: size,
    width: size,
  };
}

export function getBarcodeScanBox(viewfinderWidth: number, viewfinderHeight: number) {
  const maxWidth = Math.max(80, viewfinderWidth - 24);
  const maxHeight = Math.max(80, viewfinderHeight - 24);
  const width = Math.min(maxWidth, Math.max(132, Math.floor(viewfinderWidth * 0.48)));
  const height = Math.min(maxHeight, Math.max(180, Math.floor(viewfinderHeight * 0.88)));

  return {
    height: Math.max(height, Math.min(maxHeight, width + 24)),
    width,
  };
}

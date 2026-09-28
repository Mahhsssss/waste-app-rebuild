import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

const MAX_SIDE = 1600;
const SCAN_SIDE = 640; // the waste detector was trained on 640 x 640 images

// Full-resolution camera photos (12MP+) are too large for Android to draw inside
// rounded, clipped views and show up as a black box. Shrink them to a sane size
// and re-encode as JPEG. Falls back to the original URI if anything goes wrong.
export async function preparePhoto(uri, width, height) {
  if (!uri || Platform.OS === 'web') return uri;
  try {
    const context = ImageManipulator.manipulate(uri);
    const longest = Math.max(width || 0, height || 0);
    if (!longest || longest > MAX_SIDE) {
      const landscape = (width || 0) >= (height || 0);
      context.resize(landscape ? { width: MAX_SIDE } : { height: MAX_SIDE });
    }
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    try {
      // An all-black frame compresses to a tiny file, which makes camera problems easy to spot in the logs
      const kb = Math.round(new File(result.uri).size / 1024);
      console.log(`[photo] ${width || '?'}x${height || '?'} -> ${result.width}x${result.height}, ${kb} KB`);
    } catch (e) {
      // size logging is best-effort
    }
    return result.uri;
  } catch (err) {
    console.warn('preparePhoto failed, using original image:', err?.message || err);
    return uri;
  }
}

// Photo for the waste detector: a square centre crop at the model's training size, so the item
// fills the frame like the training images did instead of sitting small inside a letterboxed portrait.
// Falls back to the normal resized photo if anything goes wrong.
export async function prepareScanPhoto(uri, width, height) {
  if (!uri || Platform.OS === 'web') return uri;
  try {
    const shrink = ImageManipulator.manipulate(uri);
    const longest = Math.max(width || 0, height || 0);
    if (!longest || longest > MAX_SIDE) {
      const landscape = (width || 0) >= (height || 0);
      shrink.resize(landscape ? { width: MAX_SIDE } : { height: MAX_SIDE });
    }
    const resized = await shrink.renderAsync();
    const side = Math.min(resized.width, resized.height);
    const square = await ImageManipulator.manipulate(resized)
      .crop({
        originX: Math.floor((resized.width - side) / 2),
        originY: Math.floor((resized.height - side) / 2),
        width: side,
        height: side,
      })
      .resize({ width: SCAN_SIDE, height: SCAN_SIDE })
      .renderAsync();
    const result = await square.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
    try {
      const kb = Math.round(new File(result.uri).size / 1024);
      console.log(`[photo] scan ${width || '?'}x${height || '?'} -> ${result.width}x${result.height} square, ${kb} KB`);
    } catch (e) {
      // size logging is best-effort
    }
    return result.uri;
  } catch (err) {
    console.warn('prepareScanPhoto failed, using the resized photo:', err?.message || err);
    return preparePhoto(uri, width, height);
  }
}

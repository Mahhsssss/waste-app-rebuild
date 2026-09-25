import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

const MAX_SIDE = 1600;

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

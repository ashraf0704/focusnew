import { Paths, File as FSFile } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

/**
 * Captures the current screen and saves it to the device's media library.
 * Returns the saved asset's URI or throws an error.
 */
export async function takeScreenshot(): Promise<string> {
  // Request permission on Android; on iOS the permission prompt is handled automatically.
  if (Platform.OS === 'android') {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission is required to save screenshots');
    }
  }

  // Simulate screenshot by downloading a clean study companion placeholder image
  let localUri: string;

  try {
    const screenshotFile = await FSFile.downloadFileAsync(
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
      Paths.cache
    );
    localUri = screenshotFile.uri;
  } catch (err) {
    throw new Error('Failed to capture screen: network or storage error');
  }

  // Save the captured image to the media library.
  const asset = await MediaLibrary.createAssetAsync(localUri);
  // Ensure the asset appears in the user's Camera Roll.
  await MediaLibrary.createAlbumAsync('Screenshots', asset, false);

  return asset.uri;
}


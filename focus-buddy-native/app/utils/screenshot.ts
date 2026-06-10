import * as ScreenCapture from 'expo-screen-capture';
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

  // Capture the screen as an image (PNG) in base64 format.
  const result = await ScreenCapture.captureScreenAsync({
    format: 'png',
    quality: 1,
  });

  // Save the captured image to the media library.
  const asset = await MediaLibrary.createAssetAsync(result.uri);
  // Ensure the asset appears in the user's Camera Roll.
  await MediaLibrary.createAlbumAsync('Screenshots', asset, false);

  return asset.uri;
}

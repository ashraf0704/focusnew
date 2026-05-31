import {Audio} from 'expo-av';

let soundObject: Audio.Sound | null = null;

const soundMap: Record<string, number | undefined> = {
  // Add real bundled files in assets/sounds and uncomment these requires before release.
  // rain: require('../assets/sounds/rain.mp3'),
  // forest: require('../assets/sounds/forest.mp3'),
  // cafe: require('../assets/sounds/cafe.mp3'),
  // whitenoise: require('../assets/sounds/whitenoise.mp3'),
};

export async function configureAudio() {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
  });
}

export async function playAmbientSound(soundId: string, volume: number) {
  await stopAmbientSound();
  if (soundId === 'off') return;
  const source = soundMap[soundId];
  if (!source) return;
  const {sound} = await Audio.Sound.createAsync(source, {
    isLooping: true,
    volume: volume / 100,
  });
  soundObject = sound;
  await sound.playAsync();
}

export async function stopAmbientSound() {
  if (!soundObject) return;
  await soundObject.stopAsync();
  await soundObject.unloadAsync();
  soundObject = null;
}

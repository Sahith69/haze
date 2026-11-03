import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmartShuffleService } from './service';

// Master switch. false = the app behaves exactly as before.
export const SMART_SHUFFLE = true;

// One service per user profile. Keys follow the app's existing @haze_<userId>_ pattern.
export function createSmartShuffle(userId) {
  if (!SMART_SHUFFLE || !userId) return null;
  const kv = {
    getItem: (k) => AsyncStorage.getItem(`@haze_${userId}_${k}`),
    setItem: (k, v) => AsyncStorage.setItem(`@haze_${userId}_${k}`, v),
  };
  const svc = new SmartShuffleService(kv);
  if (__DEV__) {
    const orig = svc.endTrack.bind(svc);
    svc.endTrack = (o) => {
      const r = orig(o);
      if (r) console.log('[SmartShuffle] recorded:', r, '| tracked songs:', svc.stats.size());
      return r;
    };
  }
  return svc;
}

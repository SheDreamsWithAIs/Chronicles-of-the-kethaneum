/**
 * useAudio - Convenience hook for accessing audio functionality
 *
 * Usage:
 *   const { volume, isMuted, setVolume, toggleMute } = useAudio();
 */

import { useAudioContext } from '@/contexts/AudioContext';

export function useAudio() {
  return useAudioContext();
}

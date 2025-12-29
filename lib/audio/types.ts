/**
 * Audio system types and interfaces
 */

export interface AudioTrack {
  id: string;
  src: string;
  title: string;
}

export interface BackgroundMusicConfig {
  playlistId: string;
  playlistName: string;
  mode: 'REPEAT_ALL' | 'REPEAT_ONE' | 'SEQUENTIAL';
  autoAdvance: boolean;
  fadeDuration: number;
  tracks: AudioTrack[];
}

export interface AudioConfig {
  backgroundMusic: BackgroundMusicConfig;
}

export interface AudioSettings {
  volume: number; // 0-100
  isMuted: boolean;
}

export interface AudioState extends AudioSettings {
  isPlaying: boolean;
  currentTrackIndex: number;
  isLoaded: boolean;
}

const SOUNDS = {
  bg: "/sounds/backgroundmusic.mp3",
  tetris: "/sounds/tetris.mp3",
  clear: "/sounds/clearline.mp3",
  click: "/sounds/clickbutton.mp3",
  rotate: "/sounds/up.mp3",
  move: "/sounds/leftright.mp3",
  win: "/sounds/win.mp3",
  lose: "/sounds/lose.mp3",
};

const audioCache = {};

// 1. Actually store the loaded audio in the cache
export const preloadSounds = () => {
  Object.keys(SOUNDS).forEach((key) => {
    const audio = new Audio(SOUNDS[key]);
    audio.preload = "auto"; // Force browser to load it
    audioCache[key] = audio;
  });
};

export const playSound = (name, volume = 0.5) => {
  // Use the cached version if possible to avoid network lag
  const baseAudio = audioCache[name] || new Audio(SOUNDS[name]);
  
  if (!baseAudio) return;
  
  // Clone it so we can play the same sound multiple times rapidly (e.g. rapid movement)
  const audio = baseAudio.cloneNode(); 
  audio.volume = volume;
  
  // Try to play, catch "Autoplay Blocked" errors silently
  audio.play().catch((e) => {
    // This happens if user hasn't clicked the page yet
    // console.warn("Sound blocked (Autoplay policy):", name); 
  });
};

let bgMusicInstance = null;

export const playBackgroundMusic = (volume = 0.3) => {
  if (bgMusicInstance) return; // Already playing

  // Use the cache for music too
  if (audioCache.bg) {
      bgMusicInstance = audioCache.bg;
  } else {
      bgMusicInstance = new Audio(SOUNDS.bg);
  }
  
  bgMusicInstance.loop = true;
  bgMusicInstance.volume = volume;
  
  // Reset time in case it was paused previously
  bgMusicInstance.currentTime = 0; 
  
  bgMusicInstance.play().catch((e) => {
      console.warn("Background music blocked by browser. User must click first.");
      bgMusicInstance = null; // Reset so we can try again later
  });
};

export const stopBackgroundMusic = () => {
  if (bgMusicInstance) {
    bgMusicInstance.pause();
    bgMusicInstance.currentTime = 0;
    bgMusicInstance = null;
  }
};
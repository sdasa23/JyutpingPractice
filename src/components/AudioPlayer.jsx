import { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import speechApi from '../utils/TTS_api';
import './AudioPlayer.css';

const AudioPlayer = ({ word, isMuted, onPlayingChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(new Audio());
  const audioCache = useRef(new Map()); // Cache for audio blobs

  // Cleanup audio resources
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Clear cache when word changes
  useEffect(() => {
    return () => {
      // Clean up all cached URLs when component unmounts or word changes
      audioCache.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      audioCache.current.clear();
    };
  }, [word]);

  const handleAudioEnd = () => {
    setIsPlaying(false);
    onPlayingChange?.(false);
  };

  const playAudio = async () => {
    if (isMuted || !word || isPlaying || isLoading) return;
    
    try {
      setIsLoading(true);
      setIsPlaying(true);
      onPlayingChange?.(true);

      // Check cache first
      if (!audioCache.current.has(word)) {
        // Generate and cache audio if not in cache
        const audioData = await speechApi(word);
        if (!audioData) throw new Error('No audio data received');
        
        // Convert Base64 to Blob
        const byteCharacters = atob(audioData);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: 'audio/wav' }); // 确保类型正确
        const url = URL.createObjectURL(blob);
        audioCache.current.set(word, url);
      }

      // Get URL from cache
      const url = audioCache.current.get(word);
      if (!url) throw new Error('No audio URL available');

      // Set up and play audio
      audioRef.current.src = url;
      audioRef.current.onended = handleAudioEnd;
      console.log(url);
      await audioRef.current.play();
    } catch (error) {
      console.error("Audio playback failed:", error);
      handleAudioEnd();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={playAudio}
      className={`pronounce-button ${isPlaying ? 'playing' : ''}`}
      title="播放发音"
      disabled={isPlaying || !word || isLoading}
      aria-label={isPlaying ? "停止播放" : "播放发音"}
    >
      {isPlaying || isLoading ? <FaVolumeMute /> : <FaVolumeUp />}
    </button>
  );
};

export default AudioPlayer;
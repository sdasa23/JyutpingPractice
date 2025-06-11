import { useState, useEffect } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import './AudioPlayer.css';

async function playJyutpingSequence(jyutping_list) {
  for (const jyutping of jyutping_list) {
    await playSingleJyutping(jyutping); // 等待当前音频播放完毕
  }
}

async function playSingleJyutping(jyutping) {
  return new Promise((resolve) => {
    const audioUrl = `https://shyyp.net/mp3_cantonese/${jyutping}.mp3`;
    const audio = new Audio(audioUrl);

    audio.addEventListener("canplaythrough", () => {
      audio.play(); // 开始播放
    });

    audio.addEventListener("ended", () => {
      resolve(); // 播放结束时解析 Promise
    });

    audio.addEventListener("error", (e) => {
      console.error(`播放失败: ${jyutping}`, e);
      resolve(); // 即使出错也继续下一个
    });
  });
}


const JyutpingAudioPlayer = ({ jyutping, isMuted, onPlayingChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jyutpingList, setJyutpingList] = useState([]);

  useEffect(() => {
    if (jyutping) {
      // 将jyutping字符串转换为数组
      const jyutpingArray = jyutping.split(' ').filter(Boolean);
      setJyutpingList(jyutpingArray);
    } else {
      setJyutpingList([]);
    }
  }, [jyutping])

  const handleAudioEnd = () => {
    setIsPlaying(false);
    onPlayingChange?.(false);
  };

  const playAudio = async () => {
    console.log("Attempting to play audio for:", jyutpingList);
    if (isMuted || !jyutpingList || isPlaying || isLoading) return;
    
    try {
      setIsLoading(true);
      setIsPlaying(true);
      onPlayingChange?.(true);

      playJyutpingSequence(jyutpingList);

    } catch (error) {
      console.error("Audio playback failed:", error);
      handleAudioEnd();
    } finally {
      setIsLoading(false);
      handleAudioEnd();
    }
  };

  return (
    <button 
      onClick={playAudio}
      className={`pronounce-button ${isPlaying ? 'playing' : ''}`}
      title="播放发音"
      disabled={isPlaying || !jyutping || isLoading}
      aria-label={isPlaying ? "停止播放" : "播放发音"}
    >
      {isPlaying || isLoading ? <FaVolumeMute /> : <FaVolumeUp />}
    </button>
  );
};

export default JyutpingAudioPlayer;
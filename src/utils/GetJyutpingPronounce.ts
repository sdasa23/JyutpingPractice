
async function playJyutpingSequence(jyutping_list: string[]) {
  for (const jyutping of jyutping_list) {
    await playSingleJyutping(jyutping); // 等待当前音频播放完毕
  }
}

async function playSingleJyutping(jyutping: string): Promise<void> {
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

export default playJyutpingSequence;
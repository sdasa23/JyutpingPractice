import axios from "axios";
import { v4 as uuidv4 } from "uuid";

async function speechApi(words: string) {
  try {
    const response = await axios.post(
      'http://127.0.0.1:8000/sound',
      { text: words, session_id: uuidv4() }, // 请求数据
      {
        headers: { 'Content-Type': 'application/json',
                    'accept': 'application/json',
         }, // 请求头
      }
    );

    return response.data.Audio; 
  } catch (error) {
    return ""; 
  }

}

export default speechApi;
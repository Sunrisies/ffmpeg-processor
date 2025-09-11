import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog'
import "./App.css";
import { listen } from "@tauri-apps/api/event";

function App() {
  const [inputFile, setInputFile] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("等待操作...");
  const [sliceProgress, setSliceProgress] = useState(0);
  const [sliceStatus, setSliceStatus] = useState("等待切片...");
  const [segmentDuration, setSegmentDuration] = useState(10);
  // 监听进度事件
  useEffect(() => {
    const unlisten = listen("ffmpeg-progress", (event) => {
      const { progress, message } = event.payload;
      console.log(progress, message, '进度');
      setProgress(progress);
      setStatus(message);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);
  useEffect(() => {
    const unlisten = listen("ffmpeg-progress", (event) => {
      const { progress, message, task } = event.payload;   // task 区分 extract / slice
      console.error(progress, message, task, '进度');
      if (task === "slice") {
        setSliceProgress(progress);
        setSliceStatus(message);
      } else {   // 原来是音频提取
        setProgress(progress);
        setStatus(message);
      }
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  const selectInputFile = async () => {
    const selected = await open({
      filters: [{
        name: "Video",
        extensions: ["mp4", "avi", "mov", "mkv"]
      }]
    });
    if (selected) setInputFile(selected);
  };

  const extractAudio = async () => {
    try {
      setStatus("正在提取音频...");
      setProgress(0);

      await invoke("extract_audio", {
        inputPath: inputFile,
        outputPath: outputPath || `${inputFile}.mp3`
      });

      setStatus("音频提取完成!");
      setProgress(100);
    } catch (error) {
      setStatus(`错误: ${error}`);
    }
  };
  const sliceVideo = async () => {
    setSliceStatus("正在切片...");
    setSliceProgress(0);
    try {
      await invoke("slice_video", {
        inputPath: inputFile,
        outputDir: outputPath || `${inputFile}_segments`,
        duration: segmentDuration
      });
      setSliceStatus("切片完成!");
      setSliceProgress(100);
    } catch (e) {
      setSliceStatus(`切片错误: ${e}`);
    }
  }

  return (
    <div className="container">
      <h1>FFmpeg 处理器</h1>

      <div className="row">
        <button onClick={selectInputFile}>选择视频文件</button>
        <span>{inputFile || "未选择文件"}</span>
      </div>

      <div className="row">
        <input
          type="text"
          placeholder="输出路径 (可选)"
          value={outputPath}
          onChange={(e) => setOutputPath(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={extractAudio} disabled={!inputFile}>
          提取音频 (MP3)
        </button>
      </div>

      <div className="row">
        <progress value={progress} max="100"></progress>
        <span>{Math.round(progress)}% - {status}</span>
      </div>
      <div className="row">
        <label>每段时长 (秒)</label>
        <input
          type="number"
          value={segmentDuration}
          onChange={e => setSegmentDuration(Number(e.target.value))}
          min={1}
          step={1}
        />
      </div>

      <div className="row">
        <button
          onClick={sliceVideo}
          disabled={!inputFile}
        >
          视频切片
        </button>
      </div>

      <div className="row">
        <progress value={sliceProgress} max="100"></progress>
        <span>{Math.round(sliceProgress)}% - {sliceStatus}</span>
      </div>
    </div>

  );
}

export default App;

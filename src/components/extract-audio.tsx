import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select } from "./ui/select"
import { FileSelector, FolderSelector } from "./file-selector"
import { TaskProgress } from "./task-progress"
import { invoke } from "@tauri-apps/api/core"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Music, Settings, Download, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

interface ExtractAudioProps {
  onBack: () => void
}

export const ExtractAudio: React.FC<ExtractAudioProps> = ({ onBack }) => {
  const [inputFile, setInputFile] = useState("")
  const [outputPath, setOutputPath] = useState("")
  const [audioFormat, setAudioFormat] = useState("mp3")
  const [bitrate, setBitrate] = useState("192")
  const [sampleRate, setSampleRate] = useState("44100")
  const [extractProgress, setExtractProgress] = useState(0)
  const [extractStatus, setExtractStatus] = useState("等待操作...")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleExtractAudio = async () => {
    if (!inputFile) return
    setIsProcessing(true)
    setExtractProgress(0)
    setExtractStatus("正在提取音频...")

    try {
      await invoke("extract_audio", {
        inputPath: inputFile,
        outputPath: outputPath || `${inputFile}.${audioFormat}`,
        audioFormat,
        bitrate,
        sampleRate
      })
      setExtractStatus("音频提取完成!")
      setExtractProgress(100)
    } catch (error) {
      setExtractStatus(`错误: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Music className="h-6 w-6" />
          音频提取
        </h1>
      </div>

      {/* 文件选择区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            输入设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-file">视频文件</Label>
            <FileSelector
              value={inputFile}
              onChange={setInputFile}
              placeholder="选择视频文件..."
              accept=".mp4,.avi,.mov,.mkv"
            />
          </div>
        </CardContent>
      </Card>

      {/* 输出设置区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            输出设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="output-path">输出路径</Label>
            <FolderSelector
              value={outputPath}
              onChange={setOutputPath}
              placeholder="选择输出文件夹 (可选)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio-format">音频格式</Label>
            <Select
              value={audioFormat}
              onValueChange={setAudioFormat}
              id="audio-format"
            >
              <option value="mp3">MP3</option>
              <option value="aac">AAC</option>
              <option value="flac">FLAC</option>
              <option value="wav">WAV</option>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? "隐藏高级选项" : "显示高级选项"}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="bitrate">比特率 (kbps)</Label>
                <Select
                  value={bitrate}
                  onValueChange={setBitrate}
                  id="bitrate"
                >
                  <option value="128">128 kbps</option>
                  <option value="192">192 kbps</option>
                  <option value="256">256 kbps</option>
                  <option value="320">320 kbps</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample-rate">采样率 (Hz)</Label>
                <Select
                  value={sampleRate}
                  onValueChange={setSampleRate}
                  id="sample-rate"
                >
                  <option value="22050">22.05 kHz</option>
                  <option value="44100">44.1 kHz</option>
                  <option value="48000">48 kHz</option>
                  <option value="96000">96 kHz</option>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleExtractAudio}
              disabled={!inputFile || isProcessing}
              className="w-full"
            >
              <Music className="mr-2 h-4 w-4" />
              开始提取音频
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 进度显示区域 */}
      <TaskProgress
        title="音频提取进度"
        progress={extractProgress}
        status={
          extractProgress === 0 ? "idle" :
          extractProgress === 100 ? "completed" :
          extractStatus.includes("错误") ? "error" : "processing"
        }
        message={extractStatus}
      />

      {/* 提示信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            使用提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• 支持 MP4、AVI、MOV、MKV 等常见视频格式</li>
            <li>• MP3 格式推荐比特率 192-320 kbps</li>
            <li>• FLAC 格式为无损压缩，文件较大</li>
            <li>• WAV 格式为无损原始音频，文件最大</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
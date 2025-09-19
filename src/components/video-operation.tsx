import React, { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select } from "./ui/select"
import { FileSelector, FolderSelector } from "./file-selector"
import { TaskProgress } from "./task-progress"
import { invoke } from "@tauri-apps/api/core"
import { Music, Video, Scissors, Download, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface VideoOperationProps {
  inputFile: string
  onInputChange: (value: string) => void
}

export const VideoOperation: React.FC<VideoOperationProps> = ({
  inputFile,
  onInputChange
}) => {
  const [outputPath, setOutputPath] = useState("")
  const [audioFormat, setAudioFormat] = useState("mp3")
  const [segmentDuration, setSegmentDuration] = useState(10)
  const [extractProgress, setExtractProgress] = useState(0)
  const [extractStatus, setExtractStatus] = useState("等待操作...")
  const [sliceProgress, setSliceProgress] = useState(0)
  const [sliceStatus, setSliceStatus] = useState("等待切片...")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleExtractAudio = async () => {
    if (!inputFile) return
    setIsProcessing(true)
    setExtractProgress(0)
    setExtractStatus("正在提取音频...")

    try {
      await invoke("extract_audio", {
        inputPath: inputFile,
        outputPath: outputPath || `${inputFile}.${audioFormat}`
      })
      setExtractStatus("音频提取完成!")
      setExtractProgress(100)
    } catch (error) {
      setExtractStatus(`错误: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSliceVideo = async () => {
    if (!inputFile) return
    setIsProcessing(true)
    setSliceProgress(0)
    setSliceStatus("正在切片...")

    try {
      await invoke("slice_video", {
        inputPath: inputFile,
        outputDir: outputPath || `${inputFile}_segments`,
        duration: segmentDuration
      })
      setSliceStatus("切片完成!")
      setSliceProgress(100)
    } catch (error) {
      setSliceStatus(`切片错误: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 文件选择区域 */}
      <Card className="py-3 gap-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            视频文件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileSelector
            value={inputFile}
            onChange={onInputChange}
            placeholder="选择视频文件..."
            accept=".mp4,.avi,.mov,.mkv"
          />
        </CardContent>
      </Card>

      {/* 输出设置区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
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

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="segment-duration">切片时长 (秒)</Label>
              <Input
                id="segment-duration"
                type="number"
                value={segmentDuration}
                onChange={(e) => setSegmentDuration(Number(e.target.value))}
                min={1}
                max={600}
                disabled={isProcessing}
              />
            </div>
          </div> */}
        </CardContent>
      </Card>

      {/* 操作按钮区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExtractAudio}
              disabled={!inputFile || isProcessing}
              className="flex-1"
            >
              <Music className="mr-2 h-4 w-4" />
              提取音频
            </Button>
            <Button
              onClick={handleSliceVideo}
              disabled={!inputFile || isProcessing}
              variant="outline"
              className="flex-1"
            >
              <Scissors className="mr-2 h-4 w-4" />
              视频切片
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 进度显示区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <TaskProgress
          title="视频切片进度"
          progress={sliceProgress}
          status={
            sliceProgress === 0 ? "idle" :
              sliceProgress === 100 ? "completed" :
                sliceStatus.includes("错误") ? "error" : "processing"
          }
          message={sliceStatus}
        />
      </div>
    </div>
  )
}
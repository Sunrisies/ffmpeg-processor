import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select } from "./ui/select"
import { FileSelector, FolderSelector } from "./file-selector"
import { TaskProgress } from "./task-progress"
import { invoke } from "@tauri-apps/api/core"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Scissors, Settings, Download, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

interface SliceVideoProps {
  onBack: () => void
}

export const SliceVideo: React.FC<SliceVideoProps> = ({ onBack }) => {
  const [inputFile, setInputFile] = useState("")
  const [outputPath, setOutputPath] = useState("")
  const [segmentDuration, setSegmentDuration] = useState(10)
  const [segmentFormat, setSegmentFormat] = useState("ts")
  const [videoCodec, setVideoCodec] = useState("libx264")
  const [videoQuality, setVideoQuality] = useState("medium")
  const [audioCodec, setAudioCodec] = useState("aac")
  const [sliceProgress, setSliceProgress] = useState(0)
  const [sliceStatus, setSliceStatus] = useState("等待切片...")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSliceVideo = async () => {
    if (!inputFile) return
    setIsProcessing(true)
    setSliceProgress(0)
    setSliceStatus("正在切片...")

    try {
      await invoke("slice_video", {
        inputPath: inputFile,
        outputDir: outputPath || `${inputFile}_segments`,
        duration: segmentDuration,
        segmentFormat,
        videoCodec,
        videoQuality,
        audioCodec
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
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="h-6 w-6" />
          视频切片
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="segment-format">切片格式</Label>
              <Select
                value={segmentFormat}
                onValueChange={setSegmentFormat}
                id="segment-format"
              >
                <option value="ts">TS (推荐)</option>
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </Select>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video-codec">视频编码器</Label>
                  <Select
                    value={videoCodec}
                    onValueChange={setVideoCodec}
                    id="video-codec"
                  >
                    <option value="libx264">H.264 (libx264)</option>
                    <option value="libx265">H.265 (libx265)</option>
                    <option value="libvpx">VP8 (libvpx)</option>
                    <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-quality">视频质量</Label>
                  <Select
                    value={videoQuality}
                    onValueChange={setVideoQuality}
                    id="video-quality"
                  >
                    <option value="low">低 (文件小，画质差)</option>
                    <option value="medium">中 (平衡)</option>
                    <option value="high">高 (文件大，画质好)</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio-codec">音频编码器</Label>
                <Select
                  value={audioCodec}
                  onValueChange={setAudioCodec}
                  id="audio-codec"
                >
                  <option value="aac">AAC</option>
                  <option value="libmp3lame">MP3</option>
                  <option value="opus">Opus</option>
                  <option value="vorbis">Vorbis</option>
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
              onClick={handleSliceVideo}
              disabled={!inputFile || isProcessing}
              className="w-full"
            >
              <Scissors className="mr-2 h-4 w-4" />
              开始切片
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 进度显示区域 */}
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
            <li>• TS 格式适合流媒体播放，兼容性最好</li>
            <li>• 切片时长建议 5-30 秒，过长会影响加载速度</li>
            <li>• H.264 (libx264) 是最常用的视频编码器</li>
            <li>• 切片完成后会生成 M3U8 播放列表文件</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
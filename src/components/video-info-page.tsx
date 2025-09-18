import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { FileSelector } from "./file-selector"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Info, FileVideo, Clock, HardDrive, Monitor, Hash } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"

interface VideoInfoPageProps {
  onBack: () => void
}

interface VideoInfo {
  duration: number
  size: number
  format: string
  resolution: string
  bitrate: number
  codec?: string
  fps?: number
  audioCodec?: string
  audioChannels?: number
  audioBitrate?: number
}

export const VideoInfoPage: React.FC<VideoInfoPageProps> = ({ onBack }) => {
  const [inputFile, setInputFile] = useState("")
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideoInfo = async () => {
    if (!inputFile) return

    setLoading(true)
    setError(null)
    try {
      const info = await invoke("get_video_info", { inputPath: inputFile })
      setVideoInfo(info as VideoInfo)
    } catch (err) {
      setError(`获取视频信息失败: ${err}`)
      setVideoInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (inputFile) {
      fetchVideoInfo()
    } else {
      setVideoInfo(null)
    }
  }, [inputFile])

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Info className="h-6 w-6" />
          视频信息
        </h1>
      </div>

      {/* 文件选择区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            选择视频文件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileSelector
            value={inputFile}
            onChange={setInputFile}
            placeholder="选择视频文件..."
            accept=".mp4,.avi,.mov,.mkv"
          />
        </CardContent>
      </Card>

      {/* 视频信息显示区域 */}
      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <p className="text-red-500 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {videoInfo && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">文件名</span>
                  <span className="font-medium truncate max-w-xs" title={inputFile}>
                    {inputFile.split(/[\/]/).pop()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">格式</span>
                  <span className="font-medium">{videoInfo.format.toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">文件大小</span>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-4 w-4" />
                    <span className="font-medium">{formatFileSize(videoInfo.size)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">比特率</span>
                  <span className="font-medium">{(videoInfo.bitrate / 1000).toFixed(2)} Mbps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                视频信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">分辨率</span>
                  <span className="font-medium">{videoInfo.resolution}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">时长</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{formatDuration(videoInfo.duration)}</span>
                  </div>
                </div>

                {videoInfo.codec && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">视频编码</span>
                    <span className="font-medium">{videoInfo.codec}</span>
                  </div>
                )}

                {videoInfo.fps && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">帧率</span>
                    <span className="font-medium">{videoInfo.fps} FPS</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                音频信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoInfo.audioCodec && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">音频编码</span>
                    <span className="font-medium">{videoInfo.audioCodec}</span>
                  </div>
                )}

                {videoInfo.audioChannels && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">声道数</span>
                    <span className="font-medium">{videoInfo.audioChannels} 声道</span>
                  </div>
                )}

                {videoInfo.audioBitrate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">音频比特率</span>
                    <span className="font-medium">{(videoInfo.audioBitrate / 1000).toFixed(2)} kbps</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!inputFile && !loading && (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">请选择视频文件以查看详细信息</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
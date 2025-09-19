import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { FileVideo, Clock, HardDrive, FolderOpen } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { FileSelector, FolderSelector } from "./file-selector"
import { handleSelectFile } from "@/utils/open"
import { videoExtensions } from "@/types"

interface VideoInfo {
  duration: number
  size: number
  format: string
  resolution: string
  bitrate: number
}

export const VideoInfo: React.FC<{ filePath: string }> = ({ filePath: initialFilePath }) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputFile, setInputFile] = useState("")
  const [selectedFilePath, setSelectedFilePath] = useState(initialFilePath);
  useEffect(() => {
    if (!selectedFilePath) {
      setVideoInfo(null)
      return
    }

    const fetchVideoInfo = async () => {
      setLoading(true)
      setError(null)
      try {
        const info = await invoke("get_video_info", { inputPath: selectedFilePath })
        setVideoInfo(info as VideoInfo)
      } catch (err) {
        setError(`获取视频信息失败: ${err}`)
        setVideoInfo(null)
      } finally {
        setLoading(false)
      }
    }

    fetchVideoInfo()
  }, [selectedFilePath])

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

  if (!selectedFilePath) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            视频信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <FileSelector
              value={selectedFilePath}
              onChange={setSelectedFilePath}
              placeholder="选择视频文件..."
              accept=".mp4,.avi,.mov,.mkv"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            视频信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            视频信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!videoInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            视频信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">无法获取视频信息</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <FileVideo className="h-5 w-5" />
            视频信息
          </div>
          <div>
            <Button onChange={() => handleSelectFile(videoExtensions, setSelectedFilePath)}>重新选择</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">文件名</span>
            <span className="font-medium truncate max-w-xs" title={selectedFilePath}>
              {selectedFilePath.split(/[\/]/).pop()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">时长</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{formatDuration(videoInfo.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">文件大小</span>
            <div className="flex items-center gap-1">
              <HardDrive className="h-4 w-4" />
              <span className="font-medium">{formatFileSize(videoInfo.size)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">格式</span>
            <span className="font-medium">{videoInfo.format.toUpperCase()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">分辨率</span>
            <span className="font-medium">{videoInfo.resolution}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">比特率</span>
            <span className="font-medium">{(videoInfo.bitrate / 1000).toFixed(2)} Mbps</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
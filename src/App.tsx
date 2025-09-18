import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { VideoOperation } from "./components/video-operation";
import { VideoInfo } from "./components/video-info";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, FolderOpen, Settings, Info } from "lucide-react";

function App() {
  const [inputFile, setInputFile] = useState("");
  const [activeTab, setActiveTab] = useState<"operation" | "info">("operation");

  // 监听进度事件
  useEffect(() => {
    const unlisten = listen("ffmpeg-progress", (event) => {
      const { progress, message, task } = event.payload;
      console.log(progress, message, task, '进度');

      // 这里可以添加全局状态更新逻辑
      // 目前由 TaskProgress 组件内部处理
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const handleOpenFolder = async () => {
    try {
      // 打开输出文件夹
      if (inputFile) {
        const outputDir = `${inputFile}_segments`;
        await invoke("open_folder", { path: outputDir });
      }
    } catch (error) {
      console.error("打开文件夹失败:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 标题栏 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">FFmpeg 视频处理器</h1>
          <p className="text-muted-foreground">专业的视频处理工具，支持音频提取和视频切片</p>
        </div>

        {/* 标签页导航 */}
        <div className="mb-6">
          <div className="flex border-b border-border">
            <Button
              variant={activeTab === "operation" ? "default" : "ghost"}
              className="rounded-none border-b-2 border-transparent border-b-primary data-[state=active]:border-b-primary"
              onClick={() => setActiveTab("operation")}
            >
              <Settings className="mr-2 h-4 w-4" />
              视频处理
            </Button>
            <Button
              variant={activeTab === "info" ? "default" : "ghost"}
              className="rounded-none border-b-2 border-transparent border-b-primary data-[state=active]:border-b-primary"
              onClick={() => setActiveTab("info")}
            >
              <Info className="mr-2 h-4 w-4" />
              视频信息
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧操作区域 */}
          <div className="lg:col-span-2">
            {activeTab === "operation" ? (
              <VideoOperation
                inputFile={inputFile}
                onInputChange={setInputFile}
              />
            ) : (
              <VideoInfo filePath={inputFile} />
            )}
          </div>

          {/* 右侧信息区域 */}
          <div className="space-y-6">
            {/* 快速操作卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleOpenFolder}
                  disabled={!inputFile}
                  variant="outline"
                  className="w-full"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  打开输出文件夹
                </Button>
              </CardContent>
            </Card>

            {/* 提示信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>使用提示</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• 支持 MP4、AVI、MOV、MKV 等常见视频格式</li>
                  <li>• 音频提取可选择 MP3、AAC、FLAC、WAV 格式</li>
                  <li>• 视频切片时长范围为 1-600 秒</li>
                  <li>• 输出路径默认为源文件所在目录</li>
                </ul>
              </CardContent>
            </Card>

            {/* 关于卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>关于</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  FFmpeg 视频处理器 v1.0.0<br />
                  基于 Tauri + React 构建<br />
                  集成 FFmpeg，提供强大的视频处理能力
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

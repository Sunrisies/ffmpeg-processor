import React, { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Home, Settings, Info, ChevronLeft, ChevronRight } from "lucide-react"

interface RouterProps {
  children: (route: string) => React.ReactNode
}

export const Router: React.FC<RouterProps> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState("home")
  const [showSidebar, setShowSidebar] = useState(false)

  const routes = [
    { id: "home", name: "首页", icon: Home },
    { id: "extract", name: "音频提取", icon: Settings },
    { id: "slice", name: "视频切片", icon: Settings },
    { id: "info", name: "视频信息", icon: Info },
  ]

  const renderContent = () => {
    if (currentRoute === "home") {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">FFmpeg 视频处理器</h1>
            <p className="text-muted-foreground">专业的视频处理工具</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.slice(1).map((route) => {
              const Icon = route.icon
              return (
                <Card 
                  key={route.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setCurrentRoute(route.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {route.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {route.id === "extract" && "从视频中提取音频，支持多种格式"}
                      {route.id === "slice" && "将视频切分为多个小片段，适合流媒体播放"}
                      {route.id === "info" && "查看视频详细信息，包括时长、分辨率等"}
                    </p>
                    <Button className="w-full">
                      开始使用
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    }

    return children(currentRoute)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* 侧边栏 - 移动端隐藏 */}
      <div className="hidden lg:block w-64 border-r border-border p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">FFmpeg 视频处理器</h2>
        </div>

        <nav className="space-y-2">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <Button
                key={route.id}
                variant={currentRoute === route.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentRoute(route.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {route.name}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 - 移动端显示 */}
        <div className="lg:hidden border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
              {showSidebar ? <ChevronRight /> : <ChevronLeft />}
            </Button>
            <h1 className="text-xl font-bold">FFmpeg 视频处理器</h1>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
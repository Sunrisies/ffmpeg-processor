import React from "react"
import { Progress } from "./ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface TaskProgressProps {
  title: string
  progress: number
  status: "idle" | "processing" | "completed" | "error"
  message?: string
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  title,
  progress,
  status,
  message = "等待操作..."
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    if (message) return message
    switch (status) {
      case "processing":
        return "处理中..."
      case "completed":
        return "完成!"
      case "error":
        return "出错"
      default:
        return "等待操作..."
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {getStatusIcon()}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2 mb-1">
          <span className="text-xs text-muted-foreground">{getStatusText()}</span>
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </CardContent>
    </Card>
  )
}
import React, { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { open } from '@tauri-apps/plugin-dialog'
import { FileVideo, FolderOpen } from "lucide-react"

interface FileSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  accept?: string
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  value,
  onChange,
  placeholder = "选择文件",
  accept = ""
}) => {
  const handleSelectFile = async () => {
    try {
      const selected = await open({
        filters: accept ? [{
          name: "Video",
          extensions: accept.split(",").map(ext => ext.trim().replace(".", ""))
        }] : undefined,
        multiple: false,
        directory: false
      })

      if (selected) {
        onChange(selected)
      }
    } catch (error) {
      console.error("选择文件失败:", error)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-grow"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleSelectFile}
        className="shrink-0"
      >
        <FileVideo className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface FolderSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  value,
  onChange,
  placeholder = "选择文件夹"
}) => {
  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false
      })

      if (selected) {
        onChange(selected)
      }
    } catch (error) {
      console.error("选择文件夹失败:", error)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-grow"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleSelectFolder}
        className="shrink-0"
      >
        <FolderOpen className="h-4 w-4" />
      </Button>
    </div>
  )
}
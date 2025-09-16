'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Image, Video, File, X, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ipfsService, IPFSUploadResult } from '@/lib/ipfs'

interface IPFSUploadProps {
  onUploadComplete: (results: IPFSUploadResult[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
}

interface FileWithProgress {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  result?: IPFSUploadResult
  error?: string
}

export function IPFSUpload({
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 50, // 50MB
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', '.zip', '.rar', '.md', '.txt'],
  className,
  disabled = false
}: IPFSUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />
    if (type === 'application/pdf') return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxFileSize}MB`
    }

    // 检查文件类型
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isAccepted) {
      return '不支持的文件类型'
    }

    return null
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return

    const newFiles: FileWithProgress[] = []
    const currentFileCount = files.length

    for (let i = 0; i < selectedFiles.length; i++) {
      if (currentFileCount + newFiles.length >= maxFiles) {
        break
      }

      const file = selectedFiles[i]
      const error = validateFile(file)

      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    if (isUploading || disabled) return

    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    for (const fileItem of pendingFiles) {
      try {
        // 更新状态为上传中
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        // 模拟上传进度
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.id === fileItem.id && f.status === 'uploading') {
              const newProgress = Math.min(f.progress + Math.random() * 30, 90)
              return { ...f, progress: newProgress }
            }
            return f
          }))
        }, 200)

        // 上传到IPFS
        const result = await ipfsService.uploadFile(fileItem.file)

        clearInterval(progressInterval)

        // 更新状态为完成
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'completed', progress: 100, result } 
            : f
        ))

      } catch (error) {
        console.error('IPFS上传失败:', error)
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : '上传失败'
              } 
            : f
        ))
      }
    }

    setIsUploading(false)

    // 收集所有成功上传的结果
    const completedResults = files
      .filter(f => f.status === 'completed' && f.result)
      .map(f => f.result!)

    if (completedResults.length > 0) {
      onUploadComplete(completedResults)
    }
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }

  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length
  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          IPFS 文件上传
        </CardTitle>
        <CardDescription>
          将文件上传到 IPFS 网络进行去中心化存储。支持最多 {maxFiles} 个文件，单个文件最大 {maxFileSize}MB。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 上传区域 */}
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            "hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed",
            files.length >= maxFiles && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && files.length < maxFiles && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled && files.length < maxFiles) {
              e.currentTarget.classList.add('border-primary', 'bg-muted/50')
            }
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-primary', 'bg-muted/50')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-primary', 'bg-muted/50')
            if (!disabled && files.length < maxFiles) {
              handleFileSelect(e.dataTransfer.files)
            }
          }}
        >
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">
            {files.length >= maxFiles 
              ? `已达到最大文件数量 (${maxFiles})` 
              : '点击或拖拽文件到这里'
            }
          </p>
          <p className="text-xs text-muted-foreground">
            支持: {acceptedTypes.join(', ')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || files.length >= maxFiles}
        />

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                文件列表 ({files.length}/{maxFiles})
              </h4>
              {completedCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  清除已完成
                </Button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(fileItem.file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    
                    {fileItem.status === 'uploading' && (
                      <Progress value={fileItem.progress} className="h-1 mt-1" />
                    )}
                    
                    {fileItem.error && (
                      <p className="text-xs text-destructive mt-1">
                        {fileItem.error}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {fileItem.status === 'completed' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {fileItem.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileItem.id)}
                      disabled={isUploading && fileItem.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 状态信息 */}
        {(completedCount > 0 || errorCount > 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {completedCount > 0 && `${completedCount} 个文件上传成功`}
              {completedCount > 0 && errorCount > 0 && '，'}
              {errorCount > 0 && `${errorCount} 个文件上传失败`}
            </AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        {pendingCount > 0 && (
          <div className="flex gap-2">
            <Button 
              onClick={uploadFiles}
              disabled={isUploading || disabled}
              className="flex-1"
            >
              {isUploading ? '上传中...' : `上传 ${pendingCount} 个文件`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

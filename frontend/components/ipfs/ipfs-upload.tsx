'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, File, Image, Video, FileText, X, Check, AlertCircle, Copy, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { ipfsService, IPFSUploadResult } from '@/lib/ipfs'
import { useToast } from '@/hooks/use-toast'

interface IPFSUploadProps {
  onUploadComplete: (results: IPFSUploadResult[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxFileSize?: number // MB
  showPreview?: boolean
}

// 文件上传状态接口
interface FileUploadStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying'
  progress: number
  result?: IPFSUploadResult
  error?: string
  retryCount: number
}

export function IPFSUpload({
  onUploadComplete,
  acceptedTypes = ['*'],
  maxFiles = 10,
  maxFileSize = 50,
  showPreview = true
}: IPFSUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<IPFSUploadResult[]>([])
  const [errors, setErrors] = useState<string[]>([])  

  // 重试文件上传
  const retryFile = async (fileStatus: FileUploadStatus) => {
    if (fileStatus.retryCount >= 3) {
      toast({
        title: '重试失败',
        description: `${fileStatus.file.name} 已达到最大重试次数`,
        variant: 'destructive',
      })
      return
    }

    const updatedStatus = {
      ...fileStatus,
      status: 'retrying' as const,
      retryCount: fileStatus.retryCount + 1
    }
    
    setFileStatuses(prev => prev.map(fs => 
      fs.file.name === fileStatus.file.name ? updatedStatus : fs
    ))

    await uploadSingleFile(updatedStatus)
  }

  // 单个文件上传函数
  const uploadSingleFile = async (fileStatus: FileUploadStatus) => {
    try {
      // 更新状态为上传中
      setFileStatuses(prev => prev.map(fs => 
        fs.file.name === fileStatus.file.name ? 
        { ...fs, status: 'uploading', progress: 0 } : fs
      ))

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setFileStatuses(prev => prev.map(fs => {
          if (fs.file.name === fileStatus.file.name && fs.status === 'uploading') {
            const newProgress = Math.min(fs.progress + Math.random() * 15, 90)
            return { ...fs, progress: newProgress }
          }
          return fs
        }))
      }, 200)

      // 通过后端API上传到IPFS
      const formData = new FormData()
      formData.append('file', fileStatus.file)
      
      // 添加认证头
      const token = typeof window !== 'undefined' ? localStorage.getItem('hackx-token') : null
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers,
        body: formData
      })
      
      clearInterval(progressInterval)
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '上传失败')
      }
      
      // 上传成功
      const uploadResult: IPFSUploadResult = {
        hash: result.file.hash,
        path: fileStatus.file.name,
        size: fileStatus.file.size,
        url: result.file.url || `https://gateway.pinata.cloud/ipfs/${result.file.hash}`
      }
      
      setFileStatuses(prev => prev.map(fs => 
        fs.file.name === fileStatus.file.name ? 
        { ...fs, status: 'success', progress: 100, result: uploadResult } : fs
      ))
      
      setUploadedFiles(prev => [...prev, uploadResult])
      
    } catch (error) {
      clearInterval(progressInterval!)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      setFileStatuses(prev => prev.map(fs => 
        fs.file.name === fileStatus.file.name ? 
        { ...fs, status: 'error', error: errorMessage } : fs
      ))
      
      setErrors(prev => [...prev, `${fileStatus.file.name}: ${errorMessage}`])
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrors([])
    setUploading(true)
    setUploadProgress(0)

    // 验证文件
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxFileSize * 1024 * 1024) {
        setErrors(prev => [...prev, `${file.name} 超过最大文件大小 ${maxFileSize}MB`])
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      setUploading(false)
      return
    }

    // 初始化文件状态
    const initialStatuses: FileUploadStatus[] = validFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
      retryCount: 0
    }))
    
    setFileStatuses(initialStatuses)

    // 并发上传文件（最多3个同时进行）
    const uploadPromises = initialStatuses.map(status => uploadSingleFile(status))
    
    try {
      await Promise.allSettled(uploadPromises)
      
      // 统计结果
      const successCount = fileStatuses.filter(fs => fs.status === 'success').length
      const errorCount = fileStatuses.filter(fs => fs.status === 'error').length
      
      if (successCount > 0) {
        const successResults = fileStatuses
          .filter(fs => fs.status === 'success' && fs.result)
          .map(fs => fs.result!)
        
        onUploadComplete(successResults)
        
        toast({
          title: '上传完成',
          description: `成功: ${successCount} 个, 失败: ${errorCount} 个`,
          variant: errorCount > 0 ? 'destructive' : 'default'
        })
      }
    } catch (error) {
      toast({
        title: '上传失败',
        description: '批量上传过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [maxFileSize, onUploadComplete, toast, fileStatuses])

  // 获取文件状态图标
  const getStatusIcon = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'uploading':
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取状态文本
  const getStatusText = (fileStatus: FileUploadStatus) => {
    switch (fileStatus.status) {
      case 'pending':
        return '等待上传'
      case 'uploading':
        return `上传中 ${Math.round(fileStatus.progress)}%`
      case 'retrying':
        return `重试中 (${fileStatus.retryCount}/3)`
      case 'success':
        return '上传成功'
      case 'error':
        return `失败: ${fileStatus.error}`
      default:
        return '未知状态'
    }
  }
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>)
  })

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
      return <Video className="h-4 w-4" />
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '已复制',
      description: 'IPFS 哈希已复制到剪贴板',
    })
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          IPFS 文件上传
        </CardTitle>
        <CardDescription>
          将文件上传到去中心化的 IPFS 网络中永久存储
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 上传区域 */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">释放文件开始上传..</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                拖拽文件到此处或点击选择文件
              </p>
              <p className="text-sm text-muted-foreground">
                支持最多 {maxFiles} 个文件，单个文件最大 {maxFileSize}MB
              </p>
            </div>
          )}
        </div>

        {/* 文件上传状态 */}
        {fileStatuses.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">文件上传状态 ({fileStatuses.length})</h4>
            <div className="space-y-3">
              {fileStatuses.map((fileStatus, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(fileStatus.file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fileStatus.file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="text-xs">{getStatusText(fileStatus)}</span>
                      </div>
                      {fileStatus.status === 'uploading' && (
                        <Progress value={fileStatus.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(fileStatus.status)}
                    {fileStatus.status === 'error' && fileStatus.retryCount < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryFile(fileStatus)}
                        title="重试上传"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    {fileStatus.status === 'success' && fileStatus.result && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(fileStatus.result!.hash)}
                        title="复制 IPFS 哈希"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 总体进度 */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">总体进度</span>
                  <span className="text-sm text-muted-foreground">
                    {fileStatuses.filter(fs => fs.status === 'success').length} / {fileStatuses.length} 完成
                  </span>
                </div>
                <Progress 
                  value={(fileStatuses.filter(fs => fs.status === 'success').length / fileStatuses.length) * 100} 
                />
              </div>
            )}
          </div>
        )}

        {/* 上传进度 */}
        {uploading && fileStatuses.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">上传进度</span>
              <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* 错误信息 */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* 已上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">已上传文件 ({uploadedFiles.length})</h4>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.path)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.path}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <Badge variant="secondary" className="text-xs">
                          IPFS
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(file.hash)}
                      title="复制 IPFS 哈希"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      title="移除文件"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 预览区域 */}
        {showPreview && uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">文件预览</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedFiles
                .filter(file => file.path.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                .slice(0, 6)
                .map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={file.url || "/placeholder.svg"}
                      alt={file.path}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.svg?height=200&width=200'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        查看
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* IPFS 信息 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>IPFS 存储说明：</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 所有文件将存储在去中心化的 IPFS 网络中</li>
              <li>• 每个文件都有唯一的哈希值作为标识</li>
              <li>• 文件一旦上传将无法删除，请确保内容合规</li>
              <li>• 你可以通过 IPFS 网关在全球任何地方访问</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

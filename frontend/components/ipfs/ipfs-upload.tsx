'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, File, Image, Video, FileText, X, Check, AlertCircle, Copy } from 'lucide-react'
import { ipfsService, IPFSUploadResult } from '@/lib/ipfs'
import { useToast } from '@/hooks/use-toast'

interface IPFSUploadProps {
  onUploadComplete: (results: IPFSUploadResult[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxFileSize?: number // MB
  showPreview?: boolean
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
  const [uploadedFiles, setUploadedFiles] = useState<IPFSUploadResult[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrors([])
    setUploading(true)
    setUploadProgress(0)

    try {
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

      const results: IPFSUploadResult[] = []
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        try {
                  // 通过后端API上传到IPFS
        const formData = new FormData()
        formData.append('file', file)
        
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
        
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || '上传失败')
        }
        
        // 后端返回的结构：{ success: true, file: { hash, url, ... } }
        results.push({
          hash: result.file.hash,
          path: file.name,
          size: file.size,
          url: result.file.url || `https://gateway.pinata.cloud/ipfs/${result.file.hash}`
        })
          setUploadProgress(((i + 1) / validFiles.length) * 100)
        } catch (error) {
          setErrors(prev => [...prev, `${file.name} 上传失败`])
        }
      }

      setUploadedFiles(prev => [...prev, ...results])
      onUploadComplete(results)

      toast({
        title: '上传成功',
        description: `${results.length} 个文件已上传到 IPFS`,
      })
    } catch (error) {
      toast({
        title: '上传失败',
        description: '文件上传过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [maxFileSize, onUploadComplete, toast])

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

        {/* 上传进度 */}
        {uploading && (
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

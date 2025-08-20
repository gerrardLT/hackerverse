'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Search, Download, ExternalLink, File, Image, Video, FileText, AlertCircle, Copy, Eye } from 'lucide-react'
import { ipfsService } from '@/lib/ipfs'
import { useToast } from '@/hooks/use-toast'

export function IPFSBrowser() {
  const { toast } = useToast()
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [fileData, setFileData] = useState<any>(null)
  const [fileType, setFileType] = useState<string>('')
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!hash.trim()) {
      setError('请输入 IPFS 哈希')
      return
    }

    if (!ipfsService.isValidHash(hash.trim())) {
      setError('无效的 IPFS 哈希格式')
      return
    }

    setLoading(true)
    setError('')
    setFileData(null)

    try {
      const url = ipfsService.getFileUrl(hash.trim())
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('无法获取文件')
      }

      const contentType = response.headers.get('content-type') || ''
      setFileType(contentType)

      if (contentType.includes('application/json')) {
        const jsonData = await response.json()
        setFileData(jsonData)
      } else if (contentType.includes('text/')) {
        const textData = await response.text()
        setFileData(textData)
      } else if (contentType.includes('image/')) {
        setFileData(url)
      } else if (contentType.includes('video/')) {
        setFileData(url)
      } else {
        setFileData({ url, type: 'binary' })
      }

      toast({
        title: '文件加载成功',
        description: '已从 IPFS 网络获取文件',
      })
    } catch (error) {
      setError('无法从 IPFS 获取文件，请检查哈希值是否正确')
      console.error('IPFS fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyHash = () => {
    navigator.clipboard.writeText(hash)
    toast({
      title: '已复制',
      description: 'IPFS 哈希已复制到剪贴板',
    })
  }

  const downloadFile = () => {
    if (fileData) {
      const url = typeof fileData === 'string' ? fileData : ipfsService.getFileUrl(hash)
      window.open(url, '_blank')
    }
  }

  const getFileIcon = () => {
    if (fileType.includes('image/')) return <Image className="h-4 w-4" />
    if (fileType.includes('video/')) return <Video className="h-4 w-4" />
    if (fileType.includes('text/') || fileType.includes('json')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const renderFileContent = () => {
    if (!fileData) return null

    if (fileType.includes('application/json')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              JSON 数据
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(fileData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )
    }

    if (fileType.includes('text/')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              文本内容
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">
              {fileData}
            </pre>
          </CardContent>
        </Card>
      )
    }

    if (fileType.includes('image/')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              图片预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img
                src={fileData || "/placeholder.svg"}
                alt="IPFS Image"
                className="max-w-full max-h-96 rounded-lg border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg?height=200&width=200'
                }}
              />
            </div>
          </CardContent>
        </Card>
      )
    }

    if (fileType.includes('video/')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              视频预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <video
                src={fileData}
                controls
                className="max-w-full max-h-96 rounded-lg border"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            二进制文件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              此文件类型不支持预览，但可以下载查看
            </p>
            <Button onClick={downloadFile}>
              <Download className="h-4 w-4 mr-2" />
              下载文件
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            IPFS 文件浏览器
          </CardTitle>
          <CardDescription>
            通过 IPFS 哈希值浏览和预览文件内容
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hash">IPFS 哈希</Label>
            <div className="flex gap-2">
              <Input
                id="hash"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="输入 IPFS 哈希值，例如：QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? '搜索中...' : '搜索'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hash && ipfsService.isValidHash(hash) && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="secondary">有效哈希</Badge>
              <code className="flex-1 text-sm">{hash}</code>
              <Button variant="ghost" size="sm" onClick={copyHash}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open(ipfsService.getFileUrl(hash), '_blank')}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {fileData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon()}
              <span className="font-medium">文件内容</span>
              <Badge variant="outline">{fileType}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadFile}>
                <Download className="h-3 w-3 mr-1" />
                下载
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(ipfsService.getFileUrl(hash), '_blank')}>
                <Eye className="h-3 w-3 mr-1" />
                在新窗口打开
              </Button>
            </div>
          </div>

          {renderFileContent()}
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>使用说明：</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• IPFS 哈希值通常以 "Qm" 开头，长度约 46 个字符</li>
            <li>• 支持预览 JSON、文本、图片和视频文件</li>
            <li>• 其他文件类型可以下载后查看</li>
            <li>• 文件加载速度取决于 IPFS 网络状况</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

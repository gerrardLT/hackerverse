'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Database, Upload, Search, Info, Globe, Shield, Zap, Users } from 'lucide-react'
import { IPFSUpload } from '@/components/ipfs/ipfs-upload'
import { IPFSBrowser } from '@/components/ipfs/ipfs-browser'
import { IPFSUploadResult } from '@/lib/ipfs'

export default function IPFSPage() {
  const [uploadedFiles, setUploadedFiles] = useState<IPFSUploadResult[]>([])

  const handleUploadComplete = (results: IPFSUploadResult[]) => {
    setUploadedFiles(prev => [...prev, ...results])
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* 页面头部 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">IPFS 去中心化存储</h1>
              <p className="text-muted-foreground">
                使用星际文件系统 (IPFS) 进行去中心化文件存储和分发
              </p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">已上传文件</p>
                    <p className="text-2xl font-bold">{uploadedFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">总存储大小</p>
                    <p className="text-2xl font-bold">
                      {(uploadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">网络节点</p>
                    <p className="text-2xl font-bold">5000+</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">数据安全</p>
                    <p className="text-2xl font-bold">100%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 主要内容 */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              文件上传
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              文件浏览
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              关于 IPFS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <IPFSUpload
              onUploadComplete={handleUploadComplete}
              acceptedTypes={['image/*', 'video/*', 'application/pdf', 'text/*', '.doc', '.docx', '.zip']}
              maxFiles={20}
              maxFileSize={100}
              showPreview={true}
            />
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <IPFSBrowser />
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    什么是 IPFS？
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    IPFS（InterPlanetary File System，星际文件系统）是一个分布式的、点对点的文件存储系统，
                    旨在创建一个更快、更安全、更开放的网络。
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">去中心化存储</h4>
                        <p className="text-sm text-muted-foreground">
                          文件分布存储在全球节点网络中，没有单点故障
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">内容寻址</h4>
                        <p className="text-sm text-muted-foreground">
                          每个文件都有唯一的哈希值，确保内容完整性
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">全球访问</h4>
                        <p className="text-sm text-muted-foreground">
                          通过任何 IPFS 网关都可以访问存储的文件
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>IPFS 在 HackX 中的应用</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">项目文件</Badge>
                      <span className="text-sm">项目源码、文档、演示视频</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">元数据</Badge>
                      <span className="text-sm">项目和黑客松的结构化信息</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">媒体资源</Badge>
                      <span className="text-sm">图片、视频、音频文件</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">备份存储</Badge>
                      <span className="text-sm">重要数据的永久备份</span>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      所有通过 HackX 平台提交的项目文件都会自动存储到 IPFS 网络中，
                      确保数据的永久性和可访问性。
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>使用指南</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">上传文件</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>选择要上传的文件（支持多种格式）</li>
                        <li>拖拽到上传区域或点击选择</li>
                        <li>等待上传完成并获得 IPFS 哈希</li>
                        <li>保存哈希值以便后续访问</li>
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">浏览文件</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>输入有效的 IPFS 哈希</li>
                        <li>点击搜索按钮加载文件</li>
                        <li>预览支持的文件类型</li>
                        <li>下载或在新窗口中打开文件</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

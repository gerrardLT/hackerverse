'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, Edit, HelpCircle, Tag, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { categoryLabels, categoryIcons, type PostCategory } from '@/lib/community'

export default function NewPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory | ''>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('write')

  const [errors, setErrors] = useState({
    title: '',
    content: '',
    category: ''
  })

  const validateForm = () => {
    const newErrors = {
      title: '',
      content: '',
      category: ''
    }

    if (!title.trim()) {
      newErrors.title = '请输入帖子标题'
    } else if (title.length < 10) {
      newErrors.title = '标题至少需要 10 个字符'
    } else if (title.length > 200) {
      newErrors.title = '标题不能超过 200 个字符'
    }

    if (!content.trim()) {
      newErrors.content = '请输入帖子内容'
    } else if (content.length < 50) {
      newErrors.content = '内容至少需要 50 个字符'
    }

    if (!category) {
      newErrors.category = '请选择帖子分类'
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== '')
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: '发布成功',
        description: '您的帖子已成功发布到社区',
      })
      
      router.push('/community')
    } catch (error) {
      toast({
        title: '发布失败',
        description: '发布帖子时出现错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPreview = () => {
    return (
      <div className="prose max-w-none">
        <h1 className="text-2xl font-bold mb-4">{title || '帖子标题预览'}</h1>
        {category && (
          <div className="mb-4">
            <Badge className="mb-2">
              {categoryIcons[category]} {categoryLabels[category]}
            </Badge>
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {content || '帖子内容预览...'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回社区
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">发布新帖子</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>创建帖子</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">标题 *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="输入一个吸引人的标题..."
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    <div className="flex justify-between text-sm">
                      {errors.title && (
                        <span className="text-red-500">{errors.title}</span>
                      )}
                      <span className={`ml-auto ${title.length > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                        {title.length}/200
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">分类 *</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as PostCategory)}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="选择帖子分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {categoryIcons[key as PostCategory]} {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <span className="text-sm text-red-500">{errors.category}</span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">标签 (最多 5 个)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入标签后按回车键添加..."
                        disabled={tags.length >= 5}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                        disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 5}
                      >
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                    <span className="text-sm text-gray-500">
                      {tags.length}/5 个标签
                    </span>
                  </div>

                  {/* Content with Preview */}
                  <div className="space-y-2">
                    <Label htmlFor="content">内容 *</Label>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write" className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          写作
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          预览
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="write" className="mt-4">
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="详细描述您的想法、经验或问题..."
                          rows={12}
                          className={errors.content ? 'border-red-500' : ''}
                        />
                      </TabsContent>
                      <TabsContent value="preview" className="mt-4">
                        <div className="min-h-[300px] p-4 border rounded-md bg-white">
                          {renderPreview()}
                        </div>
                      </TabsContent>
                    </Tabs>
                    <div className="flex justify-between text-sm">
                      {errors.content && (
                        <span className="text-red-500">{errors.content}</span>
                      )}
                      <span className={`ml-auto ${content.length < 50 ? 'text-red-500' : 'text-gray-500'}`}>
                        {content.length} 字符 (至少 50 字符)
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Link href="/community">
                      <Button type="button" variant="outline">
                        取消
                      </Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '发布中...' : '发布帖子'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Writing Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  写作建议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">1.</span>
                  <span>使用清晰、描述性的标题</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">2.</span>
                  <span>选择合适的分类和标签</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">3.</span>
                  <span>提供详细的背景信息</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">4.</span>
                  <span>包含代码示例或截图</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">5.</span>
                  <span>保持友善和建设性的语调</span>
                </div>
              </CardContent>
            </Card>

            {/* Markdown Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  格式帮助
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-mono bg-gray-100 p-2 rounded">
                  **粗体文本**
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  *斜体文本*
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  `代码`
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  [链接](URL)
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  # 标题
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>发帖须知</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <Alert>
                  <AlertDescription>
                    发布前请确保内容符合社区规则，避免重复发帖。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

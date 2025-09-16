'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { categoryIcons, type PostCategory } from '@/lib/community'
import { apiService } from '@/lib/api'

export default function NewPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('community.newPost')
  const tCommunity = useTranslations('community')

  // 获取国际化的分类标签
  const getCategoryLabel = (category: PostCategory) => {
    return tCommunity(`categories.${category}`)
  }

  // 所有分类列表
  const categories: PostCategory[] = ['general', 'technical', 'showcase', 'help', 'announcement']
  const tCommon = useTranslations('common')
  
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
      newErrors.title = t('form.titleRequired')
    } else if (title.length < 10) {
      newErrors.title = t('form.titleMinError')
    } else if (title.length > 200) {
      newErrors.title = t('form.titleMaxError')
    }

    if (!content.trim()) {
      newErrors.content = t('form.contentRequired')
    } else if (content.length < 50) {
      newErrors.content = t('form.contentMinError')
    }

    if (!category) {
      newErrors.category = t('form.categoryRequired')
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
      // Call real API to create post
      const response = await apiService.createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        category: category as 'general' | 'technical' | 'showcase' | 'help' | 'announcement',
        tags: tags,
        excerpt: content.trim().substring(0, 200) // Auto generate excerpt
      })

      if (response.success) {
        toast({
          title: t('validation.publishSuccess'),
          description: t('validation.publishSuccessDesc'),
        })
        
        router.push('/community')
      } else {
        throw new Error(response.error || t('validation.publishFailed'))
      }
    } catch (error) {
      console.error(t('validation.createError') + ':', error)
      toast({
        title: t('validation.publishFailed'),
        description: error instanceof Error ? error.message : t('validation.publishFailedDesc'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPreview = () => {
    return (
      <div className="prose max-w-none">
        <h1 className="text-2xl font-bold mb-4">{title || t('preview.titlePreview')}</h1>
        {category && (
          <div className="mb-4">
            <Badge className="mb-2">
              {categoryIcons[category]} {getCategoryLabel(category)}
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
          {content || t('preview.contentPreview')}
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
              {t('backToCommunity')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('createPost')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('form.title')}</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('form.titlePlaceholder')}
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
                    <Label htmlFor="category">{t('form.category')}</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as PostCategory)}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('form.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((categoryItem) => (
                          <SelectItem key={categoryItem} value={categoryItem}>
                            {categoryIcons[categoryItem]} {getCategoryLabel(categoryItem)}
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
                    <Label htmlFor="tags">{t('form.tags')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('form.tagsPlaceholder')}
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
                      {t('form.tagsCount', { current: tags.length })}
                    </span>
                  </div>

                  {/* Content with Preview */}
                  <div className="space-y-2">
                    <Label htmlFor="content">{t('form.content')}</Label>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write" className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          {t('form.write')}
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {t('form.preview')}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="write" className="mt-4">
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={t('form.contentPlaceholder')}
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
                        {t('form.contentCharCount', { count: content.length })}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Link href="/community">
                      <Button type="button" variant="outline">
                        {t('form.cancel')}
                      </Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? t('form.publishing') : t('form.publish')}
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
                  {t('sidebar.writingTips')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">1.</span>
                  <span>{t('sidebar.tip1')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">2.</span>
                  <span>{t('sidebar.tip2')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">3.</span>
                  <span>{t('sidebar.tip3')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">4.</span>
                  <span>{t('sidebar.tip4')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">5.</span>
                  <span>{t('sidebar.tip5')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Markdown Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {t('sidebar.formatHelp')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-mono bg-gray-100 p-2 rounded">
                  {t('sidebar.boldText')}
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  {t('sidebar.italicText')}
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  {t('sidebar.code')}
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  {t('sidebar.link')}
                </div>
                <div className="font-mono bg-gray-100 p-2 rounded">
                  {t('sidebar.heading')}
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sidebar.guidelines')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <Alert>
                  <AlertDescription>
                    {t('sidebar.guidelinesDesc')}
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

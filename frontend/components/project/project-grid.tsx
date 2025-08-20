'use client'

import { useState, useEffect } from 'react'
import { ProjectCard } from './project-card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { apiService, type Project } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface ProjectGridProps {
  searchQuery: string
  filters: any
  category: 'all' | 'featured' | 'recent' | 'winners'
}

export function ProjectGrid({ searchQuery, filters, category }: ProjectGridProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchProjects = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: pageNum,
        limit: 12,
        search: searchQuery || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // 应用筛选条件
      if (filters.hackathonId && filters.hackathonId !== 'all') {
        params.hackathonId = filters.hackathonId
      }
      
      if (filters.technology && filters.technology !== 'all') {
        params.technology = filters.technology
      }
      
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }

      // 根据分类设置不同的排序
      switch (category) {
        case 'featured':
          params.featured = true
          break
        case 'recent':
          params.sortBy = 'createdAt'
          params.sortOrder = 'desc'
          break
        case 'winners':
          params.winners = true
          break
        default:
          break
      }

      const response = await apiService.getProjects(params)
      console.log(response)
      if (response.success && response.data) {
        const { projects: newProjects, pagination } = response.data
        
        if (append) {
          setProjects(prev => [...prev, ...newProjects])
        } else {
          setProjects(newProjects)
        }
        
        setTotalPages(pagination.totalPages)
        setHasMore(pageNum < pagination.totalPages)
      } else {
        setError(response.error || '获取项目列表失败')
        toast({
          title: '加载失败',
          description: response.error || '无法获取项目列表',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('获取项目列表错误:', error)
      setError('网络错误，请检查网络连接')
      toast({
        title: '网络错误',
        description: '请检查网络连接并重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    setPage(1)
    fetchProjects(1, false)
  }, [searchQuery, filters, category])

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchProjects(nextPage, true)
    }
  }

  // 点赞项目
  const handleLikeProject = async (projectId: string) => {
    try {
      const response = await apiService.likeProject(projectId)
      
      if (response.success) {
        // 更新本地项目列表中的点赞状态
        setProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, _count: { ...project._count, projectLikes: (project._count?.projectLikes || 0) + 1 } }
            : project
        ))
        
        toast({
          title: '成功',
          description: '项目已点赞'
        })
      } else {
        toast({
          title: '操作失败',
          description: response.error || '点赞失败',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('点赞失败:', error)
      toast({
        title: '操作失败',
        description: '点赞失败',
        variant: 'destructive'
      })
    }
  }

  if (loading && projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">加载项目中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchProjects(1, false)}>
          重试
        </Button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">📁</span>
        </div>
        <h3 className="text-lg font-medium mb-2">暂无项目</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery ? '没有找到匹配的项目' : '还没有项目，快来创建第一个吧！'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onLike={() => handleLikeProject(project.id)}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="w-full max-w-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              '加载更多项目'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

import { apiService, type CommunityPost, type CommunityReply, type CommunityUser } from '@/lib/api'

export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar?: string
  role: 'admin' | 'moderator' | 'user'
  reputation: number
  joinedAt: string
  lastActive: string
}

export interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  author: User
  category: PostCategory
  tags: string[]
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  replies: number
  isPinned: boolean
  isLocked: boolean
  lastReplyAt?: string
  lastReplyBy?: User
}

export interface Reply {
  id: string
  postId: string
  content: string
  author: User
  createdAt: string
  updatedAt: string
  likes: number
  parentId?: string
  replies?: Reply[]
}

export type PostCategory = 'general' | 'technical' | 'showcase' | 'help' | 'announcement'

export interface CommunityStats {
  totalPosts: number
  totalReplies: number
  totalUsers: number
  activeUsers: number
  todayPosts: number
  todayReplies: number
}

export const categoryLabels: Record<PostCategory, string> = {
  general: '综合讨论',
  technical: '技术交流',
  showcase: '项目展示',
  help: '求助问答',
  announcement: '官方公告',
}

export const categoryColors: Record<PostCategory, string> = {
  general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  technical: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  showcase: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  help: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  announcement: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export const categoryIcons: Record<PostCategory, string> = {
  general: '💬',
  technical: '🔧',
  showcase: '🎨',
  help: '🆘',
  announcement: '📢',
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

export function getCategoryIcon(category: PostCategory): string {
  return categoryIcons[category]
}

export function getCategoryColor(category: PostCategory): string {
  return categoryColors[category]
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'text-red-600 dark:text-red-400 font-semibold'
    case 'moderator':
      return 'text-blue-600 dark:text-blue-400 font-semibold'
    default:
      return 'text-muted-foreground'
  }
}

export class CommunityService {
  private posts: CommunityPost[] = []
  private loading = false
  private error: string | null = null

  async getPosts(params?: {
    category?: string
    sortBy?: string
    page?: number
    limit?: number
    search?: string
  }) {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getCommunityPosts(params)
      
      if (response.success && response.data) {
        this.posts = response.data.posts
        return {
          posts: response.data.posts,
          pagination: response.data.pagination,
          stats: response.data.stats
        }
      } else {
        this.error = response.error || '获取帖子列表失败'
        throw new Error(this.error)
      }
    } catch (error) {
      console.error('获取帖子列表失败:', error)
      this.error = error instanceof Error ? error.message : '获取帖子列表失败'
      throw error
    } finally {
      this.loading = false
    }
  }

  async getPost(id: string) {
    try {
      const response = await apiService.getCommunityPost(id)
      
      if (response.success && response.data) {
        return response.data.post
      } else {
        throw new Error(response.error || '获取帖子详情失败')
      }
    } catch (error) {
      console.error('获取帖子详情失败:', error)
      throw error
    }
  }

  async createPost(postData: {
    title: string
    content: string
    category: PostCategory
    tags: string[]
    excerpt?: string
  }) {
    try {
      const response = await apiService.createCommunityPost(postData)
      
      if (response.success && response.data) {
        const newPost = response.data.post
        this.posts.unshift(newPost)
        return newPost
      } else {
        throw new Error(response.error || '创建帖子失败')
      }
    } catch (error) {
      console.error('创建帖子失败:', error)
      throw error
    }
  }

  async updatePost(id: string, postData: {
    title?: string
    content?: string
    category?: PostCategory
    tags?: string[]
    excerpt?: string
  }) {
    try {
      const response = await apiService.updateCommunityPost(id, postData)
      
      if (response.success && response.data) {
        const updatedPost = response.data.post
        // 更新本地缓存
        const index = this.posts.findIndex(p => p.id === id)
        if (index !== -1) {
          this.posts[index] = updatedPost
        }
        return updatedPost
      } else {
        throw new Error(response.error || '更新帖子失败')
      }
    } catch (error) {
      console.error('更新帖子失败:', error)
      throw error
    }
  }

  async deletePost(id: string) {
    try {
      const response = await apiService.deleteCommunityPost(id)
      
      if (response.success) {
        // 从本地缓存中移除
        this.posts = this.posts.filter(p => p.id !== id)
        return true
      } else {
        throw new Error(response.error || '删除帖子失败')
      }
    } catch (error) {
      console.error('删除帖子失败:', error)
      throw error
    }
  }

  async likePost(postId: string) {
    try {
      // 这里需要后端提供点赞 API
      // const response = await apiService.likeCommunityPost(postId)
      
      // 临时实现：更新本地状态
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        post.likes += 1
        return true
      }
      return false
    } catch (error) {
      console.error('点赞失败:', error)
      throw error
    }
  }

  getLoading() {
    return this.loading
  }

  getError() {
    return this.error
  }

  clearError() {
    this.error = null
  }

  // 获取本地缓存的帖子
  getLocalPosts() {
    return this.posts
  }
}

export const communityService = new CommunityService()

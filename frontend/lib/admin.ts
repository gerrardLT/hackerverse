import { apiService } from './api'
import { useToast } from '@/hooks/use-toast'

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  totalHackathons: number
  totalProjects: number
  pendingReviews: number
  userGrowth: number
  postGrowth: number
  hackathonGrowth: number
  projectGrowth: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'moderator' | 'user'
  status: 'active' | 'suspended' | 'banned'
  joinedAt: string
  lastActive: string
  reputation: number
  postsCount: number
  projectsCount: number
}

export interface AdminPost {
  id: string
  title: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  category: string
  status: 'published' | 'pending' | 'reported' | 'deleted'
  createdAt: string
  views: number
  likes: number
  replies: number
  reports: number
}

export interface AdminHackathon {
  id: string
  title: string
  organizer: string
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  startDate: string
  endDate: string
  participants: number
  projects: number
  prizePool: number
}

export interface SystemStatus {
  database: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  blockchain: 'healthy' | 'warning' | 'error'
}

class AdminService {
  private stats: AdminStats | null = null
  private users: AdminUser[] = []
  private posts: AdminPost[] = []
  private hackathons: AdminHackathon[] = []
  private systemStatus: SystemStatus | null = null
  private loading = false
  private error: string | null = null

  // 获取管理员统计数据
  async getStats(): Promise<AdminStats | null> {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getAdminStats()
      
      if (response.success && response.data) {
        this.stats = response.data
        return this.stats
      } else {
        this.error = response.error || '获取统计数据失败'
        return null
      }
    } catch (error) {
      console.error('获取统计数据错误:', error)
      this.error = '网络错误，请检查网络连接'
      return null
    } finally {
      this.loading = false
    }
  }

  // 获取管理员用户列表
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<AdminUser[]> {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getAdminUsers(params)
      
      if (response.success && response.data) {
        this.users = response.data.users
        return this.users
      } else {
        this.error = response.error || '获取用户列表失败'
        return []
      }
    } catch (error) {
      console.error('获取用户列表错误:', error)
      this.error = '网络错误，请检查网络连接'
      return []
    } finally {
      this.loading = false
    }
  }

  // 更新用户角色
  async updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
      const response = await apiService.updateUserRole(userId, role)
      
      if (response.success) {
        // 更新本地用户列表
        this.users = this.users.map(user => 
          user.id === userId ? { ...user, role: role as any } : user
        )
        return true
      } else {
        this.error = response.error || '更新用户角色失败'
        return false
      }
    } catch (error) {
      console.error('更新用户角色错误:', error)
      this.error = '网络错误，请检查网络连接'
      return false
    }
  }

  // 更新用户状态
  async updateUserStatus(userId: string, status: string): Promise<boolean> {
    try {
      const response = await apiService.updateUserStatus(userId, status)
      
      if (response.success) {
        // 更新本地用户列表
        this.users = this.users.map(user => 
          user.id === userId ? { ...user, status: status as any } : user
        )
        return true
      } else {
        this.error = response.error || '更新用户状态失败'
        return false
      }
    } catch (error) {
      console.error('更新用户状态错误:', error)
      this.error = '网络错误，请检查网络连接'
      return false
    }
  }

  // 获取管理员帖子列表
  async getPosts(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<AdminPost[]> {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getAdminPosts(params)
      
      if (response.success && response.data) {
        this.posts = response.data.posts
        return this.posts
      } else {
        this.error = response.error || '获取帖子列表失败'
        return []
      }
    } catch (error) {
      console.error('获取帖子列表错误:', error)
      this.error = '网络错误，请检查网络连接'
      return []
    } finally {
      this.loading = false
    }
  }

  // 更新帖子状态
  async updatePostStatus(postId: string, status: string): Promise<boolean> {
    try {
      const response = await apiService.updatePostStatus(postId, status)
      
      if (response.success) {
        // 更新本地帖子列表
        this.posts = this.posts.map(post => 
          post.id === postId ? { ...post, status: status as any } : post
        )
        return true
      } else {
        this.error = response.error || '更新帖子状态失败'
        return false
      }
    } catch (error) {
      console.error('更新帖子状态错误:', error)
      this.error = '网络错误，请检查网络连接'
      return false
    }
  }

  // 获取管理员黑客松列表
  async getHackathons(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<AdminHackathon[]> {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getAdminHackathons(params)
      
      if (response.success && response.data) {
        this.hackathons = response.data.hackathons
        return this.hackathons
      } else {
        this.error = response.error || '获取黑客松列表失败'
        return []
      }
    } catch (error) {
      console.error('获取黑客松列表错误:', error)
      this.error = '网络错误，请检查网络连接'
      return []
    } finally {
      this.loading = false
    }
  }

  // 更新黑客松状态
  async updateHackathonStatus(hackathonId: string, status: string): Promise<boolean> {
    try {
      const response = await apiService.updateHackathonStatus(hackathonId, status)
      
      if (response.success) {
        // 更新本地黑客松列表
        this.hackathons = this.hackathons.map(hackathon => 
          hackathon.id === hackathonId ? { ...hackathon, status: status as any } : hackathon
        )
        return true
      } else {
        this.error = response.error || '更新黑客松状态失败'
        return false
      }
    } catch (error) {
      console.error('更新黑客松状态错误:', error)
      this.error = '网络错误，请检查网络连接'
      return false
    }
  }

  // 获取系统状态
  async getSystemStatus(): Promise<SystemStatus | null> {
    try {
      this.loading = true
      this.error = null
      
      const response = await apiService.getSystemStatus()
      
      if (response.success && response.data) {
        this.systemStatus = response.data
        return this.systemStatus
      } else {
        this.error = response.error || '获取系统状态失败'
        return null
      }
    } catch (error) {
      console.error('获取系统状态错误:', error)
      this.error = '网络错误，请检查网络连接'
      return null
    } finally {
      this.loading = false
    }
  }

  // 获取本地数据
  getLocalStats(): AdminStats | null {
    return this.stats
  }

  getLocalUsers(): AdminUser[] {
    return this.users
  }

  getLocalPosts(): AdminPost[] {
    return this.posts
  }

  getLocalHackathons(): AdminHackathon[] {
    return this.hackathons
  }

  getLocalSystemStatus(): SystemStatus | null {
    return this.systemStatus
  }

  // 状态管理
  getLoading(): boolean {
    return this.loading
  }

  getError(): string | null {
    return this.error
  }

  clearError(): void {
    this.error = null
  }
}

// 创建单例实例
export const adminService = new AdminService()

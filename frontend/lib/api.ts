// API服务层 - 管理所有的HTTP请求

// 标准化错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
}

// 认证相关错误码
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID'
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
  code?: string
}

interface User {
  id: string
  email: string
  username: string
  walletAddress?: string
  avatarUrl?: string
  bio?: string
  reputationScore: number
  role: 'user' | 'admin' | 'moderator' | 'judge'
  status: 'active' | 'suspended' | 'banned' | 'pending'
  emailVerified: boolean
  notificationSettings: {
    email: boolean
    push: boolean
    sms: boolean
    teamInvites: boolean
    projectUpdates: boolean
    hackathonReminders: boolean
  }
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'friends'
    showEmail: boolean
    showWalletAddress: boolean
  }
  ipfsProfileHash?: string
  ipfsUrl?: string
  createdAt: string
  updatedAt: string
  _count?: {
    participations: number
    projects: number
    teams: number
  }
}

interface Hackathon {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  registrationDeadline?: string
  maxParticipants?: number
  prizePool?: number
  categories: string[]
  tags: string[]
  requirements?: string
  rules?: string
  isPublic: boolean
  featured: boolean
  status: string
  createdAt: string
  // 区块链相关字段
  contractId?: number | null
  ipfsHash?: string | null
  txHash?: string | null
  blockNumber?: number | null
  gasUsed?: number | null
  syncStatus?: string | null
  // ⭐ 添加metadata字段
  metadata?: {
    prizes?: Array<{
      rank: number
      name?: string
      amount: number
      description: string
    }>
    tracks?: Array<{
      name: string
      description: string
      requirements?: string
    }>
    judgingCriteria?: Array<{
      category: string
      weight: number
      description: string
    }>
    judges?: Array<{
      name: string
      title: string
      bio: string
      avatarUrl: string
    }>
    sponsors?: Array<{
      name: string
      logoUrl: string
      websiteUrl: string
      tier: string
    }>
    timeline?: Array<{
      date: string
      title: string
      description: string
      completed: boolean
    }>
    schedule?: any[]
    coverImage?: string | null
    location?: string
    timezone?: string
  }
  organizer: {
    id: string
    username: string
    avatarUrl?: string
  }
  _count: {
    participations: number
    projects: number
  }
}

interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  tags: string[]
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  ipfsHash?: string
  status: string
  isPublic: boolean
  createdAt: string
  hackathon: {
    id: string
    title: string
  }
  team?: {
    id: string
    name: string
    members: any[]
  }
  _count: {
    scores: number
    feedback: number      // 使用正确的字段名
    projectLikes: number  // 使用正确的字段名
  }
}

interface Team {
  id: string
  name: string
  description: string
  maxMembers: number
  skills: string[]
  tags: string[]
  isPublic: boolean
  status: 'RECRUITING' | 'FULL' | 'COMPETING' | 'COMPLETED' | 'DISBANDED'
  createdAt: string
  hackathon: {
    id: string
    title: string
  }
  leader: {
    id: string
    username: string
    avatarUrl?: string
  }
  members: any[]
  _count: {
    members: number
    projects: number
  }
}

interface Notification {
  id: string
  type: 'team_invite' | 'project_update' | 'hackathon_reminder' | 'review_complete' | 'prize_awarded' | 'system_message'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  userId: string
  actionUrl?: string
  actionLabel?: string
  priority: 'low' | 'medium' | 'high'
  category: 'team' | 'project' | 'hackathon' | 'system'
}

interface CommunityUser {
  id: string
  name: string
  username: string
  avatar?: string
  reputation: number
}

interface CommunityPost {
  id: string
  title: string
  content: string
  excerpt?: string
  author: CommunityUser
  category: 'general' | 'technical' | 'showcase' | 'help' | 'announcement'
  tags: string[]
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  replies: number
  isPinned: boolean
  isLocked: boolean
  lastReplyAt?: string
  lastReplyBy?: CommunityUser
  // 用户态（可选）
  isLiked?: boolean
  isBookmarked?: boolean
}

interface CommunityReply {
  id: string
  content: string
  author: CommunityUser
  createdAt: string
  updatedAt: string
  likes: number
  replies?: CommunityReply[]
}

class ApiService {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = 'http://localhost:3002/api') {
    this.baseURL = baseURL
    // 从localStorage获取token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('hackx-token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // 构建URL，并在GET请求时追加时间戳防缓存
    let url = `${this.baseURL}${endpoint}`
    const method = (options.method || 'GET').toUpperCase()
    if (method === 'GET') {
      const hasQuery = url.includes('?')
      const ts = `_ts=${Date.now()}`
      url = hasQuery ? `${url}&${ts}` : `${url}?${ts}`
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // 动态获取最新的token（每次请求都重新检查）
    let currentToken = this.token
    if (typeof window !== 'undefined') {
      const storageToken = localStorage.getItem('hackx-token')
      if (storageToken && storageToken !== this.token) {
        console.log('🔄 检测到localStorage中有新token，更新实例token')
        this.token = storageToken
        currentToken = storageToken
      } else if (!currentToken) {
        currentToken = storageToken
        console.log('🔄 从localStorage获取token:', currentToken ? currentToken.substring(0, 20) + '...' : 'null')
      }
    }

    // 添加认证header
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`
      console.log('🔑 API请求包含token:', currentToken.substring(0, 20) + '...')
    } else {
      console.log('⚠️ API请求缺少token - 请检查用户登录状态')
      console.log('🔍 调试信息:', {
        instanceToken: this.token ? 'exists' : 'null',
        storageToken: typeof window !== 'undefined' ? (localStorage.getItem('hackx-token') ? 'exists' : 'null') : 'server-side',
        endpoint: endpoint
      })
    }

    try {
      console.log('🌐 发送API请求:', {
        method: options.method || 'GET',
        url,
        headers: Object.keys(headers),
        hasToken: !!currentToken
      })
      
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit'
      })

      const data = await response.json()

      if (!response.ok) {
        // 特殊处理401未认证错误
        if (response.status === 401) {
          // 清除无效的token
          this.clearToken()
          return {
            success: false,
            error: '未认证，请先登录'
          }
        }
        
        // 返回后端的具体错误信息
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          details: data.details || null
        }
      }

      return data
    } catch (error) {
      console.error(`API请求失败: ${endpoint}`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败'
      }
    }
  }

  // 设置认证token
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('hackx-token', token)
    }
  }

  // 清除认证token
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hackx-token')
    }
  }

  // ============ 通用HTTP方法 ============

  /**
   * GET请求
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET'
    })
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * PUT请求
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    })
  }

  // ============ 认证API ============
  
  /**
   * 验证token有效性
   */
  async validateToken(token?: string): Promise<boolean> {
    const tokenToValidate = token || this.token
    if (!tokenToValidate) return false
    
    try {
      const response = await this.request('/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`
        }
      })
      return response.success
    } catch (error) {
      return false
    }
  }
  
  async signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signUp(email: string, password: string, username?: string, walletAddress?: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, walletAddress }),
    })
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  // ============ 用户管理API ============
  async getCurrentUser(): Promise<ApiResponse<{ 
    user: User;
    communityOverview?: {
      counts: { bookmarks: number; likes: number; myPosts: number; following: number }
      previews: { 
        bookmarks: { id: string; title: string }[]
        likes: { id: string; title: string }[]
        myPosts: { id: string; title: string }[]
        following: { id: string; name: string; avatar?: string }[]
      }
    }
  }>> {
    return this.request('/users/me')
  }

  async getUserStats(): Promise<ApiResponse<{ 
    stats: {
      participatedHackathons: number
      submittedProjects: number
      wonPrizes: number
      reputationScore: number
    }
    recentActivities: Array<{
      id: string
      type: string
      title: string
      description: string
      date: string
      hackathonName?: string
    }>
  }>> {
    return this.request('/users/me/stats')
  }

  // ============ Dashboard增强API ============
  async getDashboardStats(): Promise<ApiResponse<{
    stats: {
      hackathons: {
        participated: number
        organized: number
        total: number
      }
      projects: {
        submitted: number
        won: number
        winRate: number
      }
      teams: {
        joined: number
        asJudge: number
      }
      reputation: {
        score: number
        level: number
        pointsToNextLevel: number
        nextLevelPoints: number
        progressPercentage: number
        totalEarned: number
      }
      achievements: {
        completed: number
        total: number
        completionRate: number
      }
      community: {
        posts: number
        replies: number
        likesGiven: number
        followers: number
        following: number
        engagement: number
      }
      trends: {
        participations: Array<{ month: string; count: number }>
        projects: Array<{ month: string; count: number }>
      }
    }
  }>> {
    return this.request('/dashboard/stats')
  }

  async getDashboardAchievements(params?: {
    category?: string
    rarity?: string
    completed?: boolean
  }): Promise<ApiResponse<{
    achievements: Array<{
      id: string
      type: string
      title: string
      description: string
      icon?: string
      badge?: string
      level: number
      rarity: string
      progress: number
      target: number
      isCompleted: boolean
      completedAt?: string
      category: string
      metadata?: any
    }>
    stats: {
      total: number
      completed: number
      inProgress: number
      byCategory: Record<string, { total: number; completed: number }>
      byRarity: Record<string, { total: number; completed: number }>
    }
  }>> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.rarity) searchParams.append('rarity', params.rarity)
    if (params?.completed !== undefined) searchParams.append('completed', params.completed.toString())
    
    return this.request(`/dashboard/achievements?${searchParams.toString()}`)
  }

  async getDashboardActivity(params?: {
    limit?: number
    offset?: number
    type?: string
  }): Promise<ApiResponse<{
    activities: Array<{
      id: string
      type: string
      title: string
      description: string
      date: string
      metadata?: any
    }>
    stats: {
      total: number
      byType: Record<string, number>
    }
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.type) searchParams.append('type', params.type)
    
    return this.request(`/dashboard/activity?${searchParams.toString()}`)
  }

  async getDashboardReputation(params?: {
    limit?: number
    offset?: number
    category?: string
    season?: string
  }): Promise<ApiResponse<{
    records: Array<{
      id: string
      action: string
      points: number
      multiplier: number
      description?: string
      category: string
      season?: string
      createdAt: string
    }>
    stats: {
      totalPoints: number
      level: number
      pointsToNextLevel: number
      nextLevelPoints: number
      progressPercentage: number
      byCategory: Array<{ category: string; points: number; count: number }>
      byAction: Array<{ action: string; points: number; count: number }>
      trend: {
        daily: Array<{ date: string; points: number }>
        cumulative: Array<{ date: string; points: number; cumulative: number }>
      }
    }
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.category) searchParams.append('category', params.category)
    if (params?.season) searchParams.append('season', params.season)
    
    return this.request(`/dashboard/reputation?${searchParams.toString()}`)
  }

  // ============ 声誉系统API ============
  async getReputationLeaderboard(params?: {
    timeRange?: string
    category?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    leaderboard: Array<{
      userId: string
      username: string
      avatarUrl?: string
      bio?: string
      skills: string[]
      totalPoints: number
      rank: number
      joinedAt: string
    }>
    meta: {
      timeRange: string
      category?: string
      totalUsers: number
      averageScore: number
      categoryStats: Array<{
        category: string
        totalPoints: number
        userCount: number
      }>
    }
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }>> {
    const searchParams = new URLSearchParams()
    if (params?.timeRange) searchParams.append('timeRange', params.timeRange)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    
    return this.request(`/reputation/leaderboard?${searchParams.toString()}`)
  }

  async getUserReputation(userId: string): Promise<ApiResponse<{
    user: {
      id: string
      username: string
      avatarUrl?: string
      reputationScore: number
      createdAt: string
    }
    totalPoints: number
    records: Array<{
      id: string
      action: string
      points: number
      multiplier: number
      description?: string
      category: string
      season?: string
      createdAt: string
    }>
    byCategory: Array<{
      category: string
      points: number
      count: number
    }>
    byAction: Array<{
      action: string
      points: number
      count: number
    }>
  }>> {
    return this.request(`/reputation/${userId}`)
  }

  async recalculateUserReputation(data: {
    userId?: string
    recalculateAll?: boolean
  }): Promise<ApiResponse<{
    message: string
  }>> {
    return this.request('/reputation/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 用户黑客松参与历史
  async getUserHackathons(): Promise<ApiResponse<{
    hackathons: Array<{
      id: string
      name: string
      description?: string
      status: string
      role: string
      relationshipType: 'participant' | 'organizer'
      joinedAt: string
      date: string
      prizePool?: number
      categories: string[]
      participationStatus: string
    }>
    total: number
  }>> {
    return this.request('/users/me/hackathons')
  }

  // 用户项目列表
  async getUserProjects(params?: { hackathonId?: string }): Promise<ApiResponse<{
    projects: Array<{
      id: string
      name: string
      title?: string
      description?: string
      hackathon: string
      hackathonId: string
      status: string
      score?: string
      rank?: string
      role: string
      teamName?: string
      teamMembers: number
      createdAt: string
      updatedAt: string
      ipfsHash?: string
      repositoryUrl?: string
      demoUrl?: string
      githubUrl?: string
      technologies?: string[]
      tags?: string[]
    }>
    total: number
    created: number
    participated: number
  }>> {
    const url = params?.hackathonId 
      ? `/projects?hackathonId=${params.hackathonId}` 
      : '/users/me/projects'
    return this.request(url)
  }

  // 用户团队列表
  async getUserTeams(): Promise<ApiResponse<{
    teams: Array<{
      id: string
      name: string
      description?: string
      hackathon: string
      hackathonId: string
      status: string
      role: string
      members: number
      membersList: Array<{
        id: string
        username: string
        avatarUrl?: string
        role: string
      }>
      projects: Array<{
        id: string
        title: string
        status: string
      }>
      createdAt: string
      maxMembers?: number
      skills: string[]
      isPublic: boolean
    }>
    total: number
    leading: number
    participating: number
  }>> {
    return this.request('/users/me/teams')
  }

  async updateUser(data: {
    username?: string
    bio?: string
    avatarUrl?: string
    walletAddress?: string
    skills?: string[]
    notificationSettings?: any
    privacySettings?: any
  }): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getUserPreferences(): Promise<ApiResponse<{ preferences: any }>> {
    return this.request('/users/preferences')
  }

  async updateUserPreferences(preferences: {
    theme?: string
    language?: string
    timezone?: string
    notificationSettings?: any
    privacySettings?: any
  }): Promise<ApiResponse<{ preferences: any }>> {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    })
  }

  // ============ 黑客松API ============
  async getHackathons(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
    featured?: boolean
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ hackathons: Hackathon[]; pagination: any }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/hackathons${queryString ? `?${queryString}` : ''}`)
  }

  async createHackathon(data: {
    title: string
    description: string
    startDate: string
    endDate: string
    registrationDeadline?: string
    maxParticipants?: number
    prizePool?: number
    categories: string[]
    tags?: string[]
    requirements?: string
    rules?: string
    isPublic?: boolean
    featured?: boolean
  }): Promise<ApiResponse<{ hackathon: Hackathon }>> {
    return this.request('/hackathons', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getHackathon(id: string): Promise<ApiResponse<{ hackathon: Hackathon }>> {
    return this.request(`/hackathons/${id}`)
  }

  async getHackathonProjects(hackathonId: string): Promise<ApiResponse<{ projects: any[] }>> {
    return this.request(`/hackathons/${hackathonId}/projects`)
  }

  async joinHackathon(hackathonId: string): Promise<ApiResponse<any>> {
    return this.request(`/hackathons/${hackathonId}/join`, {
      method: 'POST',
    })
  }

  async getUserHackathonParticipation(hackathonId: string): Promise<ApiResponse<{ isParticipating: boolean }>> {
    return this.request(`/hackathons/${hackathonId}/participation`)
  }

  // 获取推荐黑客松
  async getRecommendedHackathons(limit?: number): Promise<ApiResponse<{
    hackathons: Array<{
      id: string
      title: string
      description: string
      startDate: string
      endDate: string
      registrationDeadline?: string
      prizePool?: number
      categories: string[]
      tags: string[]
      participantCount: number
      maxParticipants?: number
      organizer: {
        username: string
        avatarUrl?: string
      }
      daysUntilStart: number
    }>
    total: number
  }>> {
    const queryString = limit ? `?limit=${limit}` : ''
    return this.request(`/hackathons/recommended${queryString}`)
  }

  // 获取特色黑客松（用于首页展示）
  async getFeaturedHackathons(limit: number = 3): Promise<ApiResponse<{
    hackathons: Array<{
      id: string
      title: string
      description: string
      startDate: string
      endDate: string
      prizePool?: number
      categories: string[]
      tags: string[]
      participantCount: number
      status: string
      organizer: {
        username: string
        avatarUrl?: string
      }
      daysLeft: number
      prize: string
      participants: string
    }>
    total: number
  }>> {
    return this.request(`/hackathons?featured=true&limit=${limit}&sortBy=startDate&sortOrder=asc`)
  }

  async registerForHackathon(id: string): Promise<ApiResponse<any>> {
    return this.request(`/hackathons/${id}/register`, {
      method: 'POST',
    })
  }

  async unregisterFromHackathon(id: string): Promise<ApiResponse<any>> {
    return this.request(`/hackathons/${id}/register`, {
      method: 'DELETE',
    })
  }

  // ============ 团队API ============
  async getTeams(params?: {
    page?: number
    limit?: number
    search?: string
    hackathonId?: string
    skill?: string
    hasOpenings?: boolean
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ teams: Team[]; pagination: any }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/teams${queryString ? `?${queryString}` : ''}`)
  }

  async getTeam(id: string): Promise<ApiResponse<{ team: Team }>> {
    return this.request(`/teams/${id}`)
  }

  async createTeam(data: {
    name: string
    description: string
    hackathonId: string
    maxMembers?: number
    skills: string[]
    tags?: string[]
    isPublic?: boolean
  }): Promise<ApiResponse<{ team: Team }>> {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTeam(id: string, data: {
    name?: string
    description?: string
    maxMembers?: number
    skills?: string[]
    tags?: string[]
    isPublic?: boolean
  }): Promise<ApiResponse<{ team: Team }>> {
    return this.request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTeam(id: string): Promise<ApiResponse<any>> {
    return this.request(`/teams/${id}`, {
      method: 'DELETE',
    })
  }

  async joinTeam(teamId: string, applicationData?: {
    message?: string
    skills?: string[]
  }): Promise<ApiResponse<any>> {
    return this.request(`/teams/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify(applicationData || {})
    })
  }

  async leaveTeam(teamId: string): Promise<ApiResponse<any>> {
    return this.request(`/teams/${teamId}/leave`, {
      method: 'DELETE',
    })
  }

  async inviteToTeam(teamId: string, data: {
    userId: string
    message?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/teams/${teamId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async acceptTeamInvitation(invitationId: string): Promise<ApiResponse<any>> {
    return this.request(`/teams/invitations/${invitationId}/accept`, {
      method: 'POST',
    })
  }

  async declineTeamInvitation(invitationId: string): Promise<ApiResponse<any>> {
    return this.request(`/teams/invitations/${invitationId}/decline`, {
      method: 'POST',
    })
  }

  // ============ 团队申请管理API ============
  async getTeamApplications(teamId: string, params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    page?: number
    limit?: number
  }): Promise<ApiResponse<{
    applications: Array<{
      id: string
      message: string
      skills: string[]
      status: string
      createdAt: string
      reviewedAt?: string
      user: {
        id: string
        username: string
        avatarUrl?: string
        bio?: string
        skills: string[]
        reputationScore: number
      }
      reviewer?: {
        id: string
        username: string
      }
    }>
    pagination: any
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/teams/${teamId}/applications${queryString ? `?${queryString}` : ''}`)
  }

  async reviewTeamApplication(teamId: string, applicationId: string, data: {
    action: 'approve' | 'reject'
    reason?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/teams/${teamId}/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async getTeamInvitations(): Promise<ApiResponse<{ invitations: any[] }>> {
    return this.request('/teams/invitations')
  }

  // ============ 项目API（在黑客松中使用）============
  async getProjects(params?: {
    page?: number
    limit?: number
    search?: string
    hackathonId?: string
    teamId?: string
    technology?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ projects: Project[]; pagination: any }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/projects${queryString ? `?${queryString}` : ''}`)
  }

  async getProject(id: string): Promise<ApiResponse<{ project: Project }>> {
    return this.request(`/projects/${id}`)
  }

  async createProject(data: {
    title: string
    description: string
    hackathonId: string
    teamId?: string
    technologies: string[]
    tags?: string[]
    githubUrl?: string
    demoUrl?: string
    videoUrl?: string
    presentationUrl?: string
    ipfsHash?: string
    isPublic?: boolean
  }): Promise<ApiResponse<{ project: Project }>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: {
    title?: string
    description?: string
    technologies?: string[]
    tags?: string[]
    githubUrl?: string
    demoUrl?: string
    videoUrl?: string
    presentationUrl?: string
    ipfsHash?: string
    isPublic?: boolean
  }): Promise<ApiResponse<{ project: Project }>> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string): Promise<ApiResponse<any>> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  async likeProject(projectId: string): Promise<ApiResponse<any>> {
    return this.request(`/projects/${projectId}/like`, {
      method: 'POST',
    })
  }

  async unlikeProject(projectId: string): Promise<ApiResponse<any>> {
    return this.request(`/projects/${projectId}/like`, {
      method: 'DELETE',
    })
  }

  async getProjectLikes(projectId: string): Promise<ApiResponse<{ likes: number; isLiked: boolean }>> {
    return this.request(`/projects/${projectId}/likes`)
  }

  // ============ 管理员API ============
  async getAdminStats(): Promise<ApiResponse<{
    totalUsers: number
    activeUsers: number
    totalPosts: number
    totalHackathons: number
    pendingReviews: number
    userGrowth: number
    postGrowth: number
    hackathonGrowth: number
  }>> {
    return this.request('/admin/stats')
  }

  async getAdminUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ 
    users: any[]; 
    pagination: any 
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`)
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async getAdminPosts(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ 
    posts: any[]; 
    pagination: any 
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/admin/posts${queryString ? `?${queryString}` : ''}`)
  }

  async updatePostStatus(postId: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/posts/${postId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async getAdminHackathons(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ 
    hackathons: any[]; 
    pagination: any 
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/admin/hackathons${queryString ? `?${queryString}` : ''}`)
  }

  async updateHackathonStatus(hackathonId: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/hackathons/${hackathonId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async getSystemStatus(): Promise<ApiResponse<{
    database: 'healthy' | 'warning' | 'error'
    storage: 'healthy' | 'warning' | 'error'
    api: 'healthy' | 'warning' | 'error'
    blockchain: 'healthy' | 'warning' | 'error'
  }>> {
    return this.request('/admin/system-status')
  }

  // ============ Web3 API ============
  async getDAOProposals(params?: {
    page?: number
    limit?: number
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ 
    proposals: any[]; 
    pagination: any;
    totalVotingPower: number;
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/web3/dao/proposals${queryString ? `?${queryString}` : ''}`)
  }

  async createDAOProposal(data: {
    title: string
    description: string
    votingPeriod: number
  }): Promise<ApiResponse<{ proposal: any }>> {
    return this.request('/web3/dao/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async voteOnProposal(proposalId: string, vote: 'for' | 'against'): Promise<ApiResponse<any>> {
    return this.request(`/web3/dao/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    })
  }

  async executeProposal(proposalId: string): Promise<ApiResponse<any>> {
    return this.request(`/web3/dao/proposals/${proposalId}/execute`, {
      method: 'POST',
    })
  }

  async getUserVotingPower(): Promise<ApiResponse<{ votingPower: number }>> {
    return this.request('/web3/dao/voting-power')
  }

  async getNFTs(params?: {
    page?: number
    limit?: number
    category?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<{ 
    nfts: any[]; 
    pagination: any;
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/web3/nfts${queryString ? `?${queryString}` : ''}`)
  }

  async mintNFT(data: {
    name: string
    description: string
    imageUrl: string
    category: string
    metadata?: any
  }): Promise<ApiResponse<{ nft: any }>> {
    return this.request('/web3/nfts/mint', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getStakingInfo(): Promise<ApiResponse<{
    totalStaked: number
    userStaked: number
    rewards: number
    apy: number
  }>> {
    return this.request('/web3/staking/info')
  }

  async stakeTokens(amount: number): Promise<ApiResponse<any>> {
    return this.request('/web3/staking/stake', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  async unstakeTokens(amount: number): Promise<ApiResponse<any>> {
    return this.request('/web3/staking/unstake', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  async claimRewards(): Promise<ApiResponse<any>> {
    return this.request('/web3/staking/claim', {
      method: 'POST',
    })
  }

  // ============ 通知API ============
  async getNotifications(params?: {
    page?: number
    limit?: number
    category?: string
    unreadOnly?: boolean
  }): Promise<ApiResponse<{ 
    notifications: Notification[]; 
    pagination: any;
    unreadCount: number;
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`)
  }

  async createNotification(data: {
    type: string
    title: string
    message: string
    data?: any
    userId: string
  }): Promise<ApiResponse<{ notification: Notification }>> {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.request('/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'markAsRead',
        notificationId
      }),
    })
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'markAllAsRead'
      }),
    })
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications?id=${notificationId}`, {
      method: 'DELETE',
    })
  }

  // ============ 社区API ============
  async getCommunityPosts(params?: {
    page?: number
    limit?: number
    category?: string
    sortBy?: string
    search?: string
  }): Promise<ApiResponse<{ 
    posts: CommunityPost[]; 
    pagination: any;
    stats: any;
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/community/posts${queryString ? `?${queryString}` : ''}`)
  }

  async getCommunityPost(id: string, incrementView: boolean = true): Promise<ApiResponse<CommunityPost & { replies: CommunityReply[] }>> {
    const queryString = incrementView ? '?incrementView=true' : ''
    console.log(`🔍 [API] getCommunityPost 调用: ${id}, incrementView: ${incrementView}`)
    console.trace('getCommunityPost 调用堆栈:')
    return this.request(`/community/posts/${id}${queryString}`)
  }

  async createCommunityPost(data: {
    title: string
    content: string
    category: 'general' | 'technical' | 'showcase' | 'help' | 'announcement'
    tags: string[]
    excerpt?: string
  }): Promise<ApiResponse<{ post: CommunityPost }>> {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCommunityPost(id: string, data: {
    title?: string
    content?: string
    category?: 'general' | 'technical' | 'showcase' | 'help' | 'announcement'
    tags?: string[]
    excerpt?: string
  }): Promise<ApiResponse<{ post: CommunityPost }>> {
    return this.request(`/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCommunityPost(id: string): Promise<ApiResponse<any>> {
    return this.request(`/community/posts/${id}`, {
      method: 'DELETE',
    })
  }

  // ============ 社区回复API ============
  async createCommunityReply(postId: string, data: {
    content: string
    parentId?: string
  }): Promise<ApiResponse<{ reply: CommunityReply }>> {
    return this.request(`/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCommunityReply(id: string, data: {
    content: string
  }): Promise<ApiResponse<{ reply: CommunityReply }>> {
    return this.request(`/community/replies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCommunityReply(id: string): Promise<ApiResponse<any>> {
    return this.request(`/community/replies/${id}`, {
      method: 'DELETE',
    })
  }

  // ============ 社区点赞API ============
  async likeCommunityPost(postId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request(`/community/posts/${postId}/like`, {
      method: 'POST',
    })
  }

  async getPostLikeStatus(postId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request(`/community/posts/${postId}/like`)
  }

  async likeCommunityReply(replyId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request(`/community/replies/${replyId}/like`, {
      method: 'POST',
    })
  }

  async getReplyLikeStatus(replyId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request(`/community/replies/${replyId}/like`)
  }

  // ============ 社区收藏API ============
  async bookmarkCommunityPost(postId: string): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    return this.request(`/community/posts/${postId}/bookmark`, {
      method: 'POST',
    })
  }

  async getPostBookmarkStatus(postId: string): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    return this.request(`/community/posts/${postId}/bookmark`)
  }

  async getUserBookmarks(params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ 
    bookmarks: Array<{
      id: string
      bookmarkedAt: string
      post: CommunityPost
    }>
    pagination: any
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/users/me/bookmarks${queryString ? `?${queryString}` : ''}`)
  }

  // ============ 社区关注API ============
  async followUser(userId: string): Promise<ApiResponse<{ isFollowing: boolean; followersCount: number }>> {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST',
    })
  }

  async getUserFollowStatus(userId: string): Promise<ApiResponse<{ 
    isFollowing: boolean
    followersCount: number
    followingCount: number
  }>> {
    return this.request(`/users/${userId}/follow`)
  }

  async getUserFollowing(params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ 
    following: Array<{
      id: string
      followedAt: string
      user: any
    }>
    pagination: any
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/users/me/following${queryString ? `?${queryString}` : ''}`)
  }

  async getUserFollowers(params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ 
    followers: Array<{
      id: string
      followedAt: string
      user: any
    }>
    pagination: any
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/users/me/followers${queryString ? `?${queryString}` : ''}`)
  }

  async getUserPublicStats(userId: string): Promise<ApiResponse<{
    postsCount: number
    repliesCount: number
    joinedAt: string
  }>> {
    return this.request(`/users/${userId}/stats`)
  }

  // ============ 社区搜索API ============
  async searchCommunity(params: {
    q: string
    type?: 'all' | 'posts' | 'users' | 'tags'
    page?: number
    limit?: number
  }): Promise<ApiResponse<{
    query: string
    type: string
    results: {
      posts?: {
        items: CommunityPost[]
        total: number
        pagination?: any
      }
      users?: {
        items: any[]
        total: number
        pagination?: any
      }
      tags?: {
        items: Array<{
          name: string
          count: number
          postsCount: number
        }>
        total: number
      }
    }
  }>> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString()
    
    return this.request(`/community/search?${queryString}`)
  }

  // ============ 社区通知API ============
  async getCommunityNotifications(params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }): Promise<ApiResponse<{
    notifications: Array<{
      id: string
      type: string
      title: string
      content: string
      entityType?: string
      entityId?: string
      isRead: boolean
      createdAt: string
      readAt?: string
      triggerUser?: {
        id: string
        name: string
        username: string
        avatar?: string
      }
    }>
    pagination: any
  }>> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    return this.request(`/community/notifications${queryString ? `?${queryString}` : ''}`)
  }

  async notificationActions(data: {
    action: 'markRead' | 'markAllRead' | 'delete'
    notificationIds?: string[]
  }): Promise<ApiResponse<any>> {
    return this.request('/community/notifications/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.request('/community/notifications/unread-count')
  }

  // ============ 社区推荐API ============
  async getCommunityRecommendations(params: {
    type: 'hot' | 'personalized' | 'tags'
    limit?: number
  }): Promise<ApiResponse<{
    type: string
    items: any[]
    count: number
  }>> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString()
    
    return this.request(`/community/recommendations?${queryString}`)
  }

  async getRelatedPosts(postId: string, limit?: number): Promise<ApiResponse<{
    relatedPosts: any[]
    count: number
  }>> {
    const queryString = limit ? `?limit=${limit}` : ''
    return this.request(`/community/posts/${postId}/related${queryString}`)
  }

  // ============ IPFS API ============
  // 注意：这些方法现在通过后端API调用，不再直接调用Pinata
  async uploadFile(file: File): Promise<ApiResponse<{ hash: string; url: string; name: string; size: number }>> {
    const formData = new FormData()
    formData.append('file', file)

    // 构建完整URL
    const url = `${this.baseURL}/ipfs/upload`
    
    const headers: Record<string, string> = {}
    
    // 添加认证header
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    // 注意：不要设置Content-Type，让浏览器自动设置multipart/form-data
    console.log('📤 上传文件到:', url, '认证token:', !!this.token)
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 文件上传HTTP错误:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ 文件上传响应:', data)
      
      return data
    } catch (error) {
      console.error('❌ 文件上传fetch错误:', error)
      throw error
    }
  }

  async uploadJSON(data: any, metadata?: any): Promise<ApiResponse<{ hash: string; url: string }>> {
    return this.request('/ipfs/upload', {
      method: 'PUT', // JSON数据使用PUT方法
      body: JSON.stringify({ data, metadata }),
    })
  }

  // ============ 统计数据API ============
  async getStats(locale: string = 'zh'): Promise<ApiResponse<{
    users: { total: number; label: string; description: string }
    hackathons: { total: number; label: string; description: string }
    projects: { total: number; label: string; description: string }
    countries: { total: number; label: string; description: string }
    participations?: number
    teams?: number
  }>> {
    return this.request(`/stats/public?locale=${locale}`)
  }

  // ============ 搜索建议API ============
  async getSearchSuggestions(): Promise<ApiResponse<{
    popularSearches: string[]
    relatedSuggestions?: string[]
    query?: string
  }>> {
    return this.request('/search/suggestions')
  }

  // ⭐ ============ Web3 认证 API ============
  
  /**
   * 通过钱包地址登录
   */
  async signInWithWallet(walletAddress: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/wallet-signin', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    })
  }

  /**
   * 创建Web3用户
   */
  async createWeb3User(data: {
    walletAddress: string
    profileCID?: string
    username?: string
    bio?: string
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/wallet-signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ==================== 凭证管理 ====================

  /**
   * 获取用户凭证列表
   */
  async getUserCredentials(params?: {
    page?: number
    limit?: number
    category?: string
    status?: string
    sort?: string
    order?: string
  }): Promise<ApiResponse<{
    credentials: any[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    stats: {
      total: number
      verified: number
      public: number
      revoked: number
      totalViews: number
    }
  }>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.order) searchParams.set('order', params.order)

    const url = searchParams.toString() 
      ? `/dashboard/credentials?${searchParams.toString()}`
      : '/dashboard/credentials'

    return this.request(url)
  }

  /**
   * 生成新凭证
   */
  async generateCredential(data: {
    templateId?: string
    title: string
    description?: string
    credentialType: string
    category: string
    tags: string[]
    skillsProven: string[]
    expirationDays?: number
    isPublic: boolean
    credentialSubject: any
    evidence?: any[]
  }): Promise<ApiResponse<{
    credential: any
    ipfsHash: string
  }>> {
    return this.request('/credentials/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 验证凭证
   */
  async verifyCredential(hash: string): Promise<ApiResponse<{
    credential: any
    isValid: boolean
    verificationRecord: any
  }>> {
    return this.request(`/credentials/${hash}/verify`)
  }

  /**
   * 获取凭证模板
   */
  async getCredentialTemplates(): Promise<ApiResponse<{
    templates: any[]
  }>> {
    return this.request('/credentials/templates')
  }

  /**
   * 直接上传凭证数据到IPFS
   */
  async uploadCredentialToIPFS(data: any): Promise<ApiResponse<{
    hash: string
    url: string
  }>> {
    return this.request('/credentials/ipfs/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// 创建单例实例
export const apiService = new ApiService()

// 导出类型
export type { User, Hackathon, Project, Team, Notification, CommunityUser, CommunityPost, CommunityReply, ApiResponse } 
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

    // 添加认证header
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // 禁用缓存，确保每次刷新都会重新请求
        cache: 'no-store',
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

  // ============ 用户管理API ============
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
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

  async updateUser(data: {
    username?: string
    bio?: string
    avatarUrl?: string
    walletAddress?: string
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

  async joinTeam(teamId: string): Promise<ApiResponse<any>> {
    return this.request(`/teams/${teamId}/join`, {
      method: 'POST',
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

  async getTeamInvitations(): Promise<ApiResponse<{ invitations: any[] }>> {
    return this.request('/teams/invitations')
  }

  // ============ 项目API ============
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
    totalProjects: number
    pendingReviews: number
    userGrowth: number
    postGrowth: number
    hackathonGrowth: number
    projectGrowth: number
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

  async getCommunityPost(id: string): Promise<ApiResponse<{ 
    post: CommunityPost & { replies: CommunityReply[] }
  }>> {
    return this.request(`/community/posts/${id}`)
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

  // ============ IPFS API ============
  // 注意：这些方法现在通过后端API调用，不再直接调用Pinata
  async uploadFile(file: File): Promise<ApiResponse<{ file: any }>> {
    const formData = new FormData()
    formData.append('file', file)

    const headers: Record<string, string> = {}
    
    // 添加认证header
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return this.request('/ipfs/upload', {
      method: 'POST',
      headers,
      body: formData,
    })
  }

  async uploadJSON(data: any, metadata?: any): Promise<ApiResponse<{ hash: string; url: string }>> {
    return this.request('/ipfs/upload', {
      method: 'PUT', // JSON数据使用PUT方法
      body: JSON.stringify({ data, metadata }),
    })
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
}

// 创建单例实例
export const apiService = new ApiService()

// 导出类型
export type { User, Hackathon, Project, Team, Notification, CommunityUser, CommunityPost, CommunityReply, ApiResponse } 
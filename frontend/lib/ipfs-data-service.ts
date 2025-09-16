'use client'

import { ipfsService } from './ipfs'

// 数据类型定义
export interface UserProfile {
  id: string
  email: string
  username: string
  walletAddress?: string
  avatarUrl?: string
  bio?: string
  skills: string[]
  socialLinks: Record<string, string>
  reputationScore: number
  notificationSettings: Record<string, boolean>
  privacySettings: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface HackathonData {
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
  organizer: {
    id: string
    username: string
    walletAddress: string
  }
  // ⭐ 添加metadata字段
  metadata?: {
    coverImage?: string
    prizes?: Array<{
      rank: number
      name?: string
      amount: number
      description: string
      winnerCount?: number
    }>
    sponsors?: Array<{
      name: string
      logoUrl?: string
      websiteUrl?: string
      tier?: string
    }>
    judges?: Array<{
      name: string
      title: string
      bio: string
      avatarUrl?: string
    }>
    timeline?: Array<{
      date: string
      title: string
      description: string
      completed?: boolean
    }>
    tracks?: Array<{
      name: string
      description: string
      requirements?: string
    }>
  }
  prizes?: Array<{
    rank: number
    amount: number
    description: string
  }>
  tracks?: Array<{
    name: string
    description: string
    prizes: number[]
  }>
  sponsors?: Array<{
    name: string
    logo: string
    tier: string
  }>
  createdAt: string
  updatedAt: string
}

export interface ProjectData {
  id: string
  title: string
  description: string
  hackathonId: string
  teamId?: string
  creator: {
    id: string
    username: string
    walletAddress: string
  }
  technologies: string[]
  tags: string[]
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  team?: {
    id: string
    name: string
    members: Array<{
      id: string
      username: string
      role: string
    }>
  }
  createdAt: string
  updatedAt: string
}

export interface ScoreData {
  id: string
  projectId: string
  judge: {
    id: string
    username: string
    walletAddress: string
  }
  innovation: number
  technicalComplexity: number
  userExperience: number
  businessPotential: number
  presentation: number
  totalScore: number
  comments?: string
  isPublic: boolean
  createdAt: string
}

export interface FeedbackData {
  id: string
  projectId: string
  user: {
    id: string
    username: string
    walletAddress: string
  }
  rating: number
  comment?: string
  type: string
  createdAt: string
}

export interface LikeData {
  id: string
  projectId: string
  user: {
    id: string
    username: string
    walletAddress: string
  }
  createdAt: string
}

/**
 * IPFS数据服务
 * 提供完整的业务数据解析和错误处理
 */
export class IPFSDataService {
  // 前端现在通过后端API获取IPFS数据
  private async getFromBackend(cid: string): Promise<any> {
    const response = await fetch(`/api/ipfs/get?hash=${cid}&type=json`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '未知错误' }))
      throw new Error(`后端IPFS API错误: ${response.status} - ${errorData.error || errorData.details}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || result.details || 'IPFS数据获取失败')
    }
    
    return result.data
  }

  /**
   * 从IPFS获取JSON数据（带多网关回退）
   */
  private async getJSONWithFallback(hash: string): Promise<any> {
    try {
      console.log(`📡 通过后端API获取IPFS数据: ${hash}`)
      const data = await this.getFromBackend(hash)
      console.log(`✅ 数据获取成功`)
      return data
    } catch (error) {
      console.error(`❌ IPFS数据获取失败:`, error)
      throw error
    }
  }

  /**
   * 验证IPFS哈希格式
   */
  private validateCID(cid: string): boolean {
    if (!cid || typeof cid !== 'string') return false
    
    // 检查CID格式 (Qm... 或 bafy...)
    const cidPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{55})$/
    return cidPattern.test(cid)
  }

  /**
   * 解析用户资料数据
   */
  async getUserProfile(cid: string): Promise<UserProfile> {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    try {
      const rawData = await this.getJSONWithFallback(cid)
      
      // 验证数据结构
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('IPFS数据格式无效')
      }

      // 解析用户资料
      const profile: UserProfile = {
        id: rawData.id || rawData.userId || '',
        email: rawData.email || '',
        username: rawData.username || '',
        walletAddress: rawData.walletAddress,
        avatarUrl: rawData.avatarUrl || rawData.avatar,
        bio: rawData.bio || rawData.description,
        skills: Array.isArray(rawData.skills) ? rawData.skills : [],
        socialLinks: rawData.socialLinks || {},
        reputationScore: Number(rawData.reputationScore) || 0,
        notificationSettings: rawData.notificationSettings || {},
        privacySettings: rawData.privacySettings || {},
        createdAt: rawData.createdAt || new Date().toISOString(),
        updatedAt: rawData.updatedAt || new Date().toISOString()
      }

      return profile
       } catch (error) {
      console.error('解析用户资料失败:', error)
      throw new Error(`解析用户资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析黑客松数据
   */
  async getHackathonData(cid: string): Promise<HackathonData> {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    try {
      const rawData = await this.getJSONWithFallback(cid)
      
      // 验证数据结构
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('IPFS数据格式无效')
      }

      // 解析黑客松数据
      const hackathon: HackathonData = {
        id: rawData.id || '',
        title: rawData.title || '',
        description: rawData.description || '',
        startDate: rawData.startDate || rawData.start_date,
        endDate: rawData.endDate || rawData.end_date,
        registrationDeadline: rawData.registrationDeadline || rawData.registration_deadline,
        maxParticipants: Number(rawData.maxParticipants) || Number(rawData.max_participants),
        prizePool: Number(rawData.prizePool) || Number(rawData.prize_pool),
        categories: Array.isArray(rawData.categories) ? rawData.categories : [],
        tags: Array.isArray(rawData.tags) ? rawData.tags : [],
        requirements: rawData.requirements,
        rules: rawData.rules,
        organizer: {
          id: rawData.organizer?.id || '',
          username: rawData.organizer?.username || '',
          walletAddress: rawData.organizer?.walletAddress || rawData.organizer?.address || ''
        },
        prizes: Array.isArray(rawData.prizes) ? rawData.prizes.map((prize: any) => ({
          rank: Number(prize.rank) || 0,
          amount: Number(prize.amount) || 0,
          description: prize.description || ''
        })) : [],
        tracks: Array.isArray(rawData.tracks) ? rawData.tracks.map((track: any) => ({
          name: track.name || '',
          description: track.description || '',
          prizes: Array.isArray(track.prizes) ? track.prizes.map(Number) : []
        })) : [],
        sponsors: Array.isArray(rawData.sponsors) ? rawData.sponsors.map((sponsor: any) => ({
          name: sponsor.name || '',
          logo: sponsor.logo || '',
          tier: sponsor.tier || ''
        })) : [],
        createdAt: rawData.createdAt || new Date().toISOString(),
        updatedAt: rawData.updatedAt || new Date().toISOString()
      }

      return hackathon
    } catch (error) {
      console.error('解析黑客松数据失败:', error)
      throw new Error(`解析黑客松数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析项目数据
   */
  async getProjectData(cid: string): Promise<ProjectData> {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    try {
      const rawData = await this.getJSONWithFallback(cid)
      
      // 验证数据结构
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('IPFS数据格式无效')
      }

      // 解析项目数据
      const project: ProjectData = {
        id: rawData.id || '',
        title: rawData.title || '',
        description: rawData.description || '',
        hackathonId: rawData.hackathonId || rawData.hackathon_id || '',
        teamId: rawData.teamId || rawData.team_id,
        creator: {
          id: rawData.creator?.id || '',
          username: rawData.creator?.username || '',
          walletAddress: rawData.creator?.walletAddress || rawData.creator?.address || ''
        },
        technologies: Array.isArray(rawData.technologies) ? rawData.technologies : Array.isArray(rawData.techStack) ? rawData.techStack : [],
        tags: Array.isArray(rawData.tags) ? rawData.tags : [],
        githubUrl: rawData.githubUrl || rawData.github_url,
        demoUrl: rawData.demoUrl || rawData.demo_url,
        videoUrl: rawData.videoUrl || rawData.video_url,
        presentationUrl: rawData.presentationUrl || rawData.presentation_url,
        team: rawData.team ? {
          id: rawData.team.id || '',
          name: rawData.team.name || '',
          members: Array.isArray(rawData.team.members) ? rawData.team.members.map((member: any) => ({
            id: member.id || '',
            username: member.username || '',
            role: member.role || ''
          })) : []
        } : undefined,
        createdAt: rawData.createdAt || new Date().toISOString(),
        updatedAt: rawData.updatedAt || new Date().toISOString()
      }

      return project
    } catch (error) {
      console.error('解析项目数据失败:', error)
      throw new Error(`解析项目数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析评分数据
   */
  async getScoreData(cid: string): Promise<ScoreData> {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    try {
      const rawData = await this.getJSONWithFallback(cid)
      
      // 验证数据结构
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('IPFS数据格式无效')
      }

      // 解析评分数据
      const score: ScoreData = {
        id: rawData.id || '',
        projectId: rawData.projectId || rawData.project_id || '',
        judge: {
          id: rawData.judge?.id || '',
          username: rawData.judge?.username || '',
          walletAddress: rawData.judge?.walletAddress || rawData.judge?.address || ''
        },
        innovation: Number(rawData.innovation) || 0,
        technicalComplexity: Number(rawData.technicalComplexity) || Number(rawData.technical_complexity) || 0,
        userExperience: Number(rawData.userExperience) || Number(rawData.user_experience) || 0,
        businessPotential: Number(rawData.businessPotential) || Number(rawData.business_potential) || 0,
        presentation: Number(rawData.presentation) || 0,
        totalScore: Number(rawData.totalScore) || Number(rawData.total_score) || 0,
        comments: rawData.comments,
        isPublic: Boolean(rawData.isPublic) || Boolean(rawData.is_public) || true,
        createdAt: rawData.createdAt || new Date().toISOString()
      }

      return score
        } catch (error) {
      console.error('解析评分数据失败:', error)
      throw new Error(`解析评分数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析反馈数据
   */
  async getFeedbackData(cid: string): Promise<FeedbackData> {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    try {
      const rawData = await this.getJSONWithFallback(cid)
      
      // 验证数据结构
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('IPFS数据格式无效')
      }

      // 解析反馈数据
      const feedback: FeedbackData = {
        id: rawData.id || '',
        projectId: rawData.projectId || rawData.project_id || '',
        user: {
          id: rawData.user?.id || '',
          username: rawData.user?.username || '',
          walletAddress: rawData.user?.walletAddress || rawData.user?.address || ''
        },
        rating: Number(rawData.rating) || 0,
        comment: rawData.comment,
        type: rawData.type || 'general',
        createdAt: rawData.createdAt || new Date().toISOString()
      }

      return feedback
    } catch (error) {
      console.error('解析反馈数据失败:', error)
      throw new Error(`解析反馈数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析点赞数据
   */
  async getLikeData(cid: string): Promise<LikeData> {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    try {
      const rawData = await this.getJSONWithFallback(cid)
      
      // 验证数据结构
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('IPFS数据格式无效')
      }

      // 解析点赞数据
      const like: LikeData = {
        id: rawData.id || '',
        projectId: rawData.projectId || rawData.project_id || '',
        user: {
          id: rawData.user?.id || '',
          username: rawData.user?.username || '',
          walletAddress: rawData.user?.walletAddress || rawData.user?.address || ''
        },
        createdAt: rawData.createdAt || new Date().toISOString()
      }

      return like
    } catch (error) {
      console.error('解析点赞数据失败:', error)
      throw new Error(`解析点赞数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量获取IPFS数据
   */
  async batchGetData<T>(
    cids: string[],
    parser: (cid: string) => Promise<T>
  ): Promise<Array<T | null>> {
    const results = await Promise.allSettled(
      cids.map(async (cid) => {
        try {
          return await parser(cid)
        } catch (error) {
          console.warn(`批量获取数据失败 (CID: ${cid}):`, error)
          return null
        }
      })
    )

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    )
  }

  /**
   * 获取IPFS文件URL
   */
  getFileUrl(cid: string, gatewayIndex: number = 0): string {
    if (!this.validateCID(cid)) {
      throw new Error(`无效的IPFS CID: ${cid}`)
    }

    // 使用默认网关
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'plum-deliberate-peacock-875.mypinata.cloud'
    return `https://${gateway}/ipfs/${cid}`
  }

  /**
   * 验证IPFS数据完整性
   */
  async validateDataIntegrity(cid: string, expectedType: string): Promise<boolean> {
    try {
      const data = await this.getJSONWithFallback(cid)
      
      // 检查数据类型
      if (data.type !== expectedType) {
        console.warn(`数据类型不匹配: 期望 ${expectedType}, 实际 ${data.type}`)
        return false
      }

      // 检查必要字段
      const requiredFields = this.getRequiredFields(expectedType)
      for (const field of requiredFields) {
        if (!(field in data)) {
          console.warn(`缺少必要字段: ${field}`)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('数据完整性验证失败:', error)
      return false
    }
  }

  /**
   * 获取数据类型对应的必要字段
   */
  private getRequiredFields(type: string): string[] {
    const fieldMap: Record<string, string[]> = {
      'user-profile': ['id', 'email', 'username'],
      'hackathon': ['id', 'title', 'description', 'startDate', 'endDate'],
      'project': ['id', 'title', 'description', 'hackathonId'],
      'score': ['id', 'projectId', 'judge', 'totalScore'],
      'feedback': ['id', 'projectId', 'user', 'rating'],
      'like': ['id', 'projectId', 'user']
    }

    return fieldMap[type] || []
  }

  /**
   * 获取IPFS网关状态
   */
  async checkGatewayStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'plum-deliberate-peacock-875.mypinata.cloud'
    const gatewayUrl = `https://${gateway}`

    try {
      const response = await fetch(`${gatewayUrl}/ipfs/QmTest123`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5秒超时
      })
      status[gatewayUrl] = true
    } catch (error) {
      status[gatewayUrl] = false
    }

    return status
  }
}

// 创建单例实例
export const ipfsDataService = new IPFSDataService()

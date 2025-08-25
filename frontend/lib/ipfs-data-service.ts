'use client'

import { ipfsService } from './ipfs'
import { smartContractService } from './smart-contracts'

// 数据类型定义
export interface HackathonData {
  // 链上数据
  id: number
  organizer: string
  createdAt: Date
  active: boolean
  
  // IPFS数据
  title: string
  description: string
  startDate: Date
  endDate: Date
  prizePool: number
  categories: string[]
  requirements?: string
  rules?: string
  tracks?: Array<{
    name: string
    prize: string
    description?: string
  }>
  
  // 计算字段
  status: 'upcoming' | 'active' | 'ended'
  isValid: boolean
  formattedPrize: string
  duration: string
  timeRemaining: string
  participantCount?: number
}

export interface ProjectData {
  // 链上数据
  id: number
  hackathonId: number
  creator: string
  submissionTime: Date
  
  // IPFS数据
  title: string
  description: string
  techStack: string[]
  demoUrl?: string
  githubUrl?: string
  videoUrl?: string
  team?: string
  
  // 计算字段
  isValid: boolean
  hackathonTitle?: string
  averageScore?: number
  scoreCount?: number
}

export interface UserProfile {
  // 链上数据
  address: string
  registrationTime?: Date
  
  // IPFS数据
  username?: string
  bio?: string
  avatar?: string
  skills?: string[]
  socialLinks?: Array<{
    platform: string
    url: string
  }>
  
  // 计算字段
  isValid: boolean
  displayName: string
  hackathonCount?: number
  projectCount?: number
}

// IPFS数据解析服务
export class IPFSDataService {
  
  // ============ 黑客松数据 ============
  
  /**
   * 获取完整的黑客松数据
   */
  async getHackathonData(hackathonId: number): Promise<HackathonData> {
    try {
      // 第1步：从智能合约获取基础信息
      const contractData = await smartContractService.getHackathon(hackathonId)
      
      if (!contractData || !contractData.dataCID) {
        throw new Error(`Hackathon ${hackathonId} not found or missing data CID`)
      }
      
             // 第2步：从IPFS获取详细数据
       let ipfsData: any = {}
       try {
         ipfsData = await ipfsService.getJSON(contractData.dataCID)
       } catch (error) {
         console.warn(`Failed to load IPFS data for hackathon ${hackathonId}:`, error)
         // 使用默认值继续
       }
      
      // 第3步：数据解析和验证
      const hackathonData: HackathonData = {
        // 链上数据
        id: Number(contractData.id),
        organizer: contractData.organizer,
        createdAt: new Date(Number(contractData.creationTime) * 1000),
        active: contractData.active,
        
        // IPFS数据（带默认值）
        title: ipfsData.title || `黑客松 #${hackathonId}`,
        description: ipfsData.description || '暂无描述',
        startDate: ipfsData.startDate ? new Date(ipfsData.startDate) : new Date(),
        endDate: ipfsData.endDate ? new Date(ipfsData.endDate) : new Date(),
        prizePool: parseFloat(ipfsData.prizePool) || 0,
        categories: Array.isArray(ipfsData.categories) ? ipfsData.categories : [],
        requirements: ipfsData.requirements || '',
        rules: ipfsData.rules || '',
        tracks: Array.isArray(ipfsData.tracks) ? ipfsData.tracks : [],
        
        // 计算字段
        status: this.calculateHackathonStatus(ipfsData.startDate, ipfsData.endDate),
        isValid: this.validateHackathonData(ipfsData),
        formattedPrize: this.formatPrize(ipfsData.prizePool),
        duration: this.calculateDuration(ipfsData.startDate, ipfsData.endDate),
        timeRemaining: this.calculateTimeRemaining(ipfsData.endDate),
      }
      
      return hackathonData
    } catch (error) {
      console.error(`Error loading hackathon data for ID ${hackathonId}:`, error)
      throw error
    }
  }

  /**
   * 获取多个黑客松数据
   */
  async getHackathonsData(hackathonIds: number[]): Promise<HackathonData[]> {
    const results = await Promise.allSettled(
      hackathonIds.map(id => this.getHackathonData(id))
    )
    
    return results
      .filter((result): result is PromiseFulfilledResult<HackathonData> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }

  // ============ 项目数据 ============
  
  /**
   * 获取完整的项目数据
   */
  async getProjectData(projectId: number): Promise<ProjectData> {
    try {
      // 第1步：从智能合约获取基础信息
      const contractData = await smartContractService.getProject(projectId)
      
      if (!contractData || !contractData.projectDataCID) {
        throw new Error(`Project ${projectId} not found or missing data CID`)
      }
      
             // 第2步：从IPFS获取详细数据
       let ipfsData: any = {}
       try {
         ipfsData = await ipfsService.getJSON(contractData.projectDataCID)
       } catch (error) {
         console.warn(`Failed to load IPFS data for project ${projectId}:`, error)
       }
      
      // 第3步：获取黑客松标题
      let hackathonTitle = ''
      try {
        const hackathonData = await this.getHackathonData(Number(contractData.hackathonId))
        hackathonTitle = hackathonData.title
      } catch (error) {
        console.warn(`Failed to load hackathon data for project ${projectId}`)
      }
      
      // 第4步：数据解析
      const projectData: ProjectData = {
        // 链上数据
        id: Number(contractData.id),
        hackathonId: Number(contractData.hackathonId),
        creator: contractData.creator,
        submissionTime: new Date(Number(contractData.submissionTime) * 1000),
        
        // IPFS数据
        title: ipfsData.title || `项目 #${projectId}`,
        description: ipfsData.description || '暂无描述',
        techStack: Array.isArray(ipfsData.techStack) ? ipfsData.techStack : [],
        demoUrl: ipfsData.demoUrl || '',
        githubUrl: ipfsData.githubUrl || '',
        videoUrl: ipfsData.videoUrl || '',
        team: ipfsData.team || '',
        
        // 计算字段
        isValid: this.validateProjectData(ipfsData),
        hackathonTitle,
      }
      
      return projectData
    } catch (error) {
      console.error(`Error loading project data for ID ${projectId}:`, error)
      throw error
    }
  }

  /**
   * 获取多个项目数据
   */
  async getProjectsData(projectIds: number[]): Promise<ProjectData[]> {
    const results = await Promise.allSettled(
      projectIds.map(id => this.getProjectData(id))
    )
    
    return results
      .filter((result): result is PromiseFulfilledResult<ProjectData> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }

  // ============ 用户数据 ============
  
  /**
   * 获取完整的用户资料
   */
  async getUserProfile(address: string): Promise<UserProfile> {
    try {
      // 第1步：从智能合约获取基础信息
      const contractData = await smartContractService.getUser(address)
      
      // 第2步：从IPFS获取详细数据
      let ipfsData: any = {}
      if (contractData && contractData.profileCID) {
        try {
          ipfsData = await ipfsService.getJSON(contractData.profileCID)
        } catch (error) {
          console.warn(`Failed to load IPFS data for user ${address}:`, error)
        }
      }
      
      // 第3步：数据解析
      const userProfile: UserProfile = {
        // 链上数据
        address: address.toLowerCase(),
        registrationTime: contractData ? new Date(Number(contractData.registrationTime) * 1000) : undefined,
        
        // IPFS数据
        username: ipfsData.username || '',
        bio: ipfsData.bio || '',
        avatar: ipfsData.avatar || '',
        skills: Array.isArray(ipfsData.skills) ? ipfsData.skills : [],
        socialLinks: Array.isArray(ipfsData.socialLinks) ? ipfsData.socialLinks : [],
        
        // 计算字段
        isValid: this.validateUserData(ipfsData),
        displayName: ipfsData.username || `${address.slice(0, 6)}...${address.slice(-4)}`,
      }
      
      return userProfile
    } catch (error) {
      console.error(`Error loading user profile for ${address}:`, error)
      // 返回基础用户信息
      return {
        address: address.toLowerCase(),
        isValid: false,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      }
    }
  }

  // ============ 私有辅助方法 ============
  
  private calculateHackathonStatus(startDate: string, endDate: string): 'upcoming' | 'active' | 'ended' {
    if (!startDate || !endDate) return 'upcoming'
    
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) return 'upcoming'
    if (now > end) return 'ended'
    return 'active'
  }
  
  private validateHackathonData(data: any): boolean {
    return !!(data && data.title && data.startDate && data.endDate)
  }
  
  private validateProjectData(data: any): boolean {
    return !!(data && data.title && data.description)
  }
  
  private validateUserData(data: any): boolean {
    return !!(data && (data.username || data.bio))
  }
  
  private formatPrize(prizePool: any): string {
    const amount = parseFloat(prizePool) || 0
    if (amount === 0) return '待定'
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount.toLocaleString()}`
  }
  
  private calculateDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return '待定'
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1天'
    if (diffDays < 7) return `${diffDays}天`
    const weeks = Math.floor(diffDays / 7)
    const remainingDays = diffDays % 7
    if (remainingDays === 0) return `${weeks}周`
    return `${weeks}周${remainingDays}天`
  }
  
  private calculateTimeRemaining(endDate: string): string {
    if (!endDate) return '待定'
    
    const now = new Date()
    const end = new Date(endDate)
    const diffMs = end.getTime() - now.getTime()
    
    if (diffMs <= 0) return '已结束'
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) return `还有${diffDays}天`
    if (diffHours > 0) return `还有${diffHours}小时`
    return '即将结束'
  }
}

// 导出服务实例
export const ipfsDataService = new IPFSDataService()

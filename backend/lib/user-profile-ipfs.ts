/**
 * 统一的用户资料IPFS存储服务
 * 确保所有登录方式（邮箱、GitHub、钱包）都使用相同的IPFS存储格式
 */

export interface UserProfileData {
  // 基础信息
  email?: string
  username: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  walletAddress?: string
  
  // 认证信息
  authMethod: 'email' | 'github' | 'wallet'
  
  // 技能和经验
  skills: string[]
  experience: {
    title: string
    company: string
    duration: string
    description?: string
  }[]
  
  // 项目历史
  projects: {
    name: string
    description: string
    techStack: string[]
    repoUrl?: string
    demoUrl?: string
    hackathonId?: string
  }[]
  
  // 社交链接
  socialLinks: {
    github?: string
    githubUrl?: string
    twitter?: string
    linkedin?: string
    website?: string
    discord?: string
  }
  
  // 已验证凭证（符合xuqiu.md要求）
  certifications: {
    id: string
    title: string
    issuer: string
    issueDate: string
    verificationUrl?: string
    ipfsHash?: string // 凭证本身也可以存储在IPFS
  }[]
  
  // 声誉系统（符合xuqiu.md要求）
  reputation: {
    hackathonsParticipated: number
    hackathonsWon: number
    projectsCompleted: number
    totalEarnings?: number
    skillEndorsements: {
      skill: string
      endorsers: string[]
      count: number
    }[]
    badges: {
      id: string
      name: string
      description: string
      earnedAt: string
      ipfsHash?: string
    }[]
  }
  
  // GitHub特定数据
  githubData?: {
    id: number
    login: string
    publicRepos: number
    followers: number
    following: number
    createdAt: string
  }
  
  // Web3特定数据
  web3Data?: {
    ensName?: string
    nfts?: string[]
    tokenHoldings?: any[]
    daoMemberships?: string[]
  }
  
  // 时间戳
  createdAt: string
  updatedAt: string
}

export interface UserProfileMetadata {
  version: string
  type: 'user-profile'
  timestamp: string
  profile: UserProfileData
  metadata: {
    platform: string
    authMethod: string
    network?: string
    ipfsVersion?: string
  }
}

/**
 * 用户资料IPFS服务
 */
export class UserProfileIPFSService {
  
  /**
   * 创建标准的用户资料IPFS元数据
   */
  static createProfileMetadata(
    profileData: Partial<UserProfileData>,
    authMethod: 'email' | 'github' | 'wallet'
  ): UserProfileMetadata {
    const now = new Date().toISOString()
    
    return {
      version: '1.0',
      type: 'user-profile',
      timestamp: now,
      profile: {
        // 默认值
        username: profileData.username || `user_${Date.now()}`,
        bio: profileData.bio || '新用户',
        skills: [],
        experience: [],
        projects: [],
        socialLinks: {},
        certifications: [],
        reputation: {
          hackathonsParticipated: 0,
          hackathonsWon: 0,
          projectsCompleted: 0,
          skillEndorsements: [],
          badges: []
        },
        createdAt: profileData.createdAt || now,
        updatedAt: now,
        
        // 覆盖提供的数据
        ...profileData,
        authMethod
      },
      metadata: {
        platform: 'HackX',
        authMethod,
        network: authMethod === 'wallet' ? 'BSC Testnet' : undefined,
        ipfsVersion: '1.0'
      }
    }
  }
  
  /**
   * 上传用户资料到IPFS
   */
  static async uploadProfile(
    profileData: Partial<UserProfileData>,
    authMethod: 'email' | 'github' | 'wallet'
  ): Promise<string> {
    const { IPFSService } = await import('@/lib/ipfs')
    
    const metadata = this.createProfileMetadata(profileData, authMethod)
    
    // 生成文件名
    const identifier = profileData.username || 
                      profileData.email?.replace('@', '-at-') || 
                      profileData.walletAddress?.slice(0, 10) ||
                      `user_${Date.now()}`
    
    const ipfsCID = await IPFSService.uploadJSON(metadata, {
      name: `user-profile-${identifier}.json`,
      description: `用户资料: ${profileData.username || profileData.email || '未知用户'}`,
      tags: ['user-profile', `${authMethod}-auth`, 'developer', 'hackathon'],
      version: '1.0.0',
      author: profileData.username || profileData.email || '匿名用户'
    })
    
    console.log(`📦 ${authMethod}用户资料IPFS上传成功:`, ipfsCID)
    return ipfsCID
  }
  
  /**
   * 更新用户资料到IPFS
   */
  static async updateProfile(
    currentProfileData: UserProfileData,
    updates: Partial<UserProfileData>
  ): Promise<string> {
    // 合并当前数据和更新数据
    const updatedProfile: UserProfileData = {
      ...currentProfileData,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    return this.uploadProfile(updatedProfile, currentProfileData.authMethod)
  }
  
  /**
   * 从IPFS获取用户资料
   */
  static async getProfile(ipfsHash: string): Promise<UserProfileData | null> {
    try {
      const { IPFSService } = await import('@/lib/ipfs')
      const metadata = await IPFSService.getFromIPFS(ipfsHash) as UserProfileMetadata
      
      if (metadata.type === 'user-profile') {
        return metadata.profile
      }
      
      return null
    } catch (error) {
      console.error('获取IPFS用户资料失败:', error)
      return null
    }
  }
  
  /**
   * 验证用户资料数据格式
   */
  static validateProfile(profile: any): profile is UserProfileData {
    return (
      typeof profile === 'object' &&
      typeof profile.username === 'string' &&
      ['email', 'github', 'wallet'].includes(profile.authMethod) &&
      Array.isArray(profile.skills) &&
      Array.isArray(profile.experience) &&
      Array.isArray(profile.projects) &&
      Array.isArray(profile.certifications) &&
      typeof profile.reputation === 'object'
    )
  }
}

export default UserProfileIPFSService

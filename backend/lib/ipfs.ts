export interface IPFSFile {
  name: string
  type: string
  size: number
  hash: string
  url: string
}

export interface IPFSMetadata {
  name: string
  description?: string
  tags?: string[]
  version?: string
  author?: string
  timestamp: number
}

// 新的数据结构定义
export interface IPFSUserProfile {
  version: string
  timestamp: string
  data: {
    username: string
    email: string
    avatar?: string
    bio?: string
    skills: string[]
    socialLinks: Record<string, string>
  }
  metadata: {
    previousVersion?: string
    updatedBy: string
  }
}

export interface IPFSHackathonData {
  version: string
  timestamp: string
  data: {
    title: string
    description: string
    startDate: string
    endDate: string
    prizePool: number
    categories: string[]
    requirements: string
    rules: string
  }
  metadata: {
    organizer: string
    status: 'draft' | 'active' | 'completed'
    previousVersion?: string
  }
}

export interface IPFSProjectData {
  version: string
  timestamp: string
  data: {
    title: string
    description: string
    techStack: string[]  // 统一使用techStack字段
    demoUrl?: string
    githubUrl?: string
    videoUrl?: string
    presentationUrl?: string
    team?: string
    hackathonId: string
    teamId?: string
    tags?: string[]
    isPublic: boolean
    createdAt: string
  }
  metadata: {
    creator: string
    hackathonTitle?: string
    platform: string
    network?: string
    previousVersion?: string
  }
}

export class IPFSService {
  private static pinata: any = null
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000 // 1秒
  private static readonly UPLOAD_TIMEOUT = 30000 // 30秒

  /**
   * 重试装饰器 - 为关键方法添加重试逻辑
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} - 尝试 ${attempt}/${maxRetries}`)
        const result = await operation()
        if (attempt > 1) {
          console.log(`✅ ${operationName} - 第${attempt}次尝试成功`)
        }
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`⚠️ ${operationName} - 第${attempt}次尝试失败:`, lastError.message)
        
        if (attempt < maxRetries) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1) // 指数退避
          console.log(`🕰️ 等待 ${delay}ms 后重试...`)
          await this.sleep(delay)
        }
      }
    }
    
    throw new Error(`${operationName}在${maxRetries}次尝试后仍然失败: ${lastError?.message}`)
  }

  /**
   * 延时工具函数
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 超时装饰器 - 为上传操作添加超时控制
   */
  private static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = this.UPLOAD_TIMEOUT
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`操作超时（${timeoutMs}ms）`)), timeoutMs)
      })
    ])
  }

  /**
   * 初始化 Pinata 客户端 (基于最新SDK文档)
   */
  private static async initPinata() {
    if (!this.pinata) {
      try {
        const { PinataSDK } = await import('pinata')
        
        // 支持JWT或API Key方式认证
        const pinataJwt = process.env.PINATA_JWT
        const pinataApiKey = process.env.PINATA_API_KEY
        const pinataApiSecret = process.env.PINATA_API_SECRET
        const pinataGateway = process.env.PINATA_GATEWAY
        
        console.log('🔍 检查Pinata配置:')
        console.log('- JWT存在:', !!pinataJwt)
        console.log('- API Key存在:', !!pinataApiKey)
        console.log('- Gateway:', pinataGateway)
        
        // 检查认证配置
        if (!pinataJwt && (!pinataApiKey || !pinataApiSecret)) {
          throw new Error('Pinata认证信息未配置，请设置PINATA_JWT或PINATA_API_KEY+PINATA_API_SECRET环境变量')
        }
        
        // 根据可用的认证方式初始化SDK
        let config: any = {}
        
        if (pinataJwt) {
          console.log('🔐 使用JWT认证方式')
          config = {
            pinataJwt,
            pinataGateway: pinataGateway || 'https://gateway.pinata.cloud'
          }
        } else {
          console.log('🔐 使用API Key认证方式')
          config = {
            pinataApiKey,
            pinataSecretApiKey: pinataApiSecret,
            pinataGateway: pinataGateway || 'https://gateway.pinata.cloud'
          }
        }
        
        // 使用最新的SDK初始化方式
        this.pinata = new PinataSDK(config)
        
        // 测试认证
        try {
          await this.pinata.testAuthentication()
          console.log('✅ Pinata认证测试成功')
        } catch (authError) {
          console.warn('⚠️ Pinata认证测试失败:', authError instanceof Error ? authError.message : String(authError))
          // 继续尝试，可能是网络问题
        }
        
        console.log('✅ Pinata客户端初始化成功')
      } catch (error) {
        console.error('❌ Pinata客户端初始化失败:', error)
        throw new Error(`Pinata服务不可用: ${error}`)
      }
    }
    return this.pinata
  }

  /**
   * 上传用户资料到IPFS
   */
  static async uploadUserProfile(profileData: IPFSUserProfile): Promise<string> {
    try {
      const pinata = await this.initPinata()
      
      // 添加版本控制
      const dataWithVersion = {
        ...profileData,
        version: profileData.version || '1.0.0',
        timestamp: new Date().toISOString()
      }

      return await this.uploadJSON(dataWithVersion, {
        name: 'user-profile.json',
        description: 'User profile data for HackX platform'
      })
    } catch (error) {
      console.error('用户资料上传失败:', error)
      throw new Error(`用户资料上传失败: ${error}`)
    }
  }

  /**
   * 上传黑客松数据到IPFS
   */
  static async uploadHackathonData(hackathonData: IPFSHackathonData): Promise<string> {
    try {
      const pinata = await this.initPinata()
      
      const dataWithVersion = {
        ...hackathonData,
        version: hackathonData.version || '1.0.0',
        timestamp: new Date().toISOString()
      }

      return await this.uploadJSON(dataWithVersion, {
        name: 'hackathon-data.json',
        description: 'Hackathon data for HackX platform'
      })
    } catch (error) {
      console.error('黑客松数据上传失败:', error)
      throw new Error(`黑客松数据上传失败: ${error}`)
    }
  }

  /**
   * 上传项目数据到IPFS
   */
  static async uploadProjectData(projectData: IPFSProjectData): Promise<string> {
    try {
      const pinata = await this.initPinata()
      
      const dataWithVersion = {
        ...projectData,
        version: projectData.version || '1.0.0',
        timestamp: new Date().toISOString()
      }

      return await this.uploadJSON(dataWithVersion, {
        name: 'project-data.json',
        description: 'Project data for HackX platform'
      })
    } catch (error) {
      console.error('项目数据上传失败:', error)
      throw new Error(`项目数据上传失败: ${error}`)
    }
  }

  /**
   * 验证CID格式 (支持CIDv0和CIDv1)
   */
  static async validateCID(cid: string): Promise<boolean> {
    try {
      // 基本格式验证 - 支持CIDv0和CIDv1
      if (!this.isValidHash(cid)) {
        return false
      }

      // 尝试从Pinata网关获取数据验证CID有效性
      const pinata = await this.initPinata()
      try {
        await pinata.gateways.public.get(cid)
        return true
      } catch (error) {
        // 如果Pinata网关失败，尝试公共网关
        const response = await fetch(`${process.env.PINATA_GATEWAY}/ipfs/${cid}`)
        return response.ok
      }
    } catch (error) {
      console.error('CID验证失败:', error)
      return false
    }
  }

  /**
   * 上传文件到 IPFS - 带重试和超时保护
   */
  static async uploadFile(file: Buffer, filename: string): Promise<IPFSFile> {
    return this.withRetry(async () => {
      return this.withTimeout(async () => {
        console.log('📤 准备上传文件到Pinata:', filename)

        // 使用Pinata HTTP API上传文件
        const FormData = require('form-data')
        const formData = new FormData()
        
        formData.append('file', file, { filename })
        formData.append('pinataMetadata', JSON.stringify({
          name: filename
        }))

        const pinataUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
        const pinataJwt = process.env.PINATA_JWT
        const pinataApiKey = process.env.PINATA_API_KEY
        
        let headers: any = {
          ...formData.getHeaders()
        }
        
        // 设置认证头
        if (pinataJwt) {
          headers['Authorization'] = `Bearer ${pinataJwt}`
        } else if (pinataApiKey) {
          headers['pinata_api_key'] = pinataApiKey
          headers['pinata_secret_api_key'] = process.env.PINATA_API_SECRET
        } else {
          throw new Error('缺少Pinata认证信息，请检查环境变量配置')
        }

        const response = await fetch(pinataUrl, {
          method: 'POST',
          headers,
          body: formData
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Pinata文件上传API错误: ${response.status} - ${errorText}`)
        }

        const result = await response.json()

        console.log('✅ Pinata 文件上传成功:', result.IpfsHash)

        // 兼容不同版本的返回字段
        const cid = result.IpfsHash || result.cid || result.hash
        if (!cid) {
          throw new Error('Pinata返回的响应中没有CID')
        }
        
        const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'

        return {
          name: filename,
          type: 'file',
          size: file.length,
          hash: cid,
          url: `${gateway}/ipfs/${cid}`
        }
      })
    }, 'IPFS文件上传')
  }

  /**
   * 上传 JSON 数据到 IPFS (基于Pinata HTTP API) - 带重试和超时保护
   */
  static async uploadJSON(data: any, metadata?: Partial<IPFSMetadata>): Promise<string> {
    return this.withRetry(async () => {
      return this.withTimeout(async () => {
        const jsonData = {
          ...data,
          metadata: {
            name: metadata?.name || 'data.json',
            description: metadata?.description,
            tags: metadata?.tags || [],
            version: metadata?.version || '1.0.0',
            author: metadata?.author,
            timestamp: Date.now()
          }
        }

        console.log('📤 准备上传JSON到Pinata:', jsonData.metadata.name)
        
        // 使用Pinata HTTP API直接上传JSON
        const pinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
        const pinataJwt = process.env.PINATA_JWT
        const pinataApiKey = process.env.PINATA_API_KEY
        
        let headers: any = {
          'Content-Type': 'application/json',
        }
        
        // 设置认证头
        if (pinataJwt) {
          headers['Authorization'] = `Bearer ${pinataJwt}`
        } else if (pinataApiKey) {
          headers['pinata_api_key'] = pinataApiKey
          headers['pinata_secret_api_key'] = process.env.PINATA_API_SECRET
        } else {
          throw new Error('缺少Pinata认证信息，请检查环境变量配置')
        }

        const requestBody = {
          pinataContent: jsonData,
          pinataMetadata: {
            name: jsonData.metadata.name,
            description: jsonData.metadata.description,
          }
        }

        const response = await fetch(pinataUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Pinata API错误: ${response.status} - ${errorText}`)
        }

        const result = await response.json()

        console.log('✅ Pinata JSON上传成功:', result.IpfsHash)
        
        // 新版SDK返回的字段名可能不同，兼容处理
        const cid = result.IpfsHash || result.cid || result.hash
        if (!cid) {
          throw new Error('Pinata返回的响应中没有CID')
        }
        return cid
      })
    }, 'IPFS JSON上传')
  }

  /**
   * 从 IPFS 获取数据 - 带多网关fallback和重试机制
   */
  static async getFromIPFS(hash: string): Promise<any> {
    return this.withRetry(async () => {
      console.log('📥 从 IPFS 获取数据:', hash)
      
      // 网关优先级列表，按速度和稳定性排序
      const gateways = [
        process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',
        'https://ipfs.io/ipfs',
        'https://cloudflare-ipfs.com/ipfs', 
        'https://dweb.link/ipfs',
        'https://ipfs.infura.io/ipfs'
      ]

      let lastError: Error | null = null
      
      // 逐个尝试网关
      for (let i = 0; i < gateways.length; i++) {
        const gateway = gateways[i]
        try {
          console.log(`🌐 尝试网关 ${i + 1}/${gateways.length}: ${gateway}`)
          
          const response = await this.withTimeout(async () => {
            return fetch(`${gateway}/ipfs/${hash}`, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              }
            })
          }, 15000) // 单个网关超时时间15秒
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const contentType = response.headers.get('content-type') || ''
          if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
            throw new Error(`错误的内容类型: ${contentType}`)
          }
          
          const data = await response.json()
          console.log(`✅ 从 ${gateway} 获取数据成功`)
          return data
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          console.warn(`⚠️ ${gateway} 获取数据失败:`, lastError.message)
          
          // 如果不是最后一个网关，等待一下再试下一个
          if (i < gateways.length - 1) {
            await this.sleep(500)
          }
        }
      }
      
      throw new Error(`所有IPFS网关都无法访问数据: ${lastError?.message}`)
    }, 'IPFS数据获取')
  }

  /**
   * 验证 IPFS 哈希 (支持CIDv0和CIDv1)
   */
  static isValidHash(hash: string): boolean {
    // CIDv0: Qm开头，46个字符
    const cidv0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
    // CIDv1: bafy开头，59个字符
    const cidv1Pattern = /^bafy[1-9A-HJ-NP-Za-km-z]{55}$/
    
    return cidv0Pattern.test(hash) || cidv1Pattern.test(hash)
  }

  /**
   * 获取 IPFS 网关 URL
   */
  static getGatewayURL(hash: string): string {
    return `${process.env.PINATA_GATEWAY}/ipfs/${hash}`
  }

  /**
   * 检查 IPFS 服务状态
   */
  static async checkStatus(): Promise<boolean> {
    try {
      await this.initPinata()
      return true
    } catch (error) {
      return false
    }
  }
} 
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
    technologies: string[]  // 统一使用technologies字段
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

// 网关健康状态接口
export interface GatewayHealth {
  url: string
  isHealthy: boolean
  responseTime: number
  lastChecked: Date
  successRate: number
  consecutiveFailures: number
}

export class IPFSService {
  private static pinata: any = null
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000 // 1秒
  private static readonly UPLOAD_TIMEOUT = 30000 // 30秒
  private static readonly GATEWAY_TIMEOUT = 8000 // 8秒网关超时（降低）
  private static readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5分钟
  private static readonly MAX_CONSECUTIVE_FAILURES = 3
  
  /**
   * 验证环境变量完整性
   */
  static validateEnvironment(): { isValid: boolean; missingVars: string[]; warnings: string[] } {
    const missingVars: string[] = []
    const warnings: string[] = []
    
    // 检查必需的认证变量
    const hasJWT = !!process.env.PINATA_JWT
    const hasAPIKey = !!process.env.PINATA_API_KEY
    const hasAPISecret = !!process.env.PINATA_API_SECRET
    
    if (!hasJWT && (!hasAPIKey || !hasAPISecret)) {
      if (!hasJWT) missingVars.push('PINATA_JWT')
      if (!hasAPIKey) missingVars.push('PINATA_API_KEY')
      if (!hasAPISecret) missingVars.push('PINATA_API_SECRET')
    }
    
    // 检查可选但推荐的变量
    if (!process.env.PINATA_GATEWAY) {
      warnings.push('PINATA_GATEWAY未设置，将使用默认网关')
    }
    
    const isValid = missingVars.length === 0
    
    return { isValid, missingVars, warnings }
  }
  
  // 网关健康状态缓存
  private static gatewayHealth: Map<string, GatewayHealth> = new Map()
  private static lastHealthCheck: Date = new Date(0)
  
  // 网关优先级列表
  private static gateways = [
    // 修复Pinata网关URL格式，确保包含协议前缀
    process.env.PINATA_GATEWAY ? 
      (process.env.PINATA_GATEWAY.startsWith('http') ? 
        process.env.PINATA_GATEWAY : 
        `https://${process.env.PINATA_GATEWAY}`) : 
      'https://gateway.pinata.cloud',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs', 
    'https://dweb.link/ipfs',
    'https://ipfs.infura.io/ipfs',
    'https://hardbin.com/ipfs',
    'https://gateway.ipfs.io/ipfs'
  ].filter(url => {
    // 过滤掉无效的网关URL
    const isValid = url && typeof url === 'string' && url.length > 0
    if (!isValid) {
      console.warn(`⚠️ 跳过无效网关URL: ${url}`)
    }
    return isValid
  })

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
   * 验证网关URL格式
   */
  private static isValidGatewayUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.protocol === 'https:' && parsedUrl.hostname.length > 0
    } catch {
      return false
    }
  }

  /**
   * 检查网关健康状态
   */
  private static async checkGatewayHealth(gatewayUrl: string): Promise<GatewayHealth> {
    const startTime = Date.now()
    let isHealthy = false
    let responseTime = Infinity
    
    // 首先验证URL格式
    if (!this.isValidGatewayUrl(gatewayUrl)) {
      console.warn(`⚠️ 无效的网关URL格式: ${gatewayUrl}`)
      return {
        url: gatewayUrl,
        isHealthy: false,
        responseTime: Infinity,
        lastChecked: new Date(),
        successRate: 0,
        consecutiveFailures: (this.gatewayHealth.get(gatewayUrl)?.consecutiveFailures || 0) + 1
      }
    }
    
    try {
      // 使用一个知名的测试文件来检查网关状态
      const testCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' // hello world
      const testUrl = `${gatewayUrl}/ipfs/${testCID}`
      
      const response = await this.withTimeout(async () => {
        return fetch(testUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(this.GATEWAY_TIMEOUT)
        })
      }, this.GATEWAY_TIMEOUT)
      
      isHealthy = response.ok
      responseTime = Date.now() - startTime
      
    } catch (error) {
      console.warn(`网关健康检查失败: ${gatewayUrl}`, error)
      responseTime = Date.now() - startTime
    }
    
    const existing = this.gatewayHealth.get(gatewayUrl)
    const consecutiveFailures = isHealthy 
      ? 0 
      : (existing?.consecutiveFailures || 0) + 1
    
    // 计算成功率（基于最近20次检查）
    const successRate = existing 
      ? (existing.successRate * 19 + (isHealthy ? 100 : 0)) / 20
      : (isHealthy ? 100 : 0)
    
    return {
      url: gatewayUrl,
      isHealthy,
      responseTime,
      lastChecked: new Date(),
      successRate,
      consecutiveFailures
    }
  }
  
  /**
   * 批量检查所有网关健康状态
   */
  private static async checkAllGatewaysHealth(): Promise<void> {
    console.log('🔍 开始检查 IPFS 网关健康状态...')
    
    const healthChecks = this.gateways.map(gateway => 
      this.checkGatewayHealth(gateway)
        .catch(error => {
          console.error(`网关健康检查失败: ${gateway}`, error)
          return {
            url: gateway,
            isHealthy: false,
            responseTime: Infinity,
            lastChecked: new Date(),
            successRate: 0,
            consecutiveFailures: this.MAX_CONSECUTIVE_FAILURES
          } as GatewayHealth
        })
    )
    
    const results = await Promise.all(healthChecks)
    
    // 更新缓存
    results.forEach(health => {
      this.gatewayHealth.set(health.url, health)
    })
    
    this.lastHealthCheck = new Date()
    
    const healthyCount = results.filter(h => h.isHealthy).length
    console.log(`✅ IPFS 网关健康检查完成: ${healthyCount}/${results.length} 网关正常`)
  }
  
  /**
   * 获取最佳网关列表（按性能排序）
   */
  private static async getOptimalGateways(): Promise<string[]> {
    // 如果需要检查健康状态
    if (Date.now() - this.lastHealthCheck.getTime() > this.HEALTH_CHECK_INTERVAL) {
      await this.checkAllGatewaysHealth()
    }
    
    // 按健康状态和性能排序
    const sortedGateways = Array.from(this.gatewayHealth.values())
      .filter(health => 
        health.isHealthy && 
        health.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES
      )
      .sort((a, b) => {
        // 优先按成功率排序，然后按响应时间排序
        if (Math.abs(a.successRate - b.successRate) > 10) {
          return b.successRate - a.successRate
        }
        return a.responseTime - b.responseTime
      })
      .map(health => health.url)
    
    // 如果没有健康的网关，返回默认列表，但跳过连续失败过多的网关
    if (sortedGateways.length === 0) {
      console.warn('⚠️ 没有可用的健康网关，使用默认列表')
      const filteredGateways = this.gateways.filter(gateway => {
        const health = this.gatewayHealth.get(gateway)
        return !health || health.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES
      })
      return filteredGateways.length > 0 ? filteredGateways : this.gateways
    }
    
    // 添加一些备用网关
    const backupGateways = this.gateways.filter(g => !sortedGateways.includes(g))
    
    return [...sortedGateways, ...backupGateways]
  }
  
  /**
   * 获取网关健康报告
   */
  static async getGatewayHealthReport(): Promise<{
    lastChecked: Date
    totalGateways: number
    healthyGateways: number
    gateways: GatewayHealth[]
  }> {
    // 如果需要，进行健康检查
    if (Date.now() - this.lastHealthCheck.getTime() > this.HEALTH_CHECK_INTERVAL) {
      await this.checkAllGatewaysHealth()
    }
    
    const gateways = Array.from(this.gatewayHealth.values())
    const healthyCount = gateways.filter(g => g.isHealthy).length
    
    return {
      lastChecked: this.lastHealthCheck,
      totalGateways: gateways.length,
      healthyGateways: healthyCount,
      gateways: gateways.sort((a, b) => b.successRate - a.successRate)
    }
  }
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
          // 新SDK只支持JWT认证，网关URL不需要https://前缀
          const gatewayDomain = pinataGateway ? 
            pinataGateway.replace('https://', '').replace('http://', '') : 
            'gateway.pinata.cloud'
          
          config = {
            pinataJwt,
            pinataGateway: gatewayDomain
          }
        } else {
          throw new Error('新版Pinata SDK只支持JWT认证，请设置PINATA_JWT环境变量')
        }
        
        // 使用最新的SDK初始化方式
        this.pinata = new PinataSDK(config)
        
        // 新SDK没有testAuthentication方法，通过实际调用来验证
        console.log('✅ Pinata SDK初始化完成，将在首次使用时验证认证')
        
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

      // 尝试从Pinata SDK获取数据验证CID有效性
      try {
        const pinata = await this.initPinata()
        await pinata.gateways.public.get(cid)
        return true
      } catch (error) {
        // 如果Pinata SDK失败，尝试公共网关
        const gatewayUrl = process.env.PINATA_GATEWAY ? 
          `https://${process.env.PINATA_GATEWAY}` : 
          'https://gateway.pinata.cloud'
        const response = await fetch(`${gatewayUrl}/ipfs/${cid}`)
        return response.ok
      }
    } catch (error) {
      console.error('CID验证失败:', error)
      return false
    }
  }

  /**
   * 上传文件到 IPFS - 使用新版Pinata SDK
   */
  static async uploadFile(file: Buffer, filename: string): Promise<IPFSFile> {
    return this.withRetry(async () => {
      return this.withTimeout(async () => {
        console.log('📤 准备上传文件到Pinata (使用SDK):', filename)

        try {
          // 使用新版 Pinata SDK
          const pinata = await this.initPinata()
          
          // 创建 File 对象
          const fileObject = new File([file], filename, { 
            type: this.getMimeType(filename) 
          })
          
          console.log('📤 文件对象创建成功:', {
            name: fileObject.name,
            size: fileObject.size,
            type: fileObject.type
          })
          
          // 使用新SDK上传文件
          const upload = await pinata.upload.public.file(fileObject)
          
          console.log('✅ Pinata SDK 文件上传成功:', upload.cid)
          
          const gateway = process.env.PINATA_GATEWAY ? 
            `https://${process.env.PINATA_GATEWAY}` : 
            'https://gateway.pinata.cloud'

          return {
            name: filename,
            type: 'file',
            size: file.length,
            hash: upload.cid,
            url: `${gateway}/ipfs/${upload.cid}`
          }
        } catch (sdkError) {
          console.error('❌ Pinata SDK上传失败，尝试HTTP API:', sdkError)
          
          // 回退到HTTP API方式
          return this.uploadFileViaHTTP(file, filename)
        }
      })
    }, 'IPFS文件上传')
  }

  /**
   * 通过HTTP API上传文件 (备用方法)
   */
  private static async uploadFileViaHTTP(file: Buffer, filename: string): Promise<IPFSFile> {
    console.log('📤 使用HTTP API上传文件:', filename)
    
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
      throw new Error(`Pinata HTTP API错误: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    console.log('✅ Pinata HTTP API上传成功:', result.IpfsHash)

    // 兼容不同版本的返回字段
    const cid = result.IpfsHash || result.cid || result.hash
    if (!cid) {
      throw new Error('Pinata返回的响应中没有CID')
    }
    
    const gateway = process.env.PINATA_GATEWAY ? 
      `https://${process.env.PINATA_GATEWAY}` : 
      'https://gateway.pinata.cloud'

    return {
      name: filename,
      type: 'file',
      size: file.length,
      hash: cid,
      url: `${gateway}/ipfs/${cid}`
    }
  }

  /**
   * 根据文件名获取MIME类型
   */
  private static getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json'
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  /**
   * 上传 JSON 数据到 IPFS (使用新版Pinata SDK) - 带重试和超时保护
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
        
        const pinata = await this.initPinata()
        
        // 创建一个虚拟文件对象用于上传JSON
        const jsonString = JSON.stringify(jsonData, null, 2)
        const file = new File([jsonString], jsonData.metadata.name, { 
          type: 'application/json' 
        })
        
        // 使用新SDK上传
        const upload = await pinata.upload.public.file(file)
        
        console.log('✅ Pinata JSON上传成功:', upload.cid)
        
        return upload.cid
      })
    }, 'IPFS JSON上传')
  }

  /**
   * 从 IPFS 获取数据 - 优先使用新SDK，带多网关fallback
   */
  static async getFromIPFS(hash: string): Promise<any> {
    return this.withRetry(async () => {
      console.log('📥 从 IPFS 获取数据:', hash)
      
      // 首先尝试使用新版Pinata SDK
      try {
        const pinata = await this.initPinata()
        console.log('🌐 使用Pinata SDK获取数据')
        
        const data = await pinata.gateways.public.get(hash)
        console.log('✅ Pinata SDK获取数据成功')
        return data
      } catch (pinataError) {
        console.warn('⚠️ Pinata SDK获取失败，尝试备用网关:', pinataError)
      }
      
      // 如果Pinata SDK失败，回退到多网关方式
      const optimalGateways = await this.getOptimalGateways()

      let lastError: Error | null = null
      
      // 逐个尝试网关
      for (let i = 0; i < optimalGateways.length; i++) {
        const gateway = optimalGateways[i]
        try {
          console.log(`🌐 尝试网关 ${i + 1}/${optimalGateways.length}: ${gateway}`)
          
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
          
          // 更新网关成功状态
          this.updateGatewaySuccess(gateway)
          
          console.log(`✅ 从 ${gateway} 获取数据成功`)
          return data
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          
          // 更新网关失败状态
          this.updateGatewayFailure(gateway)
          
          console.warn(`⚠️ ${gateway} 获取数据失败:`, lastError.message)
          
          // 如果不是最后一个网关，等待一下再试下一个
          if (i < optimalGateways.length - 1) {
            await this.sleep(Math.min(500 * (i + 1), 2000)) // 递增延迟，最套2秒
          }
        }
      }
      
      throw new Error(`所有IPFS网关都无法访问数据: ${lastError?.message}`)
    }, 'IPFS数据获取')
  }
  
  /**
   * 更新网关成功状态
   */
  private static updateGatewaySuccess(gatewayUrl: string): void {
    const health = this.gatewayHealth.get(gatewayUrl)
    if (health) {
      health.consecutiveFailures = 0
      health.isHealthy = true
      // 更新成功率
      health.successRate = Math.min(100, health.successRate + 2)
    }
  }
  
  /**
   * 更新网关失败状态
   */
  private static updateGatewayFailure(gatewayUrl: string): void {
    const health = this.gatewayHealth.get(gatewayUrl)
    if (health) {
      health.consecutiveFailures += 1
      // 如果连续失败过多，标记为不健康
      if (health.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        health.isHealthy = false
      }
      // 降低成功率
      health.successRate = Math.max(0, health.successRate - 5)
    }
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
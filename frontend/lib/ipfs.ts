'use client'

// IPFS 服务封装 - 前端只负责数据获取，上传由后端处理
class IPFSService {
  // 获取Pinata专用网关（如果配置了的话）
  private getPinataGateway(): string | null {
    // 在浏览器环境中，我们可以从环境变量或配置中获取
    if (typeof window !== 'undefined' && (window as any).__PINATA_GATEWAY__) {
      return (window as any).__PINATA_GATEWAY__
    }
    return null
  }

  // 动态构建网关列表，优先使用Pinata专用网关
  private getGateways(): string[] {
    const pinataGateway = this.getPinataGateway()
    const gateways = []
    
    // 如果有Pinata专用网关，优先使用
    if (pinataGateway) {
      gateways.push(`https://${pinataGateway}/ipfs`)
    }
    
    // 添加公共网关作为备用
    gateways.push(
      'https://gateway.pinata.cloud/ipfs',
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      'https://dweb.link/ipfs',
      'https://nftstorage.link/ipfs'
    )
    
    return gateways
  }
  
  private currentGatewayIndex = 0

  // 前端只负责从IPFS获取数据，上传由后端API处理
  async getFile(hash: string): Promise<any> {
    if (!this.isValidHash(hash)) {
      throw new Error('Invalid IPFS hash format')
    }

    const gateways = this.getGateways()
    
    for (let i = 0; i < gateways.length; i++) {
      const gateway = gateways[(this.currentGatewayIndex + i) % gateways.length]
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
        
        const response = await fetch(`${gateway}/${hash}`, {
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          // 成功的网关移到前面
          this.currentGatewayIndex = (this.currentGatewayIndex + i) % gateways.length
          return await response.blob()
        }
      } catch (error) {
        console.warn(`Gateway ${gateway} failed for hash ${hash}:`, error)
        continue
      }
    }
    
    throw new Error(`Failed to fetch ${hash} from all IPFS gateways`)
  }

  async getJSON(hash: string): Promise<any> {
    if (!this.isValidHash(hash)) {
      throw new Error('Invalid IPFS hash format')
    }

    const gateways = this.getGateways()
    
    for (let i = 0; i < gateways.length; i++) {
      const gateway = gateways[(this.currentGatewayIndex + i) % gateways.length]
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
        
        const response = await fetch(`${gateway}/${hash}`, {
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          // 成功的网关移到前面
          this.currentGatewayIndex = (this.currentGatewayIndex + i) % gateways.length
          const data = await response.json()
          return data
        }
      } catch (error) {
        console.warn(`Gateway ${gateway} failed for hash ${hash}:`, error)
        continue
      }
    }
    
    throw new Error(`Failed to fetch JSON ${hash} from all IPFS gateways`)
  }

  getFileUrl(hash: string): string {
    if (!this.isValidHash(hash)) {
      return ''
    }
    const gateways = this.getGateways()
    return `${gateways[this.currentGatewayIndex]}/${hash}`
  }

  // 获取所有网关的URL列表
  getAllUrls(hash: string): string[] {
    if (!this.isValidHash(hash)) {
      return []
    }
    const gateways = this.getGateways()
    return gateways.map(gateway => `${gateway}/${hash}`)
  }

  isValidHash(hash: string): boolean {
    // CIDv0: Qm开头，46个字符
    const cidv0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
    // CIDv1: bafy开头，59个字符
    const cidv1Pattern = /^bafy[1-9A-HJ-NP-Za-km-z]{55}$/
    // 其他格式支持
    const otherPattern = /^k2k4r8[a-z0-9]{50}$/
    
    return cidv0Pattern.test(hash) || cidv1Pattern.test(hash) || otherPattern.test(hash)
  }

  // 元数据创建函数 - 用于前端准备数据，实际上传由后端处理
  createProjectMetadata(project: {
    name: string
    description: string
    team: string
    technologies: string[]
    githubUrl?: string
    demoUrl?: string
    videoUrl?: string
  }): any {
    return {
      name: project.name,
      description: project.description,
      team: project.team,
      technologies: project.technologies,
      links: {
        github: project.githubUrl,
        demo: project.demoUrl,
        video: project.videoUrl,
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  }

  createHackathonMetadata(hackathon: {
    title: string
    description: string
    organizer: string
    startDate: string
    endDate: string
    prizePool: number
    categories: string[]
  }): any {
    return {
      title: hackathon.title,
      description: hackathon.description,
      organizer: hackathon.organizer,
      dates: {
        start: hackathon.startDate,
        end: hackathon.endDate,
      },
      prizePool: hackathon.prizePool,
      categories: hackathon.categories,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  }
}

export interface IPFSUploadResult {
  hash: string
  path: string
  size: number
  url: string
}

export const ipfsService = new IPFSService()

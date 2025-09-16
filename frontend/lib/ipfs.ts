'use client'

// IPFS 服务封装 - 前端只负责数据获取，上传由后端处理
class IPFSService {
  // 通过后端API获取IPFS数据
  private async getFromBackend(hash: string, type: 'file' | 'json' = 'json'): Promise<any> {
    const response = await fetch(`/api/ipfs/get?hash=${hash}&type=${type}`)
    
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
  
  private currentGatewayIndex = 0

  // 前端通过后端API获取IPFS文件
  async getFile(hash: string): Promise<any> {
    if (!this.isValidHash(hash)) {
      throw new Error('Invalid IPFS hash format')
    }

    return await this.getFromBackend(hash, 'file')
  }

  async getJSON(hash: string): Promise<any> {
    if (!this.isValidHash(hash)) {
      throw new Error('Invalid IPFS hash format')
    }

    return await this.getFromBackend(hash, 'json')
  }

  getFileUrl(hash: string): string {
    if (!this.isValidHash(hash)) {
      return ''
    }
    // 通过后端代理获取文件URL
    return `/api/ipfs/proxy?hash=${hash}`
  }

  // 获取所有可能的URL（现在都通过后端代理）
  getAllUrls(hash: string): string[] {
    if (!this.isValidHash(hash)) {
      return []
    }
    return [`/api/ipfs/proxy?hash=${hash}`]
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

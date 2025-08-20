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
    demoUrl?: string
    githubUrl?: string
    techStack: string[]
    teamMembers: string[]
    screenshots?: string[]
  }
  metadata: {
    creator: string
    hackathonId: string
    previousVersion?: string
  }
}

export class IPFSService {
  private static client: any = null

  /**
   * 初始化 IPFS 客户端
   */
  private static async initClient() {
    if (!this.client) {
      try {
        const { create } = await import('ipfs-http-client')
        this.client = create({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            authorization: `Basic ${Buffer.from(
              `${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`
            ).toString('base64')}`
          }
        })
      } catch (error) {
        console.error('IPFS 客户端初始化失败:', error)
        throw new Error('IPFS 服务不可用')
      }
    }
    return this.client
  }

  /**
   * 上传用户资料到IPFS
   */
  static async uploadUserProfile(profileData: IPFSUserProfile): Promise<string> {
    try {
      const client = await this.initClient()
      
      // 添加版本控制
      const dataWithVersion = {
        ...profileData,
        version: profileData.version || '1.0.0',
        timestamp: new Date().toISOString()
      }

      const result = await client.add(JSON.stringify(dataWithVersion), {
        pin: true,
        metadata: {
          name: 'user-profile.json',
          description: 'User profile data for HackX platform'
        }
      })

      return result.cid.toString()
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
      const client = await this.initClient()
      
      const dataWithVersion = {
        ...hackathonData,
        version: hackathonData.version || '1.0.0',
        timestamp: new Date().toISOString()
      }

      const result = await client.add(JSON.stringify(dataWithVersion), {
        pin: true,
        metadata: {
          name: 'hackathon-data.json',
          description: 'Hackathon data for HackX platform'
        }
      })

      return result.cid.toString()
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
      const client = await this.initClient()
      
      const dataWithVersion = {
        ...projectData,
        version: projectData.version || '1.0.0',
        timestamp: new Date().toISOString()
      }

      const result = await client.add(JSON.stringify(dataWithVersion), {
        pin: true,
        metadata: {
          name: 'project-data.json',
          description: 'Project data for HackX platform'
        }
      })

      return result.cid.toString()
    } catch (error) {
      console.error('项目数据上传失败:', error)
      throw new Error(`项目数据上传失败: ${error}`)
    }
  }

  /**
   * 验证CID格式
   */
  static async validateCID(cid: string): Promise<boolean> {
    try {
      // 基本格式验证
      if (!/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid)) {
        return false
      }

      // 尝试从IPFS获取数据验证CID有效性
      const client = await this.initClient()
      await client.cat(cid).next()
      return true
    } catch (error) {
      console.error('CID验证失败:', error)
      return false
    }
  }

  /**
   * 上传文件到 IPFS
   */
  static async uploadFile(file: Buffer, filename: string): Promise<IPFSFile> {
    try {
      const client = await this.initClient()
      const result = await client.add(file, {
        pin: true,
        metadata: {
          name: filename
        }
      })

      return {
        name: filename,
        type: 'file',
        size: file.length,
        hash: result.cid.toString(),
        url: `${process.env.IPFS_GATEWAY}/ipfs/${result.cid}`
      }
    } catch (error) {
      console.error('IPFS 文件上传失败:', error)
      throw new Error(`IPFS 文件上传失败: ${error}`)
    }
  }

  /**
   * 上传 JSON 数据到 IPFS
   */
  static async uploadJSON(data: any, metadata?: Partial<IPFSMetadata>): Promise<string> {
    try {
      const client = await this.initClient()
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

      const result = await client.add(JSON.stringify(jsonData), {
        pin: true
      })

      return result.cid.toString()
    } catch (error) {
      console.error('IPFS JSON 上传失败:', error)
      throw new Error(`IPFS JSON 上传失败: ${error}`)
    }
  }

  /**
   * 从 IPFS 获取数据
   */
  static async getFromIPFS(hash: string): Promise<any> {
    try {
      const client = await this.initClient()
      const chunks = []
      for await (const chunk of client.cat(hash)) {
        chunks.push(chunk)
      }
      const data = Buffer.concat(chunks)
      return JSON.parse(data.toString())
    } catch (error) {
      console.error('从 IPFS 获取数据失败:', error)
      throw new Error(`从 IPFS 获取数据失败: ${error}`)
    }
  }

  /**
   * 验证 IPFS 哈希
   */
  static isValidHash(hash: string): boolean {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }

  /**
   * 获取 IPFS 网关 URL
   */
  static getGatewayURL(hash: string): string {
    return `${process.env.IPFS_GATEWAY}/ipfs/${hash}`
  }

  /**
   * 检查 IPFS 服务状态
   */
  static async checkStatus(): Promise<boolean> {
    try {
      await this.initClient()
      return true
    } catch (error) {
      return false
    }
  }
} 
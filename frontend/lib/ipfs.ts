'use client'

import { apiService } from './api'

// IPFS 服务封装
class IPFSService {
  private baseUrl = 'https://ipfs.infura.io:5001/api/v0'
  private gatewayUrl = 'https://ipfs.io/ipfs'

  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      const response = await apiService.uploadFile(file)
      
      if (response.success && response.data) {
        return {
          hash: response.data.file.hash,
          path: file.name,
          size: file.size,
          url: response.data.file.url,
        }
      } else {
        throw new Error(response.error || '上传失败')
      }
    } catch (error) {
      console.error('IPFS upload error:', error)
      throw new Error('文件上传失败，请重试')
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<IPFSUploadResult[]> {
    const results = await Promise.all(files.map((file) => this.uploadFile(file)))
    return results
  }

  async uploadJSON(data: any, metadata?: any): Promise<IPFSUploadResult> {
    try {
      const response = await apiService.uploadJSON(data, metadata)
      
      if (response.success && response.data) {
        return {
          hash: response.data.hash,
          path: 'metadata.json',
          size: JSON.stringify(data).length,
          url: response.data.url,
        }
      } else {
        throw new Error(response.error || 'JSON 上传失败')
      }
    } catch (error) {
      console.error('JSON upload error:', error)
      throw new Error('JSON 上传失败，请重试')
    }
  }

  async getFile(hash: string): Promise<any> {
    try {
      const response = await fetch(`${this.gatewayUrl}/${hash}`)
      if (!response.ok) {
        throw new Error('Failed to fetch from IPFS')
      }
      return await response.blob()
    } catch (error) {
      console.error('IPFS fetch error:', error)
      throw error
    }
  }

  async getJSON(hash: string): Promise<any> {
    try {
      const response = await fetch(`${this.gatewayUrl}/${hash}`)
      if (!response.ok) {
        throw new Error('Failed to fetch JSON from IPFS')
      }
      return await response.json()
    } catch (error) {
      console.error('IPFS JSON fetch error:', error)
      throw error
    }
  }

  getFileUrl(hash: string): string {
    return `${this.gatewayUrl}/${hash}`
  }

  isValidHash(hash: string): boolean {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }

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

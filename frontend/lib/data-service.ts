'use client'

import { ipfsDataService, type HackathonData, type ProjectData, type UserProfile } from './ipfs-data-service'
import { smartContractService } from './smart-contracts'
import { apiService } from './api'

/**
 * 统一数据服务
 * 实现多层级回退策略，确保数据获取的可靠性
 */
export class DataService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存
  
  /**
   * 获取黑客松列表（优先级：API > The Graph > 智能合约）
   * 暂时优先使用API，避免合约调用问题
   */
  async getHackathons(params: {
    search?: string
    status?: string
    category?: string
    page?: number
    limit?: number
    featured?: boolean
  } = {}): Promise<HackathonData[]> {
    const cacheKey = `hackathons:${JSON.stringify(params)}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      // Prioritize backend API (stable and reliable)
      console.log('[DataService] Getting hackathon list from API', params)
      const response = await apiService.getHackathons(params)
      
      // 保持完整的响应结构，包括分页信息
      if (Array.isArray(response)) {
        // 旧格式：直接返回数组
        this.setCache(cacheKey, response)
        console.log('[DataService] API fetch successful, hackathon count:', response.length)
        return response
      } else {
        // 新格式：返回完整的响应对象
        const apiData = response.data?.hackathons || response.hackathons || []
        this.setCache(cacheKey, response) // 缓存完整响应
        console.log('[DataService] API fetch successful, hackathon count:', apiData.length)
        return response // 返回完整响应，包括分页信息
      }
      
    } catch (error) {
      console.warn('[DataService] API fetch failed:', error)
      // Return empty array directly when API fails, no longer trying other unstable data sources
      return []
    }
  }

  /**
   * 获取黑客松详情
   */
  async getHackathonDetail(id: string): Promise<HackathonData | null> {
    const cacheKey = `hackathon:${id}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      // 1. 从智能合约获取基础信息
      const contractData = await smartContractService.getHackathon(Number(id))
      
      // 2. 从IPFS获取详细数据
      if (contractData.dataCID) {
        const ipfsData = await ipfsDataService.getHackathonData(contractData.dataCID)
        const enrichedData = {
          ...ipfsData,
          id: contractData.id.toString(),
          organizer: contractData.organizer,
          participantCount: contractData.participantCount || 0,
          projectCount: contractData.projectCount || 0
        }
        this.setCache(cacheKey, enrichedData)
        return enrichedData
      }
    } catch (error) {
      console.warn('Contract + IPFS failed, falling back to API:', error)
    }

    try {
      // 3. 从API获取
      const response = await apiService.getHackathon(id)
      const apiData = response.data?.hackathon
      if (apiData) {
        this.setCache(cacheKey, apiData)
        return apiData
      }
    } catch (error) {
      console.error('All data sources failed for hackathon detail:', error)
      }
      
      return null
  }

  /**
   * 获取黑客松中的项目列表
   */
  async getHackathonProjects(hackathonId: string, params: {
    search?: string
    technology?: string
    status?: string
    page?: number
    limit?: number
  } = {}): Promise<ProjectData[]> {
    const cacheKey = `hackathon-projects:${hackathonId}:${JSON.stringify(params)}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      // Get projects for specified hackathon directly from API
      console.log('[DataService] Getting hackathon projects', { hackathonId, params })
      const response = await apiService.getProjects({
        hackathonId,
        ...params
      })
      
      const apiData = response.data?.projects || []
      this.setCache(cacheKey, apiData)
      console.log('[DataService] Hackathon projects fetched successfully, count:', apiData.length)
      return apiData
    } catch (error) {
      console.error('[DataService] Failed to get hackathon projects:', error)
      return []
    }
  }

  /**
   * 获取项目详情
   */
  async getProjectDetail(id: string): Promise<ProjectData | null> {
    const cacheKey = `project:${id}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      // 从API获取项目详情
      console.log('🔍 DataService: 获取项目详情', id)
      const response = await apiService.getProject(id)
      const apiData = response.data?.project
      
      if (apiData) {
        this.setCache(cacheKey, apiData)
        console.log('✅ DataService: 项目详情获取成功')
        return apiData
      }
    } catch (error) {
      console.error('❌ 获取项目详情失败:', error)
    }

    return null
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(address: string): Promise<UserProfile | null> {
    const cacheKey = `user:${address}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      // 1. 从智能合约获取基础信息
      const contractData = await smartContractService.getUser(address)
      
      // 2. 从IPFS获取详细数据
      if (contractData.profileCID) {
        const ipfsData = await ipfsDataService.getUserProfile(contractData.profileCID)
        const enrichedData = {
          ...ipfsData,
          address: contractData.address,
          isRegistered: contractData.isRegistered
        }
        this.setCache(cacheKey, enrichedData)
        return enrichedData
      }
    } catch (error) {
      console.warn('Contract + IPFS failed for user profile, falling back to API:', error)
    }

    try {
      // 3. 从API获取
      const response = await apiService.getUserProfile(address)
      const apiData = response.data?.user
      if (apiData) {
        this.setCache(cacheKey, apiData)
        return apiData
      }
    } catch (error) {
      console.error('All data sources failed for user profile:', error)
    }

    return null
  }

  /**
   * 从The Graph获取黑客松数据
   */
  private async getHackathonsFromGraph(params: any): Promise<any[]> {
    // 这里应该实现The Graph查询
    // 由于The Graph子图还未部署，暂时返回空数组
    console.log('The Graph查询暂未实现')
    return []
  }

  /**
   * 从智能合约获取黑客松数据
   */
  private async getHackathonsFromContracts(params: any): Promise<HackathonData[]> {
    try {
      // 获取黑客松总数
      const count = await smartContractService.getHackathonCount()
      const hackathons: HackathonData[] = []

      // 获取所有黑客松数据
      for (let i = 1; i <= Math.min(count, 20); i++) { // 限制最多20个
        try {
          const contractData = await smartContractService.getHackathon(i)
          if (contractData.dataCID) {
            const ipfsData = await ipfsDataService.getHackathonData(contractData.dataCID)
            hackathons.push({
              ...ipfsData,
              id: contractData.id.toString(),
              organizer: contractData.organizer,
              participantCount: contractData.participantCount || 0,
              projectCount: contractData.projectCount || 0
            })
          }
        } catch (error) {
          console.warn(`Failed to load hackathon ${i}:`, error)
          continue
        }
      }

      return hackathons
    } catch (error) {
      console.error('Failed to get hackathons from contracts:', error)
      throw error
    }
  }


  /**
   * 从IPFS丰富黑客松数据
   */
  private async enrichHackathonsFromIPFS(hackathons: any[]): Promise<HackathonData[]> {
    return Promise.all(
      hackathons.map(async (hackathon) => {
        try {
          if (hackathon.dataCID) {
            const ipfsData = await ipfsDataService.getHackathonData(hackathon.dataCID)
            return { ...hackathon, ...ipfsData }
          }
          return hackathon
        } catch (error) {
          console.warn(`Failed to load IPFS data for hackathon ${hackathon.id}:`, error)
          return hackathon
        }
      })
    )
  }


  /**
   * 缓存管理
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * 预加载数据
   */
  async preloadData(type: 'hackathons' | 'users', params: any = {}): Promise<void> {
    try {
      switch (type) {
        case 'hackathons':
          await this.getHackathons(params)
          break
        case 'users':
          // 预加载用户数据
          break
      }
      console.log(`✅ 预加载 ${type} 数据成功`)
    } catch (error) {
      console.warn(`⚠️ 预加载 ${type} 数据失败:`, error)
    }
  }

  /**
   * 数据同步
   */
  async syncData(): Promise<void> {
    try {
      // 清除旧缓存
      this.clearCache()
      
      // 重新加载数据
      await Promise.all([
        this.preloadData('hackathons')
      ])
      
      console.log('✅ 数据同步完成')
    } catch (error) {
      console.error('❌ 数据同步失败:', error)
      throw error
    }
  }
}

// 创建单例实例
export const dataService = new DataService()

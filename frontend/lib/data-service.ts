'use client'

import { smartContractService } from './smart-contracts'
import { ipfsDataService, HackathonData, ProjectData, UserProfile } from './ipfs-data-service'
import { GraphQLService } from './graphql-client'
import { apiService } from './api'

// 统一的数据获取服务
export class DataService {
  
  // ============ 黑客松数据获取 ============
  
  /**
   * 获取黑客松列表（优先级：The Graph > 智能合约 > API）
   */
  async getHackathons(params: {
    search?: string
    category?: string
    status?: string
    sortBy?: string
    page?: number
    limit?: number
  } = {}): Promise<{
    hackathons: HackathonData[]
    total: number
    hasMore: boolean
  }> {
    console.log('DataService: Getting hackathons with params:', params)
    
    // 策略1: 尝试从 The Graph 获取（最快）
    try {
      console.log('DataService: Trying The Graph...')
      const graphData = await GraphQLService.getHackathons({
        first: params.limit || 10,
        skip: ((params.page || 1) - 1) * (params.limit || 10)
      })
      
      if (graphData?.hackathons && graphData.hackathons.length > 0) {
        console.log('DataService: The Graph returned data, enriching from IPFS...')
        const enrichedHackathons = await this.enrichHackathonsFromGraph(graphData.hackathons)
        const filteredHackathons = this.filterHackathons(enrichedHackathons, params)
        
        return {
          hackathons: filteredHackathons,
          total: filteredHackathons.length,
          hasMore: graphData.hackathons.length === (params.limit || 10)
        }
      }
    } catch (error) {
      console.warn('DataService: The Graph unavailable, falling back to contracts:', error)
    }
    
    // 策略2: 从智能合约获取（可靠）
    try {
      console.log('DataService: Trying smart contracts...')
      const hackathons = await this.getHackathonsFromContract(params)
      console.log(`DataService: Smart contracts returned ${hackathons.length} hackathons`)
      
      return {
        hackathons,
        total: hackathons.length,
        hasMore: false // 智能合约返回所有数据
      }
    } catch (error) {
      console.log(error)
      console.warn('DataService: Smart contracts unavailable, falling back to API:', error)
    }
    
    // 策略3: 从后端 API 获取（备用）
    try {
      console.log('DataService: Trying backend API...')
      const response = await apiService.getHackathons(params)
      
      if (response.success && response.data) {
        console.log(`DataService: API returned ${response.data.hackathons?.length || 0} hackathons`)
        return {
          hackathons: response.data.hackathons || [],
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        }
      }
    } catch (error) {
      console.warn('DataService: API also failed:', error)
    }
    
    // 都失败了，返回空数据
    console.warn('DataService: All data sources failed, returning empty data')
    return {
      hackathons: [],
      total: 0,
      hasMore: false
    }
  }

  /**
   * 获取单个黑客松数据
   */
  async getHackathon(hackathonId: number): Promise<HackathonData | null> {
    try {
      console.log(`DataService: Getting hackathon ${hackathonId}`)
      
      // 优先从 IPFS 数据服务获取（最完整）
      const hackathonData = await ipfsDataService.getHackathonData(hackathonId)
      console.log(`DataService: Successfully loaded hackathon ${hackathonId}`)
      
      return hackathonData
    } catch (error) {
      console.error(`DataService: Failed to load hackathon ${hackathonId}:`, error)
      
      // 备用：从API获取
      try {
        const response = await apiService.getHackathon(hackathonId.toString())
        if (response.success && response.data) {
          return this.convertApiHackathonToData(response.data.hackathon)
        }
      } catch (apiError) {
        console.warn('DataService: API fallback also failed')
      }
      
      return null
    }
  }

  // ============ 项目数据获取 ============
  
  /**
   * 获取项目列表
   */
  async getProjects(params: {
    hackathonId?: number
    search?: string
    technology?: string
    status?: string
    sortBy?: string
    page?: number
    limit?: number
  } = {}): Promise<{
    projects: ProjectData[]
    total: number
    hasMore: boolean
  }> {
    console.log('DataService: Getting projects with params:', params)
    
    // 策略1: 尝试从智能合约获取
    try {
      const projects = await this.getProjectsFromContract(params)
      console.log(`DataService: Smart contracts returned ${projects.length} projects`)
      
      return {
        projects,
        total: projects.length,
        hasMore: false
      }
    } catch (error) {
      console.warn('DataService: Smart contracts unavailable for projects:', error)
    }
    
    // 策略2: 从后端API获取
    try {
      const response = await apiService.getProjects(params)
      
      if (response.success && response.data) {
        return {
          projects: response.data.projects || [],
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        }
      }
    } catch (error) {
      console.warn('DataService: API also failed for projects:', error)
    }
    
    return {
      projects: [],
      total: 0,
      hasMore: false
    }
  }

  /**
   * 获取单个项目数据
   */
  async getProject(projectId: number): Promise<ProjectData | null> {
    try {
      return await ipfsDataService.getProjectData(projectId)
    } catch (error) {
      console.error(`DataService: Failed to load project ${projectId}:`, error)
      return null
    }
  }

  // ============ 用户数据获取 ============
  
  /**
   * 获取用户资料
   */
  async getUserProfile(address: string): Promise<UserProfile> {
    try {
      return await ipfsDataService.getUserProfile(address)
    } catch (error) {
      console.error(`DataService: Failed to load user profile ${address}:`, error)
      
      // 返回基础用户信息
      return {
        address: address.toLowerCase(),
        isValid: false,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      }
    }
  }

  // ============ 私有辅助方法 ============
  
  /**
   * 从智能合约获取黑客松列表
   */
  private async getHackathonsFromContract(params: any): Promise<HackathonData[]> {
    try {
      // 确保智能合约服务已初始化
      await smartContractService.initialize()
      
      const count = await smartContractService.getHackathonCount()
      const totalCount = Number(count)
      
      if (totalCount === 0) return []
      
      // 生成ID数组
      const ids = Array.from({ length: totalCount }, (_, i) => i + 1)
      
      // 批量获取数据
      const hackathons = await ipfsDataService.getHackathonsData(ids)
      
      // 应用筛选和排序
    const filteredHackathons = this.filterHackathons(hackathons, params)
    const sortedHackathons = this.sortHackathons(filteredHackathons, params.sortBy)
    
    // 应用分页
    if (params.page && params.limit) {
      const start = (params.page - 1) * params.limit
      const end = start + params.limit
      return sortedHackathons.slice(start, end)
    }
    
    return sortedHackathons
    } catch (error: any) {
      console.warn('从智能合约获取黑客松数据失败:', error)
      
      // 检查是否是网络相关错误
      if (error.message?.includes('missing trie node') || 
          error.message?.includes('Internal JSON-RPC error') ||
          error.code === 'CALL_EXCEPTION') {
        console.warn('检测到BSC Testnet网络问题，切换到fallback数据源')
      }
      
      // 如果合约调用失败，返回空数组，让上层逻辑fallback到其他数据源
      return []
    }
  }

  /**
   * 从智能合约获取项目列表
   */
  private async getProjectsFromContract(params: any): Promise<ProjectData[]> {
    try {
      // 确保智能合约服务已初始化
      await smartContractService.initialize()
      
      const count = await smartContractService.getProjectCount()
      const totalCount = Number(count)
    
    if (totalCount === 0) return []
    
    // 生成ID数组
    const ids = Array.from({ length: totalCount }, (_, i) => i + 1)
    
    // 批量获取数据
    const projects = await ipfsDataService.getProjectsData(ids)
    
    // 应用筛选
    const filteredProjects = this.filterProjects(projects, params)
    const sortedProjects = this.sortProjects(filteredProjects, params.sortBy)
    
    // 应用分页
    if (params.page && params.limit) {
      const start = (params.page - 1) * params.limit
      const end = start + params.limit
      return sortedProjects.slice(start, end)
    }
    
    return sortedProjects
    } catch (error: any) {
      console.warn('从智能合约获取项目数据失败:', error)
      
      // 检查是否是网络相关错误
      if (error.message?.includes('missing trie node') || 
          error.message?.includes('Internal JSON-RPC error') ||
          error.code === 'CALL_EXCEPTION') {
        console.warn('检测到BSC Testnet网络问题，切换到fallback数据源')
      }
      
      // 如果合约调用失败，返回空数组，让上层逻辑fallback到其他数据源
      return []
    }
  }

  /**
   * 从 The Graph 数据丰富黑客松信息
   */
  private async enrichHackathonsFromGraph(graphHackathons: any[]): Promise<HackathonData[]> {
    const results = await Promise.allSettled(
      graphHackathons.map(async (h) => {
        try {
          // 如果Graph数据中有dataCID，从IPFS获取详细数据
          if (h.dataCID) {
            return await ipfsDataService.getHackathonData(Number(h.hackathonId || h.id))
          }
          
          // 否则转换Graph数据
          return this.convertGraphHackathonToData(h)
        } catch (error) {
          console.warn(`Failed to enrich hackathon ${h.id}:`, error)
          return this.convertGraphHackathonToData(h)
        }
      })
    )
    
    return results
      .filter((result): result is PromiseFulfilledResult<HackathonData> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }

  /**
   * 转换Graph数据为HackathonData
   */
  private convertGraphHackathonToData(graphData: any): HackathonData {
    return {
      id: Number(graphData.hackathonId || graphData.id),
      organizer: graphData.organizer?.address || graphData.organizer,
      createdAt: new Date(graphData.createdAt * 1000),
      active: true,
      
      title: graphData.hackathonData?.title || `黑客松 #${graphData.id}`,
      description: graphData.hackathonData?.description || '暂无描述',
      startDate: graphData.hackathonData?.startDate ? new Date(graphData.hackathonData.startDate) : new Date(),
      endDate: graphData.hackathonData?.endDate ? new Date(graphData.hackathonData.endDate) : new Date(),
      prizePool: parseFloat(graphData.hackathonData?.prizePool) || 0,
      categories: graphData.hackathonData?.categories || [],
      
      status: 'active' as const,
      isValid: true,
      formattedPrize: '待定',
      duration: '待定',
      timeRemaining: '待定',
    }
  }

  /**
   * 转换API数据为HackathonData
   */
  private convertApiHackathonToData(apiData: any): HackathonData {
    return {
      id: Number(apiData.id),
      organizer: apiData.organizerId,
      createdAt: new Date(apiData.createdAt),
      active: apiData.status === 'active',
      
      title: apiData.title,
      description: apiData.description,
      startDate: new Date(apiData.startDate),
      endDate: new Date(apiData.endDate),
      prizePool: parseFloat(apiData.prizePool) || 0,
      categories: apiData.categories || [],
      
      status: apiData.status,
      isValid: true,
      formattedPrize: `$${apiData.prizePool?.toLocaleString()}` || '待定',
      duration: '待定',
      timeRemaining: '待定',
    }
  }

  /**
   * 筛选黑客松
   */
  private filterHackathons(hackathons: HackathonData[], params: any): HackathonData[] {
    let filtered = [...hackathons]
    
    // 搜索筛选
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(h => 
        h.title.toLowerCase().includes(search) ||
        h.description.toLowerCase().includes(search)
      )
    }
    
    // 分类筛选
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter(h => 
        h.categories.includes(params.category)
      )
    }
    
    // 状态筛选
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(h => h.status === params.status)
    }
    
    return filtered
  }

  /**
   * 排序黑客松
   */
  private sortHackathons(hackathons: HackathonData[], sortBy?: string): HackathonData[] {
    const sorted = [...hackathons]
    
    switch (sortBy) {
      case 'prize':
        return sorted.sort((a, b) => b.prizePool - a.prizePool)
      case 'startDate':
        return sorted.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      case 'endDate':
        return sorted.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
      case 'createdAt':
      default:
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
  }

  /**
   * 筛选项目
   */
  private filterProjects(projects: ProjectData[], params: any): ProjectData[] {
    let filtered = [...projects]
    
    // 黑客松筛选
    if (params.hackathonId) {
      filtered = filtered.filter(p => p.hackathonId === Number(params.hackathonId))
    }
    
    // 搜索筛选
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      )
    }
    
    // 技术栈筛选
    if (params.technology && params.technology !== 'all') {
      filtered = filtered.filter(p => 
        p.techStack.some(tech => tech.toLowerCase().includes(params.technology.toLowerCase()))
      )
    }
    
    return filtered
  }

  /**
   * 排序项目
   */
  private sortProjects(projects: ProjectData[], sortBy?: string): ProjectData[] {
    const sorted = [...projects]
    
    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      case 'submissionTime':
        return sorted.sort((a, b) => b.submissionTime.getTime() - a.submissionTime.getTime())
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case 'createdAt':
      default:
        return sorted.sort((a, b) => b.submissionTime.getTime() - a.submissionTime.getTime())
    }
  }
}

// 导出服务实例
export const dataService = new DataService()

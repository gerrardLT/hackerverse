import { ethers } from 'ethers'

// 合约地址 (BSC 测试网)
export const CONTRACT_ADDRESSES = {
  HACKX_CORE: '0x4BcFE52B6f38881d888b595E201E56B2cde93699',
}

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 97, // BSC Testnet
  name: 'BSC Testnet',
  rpcUrls: [
    'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
    'https://data-seed-prebsc-2-s1.bnbchain.org:8545',
    'https://data-seed-prebsc-1-s2.bnbchain.org:8545',
    'https://data-seed-prebsc-2-s2.bnbchain.org:8545',
    'https://data-seed-prebsc-1-s3.bnbchain.org:8545',
    'https://bsc-testnet.public.blastapi.io',
    'https://bsc-testnet-rpc.publicnode.com'
  ],
  rpcUrl: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
  blockExplorer: 'https://testnet.bscscan.com',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18
  }
}

// HackXCore 合约 ABI
const HACKX_CORE_ABI = [
  // 用户管理
  "function registerUser(string memory profileCID) external",
  "function updateProfile(string memory profileCID) external",
  "function getUser(address userAddress) external view returns (bool isRegistered, string memory profileCID, uint256 registrationTime)",
  
  // 黑客松管理
  "function createHackathon(string memory dataCID) external returns (uint256)",
  "function updateHackathon(uint256 hackathonId, string memory dataCID) external",
  "function getHackathon(uint256 hackathonId) external view returns (address organizer, string memory dataCID, uint256 creationTime, bool isActive)",
  "function getHackathonCount() external view returns (uint256)",
  "function joinHackathon(uint256 hackathonId) external",
  "function leaveHackathon(uint256 hackathonId) external",
  
  // 项目管理
  "function submitProject(uint256 hackathonId, string memory projectDataCID, string memory creatorsCID) external returns (uint256)",
  "function updateProject(uint256 projectId, string memory projectDataCID) external",
  "function getProject(uint256 projectId) external view returns (uint256 hackathonId, string memory projectDataCID, string memory creatorsCID, uint256 submissionTime)",
  "function getProjectCount() external view returns (uint256)",
  
  // 评分管理
  "function submitScore(uint256 projectId, uint256 score) external",
  "function getProjectScore(uint256 projectId) external view returns (uint256 totalScore, uint256 voteCount, uint256 averageScore)",
  
  // 事件
  "event UserRegistered(indexed address user, string profileCID)",
  "event ProfileUpdated(indexed address user, string profileCID)",
  "event HackathonCreated(indexed uint256 hackathonId, indexed address organizer, string dataCID)",
  "event HackathonUpdated(indexed uint256 hackathonId, string dataCID)",
  "event UserJoinedHackathon(indexed uint256 hackathonId, indexed address user)",
  "event UserLeftHackathon(indexed uint256 hackathonId, indexed address user)",
  "event ProjectSubmitted(indexed uint256 projectId, indexed address creator, string projectDataCID)",
  "event ProjectUpdated(indexed uint256 projectId, string projectDataCID)",
  "event ScoreSubmitted(indexed uint256 projectId, indexed address judge, uint256 score)"
];

/**
 * 后端智能合约服务
 * 用于服务端与智能合约交互，使用私钥签名
 */
export class SmartContractService {
  private provider: ethers.JsonRpcProvider | null = null
  private signer: ethers.Wallet | null = null
  public contracts: { [key: string]: ethers.Contract } = {}
  private maxRetries = 3
  private retryDelay = 1000

  async initialize() {
    try {
      // 使用环境变量中的私钥和RPC URL
      const privateKey = process.env.PRIVATE_KEY
      const rpcUrl = process.env.BSC_TESTNET_RPC_URL || NETWORK_CONFIG.rpcUrl

      if (!privateKey) {
        throw new Error('PRIVATE_KEY not found in environment variables')
      }

      // 创建 Provider 和 Signer
      this.provider = new ethers.JsonRpcProvider(rpcUrl)
      this.signer = new ethers.Wallet(privateKey, this.provider)
      
      // 初始化合约
      this.contracts.hackxCore = new ethers.Contract(
        CONTRACT_ADDRESSES.HACKX_CORE,
        HACKX_CORE_ABI,
        this.signer
      )

      console.log('后端智能合约服务初始化成功')
      console.log(`钱包地址: ${this.signer.address}`)
      console.log(`合约地址: ${CONTRACT_ADDRESSES.HACKX_CORE}`)
      
    } catch (error) {
      console.error('后端智能合约初始化失败:', error)
      throw error
    }
  }

  // 重试机制
  private async retryContractCall<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`智能合约调用尝试 ${attempt}/${this.maxRetries}`)
        return await operation()
      } catch (error: any) {
        lastError = error
        console.warn(`智能合约调用失败 (尝试 ${attempt}/${this.maxRetries}):`, error.message)

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === this.maxRetries) {
          break
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }

    // 所有重试都失败了
    console.error('智能合约调用重试全部失败:', lastError)
    throw lastError || new Error('智能合约调用失败')
  }

  // HackXCore 合约方法 - 黑客松管理
  async createHackathon(dataCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const tx = await this.contracts.hackxCore!.createHackathon(dataCID)
      console.log('创建黑客松交易已发送:', tx.hash)
      return tx
    })
  }

  async getHackathonCount() {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      return await this.contracts.hackxCore!.getHackathonCount()
    })
  }

  async getHackathon(hackathonId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const result = await this.contracts.hackxCore!.getHackathon(hackathonId)
      return {
        organizer: result[0],
        dataCID: result[1],
        creationTime: Number(result[2]),
        isActive: result[3]
      }
    })
  }

  // HackXCore 合约方法 - 项目管理
  async submitProject(hackathonId: number, projectDataCID: string, creatorsCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const tx = await this.contracts.hackxCore!.submitProject(hackathonId, projectDataCID, creatorsCID)
      console.log('提交项目交易已发送:', tx.hash)
      return tx
    })
  }

  async getProjectCount() {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      return await this.contracts.hackxCore!.getProjectCount()
    })
  }

  async getProject(projectId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const result = await this.contracts.hackxCore!.getProject(projectId)
      return {
        hackathonId: Number(result[0]),
        projectDataCID: result[1],
        creatorsCID: result[2],
        submissionTime: Number(result[3])
      }
    })
  }

  // HackXCore 合约方法 - 用户管理
  async registerUser(profileCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const tx = await this.contracts.hackxCore!.registerUser(profileCID)
      console.log('注册用户交易已发送:', tx.hash)
      return tx
    })
  }

  async updateProfile(profileCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const tx = await this.contracts.hackxCore!.updateProfile(profileCID)
      console.log('更新用户资料交易已发送:', tx.hash)
      return tx
    })
  }

  async getUser(userAddress: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const result = await this.contracts.hackxCore!.getUser(userAddress)
      return {
        isRegistered: result[0],
        profileCID: result[1],
        registrationTime: Number(result[2])
      }
    })
  }

  // HackXCore 合约方法 - 评分管理
  async submitScore(projectId: number, score: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const tx = await this.contracts.hackxCore!.submitScore(projectId, score)
      console.log('提交评分交易已发送:', tx.hash)
      return tx
    })
  }

  async getProjectScore(projectId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')

    return await this.retryContractCall(async () => {
      const result = await this.contracts.hackxCore!.getProjectScore(projectId)
      return {
        totalScore: Number(result[0]),
        voteCount: Number(result[1]),
        averageScore: Number(result[2])
      }
    })
  }
}

// 导出单例实例
export const smartContractService = new SmartContractService()

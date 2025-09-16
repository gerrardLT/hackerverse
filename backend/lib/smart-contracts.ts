import { ethers } from 'ethers'

// 网络配置
export const NETWORK_CONFIG = {
  bscTestnet: {
    chainId: 97,
    rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    nativeToken: 'tBNB'
  },
  bscMainnet: {
    chainId: 56,
    rpcUrl: process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed1.binance.org/',
    explorerUrl: 'https://bscscan.com',
    nativeToken: 'BNB'
  },
  polygon: {
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeToken: 'MATIC'
  },
  polygonMumbai: {
    chainId: 80001,
    rpcUrl: process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeToken: 'MATIC'
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeToken: 'ETH'
  }
}

// 合约地址配置
export const CONTRACT_ADDRESSES = {
  HACKX_CORE: process.env.HACKX_CORE_ADDRESS || '0x4BcFE52B6f38881d888b595E201E56B2cde93699', // BSC Testnet 实际部署地址
  NFT_CERTIFICATES: process.env.NFT_CERTIFICATES_ADDRESS || '0x0000000000000000000000000000000000000000',
  DAO_GOVERNANCE: process.env.DAO_GOVERNANCE_ADDRESS || '0x0000000000000000000000000000000000000000',
  STAKING: process.env.STAKING_ADDRESS || '0x0000000000000000000000000000000000000000'
}

// HackXCore 合约 ABI
const HACKX_CORE_ABI = [
  // 用户管理
  "function registerUser(string memory profileCID) external",
  "function updateUserProfile(string memory newProfileCID) external",
  "function getUserProfile(address user) external view returns (string memory)",
  "function isUserRegistered(address user) external view returns (bool)",
  
  // 黑客松管理
  "function createHackathon(string memory hackathonDataCID) external returns (uint256)",
  "function updateHackathon(uint256 hackathonId, string memory newDataCID) external",
  "function getHackathonData(uint256 hackathonId) external view returns (string memory)",
  "function joinHackathon(uint256 hackathonId) external",
  "function leaveHackathon(uint256 hackathonId) external",
  "function isParticipant(uint256 hackathonId, address user) external view returns (bool)",
  
  // 项目管理
  "function submitProject(uint256 hackathonId, string memory projectDataCID) external returns (uint256)",
  "function updateProject(uint256 projectId, string memory newDataCID) external",
  "function getProjectData(uint256 projectId) external view returns (string memory)",
  "function getProjectCount(uint256 hackathonId) external view returns (uint256)",
  
  // 评分系统
  "function submitScore(uint256 projectId, uint256 score, string memory feedbackCID) external",
  "function getProjectScores(uint256 projectId) external view returns (uint256[] memory)",
  "function getAverageScore(uint256 projectId) external view returns (uint256)",
  
  // 事件
  "event UserRegistered(address indexed user, string profileCID)",
  "event ProfileUpdated(address indexed user, string newProfileCID)",
  "event HackathonCreated(uint256 indexed hackathonId, address indexed organizer, string dataCID)",
  "event UserJoinedHackathon(uint256 indexed hackathonId, address indexed user)",
  "event UserLeftHackathon(uint256 indexed hackathonId, address indexed user)",
  "event ProjectSubmitted(uint256 indexed projectId, address indexed creator, string projectDataCID)",
  "event ProjectUpdated(uint256 indexed projectId, string projectDataCID)",
  "event ScoreSubmitted(uint256 indexed projectId, address indexed judge, uint256 score)"
]

// NFT证书合约 ABI
const NFT_CERTIFICATES_ABI = [
  "function mintCertificate(address recipient, string memory tokenURI) external returns (uint256)",
  "function getTokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI)"
]

// DAO治理合约 ABI
const DAO_GOVERNANCE_ABI = [
  "function createProposal(string memory description, uint256 votingPeriod) external returns (uint256)",
  "function vote(uint256 proposalId, bool support) external",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (string memory description, uint256 forVotes, uint256 againstVotes, uint256 endTime, bool executed)",
  "function hasVoted(uint256 proposalId, address voter) external view returns (bool)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)",
  "event Voted(uint256 indexed proposalId, address indexed voter, bool support)",
  "event ProposalExecuted(uint256 indexed proposalId)"
]

// 质押合约 ABI
const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function getStakedAmount(address user) external view returns (uint256)",
  "function getRewards(address user) external view returns (uint256)",
  "function getAPY() external view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
]

// 数据类型定义
export interface UserData {
  address: string
  profileCID: string
  isRegistered: boolean
}

export interface HackathonData {
  id: number
  organizer: string
  dataCID: string
  participantCount: number
  projectCount: number
}

export interface ProjectData {
  id: number
  creator: string
  hackathonId: number
  dataCID: string
  submissionTime: number
}

export interface ScoreData {
  projectId: number
  judge: string
  score: number
  feedbackCID: string
}

// 智能合约服务接口
export interface ISmartContractService {
  initialize(): Promise<void>
  getUser(address: string): Promise<UserData>
  getHackathon(id: number): Promise<HackathonData>
  getHackathonCount(): Promise<number>
  getProject(id: number): Promise<ProjectData>
  getProjectCount(): Promise<number>
  registerUser(profileCID: string): Promise<ethers.ContractTransactionResponse>
  updateUserProfile(newProfileCID: string): Promise<ethers.ContractTransactionResponse>
  createHackathon(hackathonDataCID: string): Promise<{hackathonId: number, txHash: string, blockNumber: number | null, gasUsed: number | null}>
  joinHackathon(hackathonId: number): Promise<string>
  submitProject(hackathonId: number, projectDataCID: string): Promise<string>
  submitScore(projectId: number, score: number, feedbackCID: string): Promise<string>
  mintNFT(recipient: string, tokenURI: string): Promise<string>
  createProposal(description: string, votingPeriod: number): Promise<string>
  vote(proposalId: number, support: boolean): Promise<string>
  stake(amount: string): Promise<string>
  unstake(amount: string): Promise<string>
  claimRewards(): Promise<string>
}

/**
 * 统一的智能合约服务
 * 提供完整的错误处理、重试机制和类型安全
 */
export class SmartContractService implements ISmartContractService {
  private provider: ethers.JsonRpcProvider | null = null
  private signer: ethers.Wallet | null = null
  public contracts: { [key: string]: ethers.Contract } = {}
  private maxRetries = 3
  private retryDelay = 1000
  private isInitialized = false

  /**
   * 初始化智能合约服务
   */
  async initialize(): Promise<void> {
    try {
      // 使用环境变量中的私钥和RPC URL
      const privateKey = process.env.PRIVATE_KEY
      const network = process.env.NETWORK || 'bscTestnet'
      const networkConfig = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG]

      if (!privateKey) {
        throw new Error('PRIVATE_KEY not found in environment variables')
      }

      if (!networkConfig) {
        throw new Error(`Unsupported network: ${network}`)
      }

      // 创建 Provider 和 Signer
      this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
      this.signer = new ethers.Wallet(privateKey, this.provider)
      
      // 初始化合约实例
      await this.initializeContracts()
      
      this.isInitialized = true
      console.log('✅ 智能合约服务初始化成功')
      console.log(`📡 网络: ${network} (Chain ID: ${networkConfig.chainId})`)
      console.log(`👤 钱包地址: ${this.signer.address}`)
      
    } catch (error) {
      console.error('❌ 智能合约服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化所有合约实例
   */
  private async initializeContracts(): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer not initialized')
    }

    // 初始化核心合约
    if (CONTRACT_ADDRESSES.HACKX_CORE !== '0x0000000000000000000000000000000000000000') {
      this.contracts.hackxCore = new ethers.Contract(
        CONTRACT_ADDRESSES.HACKX_CORE,
        HACKX_CORE_ABI,
        this.signer
      )
      console.log(`📋 HackXCore合约: ${CONTRACT_ADDRESSES.HACKX_CORE}`)
    }

    // 初始化NFT合约
    if (CONTRACT_ADDRESSES.NFT_CERTIFICATES !== '0x0000000000000000000000000000000000000000') {
      this.contracts.nftCertificates = new ethers.Contract(
        CONTRACT_ADDRESSES.NFT_CERTIFICATES,
        NFT_CERTIFICATES_ABI,
        this.signer
      )
      console.log(`🎨 NFT证书合约: ${CONTRACT_ADDRESSES.NFT_CERTIFICATES}`)
    }

    // 初始化DAO合约
    if (CONTRACT_ADDRESSES.DAO_GOVERNANCE !== '0x0000000000000000000000000000000000000000') {
      this.contracts.daoGovernance = new ethers.Contract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DAO_GOVERNANCE_ABI,
        this.signer
      )
      console.log(`🏛️ DAO治理合约: ${CONTRACT_ADDRESSES.DAO_GOVERNANCE}`)
    }

    // 初始化质押合约
    if (CONTRACT_ADDRESSES.STAKING !== '0x0000000000000000000000000000000000000000') {
      this.contracts.staking = new ethers.Contract(
        CONTRACT_ADDRESSES.STAKING,
        STAKING_ABI,
        this.signer
      )
      console.log(`💰 质押合约: ${CONTRACT_ADDRESSES.STAKING}`)
    }
  }

  /**
   * 重试机制
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`⚠️ 操作失败，重试 ${i + 1}/${maxRetries}:`, lastError.message)
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)))
        }
      }
    }

    throw lastError || new Error('Operation failed after all retries')
  }

  /**
   * 检查服务是否已初始化
   */
  private checkInitialization(): void {
    if (!this.isInitialized || !this.signer) {
      throw new Error('SmartContractService not initialized. Call initialize() first.')
    }
  }

  /**
   * 检查合约是否可用
   */
  private checkContract(contractName: string): ethers.Contract {
    const contract = this.contracts[contractName]
    if (!contract) {
      throw new Error(`Contract ${contractName} not available`)
    }
    return contract
  }

  // 用户管理方法
  async getUser(address: string): Promise<UserData> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const [isRegistered, profileCID] = await Promise.all([
        contract.isUserRegistered(address),
        contract.getUserProfile(address)
      ])

      return {
        address,
        profileCID: profileCID || '',
        isRegistered
      }
    })
  }

  async isUserRegistered(address: string): Promise<boolean> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      return await contract.isUserRegistered(address)
    })
  }

  async registerUser(profileCID: string): Promise<ethers.ContractTransactionResponse> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const tx = await contract.registerUser(profileCID)
      return tx
    })
  }

  async updateUserProfile(newProfileCID: string): Promise<ethers.ContractTransactionResponse> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const tx = await contract.updateUserProfile(newProfileCID)
      return tx
    })
  }

  // 黑客松管理方法
  async getHackathon(id: number): Promise<HackathonData> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const [dataCID, participants] = await Promise.all([
        contract.getHackathonData(id),
        contract.getHackathonParticipants(id)
      ])
      
      return {
        id,
        organizer: this.signer!.address, // 需要从合约获取实际组织者
        dataCID,
        participantCount: participants.length,
        projectCount: 0 // 需要从合约获取项目数量
      }
    })
  }

  async getHackathonCount(): Promise<number> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const count = await contract.getHackathonCount()
      return Number(count)
    })
  }

  async getProjectCount(): Promise<number> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const count = await contract.getProjectCount()
      return Number(count)
    })
  }

  async createHackathon(hackathonDataCID: string): Promise<{hackathonId: number, txHash: string, blockNumber: number | null, gasUsed: number | null}> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      // createHackathon返回hackathonId，但我们需要交易信息
      // 所以我们需要分别处理交易和返回值
      const tx = await contract.createHackathon.populateTransaction(hackathonDataCID)
      const txResponse = await this.signer!.sendTransaction(tx)
      const receipt = await txResponse.wait()
      
      // 从事件中解析hackathonId
      const hackathonCreatedEvent = receipt?.logs?.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log)
          return parsedLog?.name === 'HackathonCreated'
        } catch {
          return false
        }
      })
      
      let hackathonId = 1 // 默认值
      if (hackathonCreatedEvent) {
        const parsedLog = contract.interface.parseLog(hackathonCreatedEvent)
        hackathonId = Number(parsedLog?.args?.hackathonId || 1)
      }
      
      return {
        hackathonId,
        txHash: receipt?.hash || txResponse.hash,
        blockNumber: receipt?.blockNumber || null,
        gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : null
      }
    })
  }

  async joinHackathon(hackathonId: number): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const tx = await contract.joinHackathon(hackathonId)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  // 项目管理方法
  async getProject(id: number): Promise<ProjectData> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const dataCID = await contract.getProjectData(id)
      // 注意：这里需要根据实际合约方法调整
      return {
        id,
        creator: this.signer!.address, // 简化处理
        hackathonId: 0, // 需要从合约获取
        dataCID,
        submissionTime: Date.now() // 需要从合约获取
      }
    })
  }

  async submitProject(hackathonId: number, projectDataCID: string): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const tx = await contract.submitProject(hackathonId, projectDataCID)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  async submitScore(projectId: number, score: number, feedbackCID: string): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('hackxCore')

    return await this.retryOperation(async () => {
      const tx = await contract.submitScore(projectId, score, feedbackCID)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  // NFT方法
  async mintNFT(recipient: string, tokenURI: string): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('nftCertificates')

    return await this.retryOperation(async () => {
      const tx = await contract.mintCertificate(recipient, tokenURI)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  // DAO治理方法
  async createProposal(description: string, votingPeriod: number): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('daoGovernance')

    return await this.retryOperation(async () => {
      const tx = await contract.createProposal(description, votingPeriod)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  async vote(proposalId: number, support: boolean): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('daoGovernance')

    return await this.retryOperation(async () => {
      const tx = await contract.vote(proposalId, support)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  // 质押方法
  async stake(amount: string): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('staking')

    return await this.retryOperation(async () => {
      const tx = await contract.stake(amount)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  async unstake(amount: string): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('staking')

    return await this.retryOperation(async () => {
      const tx = await contract.unstake(amount)
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  async claimRewards(): Promise<string> {
    this.checkInitialization()
    const contract = this.checkContract('staking')

    return await this.retryOperation(async () => {
      const tx = await contract.claimRewards()
      const receipt = await tx.wait()
      return receipt.hash
    })
  }

  /**
   * 获取Gas估算
   */
  async estimateGas(contractName: string, method: string, ...args: any[]): Promise<bigint> {
    this.checkInitialization()
    const contract = this.checkContract(contractName)
    
    return await this.retryOperation(async () => {
      return await contract[method].estimateGas(...args)
    })
  }

  /**
   * 获取当前Gas价格
   */
  async getGasPrice(): Promise<bigint> {
    this.checkInitialization()
    return await this.provider!.getFeeData().then(data => data.gasPrice || BigInt(0))
  }

  /**
   * 获取网络信息
   */
  async getNetworkInfo() {
    this.checkInitialization()
    const network = await this.provider!.getNetwork()
    const blockNumber = await this.provider!.getBlockNumber()
    
    return {
      chainId: network.chainId,
      blockNumber,
      name: network.name
    }
  }
}

// 创建单例实例
export const smartContractService = new SmartContractService()

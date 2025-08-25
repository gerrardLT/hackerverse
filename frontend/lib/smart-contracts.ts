'use client'

import { ethers } from 'ethers'

// 合约地址 (BSC 测试网)
export const CONTRACT_ADDRESSES = {
  HACKX_CORE: '0x4BcFE52B6f38881d888b595E201E56B2cde93699',
  // 注意：目前只部署了 HackXCore 核心合约
  // 其他合约地址将在后续部署时更新
  DAO: '0x2345678901234567890123456789012345678901', // 待部署
  TOKEN: '0x3456789012345678901234567890123456789012', // 待部署
  NFT: '0x4567890123456789012345678901234567890123' // 待部署
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
  rpcUrl: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545', // 保持向后兼容
  blockExplorer: 'https://testnet.bscscan.com',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18
  }
}

// HackXCore 合约 ABI (简化版)
export const HACKX_CORE_ABI = [
  // 用户管理
  'function registerUser(string memory profileCID) external',
  'function getUser(address userAddress) external view returns (tuple(address userAddress, string profileCID, uint256 registrationTime, bool active))',
  'function getUserCount() external view returns (uint256)',
  
  // 黑客松管理
  'function createHackathon(string memory dataCID) external returns (uint256)',
  'function updateHackathon(uint256 hackathonId, string memory dataCID) external',
  'function getHackathon(uint256 hackathonId) external view returns (tuple(uint256 id, address organizer, string dataCID, uint256 creationTime, bool active))',
  'function getHackathonCount() external view returns (uint256)',
  
  // 参与者管理  
  'function addParticipant(uint256 hackathonId, address participant) external',
  'function removeParticipant(uint256 hackathonId, address participant) external',
  'function getParticipants(uint256 hackathonId) external view returns (address[])',
  'function isParticipant(uint256 hackathonId, address participant) external view returns (bool)',
  
  // 项目提交
  'function submitProject(uint256 hackathonId, string memory projectDataCID) external returns (uint256)',
  'function updateProject(uint256 projectId, string memory projectDataCID) external',
  'function getProject(uint256 projectId) external view returns (tuple(uint256 id, uint256 hackathonId, address creator, string projectDataCID, uint256 submissionTime))',
  'function getProjectsByHackathon(uint256 hackathonId) external view returns (uint256[])',
  'function getProjectCount() external view returns (uint256)',
  
  // 评分系统
  'function submitScore(uint256 projectId, uint256 score, string memory feedbackCID) external',
  'function getProjectScores(uint256 projectId) external view returns (tuple(address judge, uint256 score, string feedbackCID, uint256 submissionTime)[])',
  'function getAverageScore(uint256 projectId) external view returns (uint256)',
  
  // 事件
  'event UserRegistered(address indexed userAddress, string profileCID)',
  'event HackathonCreated(uint256 indexed hackathonId, address indexed organizer, string dataCID)',
  'event HackathonUpdated(uint256 indexed hackathonId, string dataCID)',
  'event ParticipantAdded(uint256 indexed hackathonId, address indexed participant)',
  'event ParticipantRemoved(uint256 indexed hackathonId, address indexed participant)',
  'event ProjectSubmitted(uint256 indexed projectId, uint256 indexed hackathonId, address indexed creator, string projectDataCID)',
  'event ProjectUpdated(uint256 indexed projectId, string projectDataCID)',
  'event ScoreSubmitted(uint256 indexed projectId, address indexed judge, uint256 score, string feedbackCID)'
]

export const DAO_ABI = [
  'function createProposal(string memory title, string memory description, uint256 votingPeriod) external returns (uint256)',
  'function vote(uint256 proposalId, bool support) external',
  'function executeProposal(uint256 proposalId) external',
  'function getProposal(uint256 id) external view returns (tuple(string title, string description, uint256 forVotes, uint256 againstVotes, uint256 endTime, bool executed, address proposer))',
  'function getVotingPower(address user) external view returns (uint256)',
  'event ProposalCreated(uint256 indexed id, string title, address proposer)',
  'event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 weight)',
  'event ProposalExecuted(uint256 indexed proposalId)'
]

export const TOKEN_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function stake(uint256 amount) external',
  'function unstake(uint256 amount) external',
  'function claimRewards() external',
  'function getStakedAmount(address user) external view returns (uint256)',
  'function getPendingRewards(address user) external view returns (uint256)',
  'function totalStaked() external view returns (uint256)',
  'function getAPY() external view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)'
]

export const NFT_ABI = [
  'function mintCertificate(address to, uint256 hackathonId, uint256 rank, string memory metadataURI) external',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function getCertificateInfo(uint256 tokenId) external view returns (tuple(uint256 hackathonId, uint256 rank, uint256 mintTime))',
  'event CertificateMinted(address indexed to, uint256 indexed tokenId, uint256 hackathonId, uint256 rank)'
]

export class SmartContractService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private contracts: { [key: string]: ethers.Contract } = {}
  private maxRetries = 3
  private retryDelay = 1000

  async initialize(provider?: ethers.BrowserProvider, signer?: ethers.JsonRpcSigner) {
    try {
      // 如果提供了外部的provider和signer，优先使用它们
      if (provider && signer) {
        this.provider = provider
        this.signer = signer
      } else if (typeof window !== 'undefined' && window.ethereum) {
        // 否则尝试创建新的连接
        this.provider = new ethers.BrowserProvider(window.ethereum)
        this.signer = await this.provider.getSigner()
      } else {
        console.warn('没有可用的钱包provider')
        return
      }
      
      // 初始化合约实例 - 只初始化已部署的合约
      this.contracts.hackxCore = new ethers.Contract(
        CONTRACT_ADDRESSES.HACKX_CORE,
        HACKX_CORE_ABI,
        this.signer
      )
      
      // 其他合约暂时不初始化，因为还没有部署
      // this.contracts.dao = new ethers.Contract(
      //   CONTRACT_ADDRESSES.DAO,
      //   DAO_ABI,
      //   this.signer
      // )
      
      console.log('智能合约服务初始化成功')
    } catch (error) {
      console.warn('智能合约初始化失败:', error)
      // 不抛出错误，允许应用继续运行
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

  // HackXCore 合约方法 - 用户管理
  async registerUser(profileCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.registerUser(profileCID)
    return await tx.wait()
  }

  async getUser(address: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getUser(address)
  }

  async getUserCount() {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getUserCount()
  }

  // HackXCore 合约方法 - 黑客松管理
  async createHackathon(dataCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.createHackathon(dataCID)
    return await tx.wait()
  }

  async updateHackathon(hackathonId: number, dataCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.updateHackathon(hackathonId, dataCID)
    return await tx.wait()
  }

  async getHackathon(hackathonId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getHackathon(hackathonId)
  }

  async getHackathonCount() {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.retryContractCall(async () => {
      return await this.contracts.hackxCore!.getHackathonCount()
    })
  }

  // HackXCore 合约方法 - 参与者管理
  async addParticipant(hackathonId: number, participant: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.addParticipant(hackathonId, participant)
    return await tx.wait()
  }

  async removeParticipant(hackathonId: number, participant: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.removeParticipant(hackathonId, participant)
    return await tx.wait()
  }

  async getParticipants(hackathonId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getParticipants(hackathonId)
  }

  async isParticipant(hackathonId: number, participant: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.isParticipant(hackathonId, participant)
  }

  // HackXCore 合约方法 - 项目提交
  async submitProject(hackathonId: number, projectDataCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.submitProject(hackathonId, projectDataCID)
    return await tx.wait()
  }

  async updateProject(projectId: number, projectDataCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.updateProject(projectId, projectDataCID)
    return await tx.wait()
  }

  async getProject(projectId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getProject(projectId)
  }

  async getProjectsByHackathon(hackathonId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getProjectsByHackathon(hackathonId)
  }

  async getProjectCount() {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.retryContractCall(async () => {
      return await this.contracts.hackxCore!.getProjectCount()
    })
  }

  // HackXCore 合约方法 - 评分系统
  async submitScore(projectId: number, score: number, feedbackCID: string) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackxCore.submitScore(projectId, score, feedbackCID)
    return await tx.wait()
  }

  async getProjectScores(projectId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getProjectScores(projectId)
  }

  async getAverageScore(projectId: number) {
    if (!this.contracts.hackxCore) throw new Error('Contract not initialized')
    
    return await this.contracts.hackxCore.getAverageScore(projectId)
  }

  // DAO合约方法
  async createProposal(title: string, description: string, votingPeriod: number) {
    if (!this.contracts.dao) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.dao.createProposal(title, description, votingPeriod)
    return await tx.wait()
  }

  async vote(proposalId: number, support: boolean) {
    if (!this.contracts.dao) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.dao.vote(proposalId, support)
    return await tx.wait()
  }

  async getProposal(id: number) {
    if (!this.contracts.dao) throw new Error('Contract not initialized')
    
    return await this.contracts.dao.getProposal(id)
  }

  async getVotingPower(address: string) {
    if (!this.contracts.dao) throw new Error('Contract not initialized')
    
    return await this.contracts.dao.getVotingPower(address)
  }

  // 代币合约方法
  async getTokenBalance(address: string) {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const balance = await this.contracts.token.balanceOf(address)
    return ethers.formatEther(balance)
  }

  async stakeTokens(amount: string) {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.token.stake(ethers.parseEther(amount))
    return await tx.wait()
  }

  async unstakeTokens(amount: string) {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.token.unstake(ethers.parseEther(amount))
    return await tx.wait()
  }

  async claimRewards() {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.token.claimRewards()
    return await tx.wait()
  }

  async getStakedAmount(address: string) {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const amount = await this.contracts.token.getStakedAmount(address)
    return ethers.formatEther(amount)
  }

  async getPendingRewards(address: string) {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const rewards = await this.contracts.token.getPendingRewards(address)
    return ethers.formatEther(rewards)
  }

  async getAPY() {
    if (!this.contracts.token) throw new Error('Contract not initialized')
    
    const apy = await this.contracts.token.getAPY()
    return Number(apy) / 100 // 转换为百分比
  }

  // NFT合约方法
  async getUserCertificates(address: string) {
    if (!this.contracts.nft) throw new Error('Contract not initialized')
    
    const balance = await this.contracts.nft.balanceOf(address)
    const certificates = []
    
    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await this.contracts.nft.tokenOfOwnerByIndex(address, i)
      const tokenURI = await this.contracts.nft.tokenURI(tokenId)
      const info = await this.contracts.nft.getCertificateInfo(tokenId)
      
      certificates.push({
        tokenId: Number(tokenId),
        tokenURI,
        hackathonId: Number(info.hackathonId),
        rank: Number(info.rank),
        mintTime: Number(info.mintTime)
      })
    }
    
    return certificates
  }

  // 事件监听
  setupEventListeners(callbacks: {
    onUserRegistered?: (event: any) => void
    onHackathonCreated?: (event: any) => void
    onHackathonUpdated?: (event: any) => void
    onParticipantAdded?: (event: any) => void
    onParticipantRemoved?: (event: any) => void
    onProjectSubmitted?: (event: any) => void
    onProjectUpdated?: (event: any) => void
    onScoreSubmitted?: (event: any) => void
    onProposalCreated?: (event: any) => void
    onVoteCast?: (event: any) => void
    onStaked?: (event: any) => void
    onRewardsClaimed?: (event: any) => void
    onCertificateMinted?: (event: any) => void
  }) {
    if (!this.contracts.hackxCore) return

    // HackXCore 事件
    if (callbacks.onUserRegistered) {
      this.contracts.hackxCore.on('UserRegistered', callbacks.onUserRegistered)
    }
    if (callbacks.onHackathonCreated) {
      this.contracts.hackxCore.on('HackathonCreated', callbacks.onHackathonCreated)
    }
    if (callbacks.onHackathonUpdated) {
      this.contracts.hackxCore.on('HackathonUpdated', callbacks.onHackathonUpdated)
    }
    if (callbacks.onParticipantAdded) {
      this.contracts.hackxCore.on('ParticipantAdded', callbacks.onParticipantAdded)
    }
    if (callbacks.onParticipantRemoved) {
      this.contracts.hackxCore.on('ParticipantRemoved', callbacks.onParticipantRemoved)
    }
    if (callbacks.onProjectSubmitted) {
      this.contracts.hackxCore.on('ProjectSubmitted', callbacks.onProjectSubmitted)
    }
    if (callbacks.onProjectUpdated) {
      this.contracts.hackxCore.on('ProjectUpdated', callbacks.onProjectUpdated)
    }
    if (callbacks.onScoreSubmitted) {
      this.contracts.hackxCore.on('ScoreSubmitted', callbacks.onScoreSubmitted)
    }

    // DAO事件
    if (callbacks.onProposalCreated) {
      this.contracts.dao.on('ProposalCreated', callbacks.onProposalCreated)
    }
    if (callbacks.onVoteCast) {
      this.contracts.dao.on('VoteCast', callbacks.onVoteCast)
    }

    // 代币事件
    if (callbacks.onStaked) {
      this.contracts.token.on('Staked', callbacks.onStaked)
    }
    if (callbacks.onRewardsClaimed) {
      this.contracts.token.on('RewardsClaimed', callbacks.onRewardsClaimed)
    }

    // NFT事件
    if (callbacks.onCertificateMinted) {
      this.contracts.nft.on('CertificateMinted', callbacks.onCertificateMinted)
    }
  }

  // 清理事件监听
  removeAllListeners() {
    Object.values(this.contracts).forEach(contract => {
      contract.removeAllListeners()
    })
  }
}

export const smartContractService = new SmartContractService()


export const HACKX_CORE_ADDRESS: { [key: number]: string } = {
  [97]: '0x4BcFE52B6f38881d888b595E201E56B2cde93699'  // BSC Testnet
};

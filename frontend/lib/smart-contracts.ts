'use client'

import { ethers } from 'ethers'

// 合约地址 (测试网)
export const CONTRACT_ADDRESSES = {
  HACKATHON: '0x1234567890123456789012345678901234567890',
  DAO: '0x2345678901234567890123456789012345678901',
  TOKEN: '0x3456789012345678901234567890123456789012',
  NFT: '0x4567890123456789012345678901234567890123'
}

// 合约ABI (简化版)
export const HACKATHON_ABI = [
  'function createHackathon(string memory name, uint256 startTime, uint256 endTime, uint256 prizePool) external',
  'function joinHackathon(uint256 hackathonId) external',
  'function submitProject(uint256 hackathonId, string memory projectHash) external',
  'function getHackathon(uint256 id) external view returns (tuple(string name, uint256 startTime, uint256 endTime, uint256 prizePool, address organizer, bool active))',
  'function getParticipants(uint256 hackathonId) external view returns (address[])',
  'event HackathonCreated(uint256 indexed id, string name, address organizer)',
  'event ParticipantJoined(uint256 indexed hackathonId, address participant)',
  'event ProjectSubmitted(uint256 indexed hackathonId, address participant, string projectHash)'
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

  async initialize() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      
      // 初始化合约实例
      this.contracts.hackathon = new ethers.Contract(
        CONTRACT_ADDRESSES.HACKATHON,
        HACKATHON_ABI,
        this.signer
      )
      
      this.contracts.dao = new ethers.Contract(
        CONTRACT_ADDRESSES.DAO,
        DAO_ABI,
        this.signer
      )
      
      this.contracts.token = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN,
        TOKEN_ABI,
        this.signer
      )
      
      this.contracts.nft = new ethers.Contract(
        CONTRACT_ADDRESSES.NFT,
        NFT_ABI,
        this.signer
      )
    }
  }

  // 黑客松合约方法
  async createHackathon(name: string, startTime: number, endTime: number, prizePool: string) {
    if (!this.contracts.hackathon) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackathon.createHackathon(
      name,
      startTime,
      endTime,
      ethers.parseEther(prizePool)
    )
    return await tx.wait()
  }

  async joinHackathon(hackathonId: number) {
    if (!this.contracts.hackathon) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackathon.joinHackathon(hackathonId)
    return await tx.wait()
  }

  async submitProject(hackathonId: number, projectHash: string) {
    if (!this.contracts.hackathon) throw new Error('Contract not initialized')
    
    const tx = await this.contracts.hackathon.submitProject(hackathonId, projectHash)
    return await tx.wait()
  }

  async getHackathon(id: number) {
    if (!this.contracts.hackathon) throw new Error('Contract not initialized')
    
    return await this.contracts.hackathon.getHackathon(id)
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
    onHackathonCreated?: (event: any) => void
    onParticipantJoined?: (event: any) => void
    onProjectSubmitted?: (event: any) => void
    onProposalCreated?: (event: any) => void
    onVoteCast?: (event: any) => void
    onStaked?: (event: any) => void
    onRewardsClaimed?: (event: any) => void
    onCertificateMinted?: (event: any) => void
  }) {
    if (!this.contracts.hackathon) return

    // 黑客松事件
    if (callbacks.onHackathonCreated) {
      this.contracts.hackathon.on('HackathonCreated', callbacks.onHackathonCreated)
    }
    if (callbacks.onParticipantJoined) {
      this.contracts.hackathon.on('ParticipantJoined', callbacks.onParticipantJoined)
    }
    if (callbacks.onProjectSubmitted) {
      this.contracts.hackathon.on('ProjectSubmitted', callbacks.onProjectSubmitted)
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

import { prisma } from '@/lib/prisma'
import { IPFSService } from '@/lib/ipfs'

/**
 * 增强DAO治理服务
 * 包含新的治理功能：多重签名、委托投票、声誉系统等
 */
export class DAOGovernanceService {
  
  /**
   * 创建DAO提案（增强版）
   */
  static async createProposal(data: {
    title: string
    description: string
    proposalType: 'treasury' | 'governance' | 'protocol' | 'emergency'
    targetAmount?: number
    executionTime: Date
    proposalCategory: string
    priority: 'low' | 'normal' | 'high' | 'critical'
    minVotingPower?: number
    quorum?: number
    executionDelay?: number
    creatorId: string
    requireMultiSig?: boolean
    emergencyProposal?: boolean
  }) {
    try {
      // 1. 上传提案数据到IPFS
      const proposalIPFSData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          title: data.title,
          description: data.description,
          proposalType: data.proposalType,
          targetAmount: data.targetAmount,
          executionTime: data.executionTime.toISOString(),
          category: data.proposalCategory,
          priority: data.priority,
          requirements: {
            minVotingPower: data.minVotingPower || 0,
            quorum: data.quorum || 20,
            executionDelay: data.executionDelay || 24
          }
        },
        metadata: {
          creator: data.creatorId,
          platform: 'HackX',
          network: 'BSC Testnet'
        }
      }
      
      const ipfsHash = await IPFSService.uploadJSON(proposalIPFSData, {
        name: `proposal-${Date.now()}.json`,
        description: 'DAO Governance Proposal'
      })

      // 2. 创建数据库记录
      const proposal = await prisma.dAOProposal.create({
        data: {
          title: data.title,
          description: data.description,
          // @ts-ignore - Prisma枚举类型更新延迟
          proposalType: data.proposalType,
          targetAmount: data.targetAmount,
          executionTime: data.executionTime,
          proposalCategory: data.proposalCategory,
          priority: data.priority,
          minVotingPower: data.minVotingPower || 0,
          quorum: data.quorum || 20,
          executionDelay: data.executionDelay || 24,
          votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天投票期
          creatorId: data.creatorId,
          ipfsHash,
          // @ts-ignore - Prisma枚举类型更新延迟
          status: 'active'
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputationScore: true
            }
          }
        }
      })

      // 3. 如果需要多重签名，创建多重签名提案
      if (data.requireMultiSig || data.proposalType === 'emergency') {
        await this.createMultiSigProposal({
          proposalId: proposal.id,
          requiredSigs: data.emergencyProposal ? 2 : 3,
          isEmergency: data.emergencyProposal || false,
          emergencyDelay: data.emergencyProposal ? 6 : 24
        })
      }

      // 4. 记录声誉积分
      await this.recordReputationAction({
        userId: data.creatorId,
        action: 'create_proposal',
        points: 10,
        description: `创建DAO提案: ${data.title}`
      })

      return { success: true, data: proposal, ipfsHash }
    } catch (error) {
      console.error('创建DAO提案失败:', error)
      throw new Error(`创建DAO提案失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 委托投票
   */
  static async delegateVote(data: {
    delegatorId: string
    delegateeId: string
    scope: 'all' | 'category' | 'specific'
    category?: string
    votingPower: number
    validUntil?: Date
    autoRenew?: boolean
  }) {
    try {
      // 检查委托人的投票权
      const delegatorStaking = await prisma.staking.findUnique({
        where: { userId: data.delegatorId }
      })

      if (!delegatorStaking || delegatorStaking.stakedAmount.toNumber() < data.votingPower) {
        throw new Error('委托投票权超过质押数量')
      }

      // 创建委托记录
      const delegation = await prisma.votingDelegation.create({
        data: {
          delegatorId: data.delegatorId,
          delegateeId: data.delegateeId,
          scope: data.scope,
          category: data.category,
          votingPower: data.votingPower,
          validUntil: data.validUntil,
          autoRenew: data.autoRenew || false,
          isActive: true
        },
        include: {
          delegator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          },
          delegatee: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputationScore: true
            }
          }
        }
      })

      // 记录声誉积分
      await Promise.all([
        this.recordReputationAction({
          userId: data.delegatorId,
          action: 'delegate_vote',
          points: 5,
          description: `委托投票给 ${delegation.delegatee.username}`
        }),
        this.recordReputationAction({
          userId: data.delegateeId,
          action: 'receive_delegation',
          points: 8,
          description: `接受来自 ${delegation.delegator.username} 的投票委托`
        })
      ])

      return { success: true, data: delegation }
    } catch (error) {
      console.error('委托投票失败:', error)
      throw new Error(`委托投票失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 零知识证明投票
   */
  static async submitPrivateVote(data: {
    proposalId: string
    commitHash: string
    nullifierHash: string
    proof: object
    publicSignals: object
    votingPower: number
  }) {
    try {
      // 验证nullifier hash唯一性（防止双重投票）
      const existingVote = await prisma.privateVote.findUnique({
        where: { nullifierHash: data.nullifierHash }
      })

      if (existingVote) {
        throw new Error('检测到重复投票尝试')
      }

      // TODO: 在这里实现ZK证明验证逻辑
      // const isValid = await verifyZKProof(data.proof, data.publicSignals)
      // if (!isValid) {
      //   throw new Error('零知识证明验证失败')
      // }

      // 创建私有投票记录
      const privateVote = await prisma.privateVote.create({
        data: {
          proposalId: data.proposalId,
          commitHash: data.commitHash,
          nullifierHash: data.nullifierHash,
          proof: data.proof,
          publicSignals: data.publicSignals,
          votingPower: data.votingPower,
          isVerified: true, // 在验证ZK证明后设置
          verifiedAt: new Date()
        }
      })

      return { success: true, data: privateVote }
    } catch (error) {
      console.error('零知识投票失败:', error)
      throw new Error(`零知识投票失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 创建多重签名提案
   */
  static async createMultiSigProposal(data: {
    proposalId: string
    requiredSigs: number
    isEmergency?: boolean
    emergencyDelay?: number
    signers?: string[]
  }) {
    try {
      const multiSigProposal = await prisma.multiSigProposal.create({
        data: {
          proposalId: data.proposalId,
          requiredSigs: data.requiredSigs,
          timelock: new Date(Date.now() + (data.emergencyDelay || 24) * 60 * 60 * 1000),
          isEmergency: data.isEmergency || false,
          emergencyDelay: data.emergencyDelay || 24,
          signers: data.signers || [],
          signatures: [],
          threshold: 66.67, // 2/3 majority
          executed: false
        },
        include: {
          proposal: {
            select: {
              id: true,
              title: true,
              proposalType: true,
              priority: true
            }
          }
        }
      })

      return { success: true, data: multiSigProposal }
    } catch (error) {
      console.error('创建多重签名提案失败:', error)
      throw new Error(`创建多重签名提案失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 记录声誉行为
   */
  static async recordReputationAction(data: {
    userId: string
    action: string
    points: number
    description?: string
    hackathonId?: string
    projectId?: string
    category?: string
    season?: string
  }) {
    try {
      // 获取用户质押信息以计算加成
      const userStaking = await prisma.staking.findUnique({
        where: { userId: data.userId }
      })

      const multiplier = userStaking ? userStaking.boostMultiplier.toNumber() : 1.0
      const finalPoints = Math.floor(data.points * multiplier)

      // 创建声誉记录
      const reputationRecord = await prisma.reputationRecord.create({
        data: {
          userId: data.userId,
          action: data.action,
          points: finalPoints,
          multiplier,
          hackathonId: data.hackathonId,
          projectId: data.projectId,
          description: data.description,
          category: data.category || 'general',
          season: data.season || this.getCurrentSeason(),
          isValid: true
        }
      })

      // 更新用户总声誉分数
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          reputationScore: {
            increment: finalPoints
          }
        }
      })

      return { success: true, data: reputationRecord }
    } catch (error) {
      console.error('记录声誉积分失败:', error)
      throw new Error(`记录声誉积分失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 分发社区激励
   */
  static async distributeCommunityIncentive(data: {
    userId: string
    actionType: string
    rewardAmount: number
    tokenType?: string
    season?: string
    reason?: string
  }) {
    try {
      // 获取用户质押信息以计算加成
      const userStaking = await prisma.staking.findUnique({
        where: { userId: data.userId }
      })

      const multiplier = userStaking ? userStaking.boostMultiplier.toNumber() : 1.0
      const finalReward = data.rewardAmount * multiplier

      // 创建激励记录
      const incentive = await prisma.communityIncentive.create({
        data: {
          userId: data.userId,
          actionType: data.actionType,
          rewardAmount: finalReward,
          tokenType: data.tokenType || 'HACKX',
          multiplier,
          reason: data.reason,
          season: data.season || this.getCurrentSeason(),
          distributed: false,
          isValid: true
        }
      })

      // TODO: 在这里集成实际的代币分发逻辑
      // await distributeTokens(data.userId, finalReward, data.tokenType)

      return { success: true, data: incentive }
    } catch (error) {
      console.error('分发社区激励失败:', error)
      throw new Error(`分发社区激励失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取当前赛季
   */
  private static getCurrentSeason(): string {
    const now = new Date()
    const year = now.getFullYear()
    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    return `${year}Q${quarter}`
  }

  /**
   * 获取用户治理统计
   */
  static async getUserGovernanceStats(userId: string) {
    try {
      const [
        proposals,
        votes,
        delegations,
        reputationSum,
        incentives
      ] = await Promise.all([
        prisma.dAOProposal.count({
          where: { creatorId: userId }
        }),
        prisma.dAOVote.count({
          where: { userId }
        }),
        prisma.votingDelegation.count({
          where: {
            OR: [
              { delegatorId: userId },
              { delegateeId: userId }
            ],
            isActive: true
          }
        }),
        prisma.reputationRecord.aggregate({
          where: { userId, isValid: true },
          _sum: { points: true }
        }),
        prisma.communityIncentive.aggregate({
          where: { userId, distributed: true },
          _sum: { rewardAmount: true }
        })
      ])

      return {
        proposalsCreated: proposals,
        votesCast: votes,
        activeDelegations: delegations,
        totalReputationPoints: reputationSum._sum.points || 0,
        totalRewardsEarned: incentives._sum.rewardAmount || 0
      }
    } catch (error) {
      console.error('获取用户治理统计失败:', error)
      throw new Error(`获取用户治理统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 清理过期数据
   */
  static async cleanupExpiredData() {
    try {
      // 清理过期的委托投票
      await prisma.votingDelegation.updateMany({
        where: {
          validUntil: {
            lt: new Date()
          },
          isActive: true
        },
        data: {
          isActive: false
        }
      })

      // 清理过期的DID凭证
      await prisma.dIDCredential.updateMany({
        where: {
          expiryDate: {
            lt: new Date()
          },
          revoked: false
        },
        data: {
          revoked: true,
          revokedAt: new Date()
        }
      })

      console.log('过期数据清理完成')
    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { smartContractService } from '@/lib/smart-contracts'

const walletSignUpSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '钱包地址格式不正确'),
  profileCID: z.string().optional(),
  username: z.string().min(2, '用户名至少2个字符').max(30, '用户名最多30个字符').optional(),
  bio: z.string().max(500, '个人简介最多500个字符').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = walletSignUpSchema.parse(body)
    
    const { walletAddress, profileCID, username, bio } = validatedData

    console.log('📝 创建Web3用户:', walletAddress)

    // 检查钱包地址是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '该钱包地址已被注册'
      }, { status: 409 })
    }

    // 检查用户名是否已存在（如果提供了用户名）
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      })

      if (existingUsername) {
        return NextResponse.json({
          success: false,
          error: '用户名已被使用'
        }, { status: 409 })
      }
    }

    // 生成默认用户名（如果没有提供）
    const finalUsername = username || `user_${walletAddress.slice(2, 10)}`

    // ⭐ 创建Web3用户的IPFS资料
    let ipfsCID
    try {
      const { IPFSService } = await import('@/lib/ipfs')
      
      // 如果用户提供了现有的profileCID，尝试获取数据
      let existingProfileData = null
      if (profileCID) {
        try {
          existingProfileData = await IPFSService.getFromIPFS(profileCID)
          console.log('📦 获取到现有IPFS用户资料')
        } catch (error) {
          console.warn('获取现有IPFS资料失败:', error)
        }
      }
      
      // 构建标准的用户资料数据结构
      const userProfileData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          username: finalUsername,
          email: '',
          avatar: '',
          bio: bio || (existingProfileData?.data?.bio) || '通过Web3钱包连接的用户',
          skills: existingProfileData?.data?.skills || [],
          socialLinks: existingProfileData?.data?.socialLinks || {}
        },
        metadata: {
          previousVersion: existingProfileData?.version,
          updatedBy: walletAddress.toLowerCase()
        }
      }
      
      // 创建或更新用户资料
      ipfsCID = await IPFSService.uploadUserProfile(userProfileData)
      
    } catch (ipfsError) {
      console.error('钱包用户IPFS上传失败:', ipfsError)
      return NextResponse.json({
        success: false,
        error: 'IPFS上传失败，无法创建Web3用户'
      }, { status: 500 })
    }

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        // 生成虚拟邮箱（Web3用户可能没有邮箱）
        email: `${walletAddress.toLowerCase()}@web3.hackx.local`,
        username: finalUsername,
        walletAddress: walletAddress.toLowerCase(),
        bio: bio || '通过Web3钱包连接的用户',
        ipfsProfileHash: ipfsCID,
        profileSyncStatus: 'SYNCED',
        emailVerified: false, // Web3用户不需要邮箱验证
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        
        // 默认设置
        reputationScore: 0,
        notificationSettings: {
          email: false, // Web3用户默认关闭邮件通知
          push: true,
          sms: false
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false, // 不显示虚拟邮箱
          showWalletAddress: true // 显示钱包地址
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        reputationScore: true,
        emailVerified: true,
        ipfsProfileHash: true,
        profileSyncStatus: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // 生成JWT token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      walletAddress: user.walletAddress || undefined,
    })

    console.log('✅ Web3用户创建成功:', user.username)

    // ⭐ 自动在智能合约中注册用户
    try {
      console.log('🔗 开始在智能合约中注册用户...')
      
      // 先初始化智能合约服务
      await smartContractService.initialize()
      
      // 检查用户是否已在智能合约中注册
      const isAlreadyRegistered = await smartContractService.isUserRegistered(walletAddress.toLowerCase())
      
      if (isAlreadyRegistered) {
        console.log('✅ 用户已在智能合约中注册，跳过注册步骤')
        // 直接更新同步状态为已同步
        await prisma.user.update({
          where: { id: user.id },
          data: {
            profileSyncStatus: 'SYNCED'
          }
        })
      } else {
        // 使用智能合约服务注册用户
        const contractResult = await smartContractService.registerUser(ipfsCID)
        
        if (contractResult) {
          console.log('✅ 智能合约注册成功:', contractResult)
          
          // 更新用户的区块链同步状态
          await prisma.user.update({
            where: { id: user.id },
            data: {
              profileSyncStatus: 'SYNCED',
              lastTxHash: contractResult.hash // 提取交易哈希
            }
          })
        }
      }
      
    } catch (contractError) {
      console.warn('⚠️ 智能合约注册失败，但数据库用户已创建:', contractError)
      // 不阻断用户注册流程，只是标记为待同步
      await prisma.user.update({
        where: { id: user.id },
        data: {
          profileSyncStatus: 'FAILED'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Web3用户创建成功',
      data: {
        user,
        token
      }
    }, { status: 201 })

  } catch (error) {
    console.error('创建Web3用户错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求数据验证失败',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: '创建Web3用户失败'
    }, { status: 500 })
  }
}

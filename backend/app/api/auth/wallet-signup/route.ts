import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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
      const { UserProfileIPFSService } = await import('@/lib/user-profile-ipfs')
      
      // 如果用户提供了现有的profileCID，尝试获取数据
      let existingProfileData = null
      if (profileCID) {
        try {
          existingProfileData = await UserProfileIPFSService.getProfile(profileCID)
          console.log('📦 获取到现有IPFS用户资料')
        } catch (error) {
          console.warn('获取现有IPFS资料失败:', error)
        }
      }
      
      // 创建或更新用户资料
      ipfsCID = await UserProfileIPFSService.uploadProfile({
        ...existingProfileData, // 合并现有数据
        username: finalUsername,
        walletAddress: walletAddress.toLowerCase(),
        bio: bio || (existingProfileData?.bio) || '通过Web3钱包连接的用户',
        // Web3特定数据
        web3Data: {
          ensName: undefined, // 可以后续添加ENS解析
          nfts: [],
          tokenHoldings: [],
          daoMemberships: []
        },
        createdAt: existingProfileData?.createdAt || new Date().toISOString()
      }, 'wallet')
      
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
        role: 'user',
        status: 'active',
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
    const token = jwt.sign(
      { 
        userId: user.id,
        walletAddress: user.walletAddress,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    console.log('✅ Web3用户创建成功:', user.username)

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

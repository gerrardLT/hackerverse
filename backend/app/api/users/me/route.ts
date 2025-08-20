import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 更新用户信息验证模式
const updateUserSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(30, '用户名最多30个字符').optional(),
  bio: z.string().max(500, '个人简介最多500个字符').optional(),
  avatarUrl: z.string().url('头像链接格式不正确').optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '钱包地址格式不正确').optional(),
  notificationSettings: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showWalletAddress: z.boolean().optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 获取用户信息
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        reputationScore: true,
        emailVerified: true,
        socialLinks: true,
        notificationSettings: true,
        privacySettings: true,
        ipfsProfileHash: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!userInfo) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...userInfo,
          ipfsUrl: userInfo.ipfsProfileHash ? `${process.env.IPFS_GATEWAY}/ipfs/${userInfo.ipfsProfileHash}` : null
        }
      }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 验证请求数据
    const validatedData = updateUserSchema.parse(body)
    
    // 检查用户名是否已存在
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: user.id }
        }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: '用户名已被使用' },
          { status: 409 }
        )
      }
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        reputationScore: true,
        emailVerified: true,
        socialLinks: true,
        createdAt: true
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 创建用户资料元数据用于IPFS存储
    const userProfileMetadata = {
      version: '1.0',
      type: 'user-profile',
      timestamp: new Date().toISOString(),
      profile: {
        id: currentUser.id,
        email: currentUser.email,
        username: validatedData.username || currentUser.username,
        walletAddress: validatedData.walletAddress || currentUser.walletAddress,
        avatarUrl: validatedData.avatarUrl || currentUser.avatarUrl,
        bio: validatedData.bio || currentUser.bio,
        reputationScore: currentUser.reputationScore,
        emailVerified: currentUser.emailVerified,
        socialLinks: currentUser.socialLinks || {},
        notificationSettings: validatedData.notificationSettings || {},
        privacySettings: validatedData.privacySettings || {},
        updatedAt: new Date().toISOString(),
        createdAt: currentUser.createdAt.toISOString()
      }
    }

    // 上传用户资料到IPFS（可选）
    let ipfsHash = null
    try {
      // 动态导入IPFS服务
      const { IPFSService } = await import('@/lib/ipfs')
      ipfsHash = await IPFSService.uploadJSON(userProfileMetadata, {
        name: `user-profile-${currentUser.username || currentUser.email}.json`,
        description: `用户资料: ${currentUser.username || currentUser.email}`,
        tags: ['user-profile', 'hackathon', 'developer'],
        version: '1.0.0',
        author: currentUser.username || currentUser.email
      })
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      // 即使IPFS上传失败，也继续更新用户信息
    }
    
    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: validatedData.username,
        bio: validatedData.bio,
        avatarUrl: validatedData.avatarUrl,
        walletAddress: validatedData.walletAddress,
        notificationSettings: validatedData.notificationSettings,
        privacySettings: validatedData.privacySettings,
        ipfsProfileHash: ipfsHash, // 存储IPFS哈希
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
        notificationSettings: true,
        privacySettings: true,
        ipfsProfileHash: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: {
          ...updatedUser,
          ipfsUrl: ipfsHash ? `${process.env.IPFS_GATEWAY}/ipfs/${ipfsHash}` : null
        }
      },
    })
    
  } catch (error) {
    console.error('更新用户信息错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
} 
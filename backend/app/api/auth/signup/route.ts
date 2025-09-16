import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { SimpleNotificationService } from '@/lib/simple-notification-service'

// 注册请求验证模式
const signupSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  username: z.string().min(2, '用户名至少2位').optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '钱包地址格式不正确').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = signupSchema.parse(body)
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '邮箱已被注册' },
        { status: 400 }
      )
    }
    
    // 检查用户名是否已存在
    if (validatedData.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: validatedData.username }
      })
      
      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: '用户名已被使用' },
          { status: 400 }
        )
      }
    }
    
    // 检查钱包地址是否已存在
    if (validatedData.walletAddress) {
      const existingWallet = await prisma.user.findUnique({
        where: { walletAddress: validatedData.walletAddress }
      })
      
      if (existingWallet) {
        return NextResponse.json(
          { success: false, error: '钱包地址已被绑定' },
          { status: 400 }
        )
      }
    }
    
    // 哈希密码
    const hashedPassword = await AuthService.hashPassword(validatedData.password)
    
    // ⭐ 使用统一的IPFS服务创建用户资料
    let ipfsCID
    try {
      console.log('🚀 开始IPFS上传用户资料...')
      const { IPFSService } = await import('@/lib/ipfs')
      
      // 构建标准的用户资料数据结构
      const userProfileData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          username: validatedData.username,
          email: validatedData.email,
          avatar: '',
          bio: '新注册用户',
          skills: [],
          socialLinks: {}
        },
        metadata: {
          previousVersion: undefined,
          updatedBy: validatedData.email
        }
      }
      
      // 设置IPFS上传超时（30秒）
      const uploadPromise = IPFSService.uploadUserProfile(userProfileData)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('IPFS上传超时')), 30000)
      })
      
      ipfsCID = await Promise.race([uploadPromise, timeoutPromise]) as string
      console.log('✅ IPFS上传成功，CID:', ipfsCID)
      
    } catch (ipfsError) {
      console.error('❌ IPFS上传失败:', ipfsError)
      
      // 根据错误类型提供不同的错误信息
      let errorMessage = 'IPFS上传失败，无法创建用户'
      if (ipfsError instanceof Error) {
        if (ipfsError.message.includes('timeout') || ipfsError.message.includes('超时')) {
          errorMessage = 'IPFS网络响应超时，请检查网络连接后重试'
        } else if (ipfsError.message.includes('gateway') || ipfsError.message.includes('网关')) {
          errorMessage = 'IPFS网关服务暂时不可用，请稍后重试'
        } else if (ipfsError.message.includes('network') || ipfsError.message.includes('网络')) {
          errorMessage = 'IPFS网络连接失败，请检查网络设置'
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: ipfsError instanceof Error ? ipfsError.message : '未知错误'
      }, { status: 500 })
    }
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        walletAddress: validatedData.walletAddress,
        
        // ⭐ IPFS相关字段
        ipfsProfileHash: ipfsCID,
        profileSyncStatus: 'SYNCED',
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          teamInvites: true,
          projectUpdates: true,
          hackathonReminders: true,
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showWalletAddress: true,
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
        createdAt: true,
      }
    })
    
    // 生成 JWT Token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      walletAddress: user.walletAddress || undefined,
    })

    // 发送欢迎通知
    try {
      await SimpleNotificationService.createWelcomeNotification(
        user.id,
        user.username || user.email
      )
    } catch (notificationError) {
      console.error('发送欢迎通知失败:', notificationError)
      // 通知失败不影响注册流程
    }
    
    return NextResponse.json({
      success: true,
      message: '注册成功',
      data: {
        user,
        token,
      }
    })
    
  } catch (error) {
    console.error('注册错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
} 
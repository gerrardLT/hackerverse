import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { SimpleNotificationService } from '@/lib/simple-notification-service'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 注册请求验证模式 - 动态创建以支持多语言
function createSignupSchema(locale: 'en' | 'zh') {
  const t = createTFunction(locale);
  return z.object({
    email: z.string().email(t('validation.emailFormatError')),
    password: z.string().min(6, t('validation.passwordMinLength')),
    username: z.string().min(2, t('validation.usernameMinLength')).optional(),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, t('validation.walletAddressFormat')).optional(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const body = await request.json()
    
    // 验证请求数据
    const signupSchema = createSignupSchema(locale)
    const validatedData = signupSchema.parse(body)
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: t('errors.emailAlreadyExists') },
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
          { success: false, error: t('errors.usernameAlreadyExists') },
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
          { success: false, error: t('errors.walletAlreadyBound') },
          { status: 400 }
        )
      }
    }
    
    // 哈希密码
    const hashedPassword = await AuthService.hashPassword(validatedData.password)
    
    // ⭐ 使用统一的IPFS服务创建用户资料
    let ipfsCID
    try {
      console.log('[AUTH] Starting IPFS profile upload...')
      const { IPFSService } = await import('@/lib/ipfs')
      
      // 构建标准的用户资料数据结构
      const userProfileData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          username: validatedData.username || validatedData.email.split('@')[0], // 使用邮箱前缀作为默认用户名
          email: validatedData.email,
          avatar: '',
          bio: 'New registered user',
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
        setTimeout(() => reject(new Error(t('ipfs.uploadTimeout'))), 30000)
      })
      
      ipfsCID = await Promise.race([uploadPromise, timeoutPromise]) as string
      console.log('[AUTH] IPFS upload successful, CID:', ipfsCID)
      
    } catch (ipfsError) {
      console.error('[AUTH] IPFS upload failed:', ipfsError)
      
      // 根据错误类型提供不同的错误信息
      let errorMessage = t('ipfs.uploadFailed')
      if (ipfsError instanceof Error) {
        if (ipfsError.message.includes('timeout') || ipfsError.message.includes('超时')) {
          errorMessage = t('ipfs.networkTimeout')
        } else if (ipfsError.message.includes('gateway') || ipfsError.message.includes('网关')) {
          errorMessage = t('ipfs.gatewayUnavailable')
        } else if (ipfsError.message.includes('network') || ipfsError.message.includes('网络')) {
          errorMessage = t('ipfs.networkConnectionFailed')
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: ipfsError instanceof Error ? ipfsError.message : t('errors.unknownError')
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
      console.error('[AUTH] Failed to send welcome notification:', notificationError)
      // 通知失败不影响注册流程
    }
    
    return NextResponse.json({
      success: true,
      message: t('auth.signupSuccess'),
      data: {
        user,
        token,
      }
    })
    
  } catch (error) {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    console.error('[AUTH] Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('auth.signupError') },
      { status: 500 }
    )
  }
} 
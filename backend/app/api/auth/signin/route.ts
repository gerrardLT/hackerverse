import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 登录请求验证模式 - 动态创建以支持多语言
function createSigninSchema(locale: 'en' | 'zh') {
  const t = createTFunction(locale);
  return z.object({
    email: z.string().email(t('validation.emailFormatError')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const body = await request.json()
    
    // 验证请求数据
    const signinSchema = createSigninSchema(locale)
    const validatedData = signinSchema.parse(body)
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        reputationScore: true,
        emailVerified: true,
        notificationSettings: true,
        privacySettings: true,
        createdAt: true,
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('errors.invalidCredentials'),
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }
    
    // 验证密码
    const isValidPassword = await AuthService.verifyPassword(
      validatedData.password,
      user.password!
    )
    
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('errors.invalidCredentials'),
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }
    
    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    // 生成 JWT Token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      walletAddress: user.walletAddress || undefined,
    })
    
    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      message: t('auth.loginSuccess'),
      data: {
        user: userWithoutPassword,
        token,
      }
    })
    
  } catch (error) {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('auth.loginError') },
      { status: 500 }
    )
  }
} 
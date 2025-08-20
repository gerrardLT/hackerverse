import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 登录请求验证模式
const signinSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
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
        { success: false, error: '邮箱或密码错误' },
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
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }
    
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
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token,
      }
    })
    
  } catch (error) {
    console.error('登录错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
} 
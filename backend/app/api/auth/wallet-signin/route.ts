import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const walletSignInSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '钱包地址格式不正确'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = walletSignInSchema.parse(body)

    console.log('🔍 尝试通过钱包地址登录:', walletAddress)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
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

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 })
    }

    // 检查用户状态
    if (user.status === 'suspended' || user.status === 'banned') {
      return NextResponse.json({
        success: false,
        error: '账户已被暂停或封禁'
      }, { status: 403 })
    }

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

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    console.log('✅ 钱包登录成功:', user.username || user.walletAddress)

    return NextResponse.json({
      success: true,
      message: '钱包登录成功',
      data: {
        user,
        token
      }
    }, { status: 200 })

  } catch (error) {
    console.error('钱包登录错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求数据验证失败',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: '钱包登录失败'
    }, { status: 500 })
  }
}

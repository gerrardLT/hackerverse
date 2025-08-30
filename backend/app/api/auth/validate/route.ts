import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * 验证JWT Token有效性
 */
export async function POST(request: NextRequest) {
  try {
    // 使用统一的auth函数验证token
    const user = await auth(request)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Token无效或已过期',
        code: 'TOKEN_INVALID'
      }, { status: 401 })
    }

    // 检查用户状态
    if (user.status === 'suspended' || user.status === 'banned') {
      return NextResponse.json({
        success: false,
        error: '账户已被暂停或封禁',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: 'Token有效',
      data: {
        userId: user.id,
        email: user.email,
        walletAddress: user.walletAddress
      }
    })

  } catch (error) {
    console.error('Token验证错误:', error)
    return NextResponse.json({
      success: false,
      error: 'Token验证失败',
      code: 'VALIDATION_ERROR'
    }, { status: 500 })
  }
}
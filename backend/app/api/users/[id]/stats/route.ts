import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取指定用户的公开统计信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        createdAt: true,
        status: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '用户不可用' },
        { status: 403 }
      )
    }

    // 获取统计数据
    const [postsCount, repliesCount] = await Promise.all([
      // 发帖数
      prisma.communityPost.count({
        where: {
          authorId: userId,
          isDeleted: false
        }
      }),
      // 回复数
      prisma.communityReply.count({
        where: {
          authorId: userId,
          isDeleted: false
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        postsCount,
        repliesCount,
        joinedAt: user.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('获取用户统计数据错误:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}

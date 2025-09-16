import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 收藏/取消收藏帖子
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: '无效的令牌' },
        { status: 401 }
      )
    }

    const postId = params.id

    // 验证帖子是否存在
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, isDeleted: false }
    })

    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已经收藏过此帖子
    const existingBookmark = await prisma.postBookmark.findUnique({
      where: {
        userId_postId: {
          userId: decoded.userId,
          postId: postId
        }
      }
    })

    let isBookmarked: boolean

    if (existingBookmark) {
      // 取消收藏
      await prisma.postBookmark.delete({
        where: {
          userId_postId: {
            userId: decoded.userId,
            postId: postId
          }
        }
      })
      isBookmarked = false
    } else {
      // 添加收藏
      await prisma.postBookmark.create({
        data: {
          userId: decoded.userId,
          postId: postId
        }
      })
      isBookmarked = true
    }

    return NextResponse.json({
      success: true,
      message: isBookmarked ? '收藏成功' : '取消收藏成功',
      data: {
        isBookmarked
      }
    })

  } catch (error) {
    console.error('收藏操作错误:', error)
    return NextResponse.json(
      { error: '收藏操作失败' },
      { status: 500 }
    )
  }
}

// 获取用户对帖子的收藏状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: '无效的令牌' },
        { status: 401 }
      )
    }

    const postId = params.id

    // 检查用户是否已经收藏过此帖子
    const existingBookmark = await prisma.postBookmark.findUnique({
      where: {
        userId_postId: {
          userId: decoded.userId,
          postId: postId
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        isBookmarked: !!existingBookmark
      }
    })

  } catch (error) {
    console.error('获取收藏状态错误:', error)
    return NextResponse.json(
      { error: '获取收藏状态失败' },
      { status: 500 }
    )
  }
}

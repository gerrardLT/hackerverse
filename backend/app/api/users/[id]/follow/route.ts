import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 关注/取消关注用户
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

    const targetUserId = params.id

    // 不能关注自己
    if (targetUserId === decoded.userId) {
      return NextResponse.json(
        { error: '不能关注自己' },
        { status: 400 }
      )
    }

    // 验证目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId, status: 'ACTIVE' }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查是否已经关注
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: targetUserId
        }
      }
    })

    let isFollowing: boolean

    if (existingFollow) {
      // 取消关注
      await prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId: decoded.userId,
            followingId: targetUserId
          }
        }
      })
      isFollowing = false
    } else {
      // 添加关注
      await prisma.userFollow.create({
        data: {
          followerId: decoded.userId,
          followingId: targetUserId
        }
      })
      isFollowing = true

      // 创建新关注者通知 (只在关注时创建，取消关注不通知)
      try {
        const follower = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { username: true }
        })
        
        if (follower && follower.username) {
          await NotificationService.createNewFollowerNotification(
            targetUserId,
            decoded.userId,
            follower.username
          )
        }
      } catch (notificationError) {
        console.error('创建关注通知失败:', notificationError)
        // 通知失败不影响主要功能
      }
    }

    // 获取关注者数量
    const followersCount = await prisma.userFollow.count({
      where: { followingId: targetUserId }
    })

    return NextResponse.json({
      success: true,
      message: isFollowing ? '关注成功' : '取消关注成功',
      data: {
        isFollowing,
        followersCount
      }
    })

  } catch (error) {
    console.error('关注操作错误:', error)
    return NextResponse.json(
      { error: '关注操作失败' },
      { status: 500 }
    )
  }
}

// 获取关注状态
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

    const targetUserId = params.id

    // 检查是否已经关注
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: targetUserId
        }
      }
    })

    // 获取关注者和关注数量
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: targetUserId }
      }),
      prisma.userFollow.count({
        where: { followerId: targetUserId }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: !!existingFollow,
        followersCount,
        followingCount
      }
    })

  } catch (error) {
    console.error('获取关注状态错误:', error)
    return NextResponse.json(
      { error: '获取关注状态失败' },
      { status: 500 }
    )
  }
}

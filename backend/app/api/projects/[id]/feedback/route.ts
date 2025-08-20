import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { IPFSService } from '@/lib/ipfs'

// 反馈验证模式
const feedbackSchema = z.object({
  rating: z.number().min(1).max(5, '评分必须在1-5之间'),
  comment: z.string().min(5, '评论至少5个字符').max(500, '评论不能超过500个字符'),
  type: z.enum(['technical', 'business', 'design', 'general']).default('general'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证token' },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '无效的认证token' },
        { status: 401 }
      )
    }

    const projectId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = feedbackSchema.parse(body)
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        hackathonId: true,
        hackathon: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户信息不存在' },
        { status: 404 }
      )
    }

    // 创建反馈元数据用于IPFS存储
    const feedbackMetadata = {
      version: '1.0',
      type: 'project-feedback',
      timestamp: new Date().toISOString(),
      feedback: {
        projectId: project.id,
        projectTitle: project.title,
        hackathonId: project.hackathonId,
        hackathonTitle: project.hackathon.title,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl
        },
        rating: validatedData.rating,
        comment: validatedData.comment,
        type: validatedData.type,
        createdAt: new Date().toISOString()
      }
    }

    // 上传反馈数据到IPFS
    let ipfsHash = null
    try {
      ipfsHash = await IPFSService.uploadJSON(feedbackMetadata, {
        name: `project-feedback-${project.id}-${user.id}.json`,
        description: `项目反馈: ${project.title} by ${user.username}`,
        tags: ['project-feedback', 'hackathon', 'community'],
        version: '1.0.0',
        author: user.username || user.email
      })
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      // 即使IPFS上传失败，也继续保存反馈
    }

    // 保存反馈到数据库
    const feedback = await prisma.feedback.create({
      data: {
        projectId: projectId,
        userId: payload.userId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        ipfsHash: ipfsHash
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        rating: true,
        comment: true,
        ipfsHash: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '反馈提交成功',
      feedback: {
        ...feedback,
        ipfsUrl: ipfsHash ? `${process.env.IPFS_GATEWAY}/ipfs/${ipfsHash}` : null
      }
    }, { status: 201 })

  } catch (error) {
    console.error('提交反馈错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '提交反馈失败' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 获取项目反馈列表
    const feedbacks = await prisma.feedback.findMany({
      where: { projectId },
      select: {
        id: true,
        rating: true,
        comment: true,
        ipfsHash: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 计算平均评分
    const averageRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum: number, feedback: any) => sum + feedback.rating, 0) / feedbacks.length
      : 0

    // 按评分分组统计
    const ratingStats = {
      5: feedbacks.filter((f: any) => f.rating === 5).length,
      4: feedbacks.filter((f: any) => f.rating === 4).length,
      3: feedbacks.filter((f: any) => f.rating === 3).length,
      2: feedbacks.filter((f: any) => f.rating === 2).length,
      1: feedbacks.filter((f: any) => f.rating === 1).length,
    }

    return NextResponse.json({
      success: true,
      feedbacks: feedbacks.map((feedback: any) => ({
        ...feedback,
        ipfsUrl: feedback.ipfsHash ? `${process.env.IPFS_GATEWAY}/ipfs/${feedback.ipfsHash}` : null
      })),
      averageRating: Math.round(averageRating * 100) / 100,
      totalFeedbacks: feedbacks.length,
      ratingStats
    })

  } catch (error) {
    console.error('获取项目反馈错误:', error)
    return NextResponse.json(
      { error: '获取项目反馈失败' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { IPFSService } from '@/lib/ipfs'
import { auth } from '@/lib/auth'

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

    // 检查是否已经点赞过
    const existingLike = await prisma.projectLike.findFirst({
      where: {
        projectId: projectId,
        userId: payload.userId
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: '您已经点赞过该项目' },
        { status: 409 }
      )
    }

    // 创建点赞元数据用于IPFS存储
    const likeMetadata = {
      version: '1.0',
      type: 'project-like',
      timestamp: new Date().toISOString(),
      like: {
        projectId: project.id,
        projectTitle: project.title,
        hackathonId: project.hackathonId,
        hackathonTitle: project.hackathon?.title || 'Independent Project',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl
        },
        createdAt: new Date().toISOString()
      }
    }

    // 上传点赞数据到IPFS
    let ipfsHash = null
    try {
      ipfsHash = await IPFSService.uploadJSON(likeMetadata, {
        name: `project-like-${project.id}-${user.id}.json`,
        description: `项目点赞: ${project.title} by ${user.username}`,
        tags: ['project-like', 'hackathon', 'community'],
        version: '1.0.0',
        author: user.username || user.email
      })
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      // 即使IPFS上传失败，也继续保存点赞
    }

    // 保存点赞到数据库
    const like = await prisma.projectLike.create({
      data: {
        projectId: projectId,
        userId: payload.userId,
        ipfsHash: ipfsHash
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
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
      message: '点赞成功',
      like: {
        ...like,
        ipfsUrl: ipfsHash ? `${process.env.IPFS_GATEWAY}/ipfs/${ipfsHash}` : null
      }
    }, { status: 201 })

  } catch (error) {
    console.error('点赞错误:', error)
    return NextResponse.json(
      { error: '点赞失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    // 删除点赞记录
    const deletedLike = await prisma.projectLike.deleteMany({
      where: {
        projectId: projectId,
        userId: payload.userId
      }
    })

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { error: '您没有点赞过该项目' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '取消点赞成功'
    })

  } catch (error) {
    console.error('取消点赞错误:', error)
    return NextResponse.json(
      { error: '取消点赞失败' },
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
    
    // 验证用户身份（可选）
    let userId: string | null = null
    try {
      const user = await auth(request)
      userId = user?.id || null
    } catch (error) {
      // 用户未认证，但不影响获取点赞信息
    }

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      )
    }

    // 获取点赞总数
    const likesCount = await prisma.projectLike.count({
      where: { projectId }
    })

    // 检查当前用户是否已点赞
    let isLiked = false
    if (userId) {
      const userLike = await prisma.projectLike.findFirst({
        where: {
          projectId,
          userId
        }
      })
      isLiked = !!userLike
    }

    return NextResponse.json({
      success: true,
      data: {
        likes: likesCount,
        isLiked
      }
    })
  } catch (error) {
    console.error('获取项目点赞信息错误:', error)
    return NextResponse.json(
      { success: false, error: '获取点赞信息失败' },
      { status: 500 }
    )
  }
} 
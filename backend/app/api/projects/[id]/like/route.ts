import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
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

    // 检查用户是否已经点赞
    const existingLike = await prisma.projectLike.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: '您已经点赞过该项目' },
        { status: 400 }
      )
    }

    // 创建点赞记录
    await prisma.projectLike.create({
      data: {
        projectId,
        userId: user.id,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '点赞成功'
    })
  } catch (error) {
    console.error('点赞项目错误:', error)
    return NextResponse.json(
      { success: false, error: '点赞失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
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

    // 删除点赞记录
    const deletedLike = await prisma.projectLike.deleteMany({
      where: {
        projectId,
        userId: user.id
      }
    })

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { success: false, error: '您还没有点赞该项目' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '取消点赞成功'
    })
  } catch (error) {
    console.error('取消点赞错误:', error)
    return NextResponse.json(
      { success: false, error: '取消点赞失败' },
      { status: 500 }
    )
  }
} 
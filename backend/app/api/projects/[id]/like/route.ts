import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ApiResponseHandler, ErrorCode } from '@/lib/api-response'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const projectId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: t('projects.notFound') },
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
        { success: false, error: t('projects.alreadyLiked', { fallback: 'You have already liked this project' }) },
        { status: 409 }
      )
    }

    // 创建点赞记录
    const like = await prisma.projectLike.create({
      data: {
        projectId,
        userId: user.id,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: t('projects.likeSuccess', { fallback: 'Liked successfully' }),
      data: like
    }, { status: 201 })
  } catch (error) {
    console.error('点赞项目错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('projects.likeError', { fallback: 'Failed to like project' }) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const projectId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: t('projects.notFound') },
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
        { success: false, error: t('projects.notLikedYet', { fallback: 'You have not liked this project yet' }) },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: t('projects.unlikeSuccess', { fallback: 'Unliked successfully' })
    })
  } catch (error) {
    console.error('取消点赞错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('projects.unlikeError', { fallback: 'Failed to unlike project' }) },
      { status: 500 }
    )
  }
} 
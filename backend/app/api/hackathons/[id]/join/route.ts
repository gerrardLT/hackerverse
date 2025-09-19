import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { t, getLocaleFromRequest } from '@/lib/i18n'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    
    const hackathonId = params.id
    
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: t('auth.tokenInvalid') },
        { status: 401 }
      )
    }
    
    console.log('🔍 用户参加黑客松:', { hackathonId, userId: payload.userId })
    
    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        registrationStartDate: true,
        registrationDeadline: true,
        maxParticipants: true,
        isPublic: true,
        _count: {
          select: {
            participations: true,
          }
        }
      }
    })
    
    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('hackathons.notFound') },
        { status: 404 }
      )
    }
    
    // 检查黑客松是否公开
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { success: false, error: t('hackathons.privateEvent', { fallback: 'This hackathon is a private event' }) },
        { status: 403 }
      )
    }
    
    // 检查是否是创建者
    if (hackathon.organizerId === payload.userId) {
      return NextResponse.json(
        { success: false, error: t('hackathons.creatorCannotJoin', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }
    
    // 检查报名时间限制
    const now = new Date()
    
    // 检查报名是否已开始
    if (hackathon.registrationStartDate && now < hackathon.registrationStartDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('hackathons.registrationNotStarted', getLocaleFromRequest(request)),
          details: `报名将于 ${hackathon.registrationStartDate.toLocaleString('zh-CN')} 开始`
        },
        { status: 400 }
      )
    }
    
    // 检查报名是否已截止
    if (hackathon.registrationDeadline && now > hackathon.registrationDeadline) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('hackathons.registrationClosed', getLocaleFromRequest(request)),
          details: `报名已于 ${hackathon.registrationDeadline.toLocaleString('zh-CN')} 截止`
        },
        { status: 400 }
      )
    }
    
    // 检查参与人数限制
    if (hackathon.maxParticipants && hackathon._count.participations >= hackathon.maxParticipants) {
      return NextResponse.json(
        { success: false, error: t('hackathons.participantLimitReached', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }
    
    // 检查用户是否已经报名
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        hackathonId,
        userId: payload.userId,
      }
    })
    
    if (existingParticipation) {
      return NextResponse.json(
        { success: false, error: t('hackathons.alreadyRegistered', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }
    
    // 创建报名记录
    const participation = await prisma.participation.create({
      data: {
        hackathonId,
        userId: payload.userId,
        status: 'REGISTERED',
        joinedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        joinedAt: true,
        hackathon: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          }
        },
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    })
    
    console.log('✅ 参加黑客松成功:', participation.id)
    
    return NextResponse.json({
      success: true,
      message: t('hackathons.joinSuccess'),
      data: {
        participation,
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('参加黑客松错误:', error)
    
    return NextResponse.json(
      { success: false, error: t('hackathons.joinError') },
      { status: 500 }
    )
  }
}

// 可选：支持DELETE方法来取消参加
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    
    const hackathonId = params.id
    
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized', getLocaleFromRequest(request)) },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: t('auth.tokenInvalid', getLocaleFromRequest(request)) },
        { status: 401 }
      )
    }
    
    // 查找报名记录
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId,
        userId: payload.userId,
      }
    })
    
    if (!participation) {
      return NextResponse.json(
        { success: false, error: t('hackathons.notRegistered', getLocaleFromRequest(request)) },
        { status: 404 }
      )
    }
    
    // 检查是否可以取消报名（在开始前）
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        startDate: true,
      }
    })
    
    if (hackathon && new Date() >= hackathon.startDate) {
      return NextResponse.json(
        { success: false, error: t('hackathons.hackathonStarted', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }
    
    // 删除报名记录
    await prisma.participation.delete({
      where: { id: participation.id }
    })
    
    return NextResponse.json({
      success: true,
      message: t('hackathons.leaveSuccess', getLocaleFromRequest(request)),
    })
    
  } catch (error) {
    console.error('Cancel registration error:', error)
    return NextResponse.json(
      { success: false, error: t('hackathons.cancelRegistrationFailed', getLocaleFromRequest(request)) },
      { status: 500 }
    )
  }
}

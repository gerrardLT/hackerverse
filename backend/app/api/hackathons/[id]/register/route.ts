import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id
    
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
    
    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
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
        { error: '黑客松不存在' },
        { status: 404 }
      )
    }
    
    // 检查黑客松是否公开
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { error: '该黑客松为私有活动' },
        { status: 403 }
      )
    }
    
    // 检查报名截止时间
    if (hackathon.registrationDeadline && new Date() > hackathon.registrationDeadline) {
      return NextResponse.json(
        { error: '报名已截止' },
        { status: 400 }
      )
    }
    
    // 检查参与人数限制
    if (hackathon.maxParticipants && hackathon._count.participations >= hackathon.maxParticipants) {
      return NextResponse.json(
        { error: '参与人数已达上限' },
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
        { error: '您已经报名参加该黑客松' },
        { status: 400 }
      )
    }
    
    // 创建报名记录
    const participation = await prisma.participation.create({
      data: {
        hackathonId,
        userId: payload.userId,
        status: 'registered',
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
            email: true,
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '报名成功',
      participation,
    }, { status: 201 })
    
  } catch (error) {
    console.error('黑客松报名错误:', error)
    return NextResponse.json(
      { error: '报名失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id
    
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
    
    // 查找并删除报名记录
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId,
        userId: payload.userId,
      }
    })
    
    if (!participation) {
      return NextResponse.json(
        { error: '您未报名参加该黑客松' },
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
        { error: '黑客松已开始，无法取消报名' },
        { status: 400 }
      )
    }
    
    // 删除报名记录
    await prisma.participation.delete({
      where: { id: participation.id }
    })
    
    return NextResponse.json({
      success: true,
      message: '取消报名成功',
    })
    
  } catch (error) {
    console.error('取消报名错误:', error)
    return NextResponse.json(
      { error: '取消报名失败' },
      { status: 500 }
    )
  }
} 
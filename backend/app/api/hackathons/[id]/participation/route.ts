import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(
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
        { success: false, error: '未提供认证token' },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '无效的认证token' },
        { status: 401 }
      )
    }
    
    console.log('🔍 检查用户参与状态:', { hackathonId, userId: payload.userId })
    
    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        isPublic: true,
        organizerId: true,
      }
    })
    
    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: '黑客松不存在' },
        { status: 404 }
      )
    }
    
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { success: false, error: '该黑客松为私有活动' },
        { status: 403 }
      )
    }
    
    // 如果是创建者，直接返回未参与状态
    if (hackathon.organizerId === payload.userId) {
      console.log('✅ 用户是创建者，返回未参与状态')
      return NextResponse.json({
        success: true,
        data: {
          isParticipating: false,
          isOrganizer: true,
        }
      })
    }
    
    // 查找用户的参与记录
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId,
        userId: payload.userId,
      },
      select: {
        id: true,
        status: true,
        joinedAt: true,
      }
    })
    
    // 查找用户在该黑客松中的项目提交记录
    const userProjects = await prisma.project.findMany({
      where: {
        hackathonId,
        creatorId: payload.userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      }
    })
    
    // 确定参与状态
    let participationStatus = 'NOT_PARTICIPATING'
    const hasSubmittedProject = userProjects.length > 0
    
    if (participation) {
      if (hasSubmittedProject) {
        participationStatus = 'SUBMITTED'
      } else {
        participationStatus = 'REGISTERED'
      }
      
      // 如果黑客松已结束且有项目，状态为完成
      const hackathonEndDate = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { endDate: true }
      })
      
      if (hackathonEndDate && new Date() > hackathonEndDate.endDate && hasSubmittedProject) {
        participationStatus = 'COMPLETED'
      }
    }
    
    const isParticipating = !!participation && ['REGISTERED', 'SUBMITTED', 'COMPLETED'].includes(participationStatus)
    
    console.log('✅ 用户参与状态:', { 
      isParticipating,
      participationStatus,
      hasSubmittedProject,
      projectCount: userProjects.length,
      joinedAt: participation?.joinedAt 
    })
    
    return NextResponse.json({
      success: true,
      data: {
        isParticipating,
        isOrganizer: false,
        participationStatus,
        hasSubmittedProject,
        projectCount: userProjects.length,
        participation: participation ? {
          id: participation.id,
          status: participation.status,
          joinedAt: participation.joinedAt,
        } : null,
        projects: userProjects,
      }
    })
    
  } catch (error) {
    console.error('检查参与状态错误:', error)
    return NextResponse.json(
      { success: false, error: '检查参与状态失败' },
      { status: 500 }
    )
  }
}

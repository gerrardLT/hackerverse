import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const joinTeamSchema = z.object({
  message: z.string().max(500, '申请理由不能超过500字符').optional(),
  skills: z.array(z.string().min(1, '技能不能为空').max(50, '技能名称最多50个字符')).max(10, '最多添加10个技能').optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized', getLocaleFromRequest(request)) },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = joinTeamSchema.parse(body)

    // 检查团队是否存在
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        maxMembers: true,
        isPublic: true,
        hackathonId: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { success: false, error: t('teams.notFound', getLocaleFromRequest(request)) },
        { status: 404 }
      )
    }

    if (!team.isPublic) {
      return NextResponse.json(
        { success: false, error: t('teams.notPublicRecruiting', getLocaleFromRequest(request)) },
        { status: 403 }
      )
    }

    // 检查团队是否已满员
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: t('teams.teamFull', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 检查用户是否已经是团队成员
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: t('teams.alreadyMember', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 检查是否已有待处理的申请
    const existingApplication = await prisma.teamApplication.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id
        }
      }
    })

    if (existingApplication) {
      if (existingApplication.status === 'PENDING') {
        return NextResponse.json(
          { success: false, error: t('teams.applicationPending', getLocaleFromRequest(request)) },
          { status: 400 }
        )
      } else if (existingApplication.status === 'REJECTED') {
        // 如果之前被拒绝，可以重新申请，更新现有记录
        const updatedApplication = await prisma.teamApplication.update({
          where: { id: existingApplication.id },
          data: {
            message: validatedData.message,
            skills: validatedData.skills || [],
            status: 'PENDING',
            updatedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null
          }
        })

        return NextResponse.json({
          success: true,
          data: { application: updatedApplication },
          message: '申请已重新提交，请等待审核'
        })
      }
    }

    // 检查用户是否已参加该黑客松
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId: team.hackathonId,
        userId: user.id
      }
    })

    if (!participation) {
      return NextResponse.json(
        { success: false, error: t('teams.needRegistration', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 检查用户是否已加入其他团队
    const otherTeamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: {
          hackathonId: team.hackathonId
        }
      }
    })

    if (otherTeamMember) {
      return NextResponse.json(
        { success: false, error: t('teams.alreadyInOtherTeam', getLocaleFromRequest(request)) },
        { status: 400 }
      )
    }

    // 创建团队申请
    const application = await prisma.teamApplication.create({
      data: {
        teamId,
        userId: user.id,
        message: validatedData.message,
        skills: validatedData.skills || [],
        status: 'PENDING'
      },
      select: {
        id: true,
        message: true,
        skills: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            leader: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { application },
      message: '申请已提交，请等待团队领导审核'
    })
  } catch (error) {
    console.error('申请加入团队错误:', error)
    return NextResponse.json(
      { success: false, error: t('teams.applicationSubmitFailed', getLocaleFromRequest(request)) },
      { status: 500 }
    )
  }
} 
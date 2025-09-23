import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// 组队请求的验证 schema
const joinRequestSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  message: z.string().optional(),
  skills: z.array(z.string()).default([]),
  referenceRecommendationId: z.string().optional() // 引用推荐ID（如果是基于推荐发送的请求）
})

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('common.errors.unauthenticated') },
        { status: 401 }
      )
    }

    // 解析和验证请求数据
    const body = await request.json()
    const data = joinRequestSchema.parse(body)

    // 验证团队存在
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        members: {
          select: { userId: true }
        },
        applications: {
          where: { userId: user.id },
          select: { id: true, status: true }
        },
        hackathon: {
          select: { 
            id: true, 
            status: true, 
            startDate: true, 
            endDate: true,
            registrationDeadline: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { success: false, error: t('teams.match.teamNotFound') },
        { status: 404 }
      )
    }

    // 检查黑客松状态
    if (!['ACTIVE', 'APPROVED'].includes(team.hackathon.status)) {
      return NextResponse.json(
        { success: false, error: t('teams.match.hackathonNotActive') },
        { status: 400 }
      )
    }

    // 检查注册截止时间
    if (team.hackathon.registrationDeadline && new Date() > team.hackathon.registrationDeadline) {
      return NextResponse.json(
        { success: false, error: t('teams.match.registrationClosed') },
        { status: 400 }
      )
    }

    // 检查团队状态
    if (team.status !== 'RECRUITING') {
      return NextResponse.json(
        { success: false, error: t('teams.match.teamNotRecruiting') },
        { status: 400 }
      )
    }

    // 检查团队是否已满
    if (team.members.length >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: t('teams.match.teamFull') },
        { status: 400 }
      )
    }

    // 检查用户是否已经在团队中
    const isAlreadyMember = team.members.some(member => member.userId === user.id)
    if (isAlreadyMember) {
      return NextResponse.json(
        { success: false, error: t('teams.match.alreadyInTeam') },
        { status: 400 }
      )
    }

    // 检查用户是否已经申请过
    const existingApplication = team.applications.find(app => 
      app.status === 'PENDING' || app.status === 'APPROVED'
    )
    if (existingApplication) {
      const statusKey = existingApplication.status === 'PENDING' ? 'pendingApplication' : 'approvedApplication'
      return NextResponse.json(
        { success: false, error: t(`teams.match.${statusKey}`) },
        { status: 400 }
      )
    }

    // 验证用户是否参与了该黑客松
    const participation = await prisma.participation.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId: team.hackathon.id,
          userId: user.id
        }
      }
    })

    if (!participation) {
      return NextResponse.json(
        { success: false, error: t('teams.match.notParticipating') },
        { status: 403 }
      )
    }

    // 检查用户是否已经在该黑客松的其他团队中
    const existingTeamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: { hackathonId: team.hackathon.id }
      }
    })

    if (existingTeamMembership) {
      return NextResponse.json(
        { success: false, error: t('teams.match.alreadyInAnotherTeam') },
        { status: 400 }
      )
    }

    // 如果引用了推荐，验证推荐存在且有效
    let referencedRecommendation = null
    if (data.referenceRecommendationId) {
      referencedRecommendation = await prisma.teamRecommendation.findUnique({
        where: { id: data.referenceRecommendationId },
        select: { 
          id: true, 
          sourceUserId: true, 
          targetTeamId: true, 
          overallScore: true,
          explanation: true,
          createdAt: true,
          expiresAt: true
        }
      })

      if (!referencedRecommendation) {
        return NextResponse.json(
          { success: false, error: t('teams.match.recommendationNotFound') },
          { status: 404 }
        )
      }

      // 验证推荐的对象匹配
      if (referencedRecommendation.sourceUserId !== user.id || 
          referencedRecommendation.targetTeamId !== data.teamId) {
        return NextResponse.json(
          { success: false, error: t('teams.match.recommendationMismatch') },
          { status: 400 }
        )
      }

      // 检查推荐是否过期
      if (referencedRecommendation.expiresAt && new Date() > referencedRecommendation.expiresAt) {
        return NextResponse.json(
          { success: false, error: t('teams.match.recommendationExpired') },
          { status: 400 }
        )
      }
    }

    // 生成申请消息（如果用户没有提供）
    let applicationMessage = data.message
    if (!applicationMessage) {
      const userSkills = user.skills as string[] || []
      const relevantSkills = data.skills.length > 0 ? data.skills : userSkills.slice(0, 5)
      
      if (referencedRecommendation) {
        applicationMessage = `您好！我看到系统推荐我们可能很匹配（匹配度${(Number(referencedRecommendation.overallScore) * 100).toFixed(0)}%）。${referencedRecommendation.explanation} 我的技能包括：${relevantSkills.join('、')}。希望能加入你们的团队！`
      } else {
        applicationMessage = `您好！我对你们的团队很感兴趣。我的技能包括：${relevantSkills.join('、')}，希望能为团队贡献力量。期待与你们合作！`
      }
    }

    // 创建团队申请
    const application = await prisma.teamApplication.create({
      data: {
        teamId: data.teamId,
        userId: user.id,
        message: applicationMessage,
        skills: data.skills.length > 0 ? data.skills : (user.skills as string[] || []),
        status: 'PENDING'
      }
    })

    // 如果引用了推荐，更新推荐状态
    if (referencedRecommendation) {
      await prisma.teamRecommendation.update({
        where: { id: data.referenceRecommendationId },
        data: {
          status: 'applied',
          respondedAt: new Date(),
          response: 'applied'
        }
      })
    }

    // 创建通知给团队领导者
    try {
      await prisma.notification.create({
        data: {
          userId: team.leaderId,
          type: 'TEAM_APPLICATION_RECEIVED',
          title: t('teams.notifications.applicationReceived.title'),
          message: t('teams.notifications.applicationReceived.message', {
            username: user.username,
            teamName: team.name
          }),
          data: {
            applicationId: application.id,
            teamId: data.teamId,
            applicantId: user.id,
            applicantName: user.username,
            recommendationScore: referencedRecommendation ? Number(referencedRecommendation.overallScore) : null
          },
          actionUrl: `/teams/${data.teamId}/applications`,
          actionLabel: t('teams.notifications.applicationReceived.viewApplication'),
          priority: 'MEDIUM',
          category: 'TEAM'
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
      // 不影响主流程
    }

    // 获取团队信息用于响应
    const teamInfo = await prisma.team.findUnique({
      where: { id: data.teamId },
      select: {
        id: true,
        name: true,
        description: true,
        maxMembers: true,
        members: {
          select: {
            user: {
              select: { id: true, username: true, avatarUrl: true }
            }
          }
        },
        leader: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: t('teams.match.applicationSubmitted'),
      data: {
        application: {
          id: application.id,
          teamId: application.teamId,
          userId: application.userId,
          message: application.message,
          skills: application.skills,
          status: application.status,
          createdAt: application.createdAt
        },
        team: teamInfo,
        recommendation: referencedRecommendation ? {
          id: referencedRecommendation.id,
          score: Number(referencedRecommendation.overallScore),
          explanation: referencedRecommendation.explanation
        } : null
      }
    })

  } catch (error) {
    console.error('Error creating join request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('teams.match.invalidRequestData'),
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: t('common.errors.internalServerError') },
      { status: 500 }
    )
  }
}

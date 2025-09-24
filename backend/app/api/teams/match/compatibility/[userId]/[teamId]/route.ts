import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { TeamMatchingService } from '@/lib/team-matching-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; teamId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    // 验证用户身份
    const currentUser = await auth(request)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: t('common.errors.unauthenticated') },
        { status: 401 }
      )
    }

    const { userId, teamId } = params
    const { searchParams } = new URL(request.url)
    const hackathonId = searchParams.get('hackathonId')

    if (!hackathonId) {
      return NextResponse.json(
        { success: false, error: t('teams.match.hackathonIdRequired') },
        { status: 400 }
      )
    }

    // 验证目标用户存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, status: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: t('teams.match.userNotFound') },
        { status: 404 }
      )
    }

    if (targetUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: t('teams.match.userNotActive') },
        { status: 400 }
      )
    }

    // 验证团队存在
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { userId: true }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { success: false, error: t('teams.match.teamNotFound') },
        { status: 404 }
      )
    }

    // 验证团队属于指定的黑客松
    if (team.hackathonId !== hackathonId) {
      return NextResponse.json(
        { success: false, error: t('teams.match.teamHackathonMismatch') },
        { status: 400 }
      )
    }

    // 验证权限：只有团队成员、目标用户本人或管理员可以查看兼容性
    const isTeamMember = team.members.some(member => member.userId === currentUser.id)
    const isTargetUser = currentUser.id === userId
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(currentUser.role)

    if (!isTeamMember && !isTargetUser && !isAdmin) {
      return NextResponse.json(
        { success: false, error: t('teams.match.noPermissionToViewCompatibility') },
        { status: 403 }
      )
    }

    // 检查用户是否已经在团队中
    const isAlreadyMember = team.members.some(member => member.userId === userId)
    if (isAlreadyMember) {
      return NextResponse.json(
        { success: false, error: t('teams.match.userAlreadyInTeam') },
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

    // 检查用户是否参与了该黑客松
    const participation = await prisma.participation.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId
        }
      }
    })

    if (!participation) {
      return NextResponse.json(
        { success: false, error: t('teams.match.userNotParticipating') },
        { status: 400 }
      )
    }

    // 检查是否有缓存的兼容性结果
    const cachedCompatibility = await prisma.teamRecommendation.findFirst({
      where: {
        OR: [
          {
            sourceUserId: userId,
            targetTeamId: teamId,
            recommendationType: 'user_to_team'
          },
          {
            sourceTeamId: teamId,
            targetUserId: userId,
            recommendationType: 'team_to_user'
          }
        ],
        hackathonId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 过去24小时内的结果
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    let compatibilityResult

    if (cachedCompatibility) {
      // 使用缓存结果
      compatibilityResult = {
        userId,
        teamId,
        hackathonId,
        overallScore: Number(cachedCompatibility.overallScore),
        skillMatchScore: Number(cachedCompatibility.skillMatchScore),
        experienceMatchScore: Number(cachedCompatibility.experienceMatchScore),
        locationMatchScore: Number(cachedCompatibility.locationMatchScore),
        availabilityScore: Number(cachedCompatibility.availabilityScore),
        personalityScore: cachedCompatibility.personalityScore ? Number(cachedCompatibility.personalityScore) : null,
        matchingSkills: cachedCompatibility.matchingSkills,
        missingSkills: cachedCompatibility.missingSkills,
        complementarySkills: cachedCompatibility.complementarySkills,
        synergyReasons: cachedCompatibility.synergyReasons,
        strengthsAnalysis: cachedCompatibility.strengthsAnalysis,
        weaknessesAnalysis: cachedCompatibility.weaknessesAnalysis,
        confidence: Number(cachedCompatibility.confidence),
        explanation: cachedCompatibility.explanation,
        algorithmVersion: cachedCompatibility.algorithmVersion,
        fromCache: true,
        calculatedAt: cachedCompatibility.createdAt
      }
    } else {
      // 实时计算兼容性
      const startTime = Date.now()
      
      compatibilityResult = await TeamMatchingService.calculateUserTeamMatch(
        userId,
        teamId,
        hackathonId
      )

      const calculationTime = Date.now() - startTime

      // 保存计算结果到缓存
      try {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // 24小时后过期

        await prisma.teamRecommendation.create({
          data: {
            recommendationType: 'compatibility_check',
            sourceUserId: userId,
            targetTeamId: teamId,
            hackathonId,
            overallScore: compatibilityResult.overallScore,
            skillMatchScore: compatibilityResult.skillMatchScore,
            experienceMatchScore: compatibilityResult.experienceMatchScore,
            locationMatchScore: compatibilityResult.locationMatchScore,
            availabilityScore: compatibilityResult.availabilityScore,
            // personalityScore: 功能暂未实现
            matchingSkills: compatibilityResult.matchingSkills,
            missingSkills: compatibilityResult.missingSkills,
            complementarySkills: compatibilityResult.complementarySkills,
            synergyReasons: compatibilityResult.synergyReasons,
            strengthsAnalysis: compatibilityResult.strengthsAnalysis,
            weaknessesAnalysis: compatibilityResult.weaknessesAnalysis,
            confidence: compatibilityResult.confidence,
            explanation: compatibilityResult.explanation,
            expiresAt,
            algorithmVersion: '1.0.0',
            status: 'calculated'
          }
        })
      } catch (error) {
        console.error('Error saving compatibility result:', error)
        // 继续返回结果，即使保存失败
      }

      compatibilityResult = {
        ...compatibilityResult,
        fromCache: false,
        calculatedAt: new Date(),
        calculationTime
      }
    }

    // 添加一些上下文信息
    const teamInfo = {
      id: team.id,
      name: team.name,
      description: team.description,
      currentMembers: team.members.length,
      maxMembers: team.maxMembers,
      status: team.status
    }

    const userInfo = {
      id: targetUser.id,
      username: targetUser.username
    }

    return NextResponse.json({
      success: true,
      data: {
        compatibility: compatibilityResult,
        team: teamInfo,
        user: userInfo,
        metadata: {
          canJoin: team.members.length < team.maxMembers && team.status === 'RECRUITING',
          needsImprovement: compatibilityResult.overallScore < 0.6,
          highCompatibility: compatibilityResult.overallScore > 0.8,
          recommendations: compatibilityResult.overallScore < 0.8 ? [
            ...(compatibilityResult.missingSkills && Array.isArray(compatibilityResult.missingSkills) && compatibilityResult.missingSkills.length > 0 ? 
              [`考虑学习以下技能：${compatibilityResult.missingSkills.slice(0, 3).join(', ')}`] : []),
            ...(compatibilityResult.locationMatchScore < 0.5 ? 
              ['考虑调整工作时间或时区偏好'] : []),
            ...(compatibilityResult.experienceMatchScore < 0.5 ? 
              ['考虑匹配经验水平相近的团队'] : [])
          ] : []
        }
      }
    })

  } catch (error) {
    console.error('Error calculating compatibility:', error)
    return NextResponse.json(
      { success: false, error: t('common.errors.internalServerError') },
      { status: 500 }
    )
  }
}

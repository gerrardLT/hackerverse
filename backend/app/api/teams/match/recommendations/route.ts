import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { TeamMatchingService } from '@/lib/team-matching-service'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const hackathonId = searchParams.get('hackathonId')
    const type = searchParams.get('type') // 'teams' 或 'users'
    const teamId = searchParams.get('teamId') // 当type为'users'时需要
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const refreshCache = searchParams.get('refreshCache') === 'true'

    if (!hackathonId) {
      return NextResponse.json(
        { success: false, error: t('teams.match.hackathonIdRequired') },
        { status: 400 }
      )
    }

    if (!['teams', 'users'].includes(type || '')) {
      return NextResponse.json(
        { success: false, error: t('teams.match.invalidRecommendationType') },
        { status: 400 }
      )
    }

    // 验证黑客松存在且处于活跃状态
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { 
        id: true, 
        status: true, 
        startDate: true, 
        endDate: true 
      }
    })

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('common.errors.hackathonNotFound') },
        { status: 404 }
      )
    }

    // 检查黑客松状态
    if (!['ACTIVE', 'APPROVED'].includes(hackathon.status)) {
      return NextResponse.json(
        { success: false, error: t('teams.match.hackathonNotActive') },
        { status: 400 }
      )
    }

    let recommendations: any[] = []
    let cacheKey = ''

    if (type === 'teams') {
      // 为用户推荐团队
      
      // 验证用户是否参与了该黑客松
      const participation = await prisma.participation.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId,
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

      // 检查用户是否已经在团队中
      const existingTeamMembership = await prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          team: { hackathonId }
        }
      })

      if (existingTeamMembership) {
        return NextResponse.json(
          { success: false, error: t('teams.match.alreadyInTeam') },
          { status: 400 }
        )
      }

      cacheKey = `team_recommendations:user:${user.id}:hackathon:${hackathonId}`

      // 检查缓存
      if (!refreshCache) {
        const cachedRecommendations = await prisma.teamRecommendation.findMany({
          where: {
            sourceUserId: user.id,
            hackathonId,
            status: 'active',
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            targetTeam: {
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
            }
          },
          orderBy: { overallScore: 'desc' },
          take: limit
        })

        if (cachedRecommendations.length > 0) {
          recommendations = cachedRecommendations.map(rec => ({
            teamId: rec.targetTeamId,
            teamName: rec.targetTeam?.name,
            teamDescription: rec.targetTeam?.description,
            currentMembers: rec.targetTeam?.members.length,
            maxMembers: rec.targetTeam?.maxMembers,
            leaderName: rec.targetTeam?.leader.username,
            members: rec.targetTeam?.members.map(m => ({
              id: m.user.id,
              username: m.user.username,
              avatarUrl: m.user.avatarUrl
            })),
            overallScore: Number(rec.overallScore),
            skillMatchScore: Number(rec.skillMatchScore),
            experienceMatchScore: Number(rec.experienceMatchScore),
            locationMatchScore: Number(rec.locationMatchScore),
            availabilityScore: Number(rec.availabilityScore),
            matchingSkills: rec.matchingSkills,
            missingSkills: rec.missingSkills,
            complementarySkills: rec.complementarySkills,
            synergyReasons: rec.synergyReasons,
            strengthsAnalysis: rec.strengthsAnalysis,
            weaknessesAnalysis: rec.weaknessesAnalysis,
            confidence: Number(rec.confidence),
            explanation: rec.explanation,
            recommendationId: rec.id,
            createdAt: rec.createdAt
          }))

          return NextResponse.json({
            success: true,
            data: { 
              recommendations,
              fromCache: true,
              type: 'teams'
            }
          })
        }
      }

      // 生成新的推荐
      const newRecommendations = await TeamMatchingService.recommendTeamsForUser(
        user.id,
        hackathonId,
        limit
      )

      // 保存推荐到数据库
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24小时后过期

      const savedRecommendations = await Promise.all(
        newRecommendations.map(async (rec) => {
          try {
            return await prisma.teamRecommendation.create({
              data: {
                recommendationType: 'user_to_team',
                sourceUserId: user.id,
                targetTeamId: rec.teamId,
                hackathonId,
                overallScore: rec.overallScore,
                skillMatchScore: rec.skillMatchScore,
                experienceMatchScore: rec.experienceMatchScore,
                locationMatchScore: rec.locationMatchScore,
                availabilityScore: rec.availabilityScore,
                matchingSkills: rec.matchingSkills,
                missingSkills: rec.missingSkills,
                complementarySkills: rec.complementarySkills,
                synergyReasons: rec.synergyReasons,
                strengthsAnalysis: rec.strengthsAnalysis,
                weaknessesAnalysis: rec.weaknessesAnalysis,
                confidence: rec.confidence,
                explanation: rec.explanation,
                expiresAt,
                algorithmVersion: '1.0.0'
              }
            })
          } catch (error) {
            console.error('Error saving team recommendation:', error)
            return null
          }
        })
      )

      recommendations = newRecommendations.map((rec, index) => ({
        ...rec,
        recommendationId: savedRecommendations[index]?.id,
        createdAt: savedRecommendations[index]?.createdAt
      }))

    } else if (type === 'users') {
      // 为团队推荐用户
      
      if (!teamId) {
        return NextResponse.json(
          { success: false, error: t('teams.match.teamIdRequired') },
          { status: 400 }
        )
      }

      // 验证用户是否为团队领导者或成员
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: { userId: user.id }
          }
        }
      })

      if (!team) {
        return NextResponse.json(
          { success: false, error: t('teams.match.teamNotFound') },
          { status: 404 }
        )
      }

      if (team.leaderId !== user.id && team.members.length === 0) {
        return NextResponse.json(
          { success: false, error: t('teams.match.notTeamMember') },
          { status: 403 }
        )
      }

      cacheKey = `user_recommendations:team:${teamId}:hackathon:${hackathonId}`

      // 检查缓存
      if (!refreshCache) {
        const cachedRecommendations = await prisma.teamRecommendation.findMany({
          where: {
            sourceTeamId: teamId,
            hackathonId,
            status: 'active',
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            targetUser: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                bio: true,
                skills: true,
                reputationScore: true
              }
            }
          },
          orderBy: { overallScore: 'desc' },
          take: limit
        })

        if (cachedRecommendations.length > 0) {
          recommendations = cachedRecommendations.map(rec => ({
            userId: rec.targetUserId,
            username: rec.targetUser?.username,
            avatarUrl: rec.targetUser?.avatarUrl,
            bio: rec.targetUser?.bio,
            skills: rec.targetUser?.skills,
            reputationScore: rec.targetUser?.reputationScore,
            overallScore: Number(rec.overallScore),
            skillMatchScore: Number(rec.skillMatchScore),
            experienceMatchScore: Number(rec.experienceMatchScore),
            locationMatchScore: Number(rec.locationMatchScore),
            availabilityScore: Number(rec.availabilityScore),
            matchingSkills: rec.matchingSkills,
            missingSkills: rec.missingSkills,
            complementarySkills: rec.complementarySkills,
            synergyReasons: rec.synergyReasons,
            strengthsAnalysis: rec.strengthsAnalysis,
            weaknessesAnalysis: rec.weaknessesAnalysis,
            confidence: Number(rec.confidence),
            explanation: rec.explanation,
            recommendationId: rec.id,
            createdAt: rec.createdAt
          }))

          return NextResponse.json({
            success: true,
            data: { 
              recommendations,
              fromCache: true,
              type: 'users'
            }
          })
        }
      }

      // 生成新的推荐
      const newRecommendations = await TeamMatchingService.recommendUsersForTeam(
        teamId,
        hackathonId,
        limit
      )

      // 保存推荐到数据库
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24小时后过期

      const savedRecommendations = await Promise.all(
        newRecommendations.map(async (rec) => {
          try {
            return await prisma.teamRecommendation.create({
              data: {
                recommendationType: 'team_to_user',
                sourceTeamId: teamId,
                targetUserId: rec.userId,
                hackathonId,
                overallScore: rec.overallScore,
                skillMatchScore: rec.skillMatchScore,
                experienceMatchScore: rec.experienceMatchScore,
                locationMatchScore: rec.locationMatchScore,
                availabilityScore: rec.availabilityScore,
                matchingSkills: rec.matchingSkills,
                missingSkills: rec.missingSkills,
                complementarySkills: rec.complementarySkills,
                synergyReasons: rec.synergyReasons,
                strengthsAnalysis: rec.strengthsAnalysis,
                weaknessesAnalysis: rec.weaknessesAnalysis,
                confidence: rec.confidence,
                explanation: rec.explanation,
                expiresAt,
                algorithmVersion: '1.0.0'
              }
            })
          } catch (error) {
            console.error('Error saving user recommendation:', error)
            return null
          }
        })
      )

      recommendations = newRecommendations.map((rec, index) => ({
        ...rec,
        recommendationId: savedRecommendations[index]?.id,
        createdAt: savedRecommendations[index]?.createdAt
      }))
    }

    return NextResponse.json({
      success: true,
      data: { 
        recommendations,
        fromCache: false,
        type,
        total: recommendations.length
      }
    })

  } catch (error) {
    console.error('Error getting team recommendations:', error)
    return NextResponse.json(
      { success: false, error: t('common.errors.internalServerError') },
      { status: 500 }
    )
  }
}

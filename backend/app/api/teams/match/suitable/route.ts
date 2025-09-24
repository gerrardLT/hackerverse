import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

const suitableTeamsSchema = z.object({
  hackathonId: z.string().min(1, 'Hackathon ID is required'),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  timezone: z.string().optional(),
  teamSize: z.number().int().min(1).max(10).optional(),
  projectType: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(50).optional().default(10),
})

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('common.errors.unauthenticated') },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryData = {
      hackathonId: searchParams.get('hackathonId') || '',
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
      experienceLevel: searchParams.get('experienceLevel') as any,
      timezone: searchParams.get('timezone') || undefined,
      teamSize: searchParams.get('teamSize') ? parseInt(searchParams.get('teamSize')!) : undefined,
      projectType: searchParams.get('projectType') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    }

    const validatedData = suitableTeamsSchema.parse(queryData)
    const { hackathonId, skills, experienceLevel, timezone, teamSize, projectType, page, limit } = validatedData

    // 检查用户是否已加入团队
    const userTeamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: {
          hackathonId: hackathonId,
        },
      },
      include: {
        team: true,
      },
    })

    if (userTeamMembership) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('teamMatching.suitable.alreadyInTeam'),
          data: { currentTeam: userTeamMembership.team }
        },
        { status: 400 }
      )
    }

    // 构建查询条件
    const whereClause: any = {
      hackathonId: hackathonId,
      status: 'RECRUITING',
      NOT: {
        leaderId: user.id, // 排除用户自己的团队
      },
      members: {
        none: {
          userId: user.id, // 排除用户已加入的团队
        },
      },
    }

    // 如果指定了团队规模，过滤团队
    if (teamSize) {
      whereClause._count = {
        members: {
          lt: teamSize, // 团队当前成员数小于指定规模
        },
      }
    }

    // 获取用户偏好
    const userPreferences = await prisma.teamPreferences.findUnique({
      where: {
        userId_hackathonId: {
          userId: user.id,
          hackathonId: hackathonId,
        },
      },
    })

    // 如果用户设置了偏好，使用偏好来过滤
    if (userPreferences) {
      // 团队规模偏好
      if (userPreferences.preferredTeamSize) {
        whereClause.maxMembers = {
          gte: userPreferences.preferredTeamSize,
        }
      }
    }

    // 计算分页偏移量
    const offset = (page - 1) * limit

    // 查询适合的团队
    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        leader: {
          select: {
            id: true,
            username: true,
            email: true,
            skills: true,
          },
        },
        members: {
          select: {
            user: {
              select: {
                id: true,
                username: true,
                skills: true,
              },
            },
            role: true,
          },
        },
        preferences: {
          where: {
            hackathonId: hackathonId,
          },
        },
        _count: {
          select: {
            members: true,
            applications: {
              where: {
                status: 'PENDING',
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      skip: offset,
      take: limit,
    })

    // 获取总数用于分页
    const total = await prisma.team.count({
      where: whereClause,
    })

    // 处理团队数据，添加匹配信息
    const teamsWithMatchInfo = teams.map(team => {
      let matchScore = 0.5 // 基础匹配分数

      // 技能匹配计算
      if (skills && skills.length > 0) {
        const teamSkills = team.skills as string[] || []
        const matchingSkills = skills.filter(skill => 
          teamSkills.some(ts => ts.toLowerCase().includes(skill.toLowerCase()))
        )
        const skillMatchRatio = matchingSkills.length / skills.length
        matchScore += skillMatchRatio * 0.3
      }

      // 经验匹配计算 (暂时禁用，因为User模型中没有experience字段)
      // if (experienceLevel && team.leader.experience) {
      //   const experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert']
      //   const userLevel = experienceLevels.indexOf(experienceLevel)
      //   const teamLevel = experienceLevels.indexOf(team.leader.experience as string)
      //   if (userLevel !== -1 && teamLevel !== -1) {
      //     const experienceMatch = 1 - Math.abs(userLevel - teamLevel) / (experienceLevels.length - 1)
      //     matchScore += experienceMatch * 0.2
      //   }
      // }

      // 确保分数在0-1之间
      matchScore = Math.min(Math.max(matchScore, 0), 1)

      return {
        ...team,
        matchInfo: {
          score: Number(matchScore.toFixed(3)),
          matchingSkills: skills && skills.length > 0 ? 
            skills.filter(skill => 
              (team.skills as string[] || []).some(ts => 
                ts.toLowerCase().includes(skill.toLowerCase())
              )
            ) : [],
          availableSlots: (team.maxMembers || 6) - team._count.members,
          pendingApplications: team._count.applications,
        },
      }
    })

    // 按匹配分数排序
    teamsWithMatchInfo.sort((a, b) => b.matchInfo.score - a.matchInfo.score)

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }

    return NextResponse.json(
      { 
        success: true, 
        data: teamsWithMatchInfo,
        pagination,
        filters: {
          skills,
          experienceLevel,
          timezone,
          teamSize,
          projectType,
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Failed to fetch suitable teams:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('common.errors.invalidInput'), details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: t('teamMatching.suitable.fetchError') },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // 活动类型过滤

    // 并行获取不同类型的活动数据
    const [
      participations,
      projects,
      teams,
      scores,
      reputationRecords
    ] = await Promise.all([
      // 黑客松参与
      prisma.participation.findMany({
        where: { userId: user.id },
        include: {
          hackathon: {
            select: { 
              id: true,
              title: true, 
              startDate: true,
              endDate: true,
              status: true 
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: limit
      }),

      // 项目提交
      prisma.project.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            { team: { members: { some: { userId: user.id } } } }
          ]
        },
        include: {
          hackathon: {
            select: { 
              id: true,
              title: true 
            }
          },
          team: {
            select: { 
              id: true,
              name: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // 团队活动
      prisma.teamMember.findMany({
        where: { userId: user.id },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              hackathonId: true,
              hackathon: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: limit
      }),

      // 评分活动
      prisma.score.findMany({
        where: {
          judge: {
            userId: user.id
          }
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              hackathon: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // 声誉记录
      prisma.reputationRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ])

    // 组织活动数据
    const activities: any[] = []

    // 添加黑客松参与活动
    participations.forEach(participation => {
      activities.push({
        id: `participation_${participation.id}`,
        type: 'hackathon_joined',
        title: '参加了黑客松',
        description: `加入了 ${participation.hackathon.title}`,
        date: participation.joinedAt,
        metadata: {
          hackathonId: participation.hackathon.id,
          hackathonTitle: participation.hackathon.title,
          hackathonStatus: participation.hackathon.status,
          status: participation.status
        }
      })
    })

    // 添加项目提交活动
    projects.forEach(project => {
      activities.push({
        id: `project_${project.id}`,
        type: 'project_submitted',
        title: '提交了项目',
        description: project.hackathon 
          ? `在 ${project.hackathon.title} 提交了项目 "${project.title}"`
          : `提交了独立项目 "${project.title}"`,
        date: project.createdAt,
        metadata: {
          projectId: project.id,
          projectTitle: project.title,
          hackathonTitle: project.hackathon?.title,
          teamName: project.team?.name,
          status: project.status
        }
      })
    })

    // 添加团队加入活动
    teams.forEach(teamMember => {
      activities.push({
        id: `team_${teamMember.id}`,
        type: 'team_joined',
        title: '加入了团队',
        description: `加入了团队 "${teamMember.team.name}" (${teamMember.team.hackathon.title})`,
        date: teamMember.joinedAt,
        metadata: {
          teamId: teamMember.team.id,
          teamName: teamMember.team.name,
          hackathonTitle: teamMember.team.hackathon.title,
          role: teamMember.role
        }
      })
    })

    // 添加评分活动
    scores.forEach(score => {
      activities.push({
        id: `score_${score.id}`,
        type: 'project_scored',
        title: '评分了项目',
        description: `为项目 "${score.project.title}" 打分 (${score.totalScore}/10)`,
        date: score.createdAt,
        metadata: {
          projectId: score.project.id,
          projectTitle: score.project.title,
          hackathonTitle: score.project.hackathon?.title,
          totalScore: score.totalScore
        }
      })
    })

    // 添加声誉变动活动
    reputationRecords.forEach(record => {
      activities.push({
        id: `reputation_${record.id}`,
        type: 'reputation_gained',
        title: '获得声誉积分',
        description: record.description || `通过 ${record.action} 获得了 ${record.points} 声誉积分`,
        date: record.createdAt,
        metadata: {
          action: record.action,
          points: record.points,
          category: record.category,
          multiplier: record.multiplier
        }
      })
    })

    // 按时间倒序排序
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 根据类型过滤
    let filteredActivities = activities
    if (type) {
      filteredActivities = activities.filter(activity => activity.type === type)
    }

    // 应用分页
    const paginatedActivities = filteredActivities.slice(offset, offset + limit)

    // 获取活动统计
    const activityStats = {
      total: filteredActivities.length,
      byType: {} as Record<string, number>
    }

    activities.forEach(activity => {
      activityStats.byType[activity.type] = (activityStats.byType[activity.type] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        activities: paginatedActivities,
        stats: activityStats,
        pagination: {
          total: filteredActivities.length,
          limit,
          offset,
          hasMore: offset + limit < filteredActivities.length
        }
      }
    })

  } catch (error) {
    console.error('获取用户活动历史错误:', error)
    return NextResponse.json(
      { success: false, error: '获取活动历史失败' },
      { status: 500 }
    )
  }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 分析数据类型接口
interface AnalyticsOverviewData {
  totalParticipants: number
  totalProjects: number
  totalTeams: number
  completionRate: number
  averageScore: number
  topSkills: Array<{ skill: string; count: number }>
  registrationTrend: Array<{ date: string; count: number }>
  engagementRate: number
}

interface ParticipationAnalyticsData {
  participantCount: number
  registrationTrend: Array<{ date: string; count: number }>
  demographicBreakdown: {
    byExperience: Array<{ level: string; count: number }>
    byLocation: Array<{ location: string; count: number }>
    bySkills: Array<{ skill: string; count: number }>
  }
  retentionRate: number
  dropoutRate: number
  checkInRate: number
  submissionRate: number
}

interface ProjectAnalyticsData {
  totalProjects: number
  submissionRate: number
  averageScore: number
  scoreDistribution: Array<{ range: string; count: number }>
  technologyUsage: Array<{ technology: string; count: number }>
  categoryBreakdown: Array<{ category: string; count: number; averageScore: number }>
  qualityMetrics: {
    innovationAverage: number
    technicalComplexityAverage: number
    userExperienceAverage: number
    businessPotentialAverage: number
    presentationAverage: number
  }
  completionTrend: Array<{ date: string; count: number }>
}

interface TeamAnalyticsData {
  totalTeams: number
  teamSizeDistribution: Array<{ size: number; count: number }>
  teamFormationRate: number
  collaborationMetrics: {
    averageTeamSize: number
    teamCompletionRate: number
    leaderParticipationRate: number
  }
  teamPerformance: Array<{
    teamId: string
    teamName: string
    memberCount: number
    projectCount: number
    averageScore: number
    collaborationScore: number
  }>
  skillDiversityIndex: number
  communicationPatterns: Array<{ pattern: string; count: number }>
}

export class AnalyticsService {
  /**
   * 获取黑客松概览分析
   * @param hackathonId 黑客松ID
   * @returns 概览分析数据
   */
  async getHackathonOverview(hackathonId: string): Promise<AnalyticsOverviewData> {
    // 并行查询多个统计数据
    const [
      participationStats,
      projectStats,
      teamStats,
      scoreStats,
      skillStats,
      registrationTrend
    ] = await Promise.all([
      // 参与统计
      prisma.participation.aggregate({
        where: { hackathonId },
        _count: { id: true }
      }),
      
      // 项目统计
      prisma.project.aggregate({
        where: { hackathonId },
        _count: { id: true }
      }),
      
      // 团队统计
      prisma.team.aggregate({
        where: { hackathonId },
        _count: { id: true }
      }),
      
      // 评分统计
      prisma.score.aggregate({
        where: { 
          project: { hackathonId } 
        },
        _avg: { totalScore: true },
        _count: { id: true }
      }),
      
      // 技能统计
      prisma.user.findMany({
        where: {
          participations: {
            some: { hackathonId }
          }
        },
        select: { skills: true }
      }),
      
      // 注册趋势
      prisma.participation.groupBy({
        by: ['createdAt'],
        where: { hackathonId },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      })
    ])

    // 处理技能统计
    const skillMap = new Map<string, number>()
    skillStats.forEach(user => {
      if (user.skills && Array.isArray(user.skills)) {
        (user.skills as any[]).forEach(skill => {
          if (typeof skill === 'string') {
            skillMap.set(skill, (skillMap.get(skill) || 0) + 1)
          } else if (skill.name) {
            skillMap.set(skill.name, (skillMap.get(skill.name) || 0) + 1)
          }
        })
      }
    })

    const topSkills = Array.from(skillMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 处理注册趋势数据（按天聚合）
    const trendMap = new Map<string, number>()
    registrationTrend.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0]
      trendMap.set(date, (trendMap.get(date) || 0) + item._count.id)
    })

    const registrationTrendData = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 计算完成率和参与度
    const totalParticipants = participationStats._count.id
    const totalProjects = projectStats._count.id
    const completionRate = totalParticipants > 0 ? (totalProjects / totalParticipants) * 100 : 0
    const engagementRate = totalParticipants > 0 ? Math.min(100, (scoreStats._count.id / totalParticipants) * 100) : 0

    return {
      totalParticipants,
      totalProjects,
      totalTeams: teamStats._count.id,
      completionRate: Math.round(completionRate * 100) / 100,
      averageScore: scoreStats._avg.totalScore || 0,
      topSkills,
      registrationTrend: registrationTrendData,
      engagementRate: Math.round(engagementRate * 100) / 100
    }
  }

  /**
   * 获取参与度分析
   * @param hackathonId 黑客松ID
   * @returns 参与度分析数据
   */
  async getParticipationAnalytics(hackathonId: string): Promise<ParticipationAnalyticsData> {
    const [
      participations,
      registrationTrend,
      userDemographics,
      checkInData,
      submissionData
    ] = await Promise.all([
      // 获取所有参与记录
      prisma.participation.findMany({
        where: { hackathonId },
        include: {
          user: {
            select: { skills: true, location: true }
          }
        }
      }),
      
      // 注册趋势
      prisma.participation.groupBy({
        by: ['createdAt'],
        where: { hackathonId },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // 用户人口统计学数据
      prisma.user.findMany({
        where: {
          participations: {
            some: { hackathonId }
          }
        },
        select: { 
          skills: true, 
          location: true,
          experience: true 
        }
      }),
      
      // 签到数据（假设通过participations的状态判断）
      prisma.participation.count({
        where: { 
          hackathonId,
          status: 'checked_in'
        }
      }),
      
      // 提交数据
      prisma.project.count({
        where: { hackathonId }
      })
    ])

    const totalParticipants = participations.length

    // 处理注册趋势
    const trendMap = new Map<string, number>()
    registrationTrend.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0]
      trendMap.set(date, (trendMap.get(date) || 0) + item._count.id)
    })

    const registrationTrendData = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 人口统计学分析
    const experienceMap = new Map<string, number>()
    const locationMap = new Map<string, number>()
    const skillMap = new Map<string, number>()

    userDemographics.forEach(user => {
      // 经验分析
      const experience = (user as any).experience || 'unknown'
      experienceMap.set(experience, (experienceMap.get(experience) || 0) + 1)
      
      // 地理位置分析
      const location = user.location || 'unknown'
      locationMap.set(location, (locationMap.get(location) || 0) + 1)
      
      // 技能分析
      if (user.skills && Array.isArray(user.skills)) {
        (user.skills as any[]).forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name
          if (skillName) {
            skillMap.set(skillName, (skillMap.get(skillName) || 0) + 1)
          }
        })
      }
    })

    // 计算各种率
    const checkInRate = totalParticipants > 0 ? (checkInData / totalParticipants) * 100 : 0
    const submissionRate = totalParticipants > 0 ? (submissionData / totalParticipants) * 100 : 0
    const dropoutRate = 100 - checkInRate
    const retentionRate = submissionRate

    return {
      participantCount: totalParticipants,
      registrationTrend: registrationTrendData,
      demographicBreakdown: {
        byExperience: Array.from(experienceMap.entries())
          .map(([level, count]) => ({ level, count }))
          .sort((a, b) => b.count - a.count),
        byLocation: Array.from(locationMap.entries())
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        bySkills: Array.from(skillMap.entries())
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)
      },
      retentionRate: Math.round(retentionRate * 100) / 100,
      dropoutRate: Math.round(dropoutRate * 100) / 100,
      checkInRate: Math.round(checkInRate * 100) / 100,
      submissionRate: Math.round(submissionRate * 100) / 100
    }
  }

  /**
   * 获取项目质量分析
   * @param hackathonId 黑客松ID
   * @returns 项目质量分析数据
   */
  async getProjectAnalytics(hackathonId: string): Promise<ProjectAnalyticsData> {
    const [
      projects,
      scores,
      participantCount,
      submissionTrend
    ] = await Promise.all([
      // 获取所有项目
      prisma.project.findMany({
        where: { hackathonId },
        include: {
          scores: true
        }
      }),
      
      // 获取所有评分
      prisma.score.findMany({
        where: {
          project: { hackathonId }
        }
      }),
      
      // 参与者总数
      prisma.participation.count({
        where: { hackathonId }
      }),
      
      // 提交趋势
      prisma.project.groupBy({
        by: ['createdAt'],
        where: { hackathonId },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const totalProjects = projects.length
    const submissionRate = participantCount > 0 ? (totalProjects / participantCount) * 100 : 0

    // 评分分析
    let totalScore = 0
    let scoreCount = 0
    const scoreRanges = new Map<string, number>()
    const qualityMetrics = {
      innovation: [] as number[],
      technicalComplexity: [] as number[],
      userExperience: [] as number[],
      businessPotential: [] as number[],
      presentation: [] as number[]
    }

    scores.forEach(score => {
      if (score.totalScore) {
        totalScore += score.totalScore
        scoreCount++
        
        // 分数分布
        const range = Math.floor(score.totalScore / 2) * 2
        const rangeKey = `${range}-${range + 1.9}`
        scoreRanges.set(rangeKey, (scoreRanges.get(rangeKey) || 0) + 1)
      }
      
      // 各维度质量指标
      if (score.innovation) qualityMetrics.innovation.push(score.innovation)
      if (score.technicalComplexity) qualityMetrics.technicalComplexity.push(score.technicalComplexity)
      if (score.userExperience) qualityMetrics.userExperience.push(score.userExperience)
      if (score.businessPotential) qualityMetrics.businessPotential.push(score.businessPotential)
      if (score.presentation) qualityMetrics.presentation.push(score.presentation)
    })

    const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0

    // 技术使用统计
    const technologyMap = new Map<string, number>()
    const categoryMap = new Map<string, { count: number; totalScore: number }>()

    projects.forEach(project => {
      // 技术栈分析
      if (project.technologies && Array.isArray(project.technologies)) {
        (project.technologies as any[]).forEach(tech => {
          const techName = typeof tech === 'string' ? tech : tech.name
          if (techName) {
            technologyMap.set(techName, (technologyMap.get(techName) || 0) + 1)
          }
        })
      }
      
      // 分类分析
      const category = project.category || 'other'
      const projectAvgScore = project.scores.length > 0 
        ? project.scores.reduce((sum, s) => sum + (s.totalScore || 0), 0) / project.scores.length 
        : 0
      
      const existing = categoryMap.get(category) || { count: 0, totalScore: 0 }
      categoryMap.set(category, {
        count: existing.count + 1,
        totalScore: existing.totalScore + projectAvgScore
      })
    })

    // 处理提交趋势
    const trendMap = new Map<string, number>()
    submissionTrend.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0]
      trendMap.set(date, (trendMap.get(date) || 0) + item._count.id)
    })

    const completionTrendData = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalProjects,
      submissionRate: Math.round(submissionRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
      scoreDistribution: Array.from(scoreRanges.entries())
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => a.range.localeCompare(b.range)),
      technologyUsage: Array.from(technologyMap.entries())
        .map(([technology, count]) => ({ technology, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      categoryBreakdown: Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          count: data.count,
          averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count),
      qualityMetrics: {
        innovationAverage: qualityMetrics.innovation.length > 0 
          ? Math.round((qualityMetrics.innovation.reduce((a, b) => a + b, 0) / qualityMetrics.innovation.length) * 100) / 100 
          : 0,
        technicalComplexityAverage: qualityMetrics.technicalComplexity.length > 0 
          ? Math.round((qualityMetrics.technicalComplexity.reduce((a, b) => a + b, 0) / qualityMetrics.technicalComplexity.length) * 100) / 100 
          : 0,
        userExperienceAverage: qualityMetrics.userExperience.length > 0 
          ? Math.round((qualityMetrics.userExperience.reduce((a, b) => a + b, 0) / qualityMetrics.userExperience.length) * 100) / 100 
          : 0,
        businessPotentialAverage: qualityMetrics.businessPotential.length > 0 
          ? Math.round((qualityMetrics.businessPotential.reduce((a, b) => a + b, 0) / qualityMetrics.businessPotential.length) * 100) / 100 
          : 0,
        presentationAverage: qualityMetrics.presentation.length > 0 
          ? Math.round((qualityMetrics.presentation.reduce((a, b) => a + b, 0) / qualityMetrics.presentation.length) * 100) / 100 
          : 0
      },
      completionTrend: completionTrendData
    }
  }

  /**
   * 获取团队协作分析
   * @param hackathonId 黑客松ID
   * @returns 团队协作分析数据
   */
  async getTeamAnalytics(hackathonId: string): Promise<TeamAnalyticsData> {
    const [
      teams,
      teamMembers,
      projects
    ] = await Promise.all([
      // 获取所有团队
      prisma.team.findMany({
        where: { hackathonId },
        include: {
          members: {
            include: {
              user: {
                select: { skills: true }
              }
            }
          },
          projects: {
            include: {
              scores: true
            }
          }
        }
      }),
      
      // 团队成员统计
      prisma.teamMember.groupBy({
        by: ['teamId'],
        where: {
          team: { hackathonId }
        },
        _count: { id: true }
      }),
      
      // 项目数据
      prisma.project.findMany({
        where: { hackathonId },
        include: {
          team: true,
          scores: true
        }
      })
    ])

    const totalTeams = teams.length
    
    // 团队规模分布
    const sizeMap = new Map<number, number>()
    let totalMemberCount = 0
    
    teamMembers.forEach(team => {
      const size = team._count.id
      sizeMap.set(size, (sizeMap.get(size) || 0) + 1)
      totalMemberCount += size
    })

    const teamSizeDistribution = Array.from(sizeMap.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => a.size - b.size)

    const averageTeamSize = totalTeams > 0 ? totalMemberCount / totalTeams : 0

    // 团队表现分析
    const teamPerformance = teams.map(team => {
      const memberCount = team.members.length
      const projectCount = team.projects.length
      
      // 计算团队平均分
      let totalScore = 0
      let scoreCount = 0
      team.projects.forEach(project => {
        project.scores.forEach(score => {
          if (score.totalScore) {
            totalScore += score.totalScore
            scoreCount++
          }
        })
      })
      const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0

      // 计算协作评分（基于团队规模、项目完成度等）
      let collaborationScore = 0
      if (memberCount > 1) {
        collaborationScore += 20 // 基础分
        if (projectCount > 0) collaborationScore += 30 // 有项目提交
        if (averageScore > 7) collaborationScore += 30 // 高质量项目
        if (memberCount >= 3 && memberCount <= 5) collaborationScore += 20 // 理想团队规模
      }

      return {
        teamId: team.id,
        teamName: team.name,
        memberCount,
        projectCount,
        averageScore: Math.round(averageScore * 100) / 100,
        collaborationScore: Math.round(collaborationScore)
      }
    }).sort((a, b) => b.averageScore - a.averageScore)

    // 计算其他指标
    const teamsWithProjects = teams.filter(team => team.projects.length > 0).length
    const teamCompletionRate = totalTeams > 0 ? (teamsWithProjects / totalTeams) * 100 : 0
    
    const teamsWithLeaderProjects = teams.filter(team => 
      team.projects.some(project => project.createdBy === team.leaderId)
    ).length
    const leaderParticipationRate = totalTeams > 0 ? (teamsWithLeaderProjects / totalTeams) * 100 : 0

    // 技能多样性指数（基于团队内技能差异）
    let totalDiversityScore = 0
    let teamsAnalyzed = 0
    
    teams.forEach(team => {
      if (team.members.length > 1) {
        const teamSkills = new Set<string>()
        team.members.forEach(member => {
          if (member.user.skills && Array.isArray(member.user.skills)) {
            (member.user.skills as any[]).forEach(skill => {
              const skillName = typeof skill === 'string' ? skill : skill.name
              if (skillName) teamSkills.add(skillName)
            })
          }
        })
        const diversityScore = teamSkills.size / team.members.length
        totalDiversityScore += diversityScore
        teamsAnalyzed++
      }
    })

    const skillDiversityIndex = teamsAnalyzed > 0 ? totalDiversityScore / teamsAnalyzed : 0

    // 沟通模式分析（模拟数据，实际需要基于真实沟通数据）
    const communicationPatterns = [
      { pattern: 'daily_standup', count: Math.floor(totalTeams * 0.4) },
      { pattern: 'async_updates', count: Math.floor(totalTeams * 0.6) },
      { pattern: 'video_calls', count: Math.floor(totalTeams * 0.3) },
      { pattern: 'chat_channels', count: Math.floor(totalTeams * 0.8) }
    ]

    return {
      totalTeams,
      teamSizeDistribution,
      teamFormationRate: totalTeams, // 可以根据时间段计算形成率
      collaborationMetrics: {
        averageTeamSize: Math.round(averageTeamSize * 100) / 100,
        teamCompletionRate: Math.round(teamCompletionRate * 100) / 100,
        leaderParticipationRate: Math.round(leaderParticipationRate * 100) / 100
      },
      teamPerformance,
      skillDiversityIndex: Math.round(skillDiversityIndex * 100) / 100,
      communicationPatterns
    }
  }

  /**
   * 缓存分析数据
   * @param cacheKey 缓存键
   * @param dataType 数据类型
   * @param data 分析数据
   * @param hackathonId 黑客松ID
   * @param ttl 缓存时间（秒）
   */
  async cacheAnalyticsData(
    cacheKey: string,
    dataType: string,
    data: any,
    hackathonId?: string,
    ttl: number = 3600
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000)
    
    await prisma.analyticsCache.upsert({
      where: { cacheKey },
      update: {
        data,
        expiresAt,
        updatedAt: new Date(),
        lastDataUpdate: new Date(),
        accessCount: { increment: 1 }
      },
      create: {
        cacheKey,
        dataType,
        hackathonId,
        data,
        expiresAt,
        lastDataUpdate: new Date(),
        dataPoints: Array.isArray(data) ? data.length : Object.keys(data).length
      }
    })
  }

  /**
   * 获取缓存的分析数据
   * @param cacheKey 缓存键
   * @returns 缓存的数据或null
   */
  async getCachedAnalyticsData(cacheKey: string): Promise<any | null> {
    const cached = await prisma.analyticsCache.findUnique({
      where: { cacheKey }
    })

    if (!cached || cached.expiresAt < new Date()) {
      return null
    }

    // 更新访问统计
    await prisma.analyticsCache.update({
      where: { cacheKey },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    })

    return cached.data
  }
}

import { prisma } from './prisma'
import { getLocaleFromRequest, createTFunction } from './i18n'

/**
 * 智能团队匹配服务
 * 提供基于多维度算法的团队和用户匹配功能
 */
export class TeamMatchingService {
  
  /**
   * 计算技能匹配分数
   * @param userSkills 用户技能列表
   * @param requiredSkills 必需技能列表
   * @param preferredSkills 偏好技能列表
   * @returns 技能匹配分数 (0-1)
   */
  static calculateSkillMatch(
    userSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): {
    score: number,
    matchingSkills: string[],
    missingSkills: string[],
    complementarySkills: string[]
  } {
    // 标准化技能名称（转小写，去空格）
    const normalizeSkill = (skill: string) => skill.toLowerCase().replace(/\s+/g, '')
    
    const normalizedUserSkills = userSkills.map(normalizeSkill)
    const normalizedRequired = requiredSkills.map(normalizeSkill)
    const normalizedPreferred = preferredSkills.map(normalizeSkill)
    
    // 计算匹配的技能
    const matchingRequired = normalizedRequired.filter(skill => 
      normalizedUserSkills.includes(skill)
    )
    const matchingPreferred = normalizedPreferred.filter(skill => 
      normalizedUserSkills.includes(skill)
    )
    
    // 计算缺失的必需技能
    const missingRequired = normalizedRequired.filter(skill => 
      !normalizedUserSkills.includes(skill)
    )
    
    // 计算互补技能（用户有但团队不需要的技能，可能对团队有益）
    const complementary = normalizedUserSkills.filter(skill => 
      !normalizedRequired.includes(skill) && !normalizedPreferred.includes(skill)
    )
    
    // 计算分数
    let score = 0
    
    // 必需技能权重：70%
    if (normalizedRequired.length > 0) {
      const requiredMatch = matchingRequired.length / normalizedRequired.length
      score += requiredMatch * 0.7
    } else {
      score += 0.7 // 如果没有必需技能要求，给满分
    }
    
    // 偏好技能权重：20%
    if (normalizedPreferred.length > 0) {
      const preferredMatch = matchingPreferred.length / normalizedPreferred.length
      score += preferredMatch * 0.2
    } else {
      score += 0.2
    }
    
    // 互补技能加分：10%
    const complementaryBonus = Math.min(complementary.length * 0.02, 0.1)
    score += complementaryBonus
    
    // 如果缺失关键必需技能，重罚
    if (missingRequired.length > normalizedRequired.length * 0.5) {
      score *= 0.5 // 减半
    }
    
    return {
      score: Math.min(score, 1), // 确保不超过1
      matchingSkills: [...matchingRequired, ...matchingPreferred],
      missingSkills: missingRequired,
      complementarySkills: complementary
    }
  }
  
  /**
   * 计算经验匹配分数
   * @param userExperience 用户经验级别
   * @param minExperience 最低经验要求
   * @param maxExperience 最高经验要求
   * @returns 经验匹配分数 (0-1)
   */
  static calculateExperienceMatch(
    userExperience: string,
    minExperience: string,
    maxExperience: string
  ): number {
    const experienceLevels = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    }
    
    const userLevel = experienceLevels[userExperience as keyof typeof experienceLevels] || 1
    const minLevel = experienceLevels[minExperience as keyof typeof experienceLevels] || 1
    const maxLevel = experienceLevels[maxExperience as keyof typeof experienceLevels] || 4
    
    // 如果用户经验在范围内，给高分
    if (userLevel >= minLevel && userLevel <= maxLevel) {
      return 1.0
    }
    
    // 如果用户经验略低于最低要求，给中等分数
    if (userLevel === minLevel - 1) {
      return 0.7
    }
    
    // 如果用户经验超出最高要求，根据超出程度扣分
    if (userLevel > maxLevel) {
      const overLevel = userLevel - maxLevel
      return Math.max(0.5 - overLevel * 0.2, 0.1)
    }
    
    // 其他情况给低分
    return 0.3
  }
  
  /**
   * 计算时区/地理位置匹配分数
   * @param userTimezone 用户时区
   * @param preferredTimezones 偏好时区列表
   * @param locationFlexible 是否地理位置灵活
   * @returns 地理匹配分数 (0-1)
   */
  static calculateLocationMatch(
    userTimezone: string,
    preferredTimezones: string[],
    locationFlexible: boolean
  ): number {
    // 如果位置灵活，给高分
    if (locationFlexible) {
      return 0.9
    }
    
    // 如果没有偏好时区限制，给中等分数
    if (preferredTimezones.length === 0) {
      return 0.8
    }
    
    // 检查是否在偏好时区内
    if (preferredTimezones.includes(userTimezone)) {
      return 1.0
    }
    
    // 计算时区差异（这里简化处理，实际应该计算真实时差）
    const timezoneMapping: { [key: string]: number } = {
      'UTC-12': -12, 'UTC-11': -11, 'UTC-10': -10, 'UTC-9': -9,
      'UTC-8': -8, 'UTC-7': -7, 'UTC-6': -6, 'UTC-5': -5,
      'UTC-4': -4, 'UTC-3': -3, 'UTC-2': -2, 'UTC-1': -1,
      'UTC+0': 0, 'UTC+1': 1, 'UTC+2': 2, 'UTC+3': 3,
      'UTC+4': 4, 'UTC+5': 5, 'UTC+6': 6, 'UTC+7': 7,
      'UTC+8': 8, 'UTC+9': 9, 'UTC+10': 10, 'UTC+11': 11, 'UTC+12': 12
    }
    
    const userOffset = timezoneMapping[userTimezone] || 0
    
    // 计算与偏好时区的最小时差
    const minTimeDiff = Math.min(...preferredTimezones.map(tz => 
      Math.abs(userOffset - (timezoneMapping[tz] || 0))
    ))
    
    // 根据时差计算分数
    if (minTimeDiff <= 2) return 0.8
    if (minTimeDiff <= 4) return 0.6
    if (minTimeDiff <= 8) return 0.4
    return 0.2
  }
  
  /**
   * 计算工作时间匹配分数
   * @param userWorkingHours 用户工作时间偏好
   * @param teamWorkingHours 团队工作时间偏好
   * @returns 工作时间匹配分数 (0-1)
   */
  static calculateAvailabilityMatch(
    userWorkingHours: any,
    teamWorkingHours: any
  ): number {
    if (!userWorkingHours || !teamWorkingHours) {
      return 0.7 // 如果没有设置工作时间，给中等分数
    }
    
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes // 转换为分钟
    }
    
    try {
      const userStart = parseTime(userWorkingHours.start || '09:00')
      const userEnd = parseTime(userWorkingHours.end || '18:00')
      const teamStart = parseTime(teamWorkingHours.start || '09:00')
      const teamEnd = parseTime(teamWorkingHours.end || '18:00')
      
      // 计算重叠时间
      const overlapStart = Math.max(userStart, teamStart)
      const overlapEnd = Math.min(userEnd, teamEnd)
      const overlapDuration = Math.max(0, overlapEnd - overlapStart)
      
      // 计算总工作时间的并集
      const totalStart = Math.min(userStart, teamStart)
      const totalEnd = Math.max(userEnd, teamEnd)
      const totalDuration = totalEnd - totalStart
      
      // 重叠比例
      const overlapRatio = overlapDuration / totalDuration
      
      // 确保至少有4小时重叠才给高分
      const minOverlapHours = 4 * 60 // 4小时
      if (overlapDuration >= minOverlapHours) {
        return Math.min(0.8 + overlapRatio * 0.2, 1.0)
      } else {
        return overlapDuration / minOverlapHours * 0.8
      }
    } catch (error) {
      return 0.5 // 解析错误时给中等分数
    }
  }
  
  /**
   * 计算团队规模匹配分数
   * @param currentTeamSize 当前团队规模
   * @param maxTeamSize 最大团队规模
   * @param preferredTeamSize 偏好团队规模
   * @returns 团队规模匹配分数 (0-1)
   */
  static calculateTeamSizeMatch(
    currentTeamSize: number,
    maxTeamSize: number,
    preferredTeamSize: number
  ): number {
    // 如果团队已满，无法加入
    if (currentTeamSize >= maxTeamSize) {
      return 0
    }
    
    const sizeAfterJoining = currentTeamSize + 1
    
    // 如果加入后刚好达到偏好规模，给满分
    if (sizeAfterJoining === preferredTeamSize) {
      return 1.0
    }
    
    // 如果加入后规模在合理范围内
    const sizeDiff = Math.abs(sizeAfterJoining - preferredTeamSize)
    
    if (sizeDiff === 1) return 0.8
    if (sizeDiff === 2) return 0.6
    if (sizeDiff === 3) return 0.4
    return 0.2
  }
  
  /**
   * 综合计算用户与团队的匹配分数
   * @param userId 用户ID
   * @param teamId 团队ID
   * @param hackathonId 黑客松ID
   * @returns 综合匹配结果
   */
  static async calculateUserTeamMatch(
    userId: string,
    teamId: string,
    hackathonId: string
  ) {
    try {
      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          skills: true,
          preferences: true
        }
      })
      
      // 获取团队信息
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, skills: true }
              }
            }
          },
          preferences: {
            where: { hackathonId }
          },
          leader: {
            select: { id: true, username: true }
          }
        }
      })
      
      if (!user || !team) {
        throw new Error('User or team not found')
      }
      
      // 获取团队偏好设置（优先使用团队设置，否则使用队长设置）
      let teamPreferences = team.preferences[0]
      
      if (!teamPreferences) {
        // 如果团队没有设置偏好，尝试获取队长的偏好
        const leaderPreferences = await prisma.teamPreferences.findFirst({
          where: {
            userId: team.leaderId,
            hackathonId
          }
        })
        teamPreferences = leaderPreferences
      }
      
      // 如果没有偏好设置，使用默认值
      const preferences = teamPreferences || {
        requiredSkills: [],
        preferredSkills: [],
        skillMatchWeight: 0.4,
        minExperience: 'beginner',
        maxExperience: 'expert',
        experienceWeight: 0.2,
        preferredTimezones: [],
        locationFlexible: true,
        locationWeight: 0.1,
        workingHours: {},
        preferredTeamSize: 4,
        maxTeamSize: team.maxMembers
      }
      
      // 计算各维度匹配分数
      const skillMatch = this.calculateSkillMatch(
        user.skills as string[] || [],
        preferences.requiredSkills as string[] || [],
        preferences.preferredSkills as string[] || []
      )
      
      const experienceMatch = this.calculateExperienceMatch(
        (user.preferences as any)?.experience || 'intermediate',
        preferences.minExperience,
        preferences.maxExperience
      )
      
      const locationMatch = this.calculateLocationMatch(
        (user.preferences as any)?.timezone || 'UTC+8',
        preferences.preferredTimezones as string[] || [],
        preferences.locationFlexible
      )
      
      const availabilityMatch = this.calculateAvailabilityMatch(
        (user.preferences as any)?.workingHours,
        preferences.workingHours
      )
      
      const teamSizeMatch = this.calculateTeamSizeMatch(
        team.members.length,
        team.maxMembers,
        preferences.preferredTeamSize
      )
      
      // 计算综合分数（根据权重）
      const weights = {
        skill: preferences.skillMatchWeight,
        experience: preferences.experienceWeight,
        location: preferences.locationWeight,
        availability: 0.2,
        teamSize: 0.1
      }
      
      const overallScore = 
        skillMatch.score * weights.skill +
        experienceMatch * weights.experience +
        locationMatch * weights.location +
        availabilityMatch * weights.availability +
        teamSizeMatch * weights.teamSize
      
      // 生成协同理由
      const synergyReasons = []
      if (skillMatch.score > 0.8) synergyReasons.push('技能高度匹配')
      if (experienceMatch > 0.8) synergyReasons.push('经验水平适合')
      if (locationMatch > 0.8) synergyReasons.push('时区/地理位置兼容')
      if (availabilityMatch > 0.8) synergyReasons.push('工作时间重叠度高')
      if (skillMatch.complementarySkills.length > 0) {
        synergyReasons.push(`带来${skillMatch.complementarySkills.length}项互补技能`)
      }
      
      // 优势和劣势分析
      const strengths = []
      const weaknesses = []
      
      if (skillMatch.score > 0.7) {
        strengths.push('技能匹配度高')
      } else if (skillMatch.missingSkills.length > 0) {
        weaknesses.push(`缺少${skillMatch.missingSkills.length}项必需技能`)
      }
      
      if (experienceMatch > 0.7) {
        strengths.push('经验水平合适')
      } else {
        weaknesses.push('经验水平不太匹配')
      }
      
      if (locationMatch < 0.5) {
        weaknesses.push('时区差异较大')
      }
      
      if (teamSizeMatch < 0.5) {
        weaknesses.push('团队规模不理想')
      }
      
      return {
        userId,
        teamId,
        hackathonId,
        overallScore,
        skillMatchScore: skillMatch.score,
        experienceMatchScore: experienceMatch,
        locationMatchScore: locationMatch,
        availabilityScore: availabilityMatch,
        teamSizeScore: teamSizeMatch,
        matchingSkills: skillMatch.matchingSkills,
        missingSkills: skillMatch.missingSkills,
        complementarySkills: skillMatch.complementarySkills,
        synergyReasons,
        strengthsAnalysis: strengths,
        weaknessesAnalysis: weaknesses,
        confidence: Math.min(overallScore + 0.1, 1.0), // 置信度略高于总分
        explanation: `综合匹配度${(overallScore * 100).toFixed(1)}%，${synergyReasons.join('，')}`
      }
    } catch (error) {
      console.error('Error calculating user-team match:', error)
      throw error
    }
  }
  
  /**
   * 为用户推荐合适的团队
   * @param userId 用户ID
   * @param hackathonId 黑客松ID
   * @param limit 推荐数量限制
   * @returns 推荐团队列表
   */
  static async recommendTeamsForUser(
    userId: string,
    hackathonId: string,
    limit: number = 10
  ) {
    try {
      // 获取该黑客松中状态为RECRUITING的团队
      const teams = await prisma.team.findMany({
        where: {
          hackathonId,
          status: 'RECRUITING',
          members: {
            none: {
              userId // 排除用户已经加入的团队
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, skills: true }
              }
            }
          },
          leader: {
            select: { id: true, username: true }
          }
        }
      })
      
      // 计算每个团队的匹配分数
      const matches = []
      for (const team of teams) {
        try {
          const matchResult = await this.calculateUserTeamMatch(userId, team.id, hackathonId)
          matches.push({
            team,
            ...matchResult
          })
        } catch (error) {
          console.error(`Error calculating match for team ${team.id}:`, error)
          // 继续处理其他团队
        }
      }
      
      // 按匹配分数排序并返回前N个
      return matches
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit)
        .map(match => ({
          teamId: match.teamId,
          teamName: match.team.name,
          teamDescription: match.team.description,
          currentMembers: match.team.members.length,
          maxMembers: match.team.maxMembers,
          leaderName: match.team.leader.username,
          overallScore: match.overallScore,
          skillMatchScore: match.skillMatchScore,
          experienceMatchScore: match.experienceMatchScore,
          locationMatchScore: match.locationMatchScore,
          availabilityScore: match.availabilityScore,
          matchingSkills: match.matchingSkills,
          missingSkills: match.missingSkills,
          complementarySkills: match.complementarySkills,
          synergyReasons: match.synergyReasons,
          strengthsAnalysis: match.strengthsAnalysis,
          weaknessesAnalysis: match.weaknessesAnalysis,
          confidence: match.confidence,
          explanation: match.explanation
        }))
    } catch (error) {
      console.error('Error recommending teams for user:', error)
      throw error
    }
  }
  
  /**
   * 为团队推荐合适的用户
   * @param teamId 团队ID
   * @param hackathonId 黑客松ID
   * @param limit 推荐数量限制
   * @returns 推荐用户列表
   */
  static async recommendUsersForTeam(
    teamId: string,
    hackathonId: string,
    limit: number = 10
  ) {
    try {
      // 获取已参与该黑客松但未加入任何团队的用户
      const participantUsers = await prisma.user.findMany({
        where: {
          participations: {
            some: {
              hackathonId,
              status: 'REGISTERED'
            }
          },
          teamMemberships: {
            none: {
              team: {
                hackathonId
              }
            }
          }
        },
        select: {
          id: true,
          username: true,
          skills: true,
          preferences: true,
          avatarUrl: true,
          bio: true,
          reputationScore: true
        }
      })
      
      // 计算每个用户的匹配分数
      const matches = []
      for (const user of participantUsers) {
        try {
          const matchResult = await this.calculateUserTeamMatch(user.id, teamId, hackathonId)
          matches.push({
            user,
            ...matchResult
          })
        } catch (error) {
          console.error(`Error calculating match for user ${user.id}:`, error)
        }
      }
      
      // 按匹配分数排序并返回前N个
      return matches
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit)
        .map(match => ({
          userId: match.userId,
          username: match.user.username,
          avatarUrl: match.user.avatarUrl,
          bio: match.user.bio,
          skills: match.user.skills,
          reputationScore: match.user.reputationScore,
          overallScore: match.overallScore,
          skillMatchScore: match.skillMatchScore,
          experienceMatchScore: match.experienceMatchScore,
          locationMatchScore: match.locationMatchScore,
          availabilityScore: match.availabilityScore,
          matchingSkills: match.matchingSkills,
          missingSkills: match.missingSkills,
          complementarySkills: match.complementarySkills,
          synergyReasons: match.synergyReasons,
          strengthsAnalysis: match.strengthsAnalysis,
          weaknessesAnalysis: match.weaknessesAnalysis,
          confidence: match.confidence,
          explanation: match.explanation
        }))
    } catch (error) {
      console.error('Error recommending users for team:', error)
      throw error
    }
  }
}

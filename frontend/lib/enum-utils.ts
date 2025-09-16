import { useTranslations } from 'next-intl'

// 枚举类型定义
export type HackathonStatus = 'upcoming' | 'ongoing' | 'completed' | 'ended'
export type TeamStatus = 'recruiting' | 'full' | 'competing' | 'completed' | 'disbanded'
export type ProjectStatus = 'draft' | 'submitted' | 'reviewed' | 'winner'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type UserRole = 'member' | 'admin' | 'leader'

// 通知类型（保持常见的类型）
export type NotificationType = 
  | 'team_invite' | 'team_application_approved' | 'team_application_rejected'
  | 'team_member_joined' | 'team_status_changed'
  | 'hackathon_starting' | 'hackathon_ending' | 'hackathon_started' | 'hackathon_ended'
  | 'hackathon_registration_reminder' | 'hackathon_submission_reminder'
  | 'hackathon_results_announced' | 'prize_awarded'
  | 'project_liked' | 'project_commented' | 'project_reviewed' | 'project_status_changed'
  | 'community_post_replied' | 'community_post_liked' | 'community_reply_liked'
  | 'community_new_follower'

// Hook 用于获取枚举值的本地化显示
export function useEnumTranslations() {
  const t = useTranslations('enums')
  
  return {
    // 黑客松状态
    getHackathonStatusText: (status: string): string => {
      const normalizedStatus = status.toLowerCase() as HackathonStatus
      return t(`hackathonStatus.${normalizedStatus}`) || status
    },
    
    // 团队状态
    getTeamStatusText: (status: string): string => {
      const normalizedStatus = status.toLowerCase() as TeamStatus
      return t(`teamStatus.${normalizedStatus}`) || status
    },
    
    // 项目状态
    getProjectStatusText: (status: string): string => {
      const normalizedStatus = status.toLowerCase() as ProjectStatus
      return t(`projectStatus.${normalizedStatus}`) || status
    },
    
    // 申请状态
    getApplicationStatusText: (status: string): string => {
      const normalizedStatus = status.toLowerCase() as ApplicationStatus
      return t(`applicationStatus.${normalizedStatus}`) || status
    },
    
    // 用户角色
    getUserRoleText: (role: string): string => {
      const normalizedRole = role.toLowerCase() as UserRole
      return t(`userRole.${normalizedRole}`) || role
    },
    
    // 通知类型
    getNotificationTypeText: (type: string): string => {
      const normalizedType = type.toLowerCase() as NotificationType
      return t(`notificationType.${normalizedType}`) || type
    }
  }
}

// 通用的枚举值转换函数（不依赖 Hook，用于服务端或其他场景）
export function getEnumDisplayText(
  enumType: 'hackathonStatus' | 'teamStatus' | 'projectStatus' | 'applicationStatus' | 'userRole' | 'notificationType',
  value: string,
  locale: 'en' | 'zh' = 'en'
): string {
  const normalizedValue = value.toLowerCase()
  
  // 英文映射
  const enMappings = {
    hackathonStatus: {
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      completed: 'Completed',
      ended: 'Ended'
    },
    teamStatus: {
      recruiting: 'Recruiting',
      full: 'Full',
      competing: 'Competing',
      completed: 'Completed',
      disbanded: 'Disbanded'
    },
    projectStatus: {
      draft: 'Draft',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      winner: 'Winner'
    },
    applicationStatus: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled'
    },
    userRole: {
      member: 'Member',
      admin: 'Admin',
      leader: 'Leader'
    },
    notificationType: {
      team_invite: 'Team Invitation',
      team_application_approved: 'Team Application Approved',
      team_application_rejected: 'Team Application Rejected',
      team_member_joined: 'Team Member Joined',
      team_status_changed: 'Team Status Changed',
      hackathon_starting: 'Hackathon Starting',
      hackathon_ending: 'Hackathon Ending',
      hackathon_started: 'Hackathon Started',
      hackathon_ended: 'Hackathon Ended',
      hackathon_registration_reminder: 'Registration Reminder',
      hackathon_submission_reminder: 'Submission Reminder',
      hackathon_results_announced: 'Results Announced',
      prize_awarded: 'Prize Awarded',
      project_liked: 'Project Liked',
      project_commented: 'Project Commented',
      project_reviewed: 'Project Reviewed',
      project_status_changed: 'Project Status Changed',
      community_post_replied: 'Post Replied',
      community_post_liked: 'Post Liked',
      community_reply_liked: 'Reply Liked',
      community_new_follower: 'New Follower'
    }
  }
  
  // 中文映射
  const zhMappings = {
    hackathonStatus: {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已结束',
      ended: '已结束'
    },
    teamStatus: {
      recruiting: '招募中',
      full: '已满员',
      competing: '比赛中',
      completed: '已完成',
      disbanded: '已解散'
    },
    projectStatus: {
      draft: '草稿',
      submitted: '已提交',
      reviewed: '已评审',
      winner: '获奖项目'
    },
    applicationStatus: {
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
      cancelled: '已取消'
    },
    userRole: {
      member: '成员',
      admin: '管理员',
      leader: '队长'
    },
    notificationType: {
      team_invite: '团队邀请',
      team_application_approved: '团队申请已批准',
      team_application_rejected: '团队申请已拒绝',
      team_member_joined: '团队成员加入',
      team_status_changed: '团队状态变更',
      hackathon_starting: '黑客松即将开始',
      hackathon_ending: '黑客松即将结束',
      hackathon_started: '黑客松已开始',
      hackathon_ended: '黑客松已结束',
      hackathon_registration_reminder: '报名提醒',
      hackathon_submission_reminder: '提交提醒',
      hackathon_results_announced: '结果公布',
      prize_awarded: '获奖通知',
      project_liked: '项目获赞',
      project_commented: '项目获评论',
      project_reviewed: '项目已评审',
      project_status_changed: '项目状态变更',
      community_post_replied: '帖子获回复',
      community_post_liked: '帖子获点赞',
      community_reply_liked: '回复获点赞',
      community_new_follower: '新粉丝'
    }
  }
  
  const mappings = locale === 'zh' ? zhMappings : enMappings
  const typeMapping = mappings[enumType] as Record<string, string>
  
  return typeMapping?.[normalizedValue] || value
}

// Hook 用于获取数据的本地化显示 (technologies, categories, tags)
export function useDataTranslations() {
  const techT = useTranslations('technologies')
  const categoryT = useTranslations('categories')
  const tagT = useTranslations('tags')
  
  return {
    // 技术栈翻译
    getTechnologyText: (technology: string): string => {
      return techT(technology) || technology
    },
    
    // 分类翻译
    getCategoryText: (category: string): string => {
      return categoryT(category) || category
    },
    
    // 标签翻译
    getTagText: (tag: string): string => {
      return tagT(tag) || tag
    },
    
    // 批量技术栈翻译
    getTechnologiesText: (technologies: string[]): string[] => {
      return technologies.map(tech => techT(tech) || tech)
    },
    
    // 批量分类翻译
    getCategoriesText: (categories: string[]): string[] => {
      return categories.map(cat => categoryT(cat) || cat)
    },
    
    // 批量标签翻译
    getTagsText: (tags: string[]): string[] => {
      return tags.map(tag => tagT(tag) || tag)
    }
  }
}

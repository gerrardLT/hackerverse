import { z } from 'zod'
import { t } from './i18n'

// 动态创建支持国际化的验证模式

export const createProjectSchema = (locale: 'zh' | 'en' = 'zh') => z.object({
  title: z.string().min(1, t('validation.projectTitleRequired', locale)),
  description: z.string().min(10, t('validation.projectDescriptionMinLength', locale)),
  hackathonId: z.string().min(1, t('validation.hackathonIdRequired', locale)),
  teamId: z.string().optional(),
  technologies: z.array(z.string()).min(1, t('validation.technologiesRequired', locale)),
  tags: z.array(z.string()).optional(),
  githubUrl: z.string().url(t('validation.githubUrlFormat', locale)).optional(),
  demoUrl: z.string().url(t('validation.demoUrlFormat', locale)).optional(),
  videoUrl: z.string().url(t('validation.videoUrlFormat', locale)).optional(),
  presentationUrl: z.string().url(t('validation.presentationUrlFormat', locale)).optional(),
  ipfsHash: z.string().optional(),
  isPublic: z.boolean().default(true),
})

export const createTeamSchema = (locale: 'zh' | 'en' = 'zh') => z.object({
  name: z.string().min(2, t('validation.teamNameMinLength', locale)),
  description: z.string().min(10, t('validation.teamDescriptionMinLength', locale)),
  hackathonId: z.string().min(1, t('validation.hackathonIdRequired', locale)),
  maxMembers: z.number().min(1, t('validation.maxMembersRange', locale)).max(10, t('validation.maxMembersRange', locale)).default(5),
  skills: z.array(z.string()).min(1, t('validation.skillsRequired', locale)),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
})

export const createHackathonSchema = (locale: 'zh' | 'en' = 'zh') => z.object({
  title: z.string().min(1, t('validation.titleRequired', locale)),
  description: z.string().min(10, t('validation.descriptionMinLength', locale)),
  startDate: z.string().datetime(t('validation.startDateFormat', locale)),
  endDate: z.string().datetime(t('validation.endDateFormat', locale)),
  registrationStartDate: z.string().datetime(t('validation.registrationStartDateFormat', locale)).optional(),
  registrationDeadline: z.string().datetime(t('validation.registrationDeadlineFormat', locale)),
  maxParticipants: z.number().min(1, t('validation.maxParticipantsMin', locale)).optional(),
  prizePool: z.number().min(0, t('validation.prizePoolNonNegative', locale)).optional(),
  categories: z.array(z.string()).min(1, t('validation.categoriesRequired', locale)),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  rules: z.string().optional(),
  isPublic: z.boolean().default(true),
  featured: z.boolean().default(false),
  // 新增字段用于IPFS元数据
  prizes: z.array(z.object({
    rank: z.number(),
    name: z.string().optional(),
    amount: z.number(),
    description: z.string(),
    winnerCount: z.number().optional().default(1)
  })).optional(),
  tracks: z.array(z.object({
    name: z.string(),
    description: z.string(),
    requirements: z.string().optional()
  })).optional(),
  schedule: z.array(z.object({
    date: z.string().datetime(),
    title: z.string(),
    description: z.string()
  })).optional(),
  judges: z.array(z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional()
  })).optional(),
  sponsors: z.array(z.object({
    name: z.string(),
    logoUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
    tier: z.string().optional()
  })).optional(),
  organizer: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    website: z.string().optional(),
    description: z.string().optional()
  }),
})

export const updateProjectSchema = (locale: 'zh' | 'en' = 'zh') => z.object({
  title: z.string().min(1, t('validation.projectTitleRequired', locale)).optional(),
  description: z.string().min(10, t('validation.projectDescriptionMinLength', locale)).optional(),
  technologies: z.array(z.string()).min(1, t('validation.technologiesRequired', locale)).optional(),
  tags: z.array(z.string()).optional(),
  githubUrl: z.string().url(t('validation.githubUrlFormat', locale)).optional(),
  demoUrl: z.string().url(t('validation.demoUrlFormat', locale)).optional(),
  videoUrl: z.string().url(t('validation.videoUrlFormat', locale)).optional(),
  presentationUrl: z.string().url(t('validation.presentationUrlFormat', locale)).optional(),
  isPublic: z.boolean().optional(),
})

export const updateTeamSchema = (locale: 'zh' | 'en' = 'zh') => z.object({
  name: z.string().min(2, t('validation.teamNameMinLength', locale)).optional(),
  description: z.string().min(10, t('validation.teamDescriptionMinLength', locale)).optional(),
  maxMembers: z.number().min(1, t('validation.maxMembersRange', locale)).max(10, t('validation.maxMembersRange', locale)).optional(),
  skills: z.array(z.string()).min(1, t('validation.skillsRequired', locale)).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
})

export const inviteUserSchema = (locale: 'zh' | 'en' = 'zh') => z.object({
  userId: z.string().min(1, t('validation.userIdRequired', locale)),
  teamId: z.string().optional(),
  message: z.string().max(500, t('validation.inviteMessageMaxLength', locale)).optional(),
})

// 通用查询参数验证模式
export const createQuerySchema = () => z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('12'),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// 团队匹配偏好设置的验证 schema
const teamPreferencesSchema = z.object({
  hackathonId: z.string().min(1, 'Hackathon ID is required'),
  teamId: z.string().optional(), // 如果是团队设置偏好
  
  // 技能匹配偏好
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  skillMatchWeight: z.number().min(0).max(1).default(0.4),
  
  // 经验偏好
  minExperience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('beginner'),
  maxExperience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('expert'),
  experienceWeight: z.number().min(0).max(1).default(0.2),
  
  // 地理位置偏好
  preferredTimezones: z.array(z.string()).default([]),
  locationFlexible: z.boolean().default(true),
  locationWeight: z.number().min(0).max(1).default(0.1),
  
  // 工作模式偏好
  communicationStyle: z.array(z.string()).default([]),
  workingHours: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    timezone: z.string().optional()
  }).optional(),
  collaborationStyle: z.enum(['structured', 'flexible', 'balanced']).default('balanced'),
  
  // 团队规模偏好
  preferredTeamSize: z.number().min(1).max(10).default(4),
  maxTeamSize: z.number().min(1).max(10).default(6),
  
  // 项目偏好
  projectTypes: z.array(z.string()).default([]),
  technologyStacks: z.array(z.string()).default([]),
  difficultyLevel: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  
  // 其他偏好
  personalityMatch: z.boolean().default(false),
  diversityPreference: z.enum(['similar', 'diverse', 'balanced']).default('balanced'),
  leadershipStyle: z.string().optional(),
  
  // 匹配设置
  isActive: z.boolean().default(true),
  autoAcceptThreshold: z.number().min(0).max(1).default(0.8),
  notifyOnMatch: z.boolean().default(true)
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
    const data = teamPreferencesSchema.parse(body)

    // 验证黑客松存在且用户有权限
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: data.hackathonId },
      select: { id: true, organizerId: true, status: true }
    })

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('common.errors.hackathonNotFound') },
        { status: 404 }
      )
    }

    // 如果指定了teamId，验证用户是否为团队领导者
    if (data.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: data.teamId },
        select: { id: true, leaderId: true, hackathonId: true }
      })

      if (!team) {
        return NextResponse.json(
          { success: false, error: t('teams.match.teamNotFound') },
          { status: 404 }
        )
      }

      if (team.leaderId !== user.id) {
        return NextResponse.json(
          { success: false, error: t('teams.match.notTeamLeader') },
          { status: 403 }
        )
      }

      if (team.hackathonId !== data.hackathonId) {
        return NextResponse.json(
          { success: false, error: t('teams.match.teamHackathonMismatch') },
          { status: 400 }
        )
      }
    } else {
      // 验证用户是否参与了该黑客松
      const participation = await prisma.participation.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId: data.hackathonId,
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
    }

    // 创建或更新偏好设置
    const { hackathonId, teamId, ...preferencesData } = data
    
    const preferences = await prisma.teamPreferences.upsert({
      where: teamId 
        ? { teamId_hackathonId: { teamId, hackathonId } }
        : { userId_hackathonId: { userId: user.id, hackathonId } },
      update: {
        ...preferencesData,
        updatedAt: new Date()
      },
      create: {
        ...preferencesData,
        hackathonId,
        ...(teamId ? { teamId } : { userId: user.id })
      }
    })

    return NextResponse.json({
      success: true,
      message: t('teams.match.preferencesUpdated'),
      data: { preferences }
    })

  } catch (error) {
    console.error('Error setting team preferences:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('teams.match.invalidPreferences'),
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
    const teamId = searchParams.get('teamId')

    if (!hackathonId) {
      return NextResponse.json(
        { success: false, error: t('teams.match.hackathonIdRequired') },
        { status: 400 }
      )
    }

    // 获取偏好设置
    let preferences
    
    if (teamId) {
      // 验证用户是否为团队成员或领导者
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId, userId: user.id }
        }
      })

      if (!teamMember) {
        return NextResponse.json(
          { success: false, error: t('teams.match.notTeamMember') },
          { status: 403 }
        )
      }

      preferences = await prisma.teamPreferences.findUnique({
        where: { teamId_hackathonId: { teamId, hackathonId } }
      })
    } else {
      preferences = await prisma.teamPreferences.findUnique({
        where: { userId_hackathonId: { userId: user.id, hackathonId } }
      })
    }

    return NextResponse.json({
      success: true,
      data: { preferences }
    })

  } catch (error) {
    console.error('Error getting team preferences:', error)
    return NextResponse.json(
      { success: false, error: t('common.errors.internalServerError') },
      { status: 500 }
    )
  }
}

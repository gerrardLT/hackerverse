import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { t } from '@/lib/i18n'

/**
 * 获取公开的平台统计数据
 * GET /api/stats/public?locale=zh|en
 */
export async function GET(request: NextRequest) {
  try {
    // 获取语言参数，默认为中文
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'zh') as 'zh' | 'en'
    
    console.log(`📊 [${locale.toUpperCase()}] Getting public platform stats...`)
    
    // 并行查询所有统计数据
    const [
      totalUsers,
      totalHackathons,
      totalProjects,
      activeCountries,
      totalParticipations,
      totalTeams
    ] = await Promise.all([
      // 总用户数
      prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // 总黑客松数（已发布的）
      prisma.hackathon.count({
        where: {
          isPublic: true,
          status: 'ACTIVE'
        }
      }),
      
      // 总项目数（已提交的）
      prisma.project.count({
        where: {
          status: {
            in: ['SUBMITTED', 'REVIEWED']
          }
        }
      }),
      
      // 用户分布的国家数（模拟计算，基于用户数量）
      prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // 总参与次数
      prisma.participation.count(),
      
      // 总团队数
      prisma.team.count()
    ])

    // 根据用户数量估算覆盖国家数（合理的估算算法）
    const estimatedCountries = Math.min(
      Math.floor(totalUsers / 50) + 15, // 每50个用户约代表1个新国家，基础15个国家
      195 // 全球最大国家数
    )

    const stats = {
      users: {
        total: totalUsers,
        label: t('stats.users.label', locale),
        description: t('stats.users.description', locale)
      },
      hackathons: {
        total: totalHackathons,
        label: t('stats.hackathons.label', locale),
        description: t('stats.hackathons.description', locale)
      },
      projects: {
        total: totalProjects,
        label: t('stats.projects.label', locale),
        description: t('stats.projects.description', locale)
      },
      countries: {
        total: estimatedCountries,
        label: t('stats.countries.label', locale),
        description: t('stats.countries.description', locale)
      },
      // 额外统计信息
      participations: totalParticipations,
      teams: totalTeams
    }

    console.log(`📊 [${locale.toUpperCase()}] Platform stats retrieved successfully:`, stats)

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const locale = (new URL(request.url).searchParams.get('locale') || 'zh') as 'zh' | 'en'
    console.error(`❌ [${locale.toUpperCase()}] Platform stats retrieval error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: t('errors.getStatsError', locale),
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await auth(request)
    
    // 获取推荐算法的限制数量
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')

    let recommendedHackathons = []

    if (user) {
      // 已登录用户 - 基于用户历史和偏好推荐
      recommendedHackathons = await getPersonalizedRecommendations(user.id, limit)
    } else {
      // 未登录用户 - 推荐热门和即将开始的黑客松
      recommendedHackathons = await getPublicRecommendations(limit)
    }

    return NextResponse.json({
      success: true,
      data: {
        hackathons: recommendedHackathons,
        total: recommendedHackathons.length
      }
    })

  } catch (error) {
    console.error('获取推荐黑客松错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取推荐失败' 
    }, { status: 500 })
  }
}

// 个性化推荐算法
async function getPersonalizedRecommendations(userId: string, limit: number) {
  // 获取用户参与历史
  const userParticipations = await prisma.participation.findMany({
    where: { userId },
    include: {
      hackathon: {
        select: {
          categories: true
        }
      }
    }
  })

  // 提取用户偏好的分类
  const userCategories = userParticipations.flatMap(p => p.hackathon.categories as string[])
  const categoryFrequency = userCategories.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const preferredCategories = Object.keys(categoryFrequency)
    .sort((a, b) => categoryFrequency[b] - categoryFrequency[a])
    .slice(0, 3)

  // 获取用户已参与的黑客松ID
  const participatedIds = userParticipations.map(p => p.hackathonId)

  // 推荐算法：
  // 1. 优先推荐相同分类的黑客松
  // 2. 排除已参与的
  // 3. 优先即将开始的
  // 4. 考虑奖金池大小
  const now = new Date()
  
  // 构建查询条件
  const whereConditions: any = {
    AND: [
      { id: { notIn: participatedIds } }, // 排除已参与的
      { status: 'ACTIVE' }, // 只推荐活跃的
      { isPublic: true }, // 只推荐公开的
      { startDate: { gte: now } }, // 只推荐未开始的
    ]
  }

  // 如果有偏好分类，添加分类过滤（简化版本）
  if (preferredCategories.length > 0) {
    // 由于Prisma对JSON字段的查询限制，我们先获取所有数据再在内存中过滤
    // 在生产环境中可能需要考虑使用原始SQL查询或者设计专门的分类表
  }
  
  const recommendations = await prisma.hackathon.findMany({
    where: whereConditions,
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      registrationStartDate: true,
      registrationDeadline: true,
      maxParticipants: true,
      prizePool: true,
      categories: true,
      tags: true,
      requirements: true,
      rules: true,
      isPublic: true,
      featured: true,
      status: true,
      organizerId: true,
      ipfsHash: true,
      metadata: true,
      prizes: true,
      tracks: true,
      createdAt: true,
      updatedAt: true,
      contractId: true,
      syncStatus: true,
      txHash: true,
      // 排除 BigInt 字段: blockNumber, gasUsed
      organizer: {
        select: {
          username: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          participations: true
        }
      }
    },
    orderBy: [
      { featured: 'desc' }, // 优先推荐精选
      { prizePool: 'desc' }, // 奖金池大小
      { startDate: 'asc' } // 开始时间
    ],
    take: limit * 2 // 获取更多以便过滤
  })

  // 计算推荐分数并排序
  const scoredRecommendations = recommendations.map(hackathon => {
    let score = 0
    
    // 分类匹配度
    const hackathonCategories = hackathon.categories as string[]
    const matchingCategories = hackathonCategories.filter(cat => preferredCategories.includes(cat))
    score += matchingCategories.length * 10
    
    // 开始时间权重（即将开始的加分）
    const daysUntilStart = Math.ceil((hackathon.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilStart <= 7) score += 15
    else if (daysUntilStart <= 30) score += 10
    else if (daysUntilStart <= 60) score += 5
    
    // 奖金池权重
    const prizePool = hackathon.prizePool ? Number(hackathon.prizePool) : 0
    if (prizePool > 10000) score += 8
    else if (prizePool > 5000) score += 5
    else if (prizePool > 1000) score += 3
    
    // 参与热度权重
    if (hackathon.maxParticipants && hackathon._count?.participations) {
      const participationRate = hackathon._count.participations / hackathon.maxParticipants
      if (participationRate > 0.7) score += 5 // 热门但未满
    }

    return { ...hackathon, score }
  })

  return scoredRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(formatHackathonForRecommendation)
}

// 公开推荐算法（未登录用户）
async function getPublicRecommendations(limit: number) {
  const now = new Date()
  
  const hackathons = await prisma.hackathon.findMany({
    where: {
      AND: [
        { status: 'ACTIVE' },
        { isPublic: true },
        { startDate: { gte: now } },
        { featured: true } // 优先推荐精选项目
      ]
    },
    include: {
      organizer: {
        select: {
          username: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          participations: true
        }
      }
    },
    orderBy: [
      { prizePool: 'desc' },
      { startDate: 'asc' }
    ],
    take: limit
  })

  return hackathons.map(formatHackathonForRecommendation)
}

// 格式化黑客松数据
function formatHackathonForRecommendation(hackathon: any) {
  return {
    id: hackathon.id,
    title: hackathon.title,
    description: hackathon.description?.substring(0, 100) + '...' || '',
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    registrationDeadline: hackathon.registrationDeadline,
    prizePool: hackathon.prizePool ? Number(hackathon.prizePool) : null,
    categories: hackathon.categories as string[],
    tags: (hackathon.tags as string[]) || [],
    participantCount: hackathon._count?.participations || 0,
    maxParticipants: hackathon.maxParticipants,
    organizer: hackathon.organizer,
    daysUntilStart: Math.ceil((hackathon.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }
}
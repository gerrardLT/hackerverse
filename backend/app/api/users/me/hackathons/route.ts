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
    if (!user) {
      return NextResponse.json({ success: false, error: '未认证' }, { status: 401 })
    }

    // 获取用户参与的黑客松
    const participations = await prisma.participation.findMany({
      where: {
        userId: user.id
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            status: true,
            prizePool: true,
            categories: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    // 获取用户创建的黑客松
    const organizedHackathons = await prisma.hackathon.findMany({
      where: {
        organizerId: user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        prizePool: true,
        categories: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 转换参与的黑客松数据格式
    const participatedHackathons = participations.map(participation => ({
      id: participation.hackathon.id,
      name: participation.hackathon.title,
      description: participation.hackathon.description,
      status: getHackathonDisplayStatus(participation.hackathon.status, participation.hackathon.startDate, participation.hackathon.endDate),
      role: getParticipationRole(participation.status),
      relationshipType: 'participant' as const,
      joinedAt: participation.joinedAt,
      date: `${participation.hackathon.startDate.toISOString().split('T')[0]} - ${participation.hackathon.endDate.toISOString().split('T')[0]}`,
      prizePool: participation.hackathon.prizePool,
      categories: participation.hackathon.categories,
      participationStatus: participation.status
    }))

    // 转换创建的黑客松数据格式
    const createdHackathons = organizedHackathons.map(hackathon => ({
      id: hackathon.id,
      name: hackathon.title,
      description: hackathon.description,
      status: getHackathonDisplayStatus(hackathon.status, hackathon.startDate, hackathon.endDate),
      role: '组织者',
      relationshipType: 'organizer' as const,
      joinedAt: hackathon.createdAt,
      date: `${hackathon.startDate.toISOString().split('T')[0]} - ${hackathon.endDate.toISOString().split('T')[0]}`,
      prizePool: hackathon.prizePool,
      categories: hackathon.categories,
      participationStatus: 'ORGANIZER'
    }))

    // 合并所有黑客松数据
    const userHackathons = [...participatedHackathons, ...createdHackathons]
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

    return NextResponse.json({
      success: true,
      data: {
        hackathons: userHackathons,
        total: userHackathons.length
      }
    })

  } catch (error) {
    console.error('获取用户黑客松数据错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取黑客松数据失败' 
    }, { status: 500 })
  }
}

// 辅助函数：获取黑客松显示状态
function getHackathonDisplayStatus(status: string, startDate: Date, endDate: Date): string {
  const now = new Date()
  
  if (status === 'CANCELLED') return '已取消'
  if (status === 'DRAFT') return '草稿'
  
  if (now < startDate) return '即将开始'
  if (now >= startDate && now <= endDate) return '进行中'
  if (now > endDate) return '已完成'
  
  return status === 'COMPLETED' ? '已完成' : '未知'
}

// 辅助函数：获取参与角色显示
function getParticipationRole(status: string): string {
  switch (status) {
    case 'REGISTERED': return '已报名'
    case 'CONFIRMED': return '参与者'
    case 'CANCELLED': return '已取消'
    case 'COMPLETED': return '已完成'
    default: return '参与者'
  }
}

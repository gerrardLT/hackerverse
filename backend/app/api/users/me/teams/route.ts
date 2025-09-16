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

    // 获取用户创建的团队
    const ledTeams = await prisma.team.findMany({
      where: {
        leaderId: user.id
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 获取用户参与的团队
    const memberTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        },
        leaderId: {
          not: user.id // 排除自己创建的团队
        }
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        leader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 转换数据格式
    const allTeams = [
      ...ledTeams.map(team => ({ ...team, userRole: '团队领导' })),
      ...memberTeams.map(team => {
        const memberInfo = team.members.find(member => member.userId === user.id)
        return { 
          ...team, 
          userRole: memberInfo?.role === 'LEADER' ? '团队领导' : '团队成员'
        }
      })
    ]

    const userTeams = allTeams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      hackathon: team.hackathon.title,
      hackathonId: team.hackathon.id,
      status: getTeamDisplayStatus(team.hackathon.status, team.hackathon.startDate, team.hackathon.endDate),
      role: team.userRole,
      members: team.members.length,
      membersList: team.members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl,
        role: member.role
      })),
      projects: team.projects.map(project => ({
        id: project.id,
        title: project.title,
        status: project.status
      })),
      createdAt: team.createdAt,
      maxMembers: team.maxMembers,
      skills: team.skills || [],
      isPublic: team.isPublic
    }))

    return NextResponse.json({
      success: true,
      data: {
        teams: userTeams,
        total: userTeams.length,
        leading: ledTeams.length,
        participating: memberTeams.length
      }
    })

  } catch (error) {
    console.error('获取用户团队数据错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取团队数据失败' 
    }, { status: 500 })
  }
}

// 辅助函数：获取团队状态显示
function getTeamDisplayStatus(hackathonStatus: string, startDate: Date, endDate: Date): string {
  const now = new Date()
  
  if (hackathonStatus === 'CANCELLED') return '已取消'
  if (hackathonStatus === 'DRAFT') return '准备中'
  
  if (now < startDate) return '准备中'
  if (now >= startDate && now <= endDate) return '活跃'
  if (now > endDate) return '已完成'
  
  return hackathonStatus === 'COMPLETED' ? '已完成' : '活跃'
}

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

    // 获取用户创建的项目
    const createdProjects = await prisma.project.findMany({
      where: {
        creatorId: user.id
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
            name: true,
            members: {
              select: {
                userId: true,
                role: true
              }
            }
          }
        },
        scores: {
          select: {
            totalScore: true,
            judgeId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 获取用户参与的团队项目
    const teamProjects = await prisma.project.findMany({
      where: {
        team: {
          members: {
            some: {
              userId: user.id
            }
          }
        },
        creatorId: {
          not: user.id // 排除自己创建的项目
        }
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
            name: true,
            members: {
              select: {
                userId: true,
                role: true
              }
            }
          }
        },
        scores: {
          select: {
            totalScore: true,
            judgeId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 合并并转换数据格式
    const allProjects = [...createdProjects, ...teamProjects]
    
    const userProjects = allProjects.map((project: any) => {
      const averageScore = project.scores?.length > 0 
        ? Math.round(project.scores.reduce((sum: number, scoreItem: any) => sum + Number(scoreItem.totalScore || 0), 0) / project.scores.length)
        : null

      const rank = getRankFromScore(averageScore)
      const isCreator = project.creatorId === user.id

      return {
        id: project.id,
        name: project.title,
        description: project.description,
        hackathon: project.hackathon?.title || '',
        hackathonId: project.hackathon?.id || project.hackathonId,
        status: getProjectDisplayStatus(project.status),
        score: averageScore ? `${averageScore}/100` : null,
        rank: rank,
        role: isCreator ? '项目创建者' : '团队成员',
        teamName: project.team?.name,
        teamMembers: project.team?.members?.length || 1,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        ipfsHash: project.ipfsHash,
        repositoryUrl: project.githubUrl, // 修正字段名
        demoUrl: project.demoUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        projects: userProjects,
        total: userProjects.length,
        created: createdProjects.length,
        participated: teamProjects.length
      }
    })

  } catch (error) {
    console.error('获取用户项目数据错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取项目数据失败' 
    }, { status: 500 })
  }
}

// 辅助函数：获取项目显示状态
function getProjectDisplayStatus(status: string): string {
  switch (status) {
    case 'DRAFT': return '草稿'
    case 'SUBMITTED': return '已提交'
    case 'REVIEWED': return '已评审'
    case 'WINNER': return '获奖项目'
    case 'REJECTED': return '未入选'
    default: return status
  }
}

// 辅助函数：根据分数获取排名
function getRankFromScore(score: number | null): string | null {
  if (!score) return null
  
  if (score >= 95) return '第 1 名'
  if (score >= 90) return '第 2 名'
  if (score >= 85) return '第 3 名'
  if (score >= 80) return '优秀奖'
  
  return null
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

const projectUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  technologies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  presentationUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().optional(),
  status: z.enum(['DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED']).optional()
})

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    const projectId = params.id

    // 查询项目详情
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            email: true
          }
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            registrationDeadline: true,
            maxParticipants: true,
            isPublic: true,
            tracks: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            maxMembers: true,
            members: {
              select: {
                userId: true,
                role: true,
                joinedAt: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        submissions: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                startDate: true,
                endDate: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        scores: {
          select: {
            id: true,
            totalScore: true,
            innovation: true,
            technicalComplexity: true,
            userExperience: true,
            businessPotential: true,
            presentation: true,
            judgeId: true,
            createdAt: true,
            judge: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    username: true,
                    avatarUrl: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        projectLikes: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                username: true,
                avatarUrl: true
              }
            }
          }
        },
        projectComments: {
          select: {
            id: true,
            content: true,
            userId: true,
            parentId: true,
            isEdited: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                username: true,
                avatarUrl: true
              }
            },
            replies: {
              select: {
                id: true,
                content: true,
                userId: true,
                parentId: true,
                isEdited: true,
                createdAt: true,
                updatedAt: true,
                user: {
                  select: {
                    username: true,
                    avatarUrl: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          where: {
            parentId: null // 只获取顶级评论
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            projectLikes: true,
            projectComments: true,
            submissions: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.projectNotFound') },
        { status: 404 }
      )
    }

    // 检查权限 - 只有项目创建者或公开项目可以访问
    if (!project.isPublic && project.creatorId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.accessDenied') },
        { status: 403 }
      )
    }

    // 计算平均评分
    const averageScore = project.scores.length > 0 
      ? project.scores.reduce((sum, score) => sum + Number(score.totalScore || 0), 0) / project.scores.length
      : null

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        averageScore,
        isOwner: project.creatorId === user.id,
        isLiked: project.projectLikes.some(like => like.userId === user.id)
      }
    })

  } catch (error) {
    console.error('Error fetching project:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('projects.errors.fetchProject') },
      { status: 500 }
    )
  }
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    const projectId = params.id
    const body = await request.json()

    // 验证请求数据
    const validatedData = projectUpdateSchema.parse(body)

    // 检查项目是否存在且用户有权限
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        creatorId: true, 
        status: true,
        hackathonId: true 
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.projectNotFound') },
        { status: 404 }
      )
    }

    if (existingProject.creatorId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.accessDenied') },
        { status: 403 }
      )
    }

    // 检查是否可以编辑（只有草稿和准备提交状态可以编辑）
    if (!['DRAFT', 'READY_TO_SUBMIT'].includes(existingProject.status)) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.cannotEditSubmitted') },
        { status: 400 }
      )
    }

    // 更新项目
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            projectLikes: true,
            projectComments: true,
            submissions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: t('projects.success.projectUpdated'),
      data: updatedProject
    })

  } catch (error) {
    console.error('Error updating project:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('projects.errors.updateProject') },
      { status: 500 }
    )
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    const projectId = params.id

    // 检查项目是否存在且用户有权限
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        creatorId: true, 
        status: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.projectNotFound') },
        { status: 404 }
      )
    }

    if (existingProject.creatorId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('projects.errors.accessDenied') },
        { status: 403 }
      )
    }

    // 检查是否可以删除（只有草稿状态可以删除）
    if (existingProject.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: t('projects.errors.cannotDeleteSubmitted') },
        { status: 400 }
      )
    }

    // 删除项目
    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({
      success: true,
      message: t('projects.success.projectDeleted')
    })

  } catch (error) {
    console.error('Error deleting project:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('projects.errors.deleteProject') },
      { status: 500 }
    )
  }
}
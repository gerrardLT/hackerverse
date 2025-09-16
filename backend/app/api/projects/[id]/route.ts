import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 更新项目验证模式
const updateProjectSchema = z.object({
  title: z.string().min(1, '项目标题不能为空').optional(),
  description: z.string().min(10, '项目描述至少10个字符').optional(),
  technologies: z.array(z.string()).min(1, '至少选择一种技术').optional(),
  tags: z.array(z.string()).optional(),
  githubUrl: z.string().url('GitHub链接格式不正确').optional(),
  demoUrl: z.string().url('演示链接格式不正确').optional(),
  videoUrl: z.string().url('视频链接格式不正确').optional(),
  presentationUrl: z.string().url('演示文稿链接格式不正确').optional(),
  ipfsHash: z.string().optional(),
  isPublic: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const projectId = params.id

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        technologies: true,
        tags: true,
        githubUrl: true,
        demoUrl: true,
        videoUrl: true,
        presentationUrl: true,
        ipfsHash: true,
        status: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        hackathon: {
          select: {
            id: true,
            title: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            scores: true,
            feedback: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: t('projects.notFound') },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { project }
    })
  } catch (error) {
    console.error('获取项目详情错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('projects.getDetailsError', { fallback: 'Failed to get project details' }) },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const projectId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = updateProjectSchema.parse(body)
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查项目是否存在且用户有权限修改
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        teamId: true,
        team: {
          select: {
            leaderId: true,
            members: {
              where: { userId: user.id },
              select: { id: true }
            }
          }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: t('projects.notFound') },
        { status: 404 }
      )
    }

    // 检查用户是否是项目团队成员或队长
    const isTeamMember = (existingProject.team?.members?.length || 0) > 0
    const isTeamLeader = existingProject.team?.leaderId === user.id

    if (!isTeamMember && !isTeamLeader) {
      return NextResponse.json(
        { success: false, error: t('projects.onlyTeamMemberCanModify', { fallback: 'Only project team members can modify project information' }) },
        { status: 403 }
      )
    }

    // 更新项目信息
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: validatedData,
      select: {
        id: true,
        title: true,
        description: true,
        technologies: true,
        tags: true,
        githubUrl: true,
        demoUrl: true,
        videoUrl: true,
        presentationUrl: true,
        ipfsHash: true,
        status: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        hackathon: {
          select: {
            id: true,
            title: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            scores: true,
            feedback: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { project: updatedProject }
    })
  } catch (error) {
    console.error('更新项目错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: t('projects.updateError', { fallback: 'Failed to update project' }) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const projectId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查项目是否存在且用户是队长
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        team: {
          select: {
            leaderId: true
          }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: t('projects.notFound') },
        { status: 404 }
      )
    }

    if (existingProject.team?.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('projects.onlyLeaderCanDelete', { fallback: 'Only team leader can delete project' }) },
        { status: 403 }
      )
    }

    // 删除项目（同时删除相关的评分和反馈）
    await prisma.$transaction([
      prisma.score.deleteMany({
        where: { projectId }
      }),
      prisma.feedback.deleteMany({
        where: { projectId }
      }),
      prisma.project.delete({
        where: { id: projectId }
      })
    ])

    return NextResponse.json({
      success: true,
      message: t('projects.deleteSuccess', { fallback: 'Project deleted successfully' })
    })
  } catch (error) {
    console.error('删除项目错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('projects.deleteError', { fallback: 'Failed to delete project' }) },
      { status: 500 }
    )
  }
} 
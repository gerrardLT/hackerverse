import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { ApiResponseHandler } from '@/lib/api-response'

export async function OPTIONS() {
  return ApiResponseHandler.cors()
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 认证
    const user = await auth(request)
    if (!user) {
      return ApiResponseHandler.unauthorized(t('auth.unauthorized'))
    }
    
    const hackathonId = params.id
    
    // 检查黑客松是否存在和用户是否已报名
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        participations: {
          where: { userId: user.id },
          select: { id: true }
        }
      }
    })
    
    if (!hackathon) {
      return ApiResponseHandler.notFound(t('hackathons.notFound'))
    }
    
    // 检查用户是否已报名
    if (hackathon.participations.length === 0) {
      return ApiResponseHandler.badRequest(t('teams.needRegistration'))
    }
    
    // 检查黑客松状态和时间
    const now = new Date()
    if (hackathon.status !== 'ACTIVE' && hackathon.status !== 'UPCOMING') {
      return ApiResponseHandler.badRequest(
        t('hackathons.notAcceptingSubmissions', { status: hackathon.status })
      )
    }
    
    if (now > hackathon.endDate) {
      return ApiResponseHandler.badRequest(
        t('projects.hackathonEnded', {
          endTime: hackathon.endDate.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
        })
      )
    }
    
    // 获取用户的项目
    const userProjects = await prisma.project.findMany({
      where: {
        creatorId: user.id,
        status: {
          in: ['DRAFT', 'READY_TO_SUBMIT'] // 只显示可提交的状态
        }
      },
      include: {
        submissions: {
          where: { hackathonId },
          select: { id: true, status: true }
        },
        _count: {
          select: {
            submissions: true,
            projectLikes: true,
            projectComments: true
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
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'desc' }, // READY_TO_SUBMIT 优先
        { updatedAt: 'desc' }
      ]
    })
    
    // 过滤和转换数据
    const suitableProjects = userProjects
      .filter(project => {
        // 排除已经提交到这个黑客松且未撤销的项目
        const activeSubmission = project.submissions.find(
          sub => sub.status !== 'WITHDRAWN'
        )
        return !activeSubmission
      })
      .map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        statusDisplay: getProjectStatusDisplay(project.status, t),
        technologies: project.technologies,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        videoUrl: project.videoUrl,
        presentationUrl: project.presentationUrl,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
        stats: {
          totalSubmissions: project._count.submissions,
          likes: project._count.projectLikes,
          comments: project._count.projectComments
        },
        // 提交准备度评估
        readinessScore: calculateReadinessScore(project),
        missingFields: getMissingFields(project, t),
        canSubmit: project.status === 'READY_TO_SUBMIT' && 
                   project.title && 
                   project.description,
        recommendations: getSubmissionRecommendations(project, hackathon, t)
      }))
    
    // 按准备度评分排序
    suitableProjects.sort((a, b) => b.readinessScore - a.readinessScore)
    
    // 统计信息
    const stats = {
      total: suitableProjects.length,
      readyToSubmit: suitableProjects.filter(p => p.canSubmit).length,
      needsWork: suitableProjects.filter(p => !p.canSubmit).length,
      averageReadiness: suitableProjects.length > 0 
        ? Math.round(suitableProjects.reduce((sum, p) => sum + p.readinessScore, 0) / suitableProjects.length)
        : 0
    }
    
    return ApiResponseHandler.success({
      projects: suitableProjects,
      stats,
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        endDate: hackathon.endDate,
        timeRemaining: Math.max(0, hackathon.endDate.getTime() - now.getTime()),
        tracks: hackathon.tracks // 用于匹配项目标签
      }
    })
    
  } catch (error) {
    console.error('获取可提交项目失败:', error)
    return ApiResponseHandler.internalError('Failed to get suitable projects')
  }
}

// 辅助函数：计算项目提交准备度评分 (0-100)
function calculateReadinessScore(project: any): number {
  let score = 0
  
  // 基本信息 (40分)
  if (project.title) score += 15
  if (project.description && project.description.length >= 50) score += 25
  
  // 技术信息 (20分)
  if (project.technologies && project.technologies.length > 0) score += 10
  if (project.tags && project.tags.length > 0) score += 10
  
  // 链接和资源 (30分)
  if (project.githubUrl) score += 15
  if (project.demoUrl) score += 10
  if (project.videoUrl) score += 5
  
  // 项目状态 (10分)
  if (project.status === 'READY_TO_SUBMIT') score += 10
  
  return Math.min(100, score)
}

// 辅助函数：获取缺失字段
function getMissingFields(project: any, t: any): string[] {
  const missing = []
  
  if (!project.title) missing.push(t('projects.fields.title'))
  if (!project.description || project.description.length < 50) {
    missing.push(t('projects.fields.description'))
  }
  if (!project.technologies || project.technologies.length === 0) {
    missing.push(t('projects.fields.technologies'))
  }
  if (!project.githubUrl) missing.push(t('projects.fields.repository'))
  if (!project.demoUrl) missing.push(t('projects.fields.demo'))
  
  return missing
}

// 辅助函数：获取提交建议
function getSubmissionRecommendations(project: any, hackathon: any, t: any): string[] {
  const recommendations = []
  
  if (project.status === 'DRAFT') {
    recommendations.push(t('projects.recommendations.setToReadyToSubmit'))
  }
  
  if (!project.description || project.description.length < 100) {
    recommendations.push(t('projects.recommendations.improveDescription'))
  }
  
  if (!project.videoUrl) {
    recommendations.push(t('projects.recommendations.addVideo'))
  }
  
  if (!project.presentationUrl) {
    recommendations.push(t('projects.recommendations.addPresentation'))
  }
  
  // 根据黑客松赛道给建议
  if (hackathon.tracks && Array.isArray(hackathon.tracks)) {
    const matchingTrack = hackathon.tracks.find((track: any) =>
      project.tags?.some((tag: string) => 
        tag.toLowerCase().includes(track.name?.toLowerCase())
      ) ||
      project.technologies?.some((tech: string) => 
        tech.toLowerCase().includes(track.name?.toLowerCase())
      )
    )
    
    if (!matchingTrack) {
      recommendations.push(t('projects.recommendations.matchTrack'))
    }
  }
  
  return recommendations
}

// 辅助函数：获取项目状态显示文本（国际化）
function getProjectStatusDisplay(status: string, t: any): string {
  const statusKey = `projects.status.${status.toLowerCase()}`
  try {
    return t(statusKey)
  } catch {
    return status
  }
}

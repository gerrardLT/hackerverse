import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { AuthService } from '@/lib/auth'
import { ApiResponseHandler } from '@/lib/api-response'

// 创建项目的验证schema
const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  githubUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  presentationUrl: z.string().url().optional(),
  isPublic: z.boolean().optional().default(true),
  status: z.enum(['DRAFT', 'READY_TO_SUBMIT']).optional().default('DRAFT'),
  hackathonId: z.string().optional() // 可选：如果指定则直接关联到黑客松
})

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 认证
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return ApiResponseHandler.unauthorized(t('auth.unauthorized'))
    }
    
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return ApiResponseHandler.unauthorized(t('auth.tokenInvalid'))
    }
    
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)
    
    // 如果指定了hackathonId，检查黑客松是否存在和用户权限
    let hackathonId = validatedData.hackathonId
    if (hackathonId) {
      const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: {
          id: true,
          title: true,
          isPublic: true,
          registrationDeadline: true,
          participations: {
            where: { userId: payload.userId },
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
    }
    
    // 创建项目
    const project = await prisma.project.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        creatorId: payload.userId,
        hackathonId: hackathonId || null, // ✅ 如果没有指定黑客松，设置为 null（支持独立项目创建）
        technologies: validatedData.technologies,
        tags: validatedData.tags,
        githubUrl: validatedData.githubUrl,
        demoUrl: validatedData.demoUrl,
        videoUrl: validatedData.videoUrl,
        presentationUrl: validatedData.presentationUrl,
        isPublic: validatedData.isPublic,
        status: validatedData.status
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        hackathon: hackathonId ? {
          select: {
            id: true,
            title: true
          }
        } : undefined
      }
    })
    
    return ApiResponseHandler.created({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        technologies: project.technologies,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        videoUrl: project.videoUrl,
        presentationUrl: project.presentationUrl,
        isPublic: project.isPublic,
        creator: project.creator,
        hackathon: project.hackathon,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    })
    
  } catch (error) {
    console.error('创建项目失败:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError(error.errors.map(e => e.message).join(', '))
    }
    
    return ApiResponseHandler.internalError('Failed to create project')
  }
}

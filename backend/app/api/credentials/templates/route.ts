import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  category: z.string().optional(),
  credentialType: z.string().optional(),
  isPublic: z.string().transform(v => v === 'true').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'popularity', 'createdAt', 'category']).default('popularity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeInactive: z.string().transform(v => v === 'true').default('false')
})

// 创建模板验证模式
const createTemplateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string().optional(),
  credentialType: z.string().min(1, '凭证类型不能为空'),
  category: z.string().min(1, '分类不能为空'),
  version: z.string().default('1.0.0'),
  schema: z.record(z.any()), // JSON Schema
  designTemplate: z.record(z.any()).optional(), // 设计模板
  requiredFields: z.array(z.string()).default([]),
  optionalFields: z.array(z.string()).default([]),
  validationRules: z.record(z.any()).default({}),
  isPublic: z.boolean().default(true),
  organizationOnly: z.boolean().default(false),
  minimumRole: z.enum(['USER', 'MODERATOR', 'ADMIN']).default('USER'),
  autoIssueRules: z.record(z.any()).optional(),
  expiryDuration: z.number().min(1).max(3650).optional(),
  tags: z.array(z.string()).default([])
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 获取用户信息（可选）
    const user = await auth(request).catch(() => null)

    // 构建查询条件
    const where: any = {}
    
    // 基础过滤条件
    if (!validatedQuery.includeInactive) {
      where.isActive = true
    }

    // 权限过滤
    if (!user || user.role === 'USER') {
      where.isPublic = true
      where.organizationOnly = false
    }

    // 类别过滤
    if (validatedQuery.category) {
      where.category = validatedQuery.category
    }

    // 凭证类型过滤
    if (validatedQuery.credentialType) {
      where.credentialType = validatedQuery.credentialType
    }

    // 公开性过滤
    if (validatedQuery.isPublic !== undefined) {
      where.isPublic = validatedQuery.isPublic
    }

    // 搜索条件
    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { credentialType: { contains: validatedQuery.search, mode: 'insensitive' } },
        { tags: { array_contains: [validatedQuery.search] } }
      ]
    }

    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // 构建排序
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder

    // 查询模板
    const [templates, total] = await Promise.all([
      prisma.credentialTemplate.findMany({
        where,
        skip,
        take: validatedQuery.limit,
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          approver: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          _count: {
            select: {
              credentials: true
            }
          }
        }
      }),
      prisma.credentialTemplate.count({ where })
    ])

    // 获取统计信息
    const stats = await prisma.credentialTemplate.groupBy({
      by: ['category'],
      where: { isActive: true, isPublic: true },
      _count: true,
      _avg: {
        popularity: true
      }
    })

    const totalPages = Math.ceil(total / validatedQuery.limit)

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages
        },
        statistics: {
          totalTemplates: total,
          categoriesStats: stats.reduce((acc, stat) => {
            acc[stat.category] = {
              count: stat._count,
              averagePopularity: stat._avg.popularity || 0
            }
            return acc
          }, {} as Record<string, any>)
        },
        filters: {
          applied: {
            category: validatedQuery.category,
            credentialType: validatedQuery.credentialType,
            isPublic: validatedQuery.isPublic,
            search: validatedQuery.search
          }
        }
      }
    })

  } catch (error) {
    console.error('获取凭证模板失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidParams') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('credentials.templates.loadError') },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)
    
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查用户是否有权限创建模板
    if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('credentials.templates.createForbidden') },
        { status: 403 }
      )
    }

    // 检查模板名称是否已存在
    const existingTemplate = await prisma.credentialTemplate.findFirst({
      where: {
        name: validatedData.name,
        credentialType: validatedData.credentialType
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, error: t('credentials.templates.nameExists') },
        { status: 409 }
      )
    }

    // 验证JSON Schema格式
    try {
      JSON.stringify(validatedData.schema)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: t('credentials.templates.invalidSchema') },
        { status: 400 }
      )
    }

    // 创建模板
    const template = await prisma.credentialTemplate.create({
      data: {
        ...validatedData,
        createdBy: user.id,
        approvedBy: user.role === 'ADMIN' ? user.id : null,
        approvedAt: user.role === 'ADMIN' ? new Date() : null
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        approver: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        template,
        message: t('credentials.templates.createSuccess')
      }
    })

  } catch (error) {
    console.error('创建凭证模板失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('credentials.templates.createError') },
      { status: 500 }
    )
  }
}

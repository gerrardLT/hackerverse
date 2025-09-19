import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  search: z.string().optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  sortBy: z.enum(['createdAt', 'username', 'email', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 检查用户是否是管理员
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 构建查询条件
    const where: any = {}
    
    // 搜索条件
    if (validatedQuery.search) {
      where.OR = [
        { username: { contains: validatedQuery.search, mode: 'insensitive' } },
        { email: { contains: validatedQuery.search, mode: 'insensitive' } },
      ]
    }
    
    // 角色筛选
    if (validatedQuery.role) {
      where.role = validatedQuery.role
    }
    
    // 状态筛选
    if (validatedQuery.status) {
      where.status = validatedQuery.status
    }
    
    // 排序
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder
    
    // 分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    
    // 查询用户列表
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: validatedQuery.limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              participations: true,
              projects: true,
              communityPosts: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit)
        }
      }
    })
  } catch (error) {
    console.error('获取用户列表错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '查询参数验证失败', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 创建团队验证模式
const createTeamSchema = z.object({
  name: z.string().min(2, '团队名称至少2个字符'),
  description: z.string().min(10, '团队描述至少10个字符'),
  hackathonId: z.string().min(1, '黑客松ID不能为空'),
  maxMembers: z.number().min(1, '最大成员数至少1人').max(10, '最大成员数不能超过10人').default(5),
  skills: z.array(z.string()).min(1, '至少选择一种技能'),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
})

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('12'),
  search: z.string().optional(),
  hackathonId: z.string().optional(),
  skill: z.string().optional(),
  hasOpenings: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'name', 'memberCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    // 构建查询条件
    const where: any = {
      isPublic: true,
    }
    
    // 搜索条件
    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { tags: { hasSome: [validatedQuery.search] } },
      ]
    }
    
    // 黑客松筛选
    if (validatedQuery.hackathonId) {
      where.hackathonId = validatedQuery.hackathonId
    }
    
    // 技能筛选
    if (validatedQuery.skill) {
      where.skills = { has: validatedQuery.skill }
    }
    
    // 有空位筛选
    if (validatedQuery.hasOpenings !== undefined) {
      if (validatedQuery.hasOpenings) {
        where.members = {
          _count: {
            lt: { maxMembers: true }
          }
        }
      }
    }
    
    // 排序
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder
    
    // 分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    
    // 查询团队列表
    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        orderBy,
        skip,
        take: validatedQuery.limit,
        select: {
          id: true,
          name: true,
          description: true,
          maxMembers: true,
          skills: true,
          tags: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          hackathon: {
            select: {
              id: true,
              title: true,
            }
          },
          leader: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          },
          members: {
            select: {
              id: true,
              role: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              projects: true,
            }
          }
        }
      }),
      prisma.team.count({ where })
    ])
    
        return NextResponse.json({      success: true,      data: {        teams,        pagination: {          page: validatedQuery.page,          limit: validatedQuery.limit,          total,          totalPages: Math.ceil(total / validatedQuery.limit),        }      }    })
    
  } catch (error) {
    console.error('获取团队列表错误:', error)
    
        if (error instanceof z.ZodError) {      return NextResponse.json(        { success: false, error: '查询参数验证失败', details: error.errors },        { status: 400 }      )    }        return NextResponse.json(      { success: false, error: '获取团队列表失败' },      { status: 500 }    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供认证token' },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '无效的认证token' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = createTeamSchema.parse(body)
    
    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: validatedData.hackathonId },
      select: {
        id: true,
        title: true,
        endDate: true,
        isPublic: true,
      }
    })
    
    if (!hackathon) {
      return NextResponse.json(
        { error: '黑客松不存在' },
        { status: 404 }
      )
    }
    
    // 检查黑客松是否公开
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { error: '该黑客松为私有活动' },
        { status: 403 }
      )
    }
    
    // 检查用户是否报名参加该黑客松
    const participation = await prisma.participation.findFirst({
      where: {
        hackathonId: validatedData.hackathonId,
        userId: payload.userId,
      }
    })
    
    if (!participation) {
      return NextResponse.json(
        { error: '您需要先报名参加该黑客松' },
        { status: 400 }
      )
    }
    
    // 检查用户是否已经加入其他团队
    const existingTeamMember = await prisma.teamMember.findFirst({
      where: {
        userId: payload.userId,
        team: {
          hackathonId: validatedData.hackathonId,
        }
      }
    })
    
    if (existingTeamMember) {
      return NextResponse.json(
        { error: '您已经加入了该黑客松的其他团队' },
        { status: 400 }
      )
    }
    
    // 检查团队名称是否已存在
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: validatedData.name,
        hackathonId: validatedData.hackathonId,
      }
    })
    
    if (existingTeam) {
      return NextResponse.json(
        { error: '该黑客松中已存在同名团队' },
        { status: 400 }
      )
    }
    
    // 创建团队并添加创建者为队长
    const team = await prisma.team.create({
      data: {
        ...validatedData,
        leaderId: payload.userId,
        members: {
          create: {
            userId: payload.userId,
            role: 'leader',
            joinedAt: new Date(),
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        maxMembers: true,
        skills: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        leader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
        members: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
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
    })
    
        return NextResponse.json({      success: true,      message: '团队创建成功',      data: {        team,      }    }, { status: 201 })
    
  } catch (error) {
    console.error('创建团队错误:', error)
    
        if (error instanceof z.ZodError) {      return NextResponse.json(        { success: false, error: '请求数据验证失败', details: error.errors },        { status: 400 }      )    }        return NextResponse.json(      { success: false, error: '创建团队失败' },      { status: 500 }    )
  }
} 
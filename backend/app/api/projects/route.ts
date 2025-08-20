import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { IPFSService } from '@/lib/ipfs'

// 创建项目验证模式
const createProjectSchema = z.object({
  title: z.string().min(1, '项目标题不能为空'),
  description: z.string().min(10, '项目描述至少10个字符'),
  hackathonId: z.string().min(1, '黑客松ID不能为空'),
  teamId: z.string().optional(),
  technologies: z.array(z.string()).min(1, '至少选择一种技术'),
  tags: z.array(z.string()).optional(),
  githubUrl: z.string().url('GitHub链接格式不正确').optional(),
  demoUrl: z.string().url('演示链接格式不正确').optional(),
  videoUrl: z.string().url('视频链接格式不正确').optional(),
  presentationUrl: z.string().url('演示文稿链接格式不正确').optional(),
  ipfsHash: z.string().optional(),
  isPublic: z.boolean().default(true),
})

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('12'),
  search: z.string().optional(),
  hackathonId: z.string().optional(),
  teamId: z.string().optional(),
  technology: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'reviewed', 'winner']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
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
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { tags: { hasSome: [validatedQuery.search] } },
      ]
    }
    
    // 黑客松筛选
    if (validatedQuery.hackathonId) {
      where.hackathonId = validatedQuery.hackathonId
    }
    
    // 团队筛选
    if (validatedQuery.teamId) {
      where.teamId = validatedQuery.teamId
    }
    
    // 技术筛选
    if (validatedQuery.technology) {
      where.technologies = { has: validatedQuery.technology }
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
    
    // 查询项目列表
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: validatedQuery.limit,
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
              feedback: true,     // 使用正确的字段名
              projectLikes: true, // 使用正确的字段名
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        }
      }
    })
    
  } catch (error) {
    console.error('获取项目列表错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '查询参数验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    )
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
    const validatedData = createProjectSchema.parse(body)
    
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
    
    // 检查团队权限（如果指定了团队）
    if (validatedData.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: validatedData.teamId,
          userId: payload.userId,
        }
      })
      
      if (!teamMember) {
        return NextResponse.json(
          { error: '您不是该团队成员' },
          { status: 403 }
        )
      }
    }
    
    // 检查是否已提交项目
    const existingProject = await prisma.project.findFirst({
      where: {
        hackathonId: validatedData.hackathonId,
        teamId: validatedData.teamId || null,
      }
    })
    
    if (existingProject) {
      return NextResponse.json(
        { error: '您已经为该黑客松提交了项目' },
        { status: 400 }
      )
    }
    
    // 创建项目
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        creatorId: payload.userId,
        status: 'draft',
      },
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
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '项目创建成功',
      project,
    }, { status: 201 })
    
  } catch (error) {
    console.error('创建项目错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    )
  }
} 
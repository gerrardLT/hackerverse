import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { IPFSService } from '@/lib/ipfs'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 强制使用Node.js运行时，避免Edge Runtime的crypto模块限制
export const runtime = 'nodejs'

// 创建项目验证模式
const createProjectSchema = z.object({
  title: z.string().min(1, '项目标题不能为空'),
  description: z.string().min(10, '项目描述至少10个字符'),
  hackathonId: z.string().min(1, '黑客松ID不能为空'),
  teamId: z.string().optional(),
  technologies: z.array(z.string()).min(1, '至少选择一种技术'), // 统一使用technologies字段
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
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 🔐 添加认证检查
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: t('auth.unauthorized'),
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { 
          success: false,
          error: t('auth.tokenInvalid'),
          code: 'TOKEN_INVALID'
        },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    console.log('🔍 项目API - 用户认证成功:', userId)

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    // 构建查询条件 - 认证用户可以看到更多项目
    const where: any = {
      OR: [
        { isPublic: true },
        { creatorId: userId }, // 用户自己的项目，无论是否公开
      ]
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
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: t('projects.getListError', { fallback: 'Failed to get project list' }) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: t('auth.unauthorized') },
        { status: 401 }
      )
    }
    
    // 验证token
    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: t('auth.tokenInvalid') },
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
        startDate: true,
        endDate: true,
        isPublic: true,
      }
    })
    
    if (!hackathon) {
      return NextResponse.json(
        { error: t('hackathons.notFound') },
        { status: 404 }
      )
    }
    
    // 检查黑客松是否公开
    if (!hackathon.isPublic) {
      return NextResponse.json(
        { error: t('hackathons.privateEvent', { fallback: 'This hackathon is a private event' }) },
        { status: 403 }
      )
    }
    
    // 检查黑客松是否已开始（项目提交必须在黑客松开始后）
    const now = new Date()
    if (now < hackathon.startDate) {
      return NextResponse.json(
        { 
          error: t('projects.hackathonNotStarted', { fallback: 'Hackathon has not started yet, cannot submit project' }),
          details: t('projects.hackathonStartsAt', { 
            fallback: `Hackathon will start at ${hackathon.startDate.toLocaleString('en-US')}`,
            startTime: hackathon.startDate.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
          })
        },
        { status: 400 }
      )
    }
    
    // 检查黑客松是否已结束
    if (now > hackathon.endDate) {
      return NextResponse.json(
        { 
          error: t('projects.hackathonEnded', { fallback: 'Hackathon has ended, cannot submit project' }),
          details: t('projects.hackathonEndedAt', {
            fallback: `Hackathon ended at ${hackathon.endDate.toLocaleString('en-US')}`,
            endTime: hackathon.endDate.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
          })
        },
        { status: 400 }
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
        { error: t('teams.needRegistration') },
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
          { error: t('teams.notTeamMember', { fallback: 'You are not a member of this team' }) },
          { status: 403 }
        )
      }
    }
    
    // 检查是否已提交项目（一个用户在一个黑客松中只能提交一个项目）
    const existingProject = await prisma.project.findFirst({
      where: {
        hackathonId: validatedData.hackathonId,
        creatorId: payload.userId, // 检查当前用户是否已经为该黑客松创建过项目
      }
    })
    
    if (existingProject) {
      return NextResponse.json(
        { 
          success: false,
          error: t('projects.alreadySubmitted'),
          code: 'PROJECT_ALREADY_EXISTS'
        },
        { status: 400 }
      )
    }
    
    // ⭐ 使用统一的IPFSService上传项目数据到IPFS（必须成功）
    let ipfsCID
    try {
      // 导入IPFS服务
      const { IPFSService } = await import('@/lib/ipfs')
      
      // 构建标准化的项目数据结构
      const projectData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          title: validatedData.title,
          description: validatedData.description,
          technologies: validatedData.technologies, // 统一字段名
          demoUrl: validatedData.demoUrl,
          githubUrl: validatedData.githubUrl,
          videoUrl: validatedData.videoUrl,
          presentationUrl: validatedData.presentationUrl,
          team: validatedData.teamId || '',
          hackathonId: validatedData.hackathonId,
          teamId: validatedData.teamId,
          tags: validatedData.tags || [],
          isPublic: validatedData.isPublic,
          createdAt: new Date().toISOString()
        },
        metadata: {
          creator: payload.userId,
          hackathonTitle: hackathon.title,
          platform: 'HackX',
          network: 'BSC Testnet'
        }
      }
      
      // 使用专用的项目数据上传方法
      ipfsCID = await IPFSService.uploadProjectData(projectData)
      console.log('📦 IPFS项目数据上传成功:', ipfsCID)
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json({
        success: false,
        error: 'IPFS上传失败，无法创建项目',
        details: ipfsError instanceof Error ? ipfsError.message : '未知错误'
      }, { status: 500 })
    }

    // ⭐ 暂时禁用智能合约调用，避免UUID转数字ID的问题
    let contractResult: {
      projectId: number
      txHash: string
      blockNumber: number
      gasUsed: number
    } | null = null
    
    // TODO: 实现UUID到数字ID的映射机制后再启用智能合约调用
    console.log('⚠️ 智能合约调用已暂时禁用，项目将仅存储在数据库中')
    
    // 如果需要启用智能合约，需要先解决hackathonId映射问题
    // try {
    //   const { smartContractService } = await import('@/lib/smart-contracts')
    //   await smartContractService.initialize()
    //   
    //   // 需要将UUID hackathonId 映射为合约中的数字ID
    //   const contractHackathonId = await getContractHackathonId(validatedData.hackathonId)
    //   
    //   const tx = await smartContractService.submitProject(
    //     contractHackathonId,
    //     ipfsCID
    //   )
    //   // ... 其余逻辑
    // } catch (contractError) {
    //   console.error('智能合约调用失败:', contractError)
    //   // 不阻止项目创建，仅记录错误
    // }

    // ⭐ 创建项目（写入数据库作为缓存）
    const project = await prisma.project.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        hackathonId: validatedData.hackathonId,
        teamId: validatedData.teamId,
        technologies: validatedData.technologies, // 数据库使用technologies字段
        tags: validatedData.tags || [],
        githubUrl: validatedData.githubUrl,
        demoUrl: validatedData.demoUrl,
        videoUrl: validatedData.videoUrl,
        presentationUrl: validatedData.presentationUrl,
        ipfsHash: ipfsCID,
        isPublic: validatedData.isPublic,
        creatorId: payload.userId,
        status: 'DRAFT',
        // ⭐ 区块链相关字段（智能合约禁用时为null）
        contractId: (contractResult as any)?.projectId || null,  // 智能合约中的ID
        txHash: (contractResult as any)?.txHash || null,         // 交易哈希
        blockNumber: (contractResult as any)?.blockNumber || null, // 区块号
        gasUsed: (contractResult as any)?.gasUsed || null,         // Gas消耗
        syncStatus: contractResult ? 'SYNCED' : 'PENDING',  // 同步状态
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
      message: t('projects.createSuccess'),
      data: {
        project: {
          ...project,
          // ⭐ 智能合约相关信息（可能为null）
          contractId: (contractResult as any)?.projectId || null,
          ipfsCID,
          txHash: (contractResult as any)?.txHash || null,
          blockNumber: (contractResult as any)?.blockNumber || null,
          gasUsed: (contractResult as any)?.gasUsed || null,
          ipfsUrl: ipfsCID ? `${process.env.IPFS_GATEWAY}/ipfs/${ipfsCID}` : null
        }
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('创建项目错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: t('projects.createError') },
      { status: 500 }
    )
  }
} 
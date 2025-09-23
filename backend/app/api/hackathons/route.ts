import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 创建黑客松验证模式
const createHackathonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationStartDate: z.string().datetime().optional(),
  registrationDeadline: z.string().datetime(),
  maxParticipants: z.number().min(1).optional(),
  prizePool: z.number().min(0).optional(),
  categories: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  rules: z.string().optional(),
  isPublic: z.boolean().default(true),
  featured: z.boolean().default(false),
  // 新增字段用于IPFS元数据
  prizes: z.array(z.object({
    rank: z.number(),
    name: z.string().optional(), // ⭐ 添加奖项名称
    amount: z.number(),
    description: z.string(),
    winnerCount: z.number().optional().default(1) // ⭐ 添加获奖人数
  })).optional(),
  tracks: z.array(z.object({
    name: z.string(),
    description: z.string(),
    requirements: z.string().optional()
  })).optional(),
  schedule: z.array(z.object({
    date: z.string(),
    time: z.string(),
    event: z.string(),
    description: z.string().optional()
  })).optional(),
  sponsors: z.array(z.object({
    name: z.string(),
    logoUrl: z.string().optional(), // ⭐ 更新字段名为logoUrl
    websiteUrl: z.string().optional(), // ⭐ 更新字段名为websiteUrl
    tier: z.string().optional() // ⭐ 添加赞助等级
  })).optional(),
  judgingCriteria: z.array(z.object({
    category: z.string(),
    weight: z.number(),
    description: z.string()
  })).optional(),
  // ⭐ 新增字段
  judges: z.array(z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    avatarUrl: z.string().optional()
  })).optional(),
  timeline: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string(),
    completed: z.boolean().optional()
  })).optional(),
  socialLinks: z.object({
    website: z.string().url().optional(),
    twitter: z.string().url().optional(),
    discord: z.string().url().optional(),
    telegram: z.string().url().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional()
  }).optional(),
  coverImage: z.string().optional()
})

/**
 * 转换数据库状态为前端期望的状态格式
 */
function convertStatusToFrontend(dbStatus: string, startDate: Date, endDate: Date): string {
  const now = new Date()
  
  // 优先根据时间判断实际状态
  if (now < startDate) {
    return 'upcoming'  // 即将开始
  } else if (now >= startDate && now <= endDate) {
    return 'ongoing'   // 进行中
  } else {
    return 'ended'     // 已结束
  }
}

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  // 支持单个状态或逗号分隔的多个状态
  status: z.string().optional().transform((val) => {
    if (!val) return undefined
    // 分割逗号分隔的状态值并验证每个值
    const statuses = val.split(',').map(s => s.trim())
    const validStatuses = ['upcoming', 'ongoing', 'completed']
    const invalidStatuses = statuses.filter(s => !validStatuses.includes(s))
    if (invalidStatuses.length > 0) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.invalid_enum_value,
        received: invalidStatuses.join(','),
        options: validStatuses,
        path: ['status'],
        message: `Invalid status values: ${invalidStatuses.join(', ')}. Expected: ${validStatuses.join(' | ')}`
      }])
    }
    return statuses as ('upcoming' | 'ongoing' | 'completed')[]
  }),
  featured: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'prizePool', 'participants']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    // 检查是否有认证用户（可选）
    let currentUserId: string | null = null
    try {
      const user = await auth(request)
      currentUserId = user?.id || null
    } catch (error) {
      // 忽略认证错误，允许未登录用户查看公开黑客松
    }
    
    // 构建查询条件
    const where: any = {
      isPublic: true,
      status: 'ACTIVE', // 只显示已审核通过的黑客松
    }
    
    // 搜索条件
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        // 暂时注释掉tags搜索，因为可能导致JSON查询错误
        // { tags: { hasSome: [validatedQuery.search] } },
      ]
    }
    
    // 类别筛选
    if (validatedQuery.category) {
      where.categories = { has: validatedQuery.category }
    }
    
    // 状态筛选 - 支持多个状态
    if (validatedQuery.status && validatedQuery.status.length > 0) {
      const now = new Date()
      const statusConditions: any[] = []
      
      for (const status of validatedQuery.status) {
        switch (status) {
          case 'upcoming':
            statusConditions.push({ startDate: { gt: now } })
            break
          case 'ongoing':
            statusConditions.push({
              AND: [
                { startDate: { lte: now } },
                { endDate: { gt: now } }
              ]
            })
            break
          case 'completed':
            statusConditions.push({ endDate: { lte: now } })
            break
        }
      }
      
      // 如果有多个状态条件，使用OR连接
      if (statusConditions.length > 0) {
        if (where.OR) {
          // 如果已经有OR条件（如搜索），需要合并
          where.AND = [
            { OR: where.OR },
            { OR: statusConditions }
          ]
          delete where.OR
        } else {
          where.OR = statusConditions
        }
      }
    }
    
    // 精选筛选
    if (validatedQuery.featured !== undefined) {
      if (validatedQuery.featured) {
        where.featured = true
      } else {
        where.featured = false
      }
    }
    
    // 排序
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder
    
    // 分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    
    // 查询黑客松列表
    const [hackathons, total] = await Promise.all([
      prisma.hackathon.findMany({
        where,
        orderBy,
        skip,
        take: validatedQuery.limit,
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          registrationStartDate: true,
          registrationDeadline: true,
          maxParticipants: true,
          prizePool: true,
          categories: true,
          tags: true,
          requirements: true,
          rules: true,
          isPublic: true,
          featured: true,
          status: true,
          ipfsHash: true,
          metadata: true,
          createdAt: true,
          organizer: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          },
          _count: {
            select: {
              participations: true,
              projects: true
            }
          }
        }
      }),
      prisma.hackathon.count({ where })
    ])
    
    // 转换状态格式并添加用户参与状态
    let hackathonsWithStatus
    
    if (currentUserId) {
      // 如果有登录用户，批量查询参与状态以提高性能
      const hackathonIds = hackathons.map(h => h.id)
      
      // 批量查询用户参与状态
      const [participations, userProjects] = await Promise.all([
        prisma.participation.findMany({
          where: {
            hackathonId: { in: hackathonIds },
            userId: currentUserId,
          },
          select: {
            hackathonId: true,
            status: true,
            joinedAt: true,
          }
        }),
        prisma.project.groupBy({
          by: ['hackathonId'],
          where: {
            hackathonId: { in: hackathonIds },
            creatorId: currentUserId,
          },
          _count: {
            id: true,
          }
        })
      ])
      
      // 创建映射以便快速查找
      const participationMap = new Map(
        participations.map(p => [p.hackathonId, p])
      )
      const projectCountMap = new Map(
        userProjects.map(p => [p.hackathonId, p._count.id])
      )
      
      hackathonsWithStatus = hackathons.map((hackathon) => {
        let userParticipationStatus = null
        
        const participation = participationMap.get(hackathon.id)
        if (participation) {
          const userProjectCount = projectCountMap.get(hackathon.id) || 0
          const hasSubmittedProject = userProjectCount > 0
          const isCompleted = new Date() > hackathon.endDate && hasSubmittedProject
          
          userParticipationStatus = {
            isParticipating: true,
            status: isCompleted ? 'COMPLETED' : (hasSubmittedProject ? 'SUBMITTED' : 'REGISTERED'),
            joinedAt: participation.joinedAt,
            hasSubmittedProject,
            projectCount: userProjectCount,
          }
        }
        
        return {
          ...hackathon,
          status: convertStatusToFrontend(hackathon.status, hackathon.startDate, hackathon.endDate),
          userParticipation: userParticipationStatus,
        }
      })
    } else {
      // 未登录用户，不查询参与状态
      hackathonsWithStatus = hackathons.map((hackathon) => ({
        ...hackathon,
        status: convertStatusToFrontend(hackathon.status, hackathon.startDate, hackathon.endDate),
        userParticipation: null,
      }))
    }
    
    return NextResponse.json({
      success: true,
      data: {
        hackathons: hackathonsWithStatus,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit)
        }
      }
    })
    
  } catch (error) {
    console.error('获取黑客松列表错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('errors.validationError'), details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('hackathons.getListError', { fallback: 'Failed to get hackathon list' }) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    // 从中间件已验证的请求中获取用户信息
    // 如果请求能到达这里，说明token已经通过中间件验证
    const user = await auth(request)
    
    // 这里不应该出现user为null的情况，因为中间件已经验证过了
    if (!user) {
      console.error('⚠️ 中间件验证通过但无法获取用户信息 - 可能的数据库问题')
      return NextResponse.json(
        { 
          success: false, 
          error: t('auth.userNotFound'),
          code: 'USER_NOT_FOUND'
        },
        { status: 500 } // 改为500，因为这是服务器内部错误
      )
    }
    
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = createHackathonSchema.parse(body)
    
    // 验证日期逻辑
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    const registrationStartDate = validatedData.registrationStartDate ? new Date(validatedData.registrationStartDate) : null
    const registrationDeadline = new Date(validatedData.registrationDeadline)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { 
          success: false,
          error: t('hackathons.invalidDateRange'),
          code: 'INVALID_DATE_RANGE'
        },
        { status: 400 }
      )
    }
    
    // 允许注册截止时间等于或晚于开始时间，但不能超过开始后24小时
    const maxRegistrationTime = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // 开始后24小时
    if (registrationDeadline > maxRegistrationTime) {
      return NextResponse.json(
        { 
          success: false,
          error: t('hackathons.registrationTooLate'),
          code: 'REGISTRATION_TOO_LATE'
        },
        { status: 400 }
      )
    }
    
    if (registrationStartDate && registrationStartDate >= registrationDeadline) {
      return NextResponse.json(
        { 
          success: false,
          error: t('hackathons.invalidRegistrationStart', { fallback: 'Registration start time must be before registration deadline' }),
          code: 'INVALID_REGISTRATION_START_DATE'
        },
        { status: 400 }
      )
    }

    // 获取组织者信息
    const organizer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, email: true, avatarUrl: true }
    })

    if (!organizer) {
      return NextResponse.json(
        { 
          success: false,
          error: t('hackathons.organizerNotFound', { fallback: 'Organizer information not found' }),
          code: 'ORGANIZER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // ⭐ 第1步: 先准备数据但不上传
    let hackathonData
    try {
      // 构建标准化的黑客松数据结构
      hackathonData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          title: validatedData.title,
          description: validatedData.description,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          prizePool: validatedData.prizePool || 0,
          categories: validatedData.categories,
          requirements: validatedData.requirements || '',
          rules: validatedData.rules || ''
        },
        metadata: {
          organizer: organizer.id,
          status: 'ACTIVE' as const,
          previousVersion: undefined
        }
      }
      console.log('📋 黑客松数据准备完成，准备验证智能合约')
    } catch (dataError) {
      console.error('数据准备失败:', dataError)
      return NextResponse.json({
        success: false,
        error: '数据准备失败',
        details: dataError instanceof Error ? dataError.message : '未知错误'
      }, { status: 500 })
    }

    // ⭐ 第2步: 先验证智能合约服务可用性
    let smartContractService
    try {
      // 动态导入智能合约服务
      const { smartContractService: scs } = await import('@/lib/smart-contracts')
      smartContractService = scs
      
      // 初始化智能合约服务
      await smartContractService.initialize()
      
      console.log('✅ 智能合约服务初始化成功')
    } catch (contractError) {
      console.error('智能合约服务初始化失败:', contractError)
      return NextResponse.json({
        success: false,
        error: '智能合约服务不可用，黑客松创建失败',
        code: 'CONTRACT_ERROR',
        details: contractError instanceof Error ? contractError.message : '未知错误'
      }, { status: 500 })
    }

    // ⭐ 第3步: 智能合约验证通过后，上传数据到IPFS
    let ipfsCID
    try {
      // 导入IPFS服务
      const { IPFSService } = await import('@/lib/ipfs')
      
      // 使用专用的黑客松数据上传方法
      ipfsCID = await IPFSService.uploadHackathonData(hackathonData)
      console.log('📦 IPFS黑客松数据上传成功:', ipfsCID)
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json({
        success: false,
        error: t('hackathons.ipfsUploadFailed'),
        details: ipfsError instanceof Error ? ipfsError.message : t('errors.unknownError')
      }, { status: 500 })
    }
    
    // ⭐ 第4步: 调用智能合约创建黑客松
    let contractResult
    try {
      // 调用智能合约创建黑客松
      contractResult = await smartContractService.createHackathon(ipfsCID)
      
      console.log('✅ 智能合约创建黑客松成功:', contractResult)
      
    } catch (contractError) {
      console.error('智能合约调用失败:', contractError)
      return NextResponse.json({
        success: false,
        error: t('hackathons.smartContractCallFailed'),
        code: 'CONTRACT_ERROR',
        details: contractError instanceof Error ? contractError.message : '未知错误'
      }, { status: 500 })
    }
    
    // ⭐ 创建黑客松（写入数据库作为缓存）
    const hackathon = await prisma.hackathon.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate,
        endDate,
        registrationStartDate,
        registrationDeadline,
        maxParticipants: validatedData.maxParticipants,
        prizePool: validatedData.prizePool,
        categories: validatedData.categories,
        tags: validatedData.tags || [],
        requirements: validatedData.requirements,
        rules: validatedData.rules,
        isPublic: validatedData.isPublic,
        featured: validatedData.featured,
        status: 'PENDING_REVIEW', // 新创建的黑客松需要审核后才能发布
        organizerId: user.id,
        
        // ⭐ 新增区块链相关字段
        contractId: contractResult.hackathonId,  // 智能合约中的ID
        ipfsHash: ipfsCID,                       // IPFS哈希
        txHash: contractResult.txHash,           // 交易哈希
        blockNumber: contractResult.blockNumber, // 区块号
        gasUsed: contractResult.gasUsed ? Number(contractResult.gasUsed) : null, // Gas消耗 (转换BigInt为number)
        syncStatus: 'SYNCED',                    // 同步状态
        
        metadata: {
          prizes: validatedData.prizes || [],
          tracks: validatedData.tracks || [],
          schedule: validatedData.schedule || [],
          sponsors: validatedData.sponsors || [],
          judges: validatedData.judges || [], // ⭐ 添加评委团队
          judgingCriteria: validatedData.judgingCriteria || [],
          timeline: validatedData.timeline || [], // ⭐ 添加时间线
          socialLinks: validatedData.socialLinks || {}, // ⭐ 添加社交链接支持
          coverImage: validatedData.coverImage || null // ⭐ 添加封面图片支持
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        registrationStartDate: true,
        registrationDeadline: true,
        maxParticipants: true,
        prizePool: true,
        categories: true,
        tags: true,
        requirements: true,
        rules: true,
        isPublic: true,
        featured: true,
        ipfsHash: true,
        metadata: true,
        createdAt: true,
        organizer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        }
      }
    })

    // 🚀 打印创建黑客松的完整信息
    console.log('🚀 黑客松创建成功 - 详细信息:', {
      hackathonId: hackathon.id,
      title: hackathon.title,
      coverImageInfo: {
        hasCoverImage: !!validatedData.coverImage,
        coverImageUrl: validatedData.coverImage,
        storedInMetadata: !!(hackathon.metadata as any)?.coverImage
      },
      smartContractInfo: {
        contractId: contractResult.hackathonId,
        txHash: contractResult.txHash,
        blockNumber: contractResult.blockNumber,
        gasUsed: contractResult.gasUsed
      },
      ipfsInfo: {
        ipfsHash: ipfsCID,
        ipfsUrl: ipfsCID ? `${process.env.IPFS_GATEWAY}/ipfs/${ipfsCID}` : null
      },
      metadata: hackathon.metadata
    })
    
    return NextResponse.json({
      success: true,
      message: t('hackathons.createSuccess'),
      data: {
        hackathon: {
          ...hackathon,
          // ⭐ 确保返回智能合约相关信息
          contractId: contractResult.hackathonId,
          ipfsCID,
          txHash: contractResult.txHash,
          blockNumber: contractResult.blockNumber,
          gasUsed: contractResult.gasUsed,
          ipfsUrl: ipfsCID ? `${process.env.IPFS_GATEWAY}/ipfs/${ipfsCID}` : null
        }
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('创建黑客松错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: t('errors.validationError'),
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: t('hackathons.createError')
    }, { status: 500 })
  }
} 
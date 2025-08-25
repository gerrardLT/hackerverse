import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 创建黑客松验证模式
const createHackathonSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(10, '描述至少10个字符'),
  startDate: z.string().datetime('开始日期格式不正确'),
  endDate: z.string().datetime('结束日期格式不正确'),
  registrationDeadline: z.string().datetime('注册截止日期格式不正确'),
  maxParticipants: z.number().min(1, '最大参与人数至少1人').optional(),
  prizePool: z.number().min(0, '奖金池不能为负数').optional(),
  categories: z.array(z.string()).min(1, '至少选择一个类别'),
  tags: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  rules: z.string().optional(),
  isPublic: z.boolean().default(true),
  featured: z.boolean().default(false),
  // 新增字段用于IPFS元数据
  prizes: z.array(z.object({
    rank: z.number(),
    amount: z.number(),
    description: z.string()
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
    logo: z.string().optional(),
    website: z.string().optional(),
    contribution: z.string().optional()
  })).optional(),
  judgingCriteria: z.array(z.object({
    category: z.string(),
    weight: z.number(),
    description: z.string()
  })).optional(),
})

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'prizePool', 'participants']).default('createdAt'),
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
      status: 'active', // 只显示已审核通过的黑客松
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
    
    // 状态筛选
    if (validatedQuery.status) {
      const now = new Date()
      switch (validatedQuery.status) {
        case 'upcoming':
          where.startDate = { gt: now }
          break
        case 'ongoing':
          where.startDate = { lte: now }
          where.endDate = { gt: now }
          break
        case 'completed':
          where.endDate = { lte: now }
          break
      }
    }
    
    // 精选筛选
    if (validatedQuery.featured !== undefined) {
      where.featured = validatedQuery.featured
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
    
    return NextResponse.json({
      success: true,
      data: {
        hackathons,
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
    
        if (error instanceof z.ZodError) {      return NextResponse.json(        { success: false, error: '请求参数验证失败', details: error.errors },        { status: 400 }      )    }        return NextResponse.json(      { success: false, error: '获取黑客松列表失败' },      { status: 500 }    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = createHackathonSchema.parse(body)
    
    // 验证日期逻辑
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    const registrationDeadline = new Date(validatedData.registrationDeadline)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: '结束日期必须晚于开始日期' },
        { status: 400 }
      )
    }
    
    if (registrationDeadline >= startDate) {
      return NextResponse.json(
        { error: '注册截止日期必须早于开始日期' },
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
        { error: '组织者信息不存在' },
        { status: 404 }
      )
    }

    // 创建黑客松元数据用于IPFS存储
    const hackathonMetadata = {
      version: '1.0',
      type: 'hackathon',
      timestamp: new Date().toISOString(),
      hackathon: {
        title: validatedData.title,
        description: validatedData.description,
        organizer: {
          id: organizer.id,
          username: organizer.username,
          email: organizer.email,
          avatarUrl: organizer.avatarUrl
        },
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        registrationDeadline: validatedData.registrationDeadline,
        maxParticipants: validatedData.maxParticipants,
        prizePool: validatedData.prizePool,
        categories: validatedData.categories,
        tags: validatedData.tags || [],
        requirements: validatedData.requirements,
        rules: validatedData.rules,
        prizes: validatedData.prizes || [],
        tracks: validatedData.tracks || [],
        schedule: validatedData.schedule || [],
        sponsors: validatedData.sponsors || [],
        judgingCriteria: validatedData.judgingCriteria || [],
        isPublic: validatedData.isPublic,
        featured: validatedData.featured,
        createdAt: new Date().toISOString()
      }
    }

    // ⭐ 上传黑客松元数据到IPFS（必须成功）
    let ipfsCID
    try {
      // 动态导入IPFS服务
      const { IPFSService } = await import('@/lib/ipfs')
      ipfsCID = await IPFSService.uploadJSON(hackathonMetadata, {
        name: `hackathon-${validatedData.title.replace(/\s+/g, '-').toLowerCase()}.json`,
        description: `黑客松详情: ${validatedData.title}`,
        tags: ['hackathon', 'metadata', ...validatedData.categories],
        version: '1.0.0',
        author: organizer.username || organizer.email
      })
      console.log('📦 IPFS上传成功:', ipfsCID)
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json({
        error: 'IPFS上传失败，无法创建黑客松',
        details: ipfsError instanceof Error ? ipfsError.message : '未知错误'
      }, { status: 500 })
    }
    
    // ⭐ 调用智能合约创建黑客松
    let contractResult
    try {
      // 动态导入智能合约服务
      const { smartContractService } = await import('@/lib/smart-contracts')
      
      // 初始化智能合约服务
      await smartContractService.initialize()
      
      // 调用智能合约创建黑客松
      const tx = await smartContractService.createHackathon(ipfsCID)
      const receipt = await tx.wait()
      
      // 获取黑客松ID（从事件中解析）
      const hackathonCreatedEvent = receipt.logs?.find((log: any) => {
        try {
          const parsedLog = smartContractService.contracts.hackxCore.interface.parseLog(log)
          return parsedLog?.name === 'HackathonCreated'
        } catch {
          return false
        }
      })
      
      let contractHackathonId = 1 // 默认值
      if (hackathonCreatedEvent) {
        try {
          const parsedLog = smartContractService.contracts.hackxCore.interface.parseLog(hackathonCreatedEvent)
          if (parsedLog && parsedLog.args) {
            contractHackathonId = Number(parsedLog.args.hackathonId)
          }
        } catch (parseError) {
          console.warn('解析事件失败，使用默认ID:', parseError)
        }
      }
      
      contractResult = {
        hackathonId: contractHackathonId,
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed)
      }
      
      console.log('⛓️ 智能合约创建成功:', contractResult)
      
    } catch (contractError) {
      console.error('智能合约调用失败:', contractError)
      return NextResponse.json({
        error: '智能合约调用失败，黑客松创建失败',
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
        registrationDeadline,
        maxParticipants: validatedData.maxParticipants,
        prizePool: validatedData.prizePool,
        categories: validatedData.categories,
        tags: validatedData.tags || [],
        requirements: validatedData.requirements,
        rules: validatedData.rules,
        isPublic: validatedData.isPublic,
        featured: validatedData.featured,
        organizerId: user.id,
        
        // ⭐ 新增区块链相关字段
        contractId: contractResult.hackathonId,  // 智能合约中的ID
        ipfsHash: ipfsCID,                       // IPFS哈希
        txHash: contractResult.txHash,           // 交易哈希
        blockNumber: contractResult.blockNumber, // 区块号
        gasUsed: contractResult.gasUsed,         // Gas消耗
        syncStatus: 'SYNCED',                    // 同步状态
        
        metadata: {
          prizes: validatedData.prizes || [],
          tracks: validatedData.tracks || [],
          schedule: validatedData.schedule || [],
          sponsors: validatedData.sponsors || [],
          judgingCriteria: validatedData.judgingCriteria || []
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
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
    
    return NextResponse.json({
      success: true,
      message: '黑客松创建成功',
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
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求数据验证失败',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: '创建黑客松失败'
    }, { status: 500 })
  }
} 
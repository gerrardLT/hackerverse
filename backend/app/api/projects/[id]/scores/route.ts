import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { IPFSService } from '@/lib/ipfs'

// 评分验证模式
const scoreSchema = z.object({
  innovation: z.number().min(0).max(10, '创新性评分必须在0-10之间'),
  technicalComplexity: z.number().min(0).max(10, '技术复杂度评分必须在0-10之间'),
  userExperience: z.number().min(0).max(10, '用户体验评分必须在0-10之间'),
  businessPotential: z.number().min(0).max(10, '商业潜力评分必须在0-10之间'),
  presentation: z.number().min(0).max(10, '演示评分必须在0-10之间'),
  comments: z.string().min(10, '评论至少10个字符').max(1000, '评论不能超过1000个字符'),
  isPublic: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const projectId = params.id
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = scoreSchema.parse(body)
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        hackathonId: true,
        contractId: true,
        hackathon: {
          select: {
            id: true,
            title: true,
            endDate: true
          }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    // 检查项目是否关联到黑客松
    if (!project.hackathon) {
      return NextResponse.json(
        { error: '独立项目无法进行评分' },
        { status: 400 }
      )
    }

    // 检查黑客松是否已结束（只有结束后才能评分）
    const now = new Date()
    if (project.hackathon.endDate > now) {
      return NextResponse.json(
        { error: '黑客松尚未结束，无法进行评分' },
        { status: 400 }
      )
    }

    // 检查是否已经评分过
    const existingScore = await prisma.score.findFirst({
      where: {
        projectId: projectId,
        judgeId: payload.userId
      }
    })

    if (existingScore) {
      return NextResponse.json(
        { error: '您已经对该项目进行过评分' },
        { status: 409 }
      )
    }

    // 获取评委信息
    const judge = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true
      }
    })

    if (!judge) {
      return NextResponse.json(
        { error: '评委信息不存在' },
        { status: 404 }
      )
    }

    // 计算总分
    const totalScore = (
      validatedData.innovation +
      validatedData.technicalComplexity +
      validatedData.userExperience +
      validatedData.businessPotential +
      validatedData.presentation
    ) / 5

    // 创建评分元数据用于IPFS存储
    const scoreMetadata = {
      version: '1.0',
      type: 'project-score',
      timestamp: new Date().toISOString(),
      score: {
        projectId: project.id,
        projectTitle: project.title,
        hackathonId: project.hackathonId,
        hackathonTitle: project.hackathon.title,
        judge: {
          id: judge.id,
          username: judge.username,
          email: judge.email,
          avatarUrl: judge.avatarUrl
        },
        scores: {
          innovation: validatedData.innovation,
          technicalComplexity: validatedData.technicalComplexity,
          userExperience: validatedData.userExperience,
          businessPotential: validatedData.businessPotential,
          presentation: validatedData.presentation,
          totalScore: totalScore
        },
        comments: validatedData.comments,
        isPublic: validatedData.isPublic,
        createdAt: new Date().toISOString()
      }
    }

    // ⭐ 上传评分数据到IPFS（必须成功）
    let ipfsCID
    try {
      ipfsCID = await IPFSService.uploadJSON(scoreMetadata, {
        name: `project-score-${project.id}-${judge.id}.json`,
        description: `项目评分: ${project.title} by ${judge.username}`,
        tags: ['project-score', 'hackathon', 'judging'],
        version: '1.0.0',
        author: judge.username || judge.email
      })
      console.log('📦 评分IPFS上传成功:', ipfsCID)
    } catch (ipfsError) {
      console.error('IPFS上传失败:', ipfsError)
      return NextResponse.json({
        error: 'IPFS上传失败，无法提交评分',
        details: ipfsError instanceof Error ? ipfsError.message : '未知错误'
      }, { status: 500 })
    }
    
    // ⭐ 调用智能合约提交评分
    let contractResult
    try {
      const { smartContractService } = await import('@/lib/smart-contracts')
      await smartContractService.initialize()
      
      // 注意：需要使用智能合约中的项目ID，而不是数据库ID
      const projectContractId = project.contractId || 1 // 如果没有contractId，使用默认值
      
      const txHash = await smartContractService.submitScore(
        projectContractId,
        Math.round(totalScore * 100), // 智能合约使用整数，乘以100保持精度
        '' // 暂时使用空字符串作为feedbackCID
      )
      
      contractResult = {
        txHash: txHash,
        blockNumber: null, // submitScore方法不返回receipt信息
        gasUsed: null
      }
      
      console.log('⛓️ 智能合约评分提交成功:', contractResult)
      
    } catch (contractError) {
      console.error('智能合约调用失败:', contractError)
      return NextResponse.json({
        error: '智能合约调用失败，评分提交失败',
        details: contractError instanceof Error ? contractError.message : '未知错误'
      }, { status: 500 })
    }

    // 保存评分到数据库
    const score = await prisma.score.create({
      data: {
        projectId: projectId,
        judgeId: payload.userId,
        innovation: validatedData.innovation,
        technicalComplexity: validatedData.technicalComplexity,
        userExperience: validatedData.userExperience,
        businessPotential: validatedData.businessPotential,
        presentation: validatedData.presentation,
        totalScore: totalScore,
        comments: validatedData.comments,
        
        // ⭐ 区块链相关字段
        ipfsHash: ipfsCID,
        txHash: contractResult.txHash,
        blockNumber: contractResult.blockNumber,
        gasUsed: contractResult.gasUsed,
        syncStatus: 'SYNCED',
      },
      select: {
        id: true,
        projectId: true,
        judgeId: true,
        innovation: true,
        technicalComplexity: true,
        userExperience: true,
        businessPotential: true,
        presentation: true,
        totalScore: true,
        comments: true,
        ipfsHash: true,
        createdAt: true,
        judge: {
          select: {
            id: true,
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
    })

    return NextResponse.json({
      success: true,
      message: '评分提交成功',
      score: {
        ...score,
        ipfsUrl: score.ipfsHash ? `${process.env.IPFS_GATEWAY}/ipfs/${score.ipfsHash}` : null
      }
    }, { status: 201 })

  } catch (error) {
    console.error('提交评分错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '提交评分失败' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // 获取项目评分列表
    const scores = await prisma.score.findMany({
      where: { projectId },
      select: {
        id: true,
        innovation: true,
        technicalComplexity: true,
        userExperience: true,
        businessPotential: true,
        presentation: true,
        totalScore: true,
        comments: true,
        ipfsHash: true,
        createdAt: true,
        judge: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 计算平均分
    const averageScore = scores.length > 0 
      ? scores.reduce((sum: number, score: any) => sum + score.totalScore, 0) / scores.length
      : 0

    return NextResponse.json({
      success: true,
      scores: scores.map((score: any) => ({
        ...score,
        ipfsUrl: score.ipfsHash ? `${process.env.IPFS_GATEWAY}/ipfs/${score.ipfsHash}` : null
      })),
      averageScore: Math.round(averageScore * 100) / 100,
      totalScores: scores.length
    })

  } catch (error) {
    console.error('获取项目评分错误:', error)
    return NextResponse.json(
      { error: '获取项目评分失败' },
      { status: 500 }
    )
  }
} 
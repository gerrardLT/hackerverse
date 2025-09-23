import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 获取用户凭证
export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)
  
  try {
    const session = await auth(request)
    if (!session) {
      return NextResponse.json(
        { error: t('errors.unauthorized') },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      userId: session.id
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (status && status !== 'all') {
      switch (status) {
        case 'verified':
          where.isVerified = true
          break
        case 'unverified':
          where.isVerified = false
          break
        case 'revoked':
          where.isRevoked = true
          break
        case 'expired':
          where.expiryDate = {
            lt: new Date()
          }
          break
      }
    }

    // 排序配置
    const orderBy: any = {}
    switch (sort) {
      case 'title':
        orderBy.title = order
        break
      case 'verificationScore':
        orderBy.verificationScore = order
        break
      case 'viewCount':
        orderBy.viewCount = order
        break
      default:
        orderBy.createdAt = order
        break
    }

    // 检查 IPFSCredential 模型是否存在
    const ipfsCredentialModel = (prisma as any).iPFSCredential || (prisma as any).ipfsCredential
    if (!ipfsCredentialModel) {
      console.error('IPFSCredential model not found')
      return NextResponse.json(
        { error: t('errors.modelNotFound') },
        { status: 500 }
      )
    }

    // 查询凭证
    const [credentials, total] = await Promise.all([
      ipfsCredentialModel.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          issuer: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              version: true
            }
          },
          verifications: {
            select: {
              id: true,
              status: true,
              score: true,
              createdAt: true,
              verifier: {
                select: {
                  username: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5 // 只取最近5条验证记录
          }
        }
      }),
      ipfsCredentialModel.count({ where })
    ])

    // 统计信息
    const stats = {
      total: await ipfsCredentialModel.count({
        where: { userId: session.id }
      }),
      verified: await ipfsCredentialModel.count({
        where: { 
          userId: session.id,
          isVerified: true 
        }
      }),
      public: await ipfsCredentialModel.count({
        where: { 
          userId: session.id,
          isPublic: true 
        }
      }),
      revoked: await ipfsCredentialModel.count({
        where: { 
          userId: session.id,
          isRevoked: true 
        }
      })
    }

    // 计算总浏览量
    const viewCountSum = await ipfsCredentialModel.aggregate({
      where: { userId: session.id },
      _sum: {
        viewCount: true
      }
    })
    
    ;(stats as any).totalViews = viewCountSum._sum.viewCount || 0

    return NextResponse.json({
      success: true,
      data: {
        credentials,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats
      }
    })

  } catch (error) {
    console.error('获取用户凭证失败:', error)
    return NextResponse.json(
      { error: t('errors.internalServerError') },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { RecommendationService } from '@/lib/recommendation-service'

// 权重更新验证模式
const updateWeightsSchema = z.object({
  prizePool: z.number().min(0).max(1).optional(),
  participation: z.number().min(0).max(1).optional(),
  recentness: z.number().min(0).max(1).optional(),
  diversity: z.number().min(0).max(1).optional(),
  reputation: z.number().min(0).max(1).optional(),
})

/**
 * 获取推荐算法报告
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'report':
        // 获取详细推荐报告
        const report = await RecommendationService.getRecommendationReport()
        return NextResponse.json({
          success: true,
          data: {
            ...report,
            timestamp: new Date().toISOString()
          }
        })

      case 'preview':
        // 预览推荐结果
        const limit = parseInt(searchParams.get('limit') || '5')
        const preview = await RecommendationService.getRecommendedHackathons(limit, false)
        return NextResponse.json({
          success: true,
          data: {
            recommendations: preview,
            count: preview.length,
            timestamp: new Date().toISOString()
          }
        })

      default:
        // 默认返回当前配置
        const currentReport = await RecommendationService.getRecommendationReport()
        return NextResponse.json({
          success: true,
          data: {
            weights: currentReport.weights,
            summary: currentReport.summary,
            lastUpdated: new Date().toISOString()
          }
        })
    }

  } catch (error) {
    console.error('获取推荐报告失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取推荐报告失败'
    }, { status: 500 })
  }
}

/**
 * 更新推荐算法配置
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'update_weights':
        // 更新权重配置
        const validatedWeights = updateWeightsSchema.parse(data.weights)
        
        // 检查权重总和
        const total = Object.values(validatedWeights).reduce((sum: number, w) => sum + (w || 0), 0)
        if (total > 0 && Math.abs(total - 1) > 0.01) {
          return NextResponse.json({
            success: false,
            error: `权重总和应该等于1，当前总和为${total.toFixed(3)}`
          }, { status: 400 })
        }

        RecommendationService.updateWeights(validatedWeights)
        
        return NextResponse.json({
          success: true,
          message: '推荐权重已更新',
          data: {
            newWeights: validatedWeights,
            timestamp: new Date().toISOString()
          }
        })

      case 'refresh_featured':
        // 刷新特色黑客松标记
        const limit = data.limit || 3
        const refreshed = await RecommendationService.getRecommendedHackathons(limit, true)
        
        return NextResponse.json({
          success: true,
          message: `已刷新${refreshed.length}个特色黑客松`,
          data: {
            refreshedHackathons: refreshed.map(h => ({
              id: h.id,
              title: h.title,
              score: h.score
            })),
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: '不支持的操作'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('更新推荐配置失败:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求数据验证失败',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: '更新推荐配置失败'
    }, { status: 500 })
  }
}

/**
 * 强制重新计算推荐
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 })
    }

    const body = await request.json()
    const { action, limit = 3 } = body

    switch (action) {
      case 'recalculate':
        // 重新计算并更新特色黑客松
        console.log('🔄 开始重新计算推荐...')
        const recommendations = await RecommendationService.getRecommendedHackathons(limit, true)
        
        return NextResponse.json({
          success: true,
          message: '推荐已重新计算并更新',
          data: {
            recommendations: recommendations.map(h => ({
              id: h.id,
              title: h.title,
              score: h.score.toFixed(2),
              metrics: h.metrics
            })),
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: '不支持的操作'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('重新计算推荐失败:', error)
    return NextResponse.json({
      success: false,
      error: '重新计算推荐失败'
    }, { status: 500 })
  }
}

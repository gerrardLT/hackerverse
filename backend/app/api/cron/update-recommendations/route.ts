import { NextRequest, NextResponse } from 'next/server'
import { RecommendationService } from '@/lib/recommendation-service'

/**
 * 定时任务：更新推荐的特色黑客松
 * 
 * 这个API可以被外部cron服务调用，例如：
 * - Vercel Cron
 * - GitHub Actions
 * - 外部cron服务
 * 
 * 建议调用频率：每天1-2次
 */
export async function POST(request: NextRequest) {
  try {
    // 简单的安全检查（可以使用更复杂的认证）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'hackx-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        success: false,
        error: '未授权的定时任务调用'
      }, { status: 401 })
    }

    console.log('🕐 开始执行定时推荐更新任务...')
    
    // 获取推荐的黑客松并更新featured标记
    const startTime = Date.now()
    const recommendations = await recommendationService.getRecommendedHackathons(3, true)
    const duration = Date.now() - startTime

    // 记录执行结果
    const result = {
      success: true,
      message: '定时推荐更新完成',
      data: {
        updatedCount: recommendations.length,
        duration: `${duration}ms`,
        recommendations: recommendations.map(h => ({
          id: h.id,
          title: h.title,
          score: h.score.toFixed(2)
        })),
        timestamp: new Date().toISOString(),
        nextRecommendedRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后
      }
    }

    console.log('✅ 定时推荐更新完成:', result.data)
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ 定时推荐更新失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '定时推荐更新失败',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * 获取定时任务状态
 */
export async function GET(request: NextRequest) {
  try {
    // 简单的状态检查
    const report = await recommendationService.getRecommendationReport()
    
    return NextResponse.json({
      success: true,
      data: {
        service: 'recommendation-cron',
        status: 'healthy',
        lastUpdate: new Date().toISOString(),
        summary: report.summary,
        weights: report.weights
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '服务不可用',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

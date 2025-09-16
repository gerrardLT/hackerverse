import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { RecommendationService } from '@/lib/recommendation-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取推荐内容
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'hot' // hot, personalized, tags
    const limit = parseInt(searchParams.get('limit') || '10')

    // 验证用户身份 (推荐功能需要登录)
    const authHeader = request.headers.get('authorization')
    let userId: string | undefined

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = AuthService.verifyToken(token)
      userId = decoded?.userId
    }

    let result: any

    switch (type) {
      case 'hot':
        // 热门推荐 (不需要登录)
        result = await RecommendationService.getHotPosts(userId, limit)
        break

      case 'personalized':
        // 个性化推荐 (需要登录)
        if (!userId) {
          return NextResponse.json(
            { error: '个性化推荐需要登录' },
            { status: 401 }
          )
        }
        result = await RecommendationService.getPersonalizedRecommendations(userId, limit)
        break

      case 'tags':
        // 热门标签
        result = await RecommendationService.getPopularTags(limit)
        break

      default:
        return NextResponse.json(
          { error: '无效的推荐类型' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        items: result,
        count: result.length
      }
    })

  } catch (error) {
    console.error('获取推荐内容错误:', error)
    return NextResponse.json(
      { error: '获取推荐内容失败' },
      { status: 500 }
    )
  }
}

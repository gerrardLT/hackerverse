import { NextRequest, NextResponse } from 'next/server'
import { RecommendationService } from '@/lib/recommendation-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取相关帖子推荐
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    const relatedPosts = await RecommendationService.getRelatedPosts(postId, limit)

    return NextResponse.json({
      success: true,
      data: {
        relatedPosts,
        count: relatedPosts.length
      }
    })

  } catch (error) {
    console.error('获取相关帖子错误:', error)
    return NextResponse.json(
      { error: '获取相关帖子失败' },
      { status: 500 }
    )
  }
}

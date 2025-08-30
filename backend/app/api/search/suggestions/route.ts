import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取热门搜索词和建议
 * GET /api/search/suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    console.log('🔍 获取搜索建议，查询词:', query)
    
    // 获取热门黑客松标签作为搜索建议
    const [popularTags, recentHackathons] = await Promise.all([
      // 从黑客松中提取最常用的标签
      prisma.hackathon.findMany({
        where: {
          isPublic: true,
          status: 'active'
        },
        select: {
          tags: true,
          categories: true
        },
        take: 50
      }),
      
      // 获取最近的黑客松标题作为搜索建议
      prisma.hackathon.findMany({
        where: {
          isPublic: true,
          startDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
          }
        },
        select: {
          title: true,
          tags: true
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])
    
    // 统计标签频率
    const tagFrequency: Record<string, number> = {}
    
    popularTags.forEach(hackathon => {
      // 处理tags数组
      if (Array.isArray(hackathon.tags)) {
        hackathon.tags.forEach(tag => {
          if (typeof tag === 'string') {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
          }
        })
      }
      
      // 处理categories数组
      if (Array.isArray(hackathon.categories)) {
        hackathon.categories.forEach(category => {
          if (typeof category === 'string') {
            tagFrequency[category] = (tagFrequency[category] || 0) + 1
          }
        })
      }
    })
    
    // 从最近黑客松中提取关键词
    recentHackathons.forEach(hackathon => {
      // 从标题中提取关键词
      const titleWords = hackathon.title.split(/\s+/).filter(word => 
        word.length > 2 && /^[a-zA-Z\u4e00-\u9fa5]+$/.test(word)
      )
      titleWords.forEach(word => {
        tagFrequency[word] = (tagFrequency[word] || 0) + 0.5 // 标题词权重较低
      })
      
      // 处理标签
      if (Array.isArray(hackathon.tags)) {
        hackathon.tags.forEach(tag => {
          if (typeof tag === 'string') {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
          }
        })
      }
    })
    
    // 排序并获取热门搜索词
    const sortedTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([tag]) => tag)
    
    // 如果数据库中标签不足，添加一些基础的Web3相关词汇
    const fallbackTags = ['Web3', 'DeFi', 'NFT', '区块链', 'AI', '智能合约', '元宇宙', 'GameFi', 'DAO', 'Layer2']
    const combinedTags = [...sortedTags, ...fallbackTags]
    const uniqueTags = Array.from(new Set(combinedTags))
    const popularSearches = uniqueTags.slice(0, 10)
    
    // 如果有查询词，提供相关建议
    let relatedSuggestions: string[] = []
    if (query.trim()) {
      relatedSuggestions = popularSearches.filter(tag => 
        tag.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(tag.toLowerCase())
      ).slice(0, 5)
    }
    
    const result = {
      popularSearches,
      relatedSuggestions,
      query: query.trim()
    }
    
    console.log('🔍 搜索建议生成成功:', result)
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('获取搜索建议错误:', error)
    
    // 发生错误时返回基础建议
    const fallbackData = {
      popularSearches: ['Web3', 'DeFi', 'NFT', '区块链', 'AI', '智能合约', '元宇宙', 'GameFi', 'DAO', 'Layer2'],
      relatedSuggestions: [],
      query: ''
    }
    
    return NextResponse.json({
      success: true,
      data: fallbackData,
      fallback: true
    })
  }
}
import { prisma } from './prisma'

export class RecommendationService {
  // 获取热门标签统计
  static async getPopularTags(limit: number = 20) {
    // 获取所有未删除的帖子的标签
    const posts = await prisma.communityPost.findMany({
      where: { isDeleted: false },
      select: { tags: true, likes: true, views: true, replies: true }
    })

    // 统计标签使用频率和权重
    const tagStats: Record<string, {
      count: number
      totalLikes: number
      totalViews: number
      totalReplies: number
      score: number
    }> = {}

    posts.forEach(post => {
      if (Array.isArray(post.tags)) {
        (post.tags as string[]).forEach((tag: string) => {
          if (!tagStats[tag]) {
            tagStats[tag] = {
              count: 0,
              totalLikes: 0,
              totalViews: 0,
              totalReplies: 0,
              score: 0
            }
          }
          
          tagStats[tag].count += 1
          tagStats[tag].totalLikes += post.likes
          tagStats[tag].totalViews += post.views
          tagStats[tag].totalReplies += post.replies
          
          // 计算标签热度得分 (使用频率 * 互动度)
          tagStats[tag].score = tagStats[tag].count * 
            (tagStats[tag].totalLikes * 3 + tagStats[tag].totalReplies * 2 + tagStats[tag].totalViews * 0.1)
        })
      }
    })

    // 按得分排序
    const sortedTags = Object.entries(tagStats)
      .map(([tag, stats]) => ({
        name: tag,
        count: stats.count,
        totalLikes: stats.totalLikes,
        totalViews: stats.totalViews,
        totalReplies: stats.totalReplies,
        score: Math.round(stats.score)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return sortedTags
  }

  // 获取热门帖子推荐
  static async getHotPosts(
    userId?: string,
    limit: number = 10,
    excludePostIds: string[] = []
  ) {
    const timeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天

    // 获取热门帖子 (基于点赞、回复、浏览量的综合得分)
    const posts = await prisma.communityPost.findMany({
      where: {
        isDeleted: false,
        id: { notIn: excludePostIds },
        createdAt: { gte: timeThreshold }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true
          }
        },
        _count: {
          select: {
            communityReplies: {
              where: { isDeleted: false }
            },
            postLikes: true,
            postBookmarks: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { likes: 'desc' },
        { replies: 'desc' },
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit * 2 // 取更多以便筛选
    })

    // 计算热度得分
    const scoredPosts = posts.map(post => {
      const ageInDays = Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const likesScore = post.likes * 10
      const repliesScore = post.replies * 15
      const viewsScore = post.views * 0.5
      const bookmarksScore = post._count.postBookmarks * 5
      const authorReputationScore = post.author.reputationScore * 0.1
      
      // 时间衰减因子 (越新的帖子得分越高)
      const timeDecay = Math.pow(0.8, ageInDays - 1)
      
      const hotScore = (likesScore + repliesScore + viewsScore + bookmarksScore + authorReputationScore) * timeDecay

      return {
        ...post,
        hotScore: Math.round(hotScore * 100) / 100
      }
    })

    // 按热度得分排序并返回指定数量
    return scoredPosts
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, limit)
      .map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        author: {
          id: post.author.id,
          name: post.author.username,
          username: post.author.username,
          avatar: post.author.avatarUrl,
          reputation: post.author.reputationScore
        },
        category: post.category,
        tags: post.tags,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        views: post.views,
        likes: post._count.postLikes,
        replies: post._count.communityReplies,
        bookmarks: post._count.postBookmarks,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        hotScore: post.hotScore
      }))
  }

  // 基于用户行为的个性化推荐
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ) {
    try {
      // 获取用户的行为数据
      const [userLikes, userBookmarks, userPosts, userFollowing] = await Promise.all([
        // 用户点赞的帖子
        prisma.postLike.findMany({
          where: { userId },
          include: {
            post: {
              select: { category: true, tags: true }
            }
          },
          take: 50,
          orderBy: { createdAt: 'desc' }
        }),
        // 用户收藏的帖子
        prisma.postBookmark.findMany({
          where: { userId },
          include: {
            post: {
              select: { category: true, tags: true }
            }
          },
          take: 50,
          orderBy: { createdAt: 'desc' }
        }),
        // 用户发布的帖子
        prisma.communityPost.findMany({
          where: { authorId: userId, isDeleted: false },
          select: { id: true, category: true, tags: true },
          take: 20,
          orderBy: { createdAt: 'desc' }
        }),
        // 用户关注的人
        prisma.userFollow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
          take: 100
        })
      ])

      // 分析用户兴趣
      const categoryInterests: Record<string, number> = {}
      const tagInterests: Record<string, number> = {}

      // 从点赞行为分析兴趣 (权重: 3)
      userLikes.forEach(like => {
        categoryInterests[like.post.category] = (categoryInterests[like.post.category] || 0) + 3
        if (Array.isArray(like.post.tags)) {
          (like.post.tags as string[]).forEach((tag: string) => {
            tagInterests[tag] = (tagInterests[tag] || 0) + 3
          })
        }
      })

      // 从收藏行为分析兴趣 (权重: 5)
      userBookmarks.forEach(bookmark => {
        categoryInterests[bookmark.post.category] = (categoryInterests[bookmark.post.category] || 0) + 5
        if (Array.isArray(bookmark.post.tags)) {
          (bookmark.post.tags as string[]).forEach((tag: string) => {
            tagInterests[tag] = (tagInterests[tag] || 0) + 5
          })
        }
      })

      // 从发帖行为分析兴趣 (权重: 2)
      userPosts.forEach(post => {
        categoryInterests[post.category] = (categoryInterests[post.category] || 0) + 2
        if (Array.isArray(post.tags)) {
          (post.tags as string[]).forEach((tag: string) => {
            tagInterests[tag] = (tagInterests[tag] || 0) + 2
          })
        }
      })

      // 获取用户已经互动过的帖子ID (避免重复推荐)
      const interactedPostIds = [
        ...userLikes.map(like => like.postId),
        ...userBookmarks.map(bookmark => bookmark.postId),
        ...userPosts.map(post => post.id)
      ].filter(Boolean)

      // 基于兴趣推荐帖子
      const timeThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天

      const candidates = await prisma.communityPost.findMany({
        where: {
          isDeleted: false,
          id: { notIn: interactedPostIds },
          createdAt: { gte: timeThreshold },
          OR: [
            // 匹配感兴趣的分类
            { category: { in: Object.keys(categoryInterests) } },
            // 匹配感兴趣的标签
            ...(Object.keys(tagInterests).length > 0 ? [{
              tags: {
                array_contains: Object.keys(tagInterests)
              }
            }] : []),
            // 关注用户的帖子
            ...(userFollowing.length > 0 ? [{
              authorId: { in: userFollowing.map(f => f.followingId) }
            }] : [])
          ]
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputationScore: true
            }
          },
          _count: {
            select: {
              communityReplies: {
                where: { isDeleted: false }
              },
              postLikes: true,
              postBookmarks: true
            }
          }
        },
        take: limit * 3,
        orderBy: [
          { likes: 'desc' },
          { replies: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // 计算推荐得分
      const scoredCandidates = candidates.map(post => {
        let recommendationScore = 0

        // 分类匹配得分
        if (categoryInterests[post.category]) {
          recommendationScore += categoryInterests[post.category] * 10
        }

        // 标签匹配得分
        if (Array.isArray(post.tags)) {
          (post.tags as string[]).forEach((tag: string) => {
            if (tagInterests[tag]) {
              recommendationScore += tagInterests[tag] * 5
            }
          })
        }

        // 关注用户加分
        if (userFollowing.some(f => f.followingId === post.authorId)) {
          recommendationScore += 50
        }

        // 帖子质量得分
        const qualityScore = post.likes * 2 + post.replies * 3 + post.views * 0.1 + post._count.postBookmarks * 4

        // 时间衰减
        const ageInDays = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        const timeDecay = Math.pow(0.9, ageInDays)

        const finalScore = (recommendationScore + qualityScore) * timeDecay

        return {
          ...post,
          recommendationScore: Math.round(finalScore * 100) / 100
        }
      })

      // 按推荐得分排序并返回
      return scoredCandidates
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
        .map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author.id,
            name: post.author.username,
            username: post.author.username,
            avatar: post.author.avatarUrl,
            reputation: post.author.reputationScore
          },
          category: post.category,
          tags: post.tags,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          views: post.views,
          likes: post._count.postLikes,
          replies: post._count.communityReplies,
          bookmarks: post._count.postBookmarks,
          isPinned: post.isPinned,
          isLocked: post.isLocked,
          recommendationScore: post.recommendationScore
        }))

    } catch (error) {
      console.error('个性化推荐错误:', error)
      // 降级到热门推荐
      return this.getHotPosts(userId, limit)
    }
  }

  // 获取相关帖子推荐
  static async getRelatedPosts(
    postId: string,
    limit: number = 5
  ) {
    try {
      // 获取当前帖子信息
      const currentPost = await prisma.communityPost.findUnique({
        where: { id: postId },
        select: { category: true, tags: true, authorId: true }
      })

      if (!currentPost) {
        return []
      }

      // 查找相关帖子
      const relatedPosts = await prisma.communityPost.findMany({
        where: {
          isDeleted: false,
          id: { not: postId },
          OR: [
            // 同分类
            { category: currentPost.category },
            // 同作者的其他帖子
            { authorId: currentPost.authorId },
            // 相同标签
            ...(Array.isArray(currentPost.tags) && currentPost.tags.length > 0 ? [{
              tags: {
                array_contains: currentPost.tags
              }
            }] : [])
          ]
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputationScore: true
            }
          },
          _count: {
            select: {
              communityReplies: {
                where: { isDeleted: false }
              },
              postLikes: true,
              postBookmarks: true
            }
          }
        },
        take: limit * 2,
        orderBy: [
          { likes: 'desc' },
          { views: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // 计算相关性得分
      const scoredPosts = relatedPosts.map(post => {
        let relevanceScore = 0

        // 同分类加分
        if (post.category === currentPost.category) {
          relevanceScore += 30
        }

        // 同作者加分
        if (post.authorId === currentPost.authorId) {
          relevanceScore += 20
        }

        // 标签匹配加分
        if (Array.isArray(currentPost.tags) && Array.isArray(post.tags)) {
          const commonTags = (currentPost.tags as string[]).filter(tag => (post.tags as string[]).includes(tag))
          relevanceScore += commonTags.length * 15
        }

        // 质量得分
        const qualityScore = post.likes * 2 + post.replies * 2 + post.views * 0.1

        return {
          ...post,
          relevanceScore: relevanceScore + qualityScore
        }
      })

      return scoredPosts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        .map(post => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          author: {
            id: post.author.id,
            name: post.author.username,
            username: post.author.username,
            avatar: post.author.avatarUrl,
            reputation: post.author.reputationScore
          },
          category: post.category,
          tags: post.tags,
          createdAt: post.createdAt.toISOString(),
          views: post.views,
          likes: post._count.postLikes,
          replies: post._count.communityReplies,
          relevanceScore: post.relevanceScore
        }))

    } catch (error) {
      console.error('获取相关帖子错误:', error)
      return []
    }
  }

  // ============ 黑客松推荐功能 ============
  
  // 获取推荐的特色黑客松
  static async getRecommendedHackathons(limit: number = 3, forceRefresh: boolean = false) {
    const candidates = await this.getCandidateHackathons()
    if (candidates.length === 0) return []

    const scored = await this.calculateHackathonScores(candidates)
    const recommended = scored.sort((a, b) => b.score - a.score).slice(0, limit)

    if (forceRefresh) {
      await this.updateFeaturedFlags(recommended.map(h => h.id))
    }

    const full = await this.getFullHackathonData(recommended.map(h => h.id))
    return full.map((hackathon, idx) => ({
      ...hackathon,
      score: recommended[idx].score,
      metrics: recommended[idx].metrics,
      rawData: recommended[idx].rawData,
    }))
  }

  // 获取完整的黑客松数据
  private static async getFullHackathonData(hackathonIds: string[]) {
    return await prisma.hackathon.findMany({
      where: { id: { in: hackathonIds } },
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
        organizer: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { participations: true, projects: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })
  }

  // 获取候选黑客松
  private static async getCandidateHackathons() {
    const now = new Date()
    return await prisma.hackathon.findMany({
      where: {
        isPublic: true,
        status: 'ACTIVE',
        OR: [
          { endDate: { gt: now } },
          { endDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        organizer: { select: { id: true, username: true, reputationScore: true } },
        _count: { select: { participations: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // 计算黑客松推荐分数
  private static async calculateHackathonScores(hackathons: any[]) {
    const maxValues = this.calculateMaxValues(hackathons)
    return hackathons.map(h => {
      const metrics = this.calculateMetrics(h, maxValues)
      const score = this.calculateFinalScore(metrics)
      return {
        id: h.id,
        title: h.title,
        score,
        metrics,
        rawData: {
          prizePool: h.prizePool || 0,
          participationCount: h._count.participations,
          daysSinceCreated: Math.floor((Date.now() - h.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          categories: h.categories || [],
          organizerHackathons: 1,
        },
      }
    })
  }

  // 计算最大值用于归一化
  private static calculateMaxValues(hackathons: any[]) {
    return {
      maxPrizePool: Math.max(...hackathons.map(h => h.prizePool || 0), 1),
      maxParticipation: Math.max(...hackathons.map(h => h._count.participations), 1),
      maxDaysOld: Math.max(...hackathons.map(h => Math.floor((Date.now() - h.createdAt.getTime()) / (1000 * 60 * 60 * 24))), 1),
      maxCategories: Math.max(...hackathons.map(h => (h.categories || []).length), 1),
    }
  }

  // 计算各项指标分数
  private static calculateMetrics(h: any, max: any) {
    const weights = {
      prizePool: 0.3,
      participation: 0.25,
      recentness: 0.2,
      diversity: 0.15,
      reputation: 0.1,
    }

    const prizePool = h.prizePool || 0
    const participationCount = h._count.participations
    const daysSinceCreated = Math.floor((Date.now() - h.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const categoriesCount = (h.categories || []).length
    const organizerReputation = h.organizer?.reputationScore || 0

    return {
      prizePoolScore: Math.min((prizePool / max.maxPrizePool) * 100, 100),
      participationScore: Math.min((participationCount / max.maxParticipation) * 100, 100),
      recentnessScore: Math.max(100 - (daysSinceCreated / max.maxDaysOld) * 100, 0),
      categoryDiversityScore: Math.min((categoriesCount / max.maxCategories) * 100, 100),
      organizerReputationScore: Math.min(organizerReputation / 10, 100),
      weights
    }
  }

  // 计算最终推荐分数
  private static calculateFinalScore(metrics: any) {
    const { weights } = metrics
    return (
      metrics.prizePoolScore * weights.prizePool +
      metrics.participationScore * weights.participation +
      metrics.recentnessScore * weights.recentness +
      metrics.categoryDiversityScore * weights.diversity +
      metrics.organizerReputationScore * weights.reputation
    )
  }

  // 更新特色标记
  private static async updateFeaturedFlags(recommendedIds: string[]) {
    await prisma.hackathon.updateMany({ where: { featured: true }, data: { featured: false } })
    if (recommendedIds.length > 0) {
      await prisma.hackathon.updateMany({ where: { id: { in: recommendedIds } }, data: { featured: true } })
    }
  }

  // 获取推荐算法报告
  static async getRecommendationReport() {
    const candidates = await this.getCandidateHackathons()
    const scored = await this.calculateHackathonScores(candidates)
    const recommended = scored.sort((a, b) => b.score - a.score).slice(0, 5)
    
    return {
      summary: {
        totalCandidates: candidates.length,
        averageScore: scored.length ? scored.reduce((s, h) => s + h.score, 0) / scored.length : 0,
        topScore: recommended[0]?.score || 0,
        lowestScore: scored.length ? scored[scored.length - 1]?.score || 0 : 0,
      },
      details: scored.sort((a, b) => b.score - a.score),
      weights: {
        prizePool: 0.3,
        participation: 0.25,
        recentness: 0.2,
        diversity: 0.15,
        reputation: 0.1,
      }
    }
  }

  // 更新推荐权重配置
  static updateWeights(newWeights: any) {
    // 这里可以实现权重更新逻辑
    console.log('权重已更新:', newWeights)
  }
}
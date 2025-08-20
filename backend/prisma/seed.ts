import { PrismaClient } from '@prisma/client'
import { AuthService } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 清理现有数据
  await prisma.score.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.project.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.participation.deleteMany()
  await prisma.hackathon.deleteMany()
  await prisma.user.deleteMany()

  console.log('清理完成，开始创建测试数据...')

  // 创建测试用户
  const hashedPassword = await AuthService.hashPassword('password123')

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@hackx.com',
        username: 'admin',
        password: hashedPassword,
        walletAddress: '0x1234567890123456789012345678901234567890',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        bio: 'HackX平台管理员，专注于区块链和Web3技术',
        reputationScore: 100,
        emailVerified: true,
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          teamInvites: true,
          projectUpdates: true,
          hackathonReminders: true,
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showWalletAddress: true,
        },
        preferences: {
          theme: 'system',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        username: 'alice_dev',
        password: hashedPassword,
        walletAddress: '0x2345678901234567890123456789012345678901',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        bio: '全栈开发者，热爱开源项目',
        reputationScore: 85,
        emailVerified: true,
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          teamInvites: true,
          projectUpdates: true,
          hackathonReminders: true,
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showWalletAddress: true,
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        username: 'bob_web3',
        password: hashedPassword,
        walletAddress: '0x3456789012345678901234567890123456789012',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        bio: 'Web3开发者，专注于DeFi和NFT项目',
        reputationScore: 92,
        emailVerified: true,
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: false,
          teamInvites: true,
          projectUpdates: true,
          hackathonReminders: true,
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showWalletAddress: true,
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'carol@example.com',
        username: 'carol_ui',
        password: hashedPassword,
        walletAddress: '0x4567890123456789012345678901234567890123',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        bio: 'UI/UX设计师，专注于用户体验设计',
        reputationScore: 78,
        emailVerified: true,
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          teamInvites: true,
          projectUpdates: true,
          hackathonReminders: false,
        },
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showWalletAddress: false,
        }
      }
    })
  ])

  console.log(`创建了 ${users.length} 个用户`)

  // 创建测试黑客松
  const hackathons = await Promise.all([
    prisma.hackathon.create({
      data: {
        title: 'Web3 创新黑客松 2024',
        description: '探索Web3技术的无限可能，构建下一代去中心化应用。本次黑客松将聚焦于DeFi、NFT、DAO等热门领域，为开发者提供展示才华的平台。',
        startDate: new Date('2024-03-15T09:00:00Z'),
        endDate: new Date('2024-03-17T18:00:00Z'),
        registrationDeadline: new Date('2024-03-10T23:59:59Z'),
        maxParticipants: 200,
        prizePool: 50000,
        categories: ['DeFi', 'NFT', 'DAO', 'GameFi'],
        tags: ['Web3', '区块链', '智能合约', '去中心化'],
        requirements: '参赛者需要具备基本的区块链开发知识，熟悉Solidity或Rust编程语言。',
        rules: '1. 项目必须是原创作品\n2. 必须使用区块链技术\n3. 代码必须开源\n4. 团队人数不超过5人',
        isPublic: true,
        featured: true,
        organizerId: users[0].id,
      }
    }),
    prisma.hackathon.create({
      data: {
        title: 'AI + 区块链融合挑战赛',
        description: '将人工智能与区块链技术相结合，创造具有实际应用价值的创新项目。探索AI在区块链中的应用，以及区块链如何赋能AI发展。',
        startDate: new Date('2024-04-20T09:00:00Z'),
        endDate: new Date('2024-04-22T18:00:00Z'),
        registrationDeadline: new Date('2024-04-15T23:59:59Z'),
        maxParticipants: 150,
        prizePool: 30000,
        categories: ['AI', '区块链', '机器学习', '数据科学'],
        tags: ['人工智能', '机器学习', '区块链', '数据隐私'],
        requirements: '需要具备AI/ML和区块链开发经验，熟悉Python、TensorFlow、Solidity等工具。',
        rules: '1. 项目必须结合AI和区块链技术\n2. 提供完整的技术文档\n3. 演示实际效果\n4. 考虑隐私保护',
        isPublic: true,
        featured: true,
        organizerId: users[0].id,
      }
    }),
    prisma.hackathon.create({
      data: {
        title: '可持续发展技术马拉松',
        description: '利用技术解决环境和社会问题，推动可持续发展。从清洁能源到循环经济，从碳减排到社会包容，用创新技术改变世界。',
        startDate: new Date('2024-05-10T09:00:00Z'),
        endDate: new Date('2024-05-12T18:00:00Z'),
        registrationDeadline: new Date('2024-05-05T23:59:59Z'),
        maxParticipants: 100,
        prizePool: 20000,
        categories: ['可持续发展', '清洁能源', '环境保护', '社会影响'],
        tags: ['绿色技术', '环保', '社会创新', '可持续发展'],
        requirements: '项目必须具有明确的环境或社会影响，提供可量化的效果评估。',
        rules: '1. 项目必须解决实际问题\n2. 提供环境影响评估\n3. 考虑可扩展性\n4. 注重社会价值',
        isPublic: true,
        featured: false,
        organizerId: users[1].id,
      }
    })
  ])

  console.log(`创建了 ${hackathons.length} 个黑客松`)

  // 创建用户报名记录
  const participations = await Promise.all([
    prisma.participation.create({
      data: {
        hackathonId: hackathons[0].id,
        userId: users[1].id,
        status: 'registered',
        joinedAt: new Date('2024-02-15T10:00:00Z'),
      }
    }),
    prisma.participation.create({
      data: {
        hackathonId: hackathons[0].id,
        userId: users[2].id,
        status: 'registered',
        joinedAt: new Date('2024-02-16T14:30:00Z'),
      }
    }),
    prisma.participation.create({
      data: {
        hackathonId: hackathons[0].id,
        userId: users[3].id,
        status: 'registered',
        joinedAt: new Date('2024-02-17T09:15:00Z'),
      }
    }),
    prisma.participation.create({
      data: {
        hackathonId: hackathons[1].id,
        userId: users[1].id,
        status: 'registered',
        joinedAt: new Date('2024-03-20T11:00:00Z'),
      }
    }),
    prisma.participation.create({
      data: {
        hackathonId: hackathons[1].id,
        userId: users[2].id,
        status: 'registered',
        joinedAt: new Date('2024-03-21T16:45:00Z'),
      }
    })
  ])

  console.log(`创建了 ${participations.length} 个报名记录`)

  // 创建测试团队
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Web3 Warriors',
        description: '专注于Web3技术开发的精英团队，拥有丰富的DeFi和NFT项目经验。',
        hackathonId: hackathons[0].id,
        maxMembers: 5,
        skills: ['Solidity', 'React', 'Node.js', 'Web3.js'],
        tags: ['DeFi', 'NFT', '前端开发', '智能合约'],
        isPublic: true,
        leaderId: users[1].id,
        members: {
          create: [
            {
              userId: users[1].id,
              role: 'leader',
              joinedAt: new Date('2024-02-20T10:00:00Z'),
            },
            {
              userId: users[2].id,
              role: 'member',
              joinedAt: new Date('2024-02-21T14:30:00Z'),
            },
            {
              userId: users[3].id,
              role: 'member',
              joinedAt: new Date('2024-02-22T09:15:00Z'),
            }
          ]
        }
      }
    }),
    prisma.team.create({
      data: {
        name: 'AI Blockchain Pioneers',
        description: '探索AI与区块链融合的前沿团队，致力于构建智能化的去中心化应用。',
        hackathonId: hackathons[1].id,
        maxMembers: 4,
        skills: ['Python', 'TensorFlow', 'Solidity', 'Machine Learning'],
        tags: ['AI', '区块链', '机器学习', '数据科学'],
        isPublic: true,
        leaderId: users[2].id,
        members: {
          create: [
            {
              userId: users[2].id,
              role: 'leader',
              joinedAt: new Date('2024-03-25T10:00:00Z'),
            },
            {
              userId: users[1].id,
              role: 'member',
              joinedAt: new Date('2024-03-26T14:30:00Z'),
            }
          ]
        }
      }
    })
  ])

  console.log(`创建了 ${teams.length} 个团队`)

  // 创建测试项目
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: 'DeFi Yield Optimizer',
        description: '一个智能的DeFi收益优化平台，自动分析各种DeFi协议的风险和收益，为用户提供最优的投资策略。',
        hackathonId: hackathons[0].id,
        teamId: teams[0].id,
        creatorId: users[1].id,
        technologies: ['Solidity', 'React', 'Node.js', 'Web3.js'],
        tags: ['DeFi', '收益优化', '智能合约', '风险管理'],
        githubUrl: 'https://github.com/example/defi-yield-optimizer',
        demoUrl: 'https://demo.example.com/defi-yield-optimizer',
        videoUrl: 'https://youtube.com/watch?v=example',
        presentationUrl: 'https://slides.example.com/defi-yield-optimizer',
        ipfsHash: 'QmExampleHash123456789',
        status: 'submitted',
        isPublic: true,
      }
    }),
    prisma.project.create({
      data: {
        title: 'AI-Powered NFT Marketplace',
        description: '基于AI技术的NFT交易平台，提供智能推荐、价格预测和内容审核功能。',
        hackathonId: hackathons[1].id,
        teamId: teams[1].id,
        creatorId: users[2].id,
        technologies: ['Python', 'TensorFlow', 'Solidity', 'React'],
        tags: ['AI', 'NFT', '机器学习', '推荐系统'],
        githubUrl: 'https://github.com/example/ai-nft-marketplace',
        demoUrl: 'https://demo.example.com/ai-nft-marketplace',
        videoUrl: 'https://youtube.com/watch?v=example2',
        presentationUrl: 'https://slides.example.com/ai-nft-marketplace',
        ipfsHash: 'QmExampleHash987654321',
        status: 'submitted',
        isPublic: true,
      }
    })
  ])

  console.log(`创建了 ${projects.length} 个项目`)

  // 创建测试评委
  const judges = await Promise.all([
    prisma.judge.create({
      data: {
        hackathonId: hackathons[0].id,
        userId: users[0].id,
        role: 'main',
        expertise: ['DeFi', '智能合约', 'Web3'],
        assignedProjects: [projects[0].id],
        createdAt: new Date('2024-03-15T09:00:00Z'),
      }
    }),
    prisma.judge.create({
      data: {
        hackathonId: hackathons[1].id,
        userId: users[0].id,
        role: 'main',
        expertise: ['AI', '机器学习', '区块链'],
        assignedProjects: [projects[1].id],
        createdAt: new Date('2024-04-20T09:00:00Z'),
      }
    })
  ])

  console.log(`创建了 ${judges.length} 个评委`)

  // 创建测试评分和反馈
  const scores = await Promise.all([
    prisma.score.create({
      data: {
        projectId: projects[0].id,
        judgeId: judges[0].id,
        innovation: 8.5,
        technicalComplexity: 9.0,
        userExperience: 8.0,
        businessPotential: 8.5,
        presentation: 8.0,
        totalScore: 42.0,
        comments: '技术实现非常出色，DeFi收益优化是一个很有前景的方向。建议在风险控制方面进一步加强。',
        createdAt: new Date('2024-03-17T16:00:00Z'),
      }
    }),
    prisma.score.create({
      data: {
        projectId: projects[1].id,
        judgeId: judges[1].id,
        innovation: 9.0,
        technicalComplexity: 9.5,
        userExperience: 8.5,
        businessPotential: 9.0,
        presentation: 8.5,
        totalScore: 44.5,
        comments: 'AI与NFT的结合非常有创意，技术实现也很扎实。推荐系统算法设计合理，有很好的商业前景。',
        createdAt: new Date('2024-04-22T16:00:00Z'),
      }
    })
  ])

  console.log(`创建了 ${scores.length} 个评分记录`)

  // 创建测试反馈
  const feedbacks = await Promise.all([
    prisma.feedback.create({
      data: {
        projectId: projects[0].id,
        userId: users[2].id,
        rating: 5,
        comment: '这个项目解决了DeFi用户的实际痛点，界面设计也很友好。希望能看到更多风险控制功能。',
        createdAt: new Date('2024-03-18T10:00:00Z'),
      }
    }),
    prisma.feedback.create({
      data: {
        projectId: projects[1].id,
        userId: users[1].id,
        rating: 5,
        comment: 'AI推荐功能很智能，用户体验流畅。建议增加更多的AI分析维度。',
        createdAt: new Date('2024-04-23T14:30:00Z'),
      }
    })
  ])

  console.log(`创建了 ${feedbacks.length} 个反馈记录`)

  console.log('数据库初始化完成！')
  console.log('\n测试账户信息:')
  console.log('管理员: admin@hackx.com / password123')
  console.log('开发者: alice@example.com / password123')
  console.log('Web3开发者: bob@example.com / password123')
  console.log('设计师: carol@example.com / password123')
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
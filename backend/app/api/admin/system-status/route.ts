import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      );
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    // 获取系统统计信息
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      totalHackathons,
      activeHackathons,
      completedHackathons,
      draftHackathons,
      totalProjects,
      submittedProjects,
      draftProjects,
      totalStakers,
      totalNFTs,
      totalProposals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'suspended' } }),
      prisma.user.count({ where: { status: 'banned' } }),
      prisma.hackathon.count(),
      prisma.hackathon.count({ where: { status: 'active' } }),
      prisma.hackathon.count({ where: { status: 'completed' } }),
      prisma.hackathon.count({ where: { status: 'draft' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'submitted' } }),
      prisma.project.count({ where: { status: 'draft' } }),
      prisma.staking.count(),
      prisma.nFT.count(),
      prisma.dAOProposal.count()
    ]);

    // 获取质押统计
    const stakingStats = await prisma.staking.aggregate({
      _sum: {
        stakedAmount: true,
        rewards: true
      }
    });

    // 模拟系统状态信息
    const systemStatus = {
      database: {
        status: 'healthy',
        connections: Math.floor(Math.random() * 20) + 10, // 模拟连接数
        uptime: '7 days'
      },
      ipfs: {
        status: 'connected',
        gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io',
        pinnedFiles: totalProjects + totalNFTs // 模拟文件数
      },
      web3: {
        status: 'connected',
        provider: process.env.WEB3_PROVIDER_URL || 'https://mainnet.infura.io',
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000 // 模拟区块号
      },
      system: {
        uptime: '15 days',
        memoryUsage: `${Math.floor(Math.random() * 30) + 50}%`, // 模拟内存使用
        cpuUsage: `${Math.floor(Math.random() * 40) + 30}%` // 模拟CPU使用
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          banned: bannedUsers
        },
        hackathons: {
          total: totalHackathons,
          active: activeHackathons,
          completed: completedHackathons,
          draft: draftHackathons
        },
        projects: {
          total: totalProjects,
          submitted: submittedProjects,
          draft: draftProjects
        },
        web3: {
          totalStakers,
          totalStakedAmount: Number(stakingStats._sum.stakedAmount || 0),
          totalRewards: Number(stakingStats._sum.rewards || 0),
          totalNFTs,
          totalProposals
        },
        system: systemStatus
      }
    });

  } catch (error) {
    console.error('获取系统状态错误:', error);
    return NextResponse.json(
      { success: false, error: '获取系统状态失败' },
      { status: 500 }
    );
  }
} 
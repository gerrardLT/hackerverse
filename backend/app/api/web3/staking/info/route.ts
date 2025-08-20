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

    // 获取用户的质押信息
    const staking = await prisma.staking.findUnique({
      where: { userId: user.id }
    });

    // 获取总体质押统计
    const [totalStakers, totalStakedAmount, totalRewards] = await Promise.all([
      prisma.staking.count(),
      prisma.staking.aggregate({
        _sum: { stakedAmount: true }
      }),
      prisma.staking.aggregate({
        _sum: { rewards: true }
      })
    ]);

    const stakedAmount = staking ? Number(staking.stakedAmount) : 0;
    const rewards = staking ? Number(staking.rewards) : 0;
    const apy = staking ? Number(staking.apy) : 12.5;
    const lastRewardTime = staking?.lastRewardTime || new Date();

    return NextResponse.json({
      success: true,
      data: {
        stakedAmount,
        rewards,
        apy,
        lastRewardTime,
        totalStakers,
        totalStakedAmount: Number(totalStakedAmount._sum.stakedAmount || 0),
        totalRewards: Number(totalRewards._sum.rewards || 0)
      }
    });

  } catch (error) {
    console.error('获取质押信息错误:', error);
    return NextResponse.json(
      { success: false, error: '获取质押信息失败' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      );
    }

    // 检查用户是否有质押记录
    const staking = await prisma.staking.findUnique({
      where: { userId: user.id }
    });

    if (!staking) {
      return NextResponse.json(
        { success: false, error: '您没有质押记录' },
        { status: 404 }
      );
    }

    const currentRewards = Number(staking.rewards);
    if (currentRewards <= 0) {
      return NextResponse.json(
        { success: false, error: '没有可领取的奖励' },
        { status: 400 }
      );
    }

    // 更新质押记录，清零奖励
    const updatedStaking = await prisma.staking.update({
      where: { userId: user.id },
      data: {
        rewards: 0,
        lastRewardTime: new Date()
      }
    });

    // 创建领取奖励交易记录
    const transaction = await prisma.stakingTransaction.create({
      data: {
        stakingId: staking.id,
        userId: user.id,
        type: 'claim_rewards',
        amount: currentRewards,
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      message: '奖励领取成功',
      data: {
        transactionId: transaction.id,
        claimedAmount: currentRewards,
        newRewards: 0,
        txHash: transaction.txHash
      }
    });

  } catch (error) {
    console.error('领取奖励错误:', error);
    return NextResponse.json(
      { success: false, error: '领取奖励失败' },
      { status: 500 }
    );
  }
} 
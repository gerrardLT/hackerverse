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

    // 计算投票权（基于质押金额和声誉分数）
    let votingPower = 0;
    let stakedAmount = 0;

    if (staking) {
      stakedAmount = Number(staking.stakedAmount);
      // 每1000代币质押 = 1投票权
      votingPower += Math.floor(stakedAmount / 1000);
    }

    // 声誉分数也影响投票权（每10分声誉 = 1投票权）
    votingPower += Math.floor(user.reputationScore / 10);

    // 确保最小投票权为1
    votingPower = Math.max(1, votingPower);

    return NextResponse.json({
      success: true,
      data: {
        votingPower,
        stakedAmount,
        reputationScore: user.reputationScore
      }
    });

  } catch (error) {
    console.error('获取投票权错误:', error);
    return NextResponse.json(
      { success: false, error: '获取投票权失败' },
      { status: 500 }
    );
  }
} 
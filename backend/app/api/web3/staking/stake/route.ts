import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const stakeSchema = z.object({
  amount: z.number().positive()
});

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

    // 验证请求体
    const body = await request.json();
    const { amount } = stakeSchema.parse(body);

    // 检查用户是否已有质押记录
    let staking = await prisma.staking.findUnique({
      where: { userId: user.id }
    });

    if (!staking) {
      // 创建新的质押记录
      staking = await prisma.staking.create({
        data: {
          userId: user.id,
          stakedAmount: amount,
          rewards: 0,
          apy: 12.5
        }
      });
    } else {
      // 更新现有质押记录
      staking = await prisma.staking.update({
        where: { userId: user.id },
        data: {
          stakedAmount: {
            increment: amount
          }
        }
      });
    }

    // 创建质押交易记录
    const transaction = await prisma.stakingTransaction.create({
      data: {
        stakingId: staking.id,
        userId: user.id,
        type: 'stake',
        amount,
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      message: '质押成功',
      data: {
        transactionId: transaction.id,
        amount,
        newStakedAmount: Number(staking.stakedAmount),
        txHash: transaction.txHash
      }
    });

  } catch (error) {
    console.error('质押错误:', error);
    return NextResponse.json(
      { success: false, error: '质押失败' },
      { status: 500 }
    );
  }
} 
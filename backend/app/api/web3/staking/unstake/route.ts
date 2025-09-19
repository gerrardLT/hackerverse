import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const unstakeSchema = z.object({
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
    const { amount } = unstakeSchema.parse(body);

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

    const currentStakedAmount = Number(staking.stakedAmount);
    if (currentStakedAmount < amount) {
      return NextResponse.json(
        { success: false, error: '质押金额不足' },
        { status: 400 }
      );
    }

    // 更新质押记录
    const updatedStaking = await prisma.staking.update({
      where: { userId: user.id },
      data: {
        stakedAmount: {
          decrement: amount
        }
      }
    });

    // 创建解除质押交易记录
    const transaction = await prisma.stakingTransaction.create({
      data: {
        stakingId: staking.id,
        userId: user.id,
        type: 'unstake',
        amount,
        status: 'CONFIRMED'
      }
    });

    return NextResponse.json({
      success: true,
      message: '解除质押成功',
      data: {
        transactionId: transaction.id,
        amount,
        newStakedAmount: Number(updatedStaking.stakedAmount),
        txHash: transaction.txHash
      }
    });

  } catch (error) {
    console.error('解除质押错误:', error);
    return NextResponse.json(
      { success: false, error: '解除质押失败' },
      { status: 500 }
    );
  }
} 
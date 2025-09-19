import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const voteSchema = z.object({
  vote: z.enum(['for', 'against']),
  votingPower: z.number().min(1)
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { vote, votingPower } = voteSchema.parse(body);

    // 检查提案是否存在
    const proposal = await prisma.dAOProposal.findUnique({
      where: { id: params.id }
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: '提案不存在' },
        { status: 404 }
      );
    }

    // 检查提案状态
    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: '提案已结束投票' },
        { status: 400 }
      );
    }

    // 检查是否已经投票
    const existingVote = await prisma.dAOVote.findUnique({
      where: {
        proposalId_userId: {
          proposalId: params.id,
          userId: user.id
        }
      }
    });

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: '您已经对此提案投过票' },
        { status: 409 }
      );
    }

    // 创建投票记录
    const voteRecord = await prisma.dAOVote.create({
      data: {
        proposalId: params.id,
        userId: user.id,
        vote,
        votingPower
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    // 更新提案投票统计
    const updateData: any = {};
    if (vote === 'for') {
      updateData.forVotes = { increment: votingPower };
    } else {
      updateData.againstVotes = { increment: votingPower };
    }

    await prisma.dAOProposal.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: '投票成功',
      data: {
        proposalId: params.id,
        vote,
        votingPower,
        ipfsHash: voteRecord.ipfsHash
      }
    });

  } catch (error) {
    console.error('DAO投票错误:', error);
    return NextResponse.json(
      { success: false, error: '投票失败' },
      { status: 500 }
    );
  }
} 
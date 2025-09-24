import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const proposalSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  proposalType: z.enum(['TREASURY', 'GOVERNANCE', 'PROTOCOL', 'EMERGENCY']),
  targetAmount: z.number().optional(),
  executionTime: z.string().datetime()
});

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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // 构建查询条件
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.proposalType = type;
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 获取提案列表
    const [proposals, total] = await Promise.all([
      prisma.dAOProposal.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dAOProposal.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        proposals,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('获取DAO提案列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取提案列表失败' },
      { status: 500 }
    );
  }
}

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
    const { title, description, proposalType, targetAmount, executionTime } = proposalSchema.parse(body);

    // 检查用户是否有足够的质押（至少1000代币）
    const minStakingRequired = 1000;
    const userStaking = await prisma.staking.findUnique({
      where: { userId: user.id }
    });

    if (!userStaking || Number(userStaking.stakedAmount) < minStakingRequired) {
      return NextResponse.json(
        { success: false, error: '需要至少质押1000代币才能创建提案' },
        { status: 400 }
      );
    }

    // 创建提案
    const proposal = await prisma.dAOProposal.create({
      data: {
        title,
        description,
        proposalType,
        targetAmount: targetAmount || null,
        executionTime: new Date(executionTime),
        votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天后到期
        creatorId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: '提案创建成功',
      data: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        ipfsHash: proposal.ipfsHash,
        createdAt: proposal.createdAt
      }
    });

  } catch (error) {
    console.error('创建DAO提案错误:', error);
    return NextResponse.json(
      { success: false, error: '创建提案失败' },
      { status: 500 }
    );
  }
} 
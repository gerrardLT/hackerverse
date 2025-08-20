import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // 检查用户权限（只有管理员或提案创建者可以执行）
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    // 检查提案是否存在
    const proposal = await prisma.dAOProposal.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: '提案不存在' },
        { status: 404 }
      );
    }

    // 检查提案状态
    if (proposal.status !== 'passed') {
      return NextResponse.json(
        { success: false, error: '提案未通过，无法执行' },
        { status: 400 }
      );
    }

    // 检查执行时间
    if (new Date() < proposal.executionTime) {
      return NextResponse.json(
        { success: false, error: '提案执行时间未到' },
        { status: 400 }
      );
    }

    // 更新提案状态为已执行
    const updatedProposal = await prisma.dAOProposal.update({
      where: { id: params.id },
      data: {
        status: 'executed'
      }
    });

    return NextResponse.json({
      success: true,
      message: '提案执行成功',
      data: {
        proposalId: params.id,
        status: 'executed',
        executedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('DAO提案执行错误:', error);
    return NextResponse.json(
      { success: false, error: '提案执行失败' },
      { status: 500 }
    );
  }
} 
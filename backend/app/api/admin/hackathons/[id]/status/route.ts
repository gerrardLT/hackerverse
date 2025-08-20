import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['draft', 'active', 'completed'])
});

export async function PUT(
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

    // 检查管理员权限
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    // 验证请求体
    const body = await request.json();
    const { status } = statusSchema.parse(body);

    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.id }
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: '黑客松不存在' },
        { status: 404 }
      );
    }

    // 更新黑客松状态
    const updatedHackathon = await prisma.hackathon.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json({
      success: true,
      message: '黑客松状态更新成功',
      data: {
        hackathonId: params.id,
        newStatus: status
      }
    });

  } catch (error) {
    console.error('更新黑客松状态错误:', error);
    return NextResponse.json(
      { success: false, error: '更新黑客松状态失败' },
      { status: 500 }
    );
  }
} 
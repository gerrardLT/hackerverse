import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned'])
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

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 不能修改自己的状态
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { success: false, error: '不能修改自己的状态' },
        { status: 400 }
      );
    }

    // 更新用户状态
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json({
      success: true,
      message: '用户状态更新成功',
      data: {
        userId: params.id,
        newStatus: status
      }
    });

  } catch (error) {
    console.error('更新用户状态错误:', error);
    return NextResponse.json(
      { success: false, error: '更新用户状态失败' },
      { status: 500 }
    );
  }
} 
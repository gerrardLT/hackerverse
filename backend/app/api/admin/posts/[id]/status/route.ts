import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const statusSchema = z.object({
  isDeleted: z.boolean()
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
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    // 验证请求体
    const body = await request.json();
    const { isDeleted } = statusSchema.parse(body);

    // 检查帖子是否存在
    const post = await prisma.communityPost.findUnique({
      where: { id: params.id }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '帖子不存在' },
        { status: 404 }
      );
    }

    // 更新帖子状态
    const updatedPost = await prisma.communityPost.update({
      where: { id: params.id },
      data: { isDeleted }
    });

    return NextResponse.json({
      success: true,
      message: '帖子状态更新成功',
      data: {
        postId: params.id,
        isDeleted
      }
    });

  } catch (error) {
    console.error('更新帖子状态错误:', error);
    return NextResponse.json(
      { success: false, error: '更新帖子状态失败' },
      { status: 500 }
    );
  }
} 
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

    // 检查管理员权限
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // draft, active, completed
    const featured = searchParams.get('featured'); // true, false

    // 构建查询条件
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (featured !== null) {
      where.featured = featured === 'true';
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 获取黑客松列表
    const [hackathons, total] = await Promise.all([
      prisma.hackathon.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              participations: true,
              projects: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.hackathon.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        hackathons,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('获取管理员黑客松列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取黑客松列表失败' },
      { status: 500 }
    );
  }
} 
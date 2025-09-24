import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  reason: z.string().optional(), // 状态变更原因
  notes: z.string().optional()   // 备注
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
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    // 验证请求体
    const body = await request.json();
    const { status, reason, notes } = statusSchema.parse(body);

    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        registrationStartDate: true,
        registrationDeadline: true,
        maxParticipants: true,
        prizePool: true,
        categories: true,
        tags: true,
        requirements: true,
        rules: true,
        isPublic: true,
        featured: true,
        status: true,
        organizerId: true,
        ipfsHash: true,
        metadata: true,
        prizes: true,
        tracks: true,
        createdAt: true,
        updatedAt: true,
        contractId: true,
        syncStatus: true,
        txHash: true,
        // 排除 BigInt 字段: blockNumber, gasUsed
        reviewStatus: true,
        reviewerId: true,
        reviewNotes: true,
        reviewedAt: true,
        rejectionReason: true,
        submittedForReviewAt: true,
        organizer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: '黑客松不存在' },
        { status: 404 }
      );
    }

    // 获取请求IP和User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 在事务中更新状态并记录日志
    const result = await prisma.$transaction(async (tx) => {
      // 更新黑客松状态
      const updatedHackathon = await tx.hackathon.update({
        where: { id: params.id },
        data: { 
          status,
          reviewNotes: notes || hackathon.reviewNotes,
          reviewedAt: ['APPROVED', 'REJECTED'].includes(status) ? new Date() : hackathon.reviewedAt,
          submittedForReviewAt: status === 'PENDING_REVIEW' ? new Date() : hackathon.submittedForReviewAt
        }
      });

      // 如果状态变更涉及审核，创建审核记录
      if (['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(status) && status !== hackathon.status) {
        await tx.hackathonReview.create({
          data: {
            hackathonId: params.id,
            reviewerId: user.id,
            action: status === 'PENDING_REVIEW' ? 'submit' : (status === 'APPROVED' ? 'approve' : 'reject'),
            status: status === 'PENDING_REVIEW' ? 'pending' : (status === 'APPROVED' ? 'approved' : 'rejected'),
            feedback: notes,
            rejectionReason: status === 'REJECTED' ? reason : undefined,
            priority: 'normal',
            ipAddress,
            userAgent,
            metadata: {
              originalStatus: hackathon.status,
              newStatus: status,
              changeType: 'status_update',
              reason
            }
          }
        });
      }

      // 记录管理员操作日志
      if ((tx as any).adminAction) {
        await (tx as any).adminAction.create({
          data: {
            adminId: user.id,
            action: 'hackathon_status_change',
            targetType: 'hackathon',
            targetId: params.id,
            targetTitle: hackathon.title,
            details: {
              originalStatus: hackathon.status,
              newStatus: status,
              reason,
              notes,
              organizerId: hackathon.organizerId
            },
            ipAddress,
            userAgent,
            reason: reason || `Changed status from ${hackathon.status} to ${status}`
          }
        });
      }

      return updatedHackathon;
    });

    return NextResponse.json({
      success: true,
      message: '黑客松状态更新成功',
      data: {
        hackathonId: params.id,
        oldStatus: hackathon.status,
        newStatus: status,
        reason,
        notes
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
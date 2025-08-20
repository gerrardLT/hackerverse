import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const mintNFTSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  category: z.enum(['certificate', 'achievement', 'collectible']),
  metadata: z.record(z.any()).optional()
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
    const category = searchParams.get('category');

    // 构建查询条件
    const where: any = {
      ownerId: user.id
    };
    if (category) {
      where.category = category;
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 获取NFT列表
    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.nFT.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        nfts,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('获取NFT列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取NFT列表失败' },
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
    const { name, description, imageUrl, category, metadata } = mintNFTSchema.parse(body);

    // 获取下一个tokenId
    const lastNFT = await prisma.nFT.findFirst({
      orderBy: { tokenId: 'desc' }
    });

    const nextTokenId = (lastNFT?.tokenId || 0) + 1;

    // 创建NFT
    const nft = await prisma.nFT.create({
      data: {
        tokenId: nextTokenId,
        name,
        description,
        imageUrl,
        category,
        metadata: metadata || {},
        ownerId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'NFT铸造成功',
      data: {
        id: nft.id,
        tokenId: nft.tokenId,
        name: nft.name,
        ipfsHash: nft.ipfsHash,
        mintTime: nft.mintTime
      }
    });

  } catch (error) {
    console.error('铸造NFT错误:', error);
    return NextResponse.json(
      { success: false, error: '铸造NFT失败' },
      { status: 500 }
    );
  }
} 
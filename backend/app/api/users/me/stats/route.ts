import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function OPTIONS() {
	return NextResponse.json(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,OPTIONS',
			'Access-Control-Allow-Headers': 'Authorization, Content-Type',
		},
	})
}

export async function GET(request: NextRequest) {
	try {
		const user = await auth(request)
		if (!user) {
			return NextResponse.json({ success: false, error: '未认证' }, { status: 401 })
		}

		const [participatedHackathons, submittedProjects, wonPrizes, recentActivities] = await Promise.all([
			prisma.participation.count({ where: { userId: user.id } }),
			prisma.project.count({
				where: {
					OR: [
						{ creatorId: user.id },
						{ team: { members: { some: { userId: user.id } } } },
					],
				},
			}),
			prisma.project.count({
				where: {
					OR: [
						{ creatorId: user.id },
						{ team: { members: { some: { userId: user.id } } } },
					],
					status: 'WINNER', // 修正为正确的项目状态字段
				},
			}),
			// 获取最近活动 - 改用 Prisma 查询而不是原始 SQL
			prisma.participation.findMany({
				where: { userId: user.id },
				include: {
					hackathon: {
						select: { title: true }
					}
				},
				orderBy: { joinedAt: 'desc' },
				take: 5
			}).then(participations => 
				participations.map(p => ({
					type: 'hackathon_joined',
					title: '参加了黑客松',
					description: `加入了 ${p.hackathon.title}`,
					date: p.joinedAt,
					hackathon_name: p.hackathon.title
				}))
			)
		])

		const reputationScore = Math.min(1000, participatedHackathons * 50 + submittedProjects * 100 + wonPrizes * 200)

		return NextResponse.json({
			success: true,
			data: {
				stats: { participatedHackathons, submittedProjects, wonPrizes, reputationScore },
				recentActivities: recentActivities.map((activity, index) => ({
					id: String(index + 1),
					type: activity.type,
					title: activity.title,
					description: activity.description,
					date: activity.date,
					hackathonName: activity.hackathon_name,
				})),
			},
		})
	} catch (error) {
		console.error('获取用户统计数据错误:', error)
		return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 })
	}
}

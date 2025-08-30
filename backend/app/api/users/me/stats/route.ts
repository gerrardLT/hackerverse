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
					status: 'completed',
					finalScore: { gte: 80 },
				},
			}),
			prisma.$queryRawUnsafe<any[]>(
				`SELECT 'hackathon_joined' AS type, h.title AS hackathon_name, p."joinedAt" AS date, '参加了黑客松' AS title, CONCAT('加入了 ', h.title) AS description
				FROM hackathon_schema.participations p
				JOIN hackathon_schema.hackathons h ON p."hackathonId" = h.id
				WHERE p."userId" = $1
				UNION ALL
				SELECT 'project_submitted' AS type, h.title AS hackathon_name, pr."createdAt" AS date, '提交了项目' AS title, CONCAT('在 ', h.title, ' 中提交了 ', pr.title, ' 项目') AS description
				FROM hackathon_schema.projects pr
				JOIN hackathon_schema.hackathons h ON pr."hackathonId" = h.id
				WHERE pr."creatorId" = $1
				UNION ALL
				SELECT 'prize_won' AS type, h.title AS hackathon_name, pr."updatedAt" AS date, '获得奖项' AS title,
				CONCAT('在 ', h.title, ' 中获得第 ', CASE WHEN pr."finalScore" >= 95 THEN '1' WHEN pr."finalScore" >= 90 THEN '2' WHEN pr."finalScore" >= 85 THEN '3' ELSE '优秀' END, ' 名') AS description
				FROM hackathon_schema.projects pr
				JOIN hackathon_schema.hackathons h ON pr."hackathonId" = h.id
				WHERE pr."creatorId" = $1 AND pr.status = 'completed' AND pr."finalScore" >= 80
				ORDER BY date DESC
				LIMIT 10`,
				user.id,
			),
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

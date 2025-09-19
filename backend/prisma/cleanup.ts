import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 开始清理数据库数据...')

  try {
    // 按照外键依赖顺序删除数据，避免约束冲突
    console.log('📋 删除评分和反馈数据...')
    await prisma.score.deleteMany()
    await prisma.feedback.deleteMany()
    await prisma.projectLike.deleteMany()

    console.log('📝 删除DAO相关数据...')
    await prisma.dAOVote.deleteMany()
    await prisma.multiSigProposal.deleteMany()
    await prisma.dAOProposal.deleteMany()

    console.log('💰 删除质押和交易数据...')
    await prisma.stakingTransaction.deleteMany()
    await prisma.staking.deleteMany()

    console.log('🏆 删除NFT和激励数据...')
    await prisma.nFT.deleteMany()
    await prisma.communityIncentive.deleteMany()
    await prisma.reputationRecord.deleteMany()

    console.log('🔔 删除通知数据...')
    await prisma.notification.deleteMany()
    await prisma.communityNotification.deleteMany()

    console.log('💬 删除社区相关数据...')
    await prisma.postLike.deleteMany()
    await prisma.replyLike.deleteMany()
    await prisma.postBookmark.deleteMany()
    await prisma.userFollow.deleteMany()
    await prisma.communityReply.deleteMany()
    await prisma.communityPost.deleteMany()

    console.log('🏗️ 删除项目数据...')
    await prisma.project.deleteMany()

    console.log('👥 删除团队相关数据...')
    await prisma.teamMember.deleteMany()
    await prisma.teamApplication.deleteMany()
    await prisma.team.deleteMany()

    console.log('🎯 删除黑客松相关数据...')
    await prisma.participation.deleteMany()
    await prisma.judge.deleteMany()
    await prisma.hackathon.deleteMany()

    console.log('🔐 删除认证和隐私数据...')
    await prisma.votingDelegation.deleteMany()
    await prisma.dIDCredential.deleteMany()
    await prisma.privateVote.deleteMany()
    await prisma.crossChainSupport.deleteMany()

    console.log('👤 删除用户数据...')
    await prisma.user.deleteMany()

    console.log('✅ 数据库清理完成！所有数据已被删除。')
    
    // 获取各表的记录数量来验证清理结果
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.hackathon.count(),
      prisma.project.count(),
      prisma.team.count(),
      prisma.participation.count(),
      prisma.communityPost.count(),
      prisma.notification.count()
    ])

    console.log('\n📊 清理验证结果:')
    console.log(`用户数: ${counts[0]}`)
    console.log(`黑客松数: ${counts[1]}`)
    console.log(`项目数: ${counts[2]}`)
    console.log(`团队数: ${counts[3]}`)
    console.log(`参与记录数: ${counts[4]}`)
    console.log(`社区帖子数: ${counts[5]}`)
    console.log(`通知数: ${counts[6]}`)
    
    const totalRecords = counts.reduce((sum, count) => sum + count, 0)
    console.log(`\n总记录数: ${totalRecords}`)
    
    if (totalRecords === 0) {
      console.log('🎉 数据库已完全清空！')
    } else {
      console.log('⚠️ 仍有部分数据残留，请检查...')
    }

  } catch (error) {
    console.error('❌ 数据库清理失败:', error)
    throw error
  }
}

cleanup()
  .catch((e) => {
    console.error('清理过程中出现错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

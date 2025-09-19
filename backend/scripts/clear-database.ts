import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('🗑️ 开始清理数据库...')
  
  try {
    // 按依赖关系顺序删除数据
    console.log('删除评分记录...')
    await prisma.score.deleteMany()
    
    console.log('删除反馈记录...')
    await prisma.feedback.deleteMany()
    
    console.log('删除项目...')
    await prisma.project.deleteMany()
    
    console.log('删除团队成员...')
    await prisma.teamMember.deleteMany()
    
    console.log('删除团队...')
    await prisma.team.deleteMany()
    
    console.log('删除评委记录...')
    await prisma.judge.deleteMany()
    
    console.log('删除参与记录...')
    await prisma.participation.deleteMany()
    
    console.log('删除黑客松...')
    await prisma.hackathon.deleteMany()
    
    console.log('删除用户...')
    await prisma.user.deleteMany()
    
    console.log('✅ 数据库清理完成!')
    
  } catch (error) {
    console.error('❌ 清理失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase()

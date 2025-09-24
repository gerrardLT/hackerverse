#!/usr/bin/env npx tsx

import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

// 自动修复API中的中文硬编码

const API_DIR = 'app/api'

// 中文硬编码映射到i18n键
const CHINESE_TO_I18N: Record<string, string> = {
  // 通用错误
  '获取项目列表失败': 'projects.getListError',
  '创建项目失败': 'projects.createError', 
  '项目不存在': 'projects.notFound',
  '获取团队列表失败': 'teams.getListError',
  '创建团队失败': 'teams.createError',
  '团队不存在': 'teams.notFound',
  '获取黑客松列表失败': 'hackathons.getListError',
  '创建黑客松失败': 'hackathons.createError',
  '黑客松不存在': 'hackathons.notFound',
  '未认证': 'auth.unauthorized',
  '未提供认证token': 'auth.unauthorized',
  '无效的认证token': 'auth.tokenInvalid',
  '用户不存在': 'auth.userNotFound',
  '权限不足': 'auth.insufficientPermissions',
  '需要管理员权限': 'auth.adminRequired',
  '未授权访问': 'auth.unauthorized',
  '无效的令牌': 'auth.tokenInvalid',
  // 验证错误
  '请求数据验证失败': 'validation.requestDataValidationFailed',
  // 特定业务错误  
  'IPFS上传失败，无法创建项目': 'ipfs.uploadFailedProject',
  'IPFS上传失败，无法创建黑客松': 'ipfs.uploadFailedHackathon',
  '团队已满员': 'teams.teamFull',
  '您已经是该团队成员': 'teams.alreadyMember',
  '只有队长可以修改团队信息': 'teams.onlyLeaderCanModify',
  '只有团队领导可以审批申请': 'teams.onlyLeaderCanReview',
  '申请已被处理': 'teams.applicationAlreadyProcessed',
  '申请不存在': 'teams.applicationNotFound',
  '邀请不存在或已处理': 'teams.invitationNotFoundOrProcessed',
  '您已经报名参加该黑客松': 'hackathons.alreadyJoined',
  '报名尚未开始': 'hackathons.registrationNotStarted',
  '报名已截止': 'hackathons.registrationClosed',
  '参与人数已达上限': 'hackathons.participantLimitReached',
  '该黑客松为私有活动': 'hackathons.privateEvent',
  '创建者不能参加自己创建的黑客松': 'hackathons.creatorCannotJoin',
  '您未报名参加该黑客松': 'hackathons.notRegistered',
  '帖子不存在': 'community.postNotFound',
  '帖子已锁定，无法回复': 'community.postLocked',
  '回复不存在': 'community.replyNotFound',
  '无权限编辑此帖子': 'community.noEditPermission',
  '无权限删除此帖子': 'community.noDeletePermission',
  '无权限编辑此回复': 'community.noEditReplyPermission',
  '无权限删除此回复': 'community.noDeleteReplyPermission',
}

// 查找所有API文件
async function findApiFiles(): Promise<string[]> {
  return await glob(`${API_DIR}/**/*.ts`)
}

// 修复单个文件
async function fixFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8')
    let hasChanges = false
    
    // 检查是否已导入i18n
    if (!content.includes("from '@/lib/i18n'")) {
      // 在第一个导入后添加i18n导入
      const importMatch = content.match(/^import .+ from .+$/m)
      if (importMatch) {
        const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length
        content = content.slice(0, insertPos) + 
          "\nimport { t, getLocaleFromRequest } from '@/lib/i18n'" +
          content.slice(insertPos)
        hasChanges = true
      }
    }
    
    // 替换中文硬编码
    for (const [chinese, i18nKey] of Object.entries(CHINESE_TO_I18N)) {
      const regex = new RegExp(`(['"])(${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\1`, 'g')
      if (regex.test(content)) {
        content = content.replace(regex, `t('${i18nKey}', getLocaleFromRequest(request))`)
        hasChanges = true
        console.log(`✅ Fixed: "${chinese}" -> t('${i18nKey}') in ${filePath}`)
      }
    }
    
    if (hasChanges) {
      await fs.writeFile(filePath, content, 'utf-8')
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error)
    return false
  }
}

// 主函数
async function main() {
  try {
    console.log('🔍 Finding API files...')
    const files = await findApiFiles()
    console.log(`📁 Found ${files.length} API files`)
    
    let fixedCount = 0
    for (const file of files) {
      const wasFixed = await fixFile(file)
      if (wasFixed) {
        fixedCount++
      }
    }
    
    console.log(`\n🎉 Completed! Fixed ${fixedCount} files`)
    
    if (fixedCount > 0) {
      console.log('\n⚠️  Please verify the changes and ensure error handling works correctly.')
      console.log('💡 You may need to add locale parameter extraction in some functions.')
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

main()

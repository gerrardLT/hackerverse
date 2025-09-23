#!/usr/bin/env node

/**
 * 国际化文件拆分和合并脚本
 * 用于将大的 i18n JSON 文件拆分成模块，或将模块合并成单一文件
 */

const fs = require('fs');
const path = require('path');

// 文件路径配置
const MESSAGES_DIR = path.join(__dirname, '../frontend/messages');
const MODULES_DIR = path.join(MESSAGES_DIR, 'modules');
const LANGUAGES = ['zh', 'en'];

// 模块定义（按优先级和大小排序）
const MODULES = [
  'common',        // ~100 lines - 通用词汇
  'navigation',    // ~20 lines - 导航
  'auth',          // ~130 lines - 认证
  'web3',          // ~80 lines - Web3功能 
  'ui',            // ~50 lines - UI组件
  'footer',        // ~40 lines - 页脚
  'hackathons',    // ~800 lines - 黑客松
  'teams',         // ~600 lines - 团队
  'projects',      // ~450 lines - 项目
  'community',     // ~300 lines - 社区
  'dashboard',     // ~400 lines - 仪表板
  'admin',         // ~400 lines - 管理员
  'notifications', // ~20 lines - 通知
  'judging',       // ~200 lines - 评审
  'analytics',     // ~100 lines - 分析
  'credentials',   // ~100 lines - 凭证
  'reputation',    // ~100 lines - 声誉
  'leaderboard',   // ~80 lines - 排行榜
  'home',          // ~200 lines - 首页
  'other'          // ~200 lines - 其他（错误、枚举等）
];

/**
 * 检查目录是否存在，不存在则创建
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

/**
 * 创建模块文件夹结构
 */
function createModuleStructure() {
  console.log('📁 Creating module structure...');
  
  ensureDir(MODULES_DIR);
  
  LANGUAGES.forEach(lang => {
    const langDir = path.join(MODULES_DIR, lang);
    ensureDir(langDir);
    
    MODULES.forEach(module => {
      const moduleFile = path.join(langDir, `${module}.json`);
      if (!fs.existsSync(moduleFile)) {
        // 创建空的模块文件
        fs.writeFileSync(moduleFile, '{}', 'utf8');
        console.log(`📄 Created: ${moduleFile}`);
      }
    });
  });
}

/**
 * 从原始文件中提取模块内容
 */
function extractModuleContent(originalData, moduleName) {
  const moduleContent = {};
  
  // 根据模块名提取对应的内容
  switch (moduleName) {
    case 'common':
      if (originalData.common) {
        return originalData.common;
      }
      break;
    
    case 'navigation':
      if (originalData.navigation) {
        return originalData.navigation;
      }
      break;
    
    case 'auth':
      if (originalData.auth) {
        return originalData.auth;
      }
      break;
    
    case 'web3':
      if (originalData.web3) {
        return originalData.web3;
      }
      break;
    
    case 'ui':
      if (originalData.ui) {
        return originalData.ui;
      }
      break;
      
    case 'footer':
      if (originalData.footer) {
        return originalData.footer;
      }
      break;
    
    case 'hackathons':
      if (originalData.hackathons) {
        return originalData.hackathons;
      }
      break;
    
    case 'teams':
      if (originalData.teams) {
        return originalData.teams;
      }
      break;
    
    case 'projects':
      if (originalData.projects) {
        return originalData.projects;
      }
      break;
    
    case 'community':
      if (originalData.community) {
        return originalData.community;
      }
      break;
    
    case 'dashboard':
      if (originalData.dashboard) {
        return originalData.dashboard;
      }
      break;
    
    case 'admin':
      if (originalData.admin) {
        return originalData.admin;
      }
      break;
    
    case 'notifications':
      if (originalData.notifications) {
        return originalData.notifications;
      }
      break;
      
    case 'judging':
      if (originalData.judging) {
        return originalData.judging;
      }
      break;
      
    case 'analytics':
      if (originalData.analytics) {
        return originalData.analytics;
      }
      break;
      
    case 'credentials':
      if (originalData.credentials) {
        return originalData.credentials;
      }
      break;
      
    case 'reputation':
      if (originalData.reputation) {
        return originalData.reputation;
      }
      break;
      
    case 'leaderboard':
      if (originalData.leaderboard) {
        return originalData.leaderboard;
      }
      break;
      
    case 'home':
      if (originalData.home) {
        return originalData.home;
      }
      break;
    
    case 'other':
      // 收集其他未分类的内容
      const usedKeys = [
        'common', 'navigation', 'auth', 'web3', 'ui', 'footer',
        'hackathons', 'teams', 'projects', 'community', 'dashboard',
        'admin', 'notifications', 'judging', 'analytics', 'credentials',
        'reputation', 'leaderboard', 'home'
      ];
      
      Object.keys(originalData).forEach(key => {
        if (!usedKeys.includes(key)) {
          moduleContent[key] = originalData[key];
        }
      });
      
      return moduleContent;
    
    default:
      return {};
  }
  
  return moduleContent;
}

/**
 * 执行文件拆分
 */
function splitFiles() {
  console.log('✂️  Starting file splitting...');
  
  LANGUAGES.forEach(lang => {
    console.log(`\n📋 Processing ${lang.toUpperCase()} files...`);
    
    const originalFile = path.join(MESSAGES_DIR, `${lang}.json`);
    
    if (!fs.existsSync(originalFile)) {
      console.log(`❌ Original file not found: ${originalFile}`);
      return;
    }
    
    // 读取原始文件
    const originalContent = fs.readFileSync(originalFile, 'utf8');
    const originalData = JSON.parse(originalContent);
    
    // 为每个模块创建文件
    MODULES.forEach(module => {
      const moduleFile = path.join(MODULES_DIR, lang, `${module}.json`);
      const moduleContent = extractModuleContent(originalData, module);
      
      if (Object.keys(moduleContent).length > 0) {
        fs.writeFileSync(
          moduleFile, 
          JSON.stringify(moduleContent, null, 2),
          'utf8'
        );
        
        const lines = JSON.stringify(moduleContent, null, 2).split('\n').length;
        console.log(`📄 ${module}.json - ${lines} lines`);
      }
    });
  });
}

/**
 * 合并模块文件为单一文件
 */
function mergeFiles() {
  console.log('🔗 Starting file merging...');
  
  LANGUAGES.forEach(lang => {
    console.log(`\n📋 Merging ${lang.toUpperCase()} files...`);
    
    const mergedData = {};
    let totalLines = 0;
    
    MODULES.forEach(module => {
      const moduleFile = path.join(MODULES_DIR, lang, `${module}.json`);
      
      if (fs.existsSync(moduleFile)) {
        const moduleContent = fs.readFileSync(moduleFile, 'utf8');
        const moduleData = JSON.parse(moduleContent);
        
        if (module === 'other') {
          // other 模块的内容直接合并到根级别
          Object.assign(mergedData, moduleData);
        } else {
          // 其他模块作为顶级键
          if (Object.keys(moduleData).length > 0) {
            mergedData[module] = moduleData;
          }
        }
        
        const lines = moduleContent.split('\n').length;
        totalLines += lines;
      }
    });
    
    // 写入合并后的文件
    const outputFile = path.join(MESSAGES_DIR, `${lang}-merged.json`);
    fs.writeFileSync(
      outputFile,
      JSON.stringify(mergedData, null, 2),
      'utf8'
    );
    
    console.log(`✅ Generated: ${outputFile} (${totalLines} total module lines)`);
  });
}

/**
 * 统计文件信息
 */
function showStats() {
  console.log('\n📊 File Statistics:');
  console.log('═'.repeat(50));
  
  LANGUAGES.forEach(lang => {
    console.log(`\n${lang.toUpperCase()} Language:`);
    
    const originalFile = path.join(MESSAGES_DIR, `${lang}.json`);
    if (fs.existsSync(originalFile)) {
      const originalLines = fs.readFileSync(originalFile, 'utf8').split('\n').length;
      console.log(`📄 Original: ${originalLines} lines`);
    }
    
    let totalModuleLines = 0;
    MODULES.forEach(module => {
      const moduleFile = path.join(MODULES_DIR, lang, `${module}.json`);
      if (fs.existsSync(moduleFile)) {
        const moduleLines = fs.readFileSync(moduleFile, 'utf8').split('\n').length;
        totalModuleLines += moduleLines;
        if (moduleLines > 4) { // 只显示非空模块
          console.log(`  📄 ${module}: ${moduleLines} lines`);
        }
      }
    });
    
    console.log(`🔢 Total modules: ${totalModuleLines} lines`);
  });
}

/**
 * 主函数
 */
function main() {
  const command = process.argv[2] || 'help';
  
  console.log('🌐 I18n Module Manager');
  console.log('═'.repeat(50));
  
  switch (command) {
    case 'init':
      console.log('🚀 Initializing module structure...');
      createModuleStructure();
      break;
    
    case 'split':
      console.log('✂️  Splitting files into modules...');
      createModuleStructure();
      splitFiles();
      showStats();
      break;
    
    case 'merge':
      console.log('🔗 Merging modules into single files...');
      mergeFiles();
      showStats();
      break;
    
    case 'stats':
      showStats();
      break;
    
    case 'help':
    default:
      console.log(`
Usage: node scripts/split-i18n.js <command>

Commands:
  init    Initialize module structure (create folders and empty files)
  split   Split large i18n files into modules  
  merge   Merge modules back into single files
  stats   Show file statistics
  help    Show this help message

Examples:
  node scripts/split-i18n.js init
  node scripts/split-i18n.js split
  node scripts/split-i18n.js merge
  node scripts/split-i18n.js stats
`);
      break;
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  createModuleStructure,
  splitFiles,
  mergeFiles,
  showStats
};

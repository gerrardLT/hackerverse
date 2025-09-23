#!/usr/bin/env node

/**
 * 国际化模块合并脚本
 * 将拆分的模块文件合并为单一的 i18n JSON 文件
 */

const fs = require('fs');
const path = require('path');

// 配置
const FRONTEND_DIR = path.join(__dirname, '../frontend');
const MESSAGES_DIR = path.join(FRONTEND_DIR, 'messages');
const MODULES_DIR = path.join(MESSAGES_DIR, 'modules');

console.log('🔗 I18n Module Merger');
console.log('════════════════════════');

/**
 * 合并指定语言的模块文件
 */
function mergeLanguage(lang) {
  console.log(`\n📋 Merging ${lang.toUpperCase()} modules...`);
  
  const langDir = path.join(MODULES_DIR, lang);
  
  if (!fs.existsSync(langDir)) {
    console.log(`❌ Language directory not found: ${langDir}`);
    return null;
  }
  
  const mergedData = {};
  const moduleFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Found ${moduleFiles.length} module files`);
  
  let totalLines = 0;
  let moduleCount = 0;
  
  moduleFiles.forEach(file => {
    const moduleName = path.basename(file, '.json');
    const moduleFile = path.join(langDir, file);
    
    try {
      const moduleContent = fs.readFileSync(moduleFile, 'utf8');
      const moduleData = JSON.parse(moduleContent);
      
      if (Object.keys(moduleData).length > 0) {
        mergedData[moduleName] = moduleData;
        
        const lines = moduleContent.split('\n').length;
        totalLines += lines;
        moduleCount++;
        
        console.log(`  ✅ ${moduleName} - ${lines} lines`);
      } else {
        console.log(`  ⚠️  ${moduleName} - empty module`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${moduleName} - error: ${error.message}`);
    }
  });
  
  console.log(`🔢 Merged ${moduleCount} modules, ${totalLines} total lines`);
  return mergedData;
}

/**
 * 主合并函数
 */
function merge() {
  const languages = ['zh', 'en'];
  
  languages.forEach(lang => {
    const mergedData = mergeLanguage(lang);
    
    if (mergedData) {
      // 写入合并文件
      const outputFile = path.join(MESSAGES_DIR, `${lang}.json`);
      const backupFile = path.join(MESSAGES_DIR, `${lang}-backup.json`);
      
      // 创建备份
      if (fs.existsSync(outputFile)) {
        fs.copyFileSync(outputFile, backupFile);
        console.log(`📋 Created backup: ${lang}-backup.json`);
      }
      
      // 写入新文件
      fs.writeFileSync(
        outputFile,
        JSON.stringify(mergedData, null, 2),
        'utf8'
      );
      
      const finalLines = JSON.stringify(mergedData, null, 2).split('\n').length;
      console.log(`✅ Generated: ${lang}.json (${finalLines} lines)`);
    }
  });
}

/**
 * 验证合并结果
 */
function validate() {
  console.log('\n✅ Validating merged files...');
  
  ['zh', 'en'].forEach(lang => {
    const file = path.join(MESSAGES_DIR, `${lang}.json`);
    
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
        
        const lines = content.split('\n').length;
        const keys = Object.keys(JSON.parse(content)).length;
        
        console.log(`✅ ${lang}.json - Valid JSON, ${lines} lines, ${keys} modules`);
        
      } catch (error) {
        console.log(`❌ ${lang}.json - Invalid JSON: ${error.message}`);
      }
    } else {
      console.log(`❌ ${lang}.json - File not found`);
    }
  });
}

/**
 * 清理备份文件
 */
function cleanup() {
  console.log('\n🧹 Cleaning up backup files...');
  
  ['zh-backup.json', 'en-backup.json'].forEach(backup => {
    const backupFile = path.join(MESSAGES_DIR, backup);
    if (fs.existsSync(backupFile)) {
      fs.unlinkSync(backupFile);
      console.log(`🗑️  Removed: ${backup}`);
    }
  });
}

/**
 * 主函数
 */
function main() {
  const command = process.argv[2] || 'merge';
  
  switch (command) {
    case 'merge':
      console.log('🔗 Merging module files...');
      merge();
      validate();
      break;
      
    case 'validate':
      validate();
      break;
      
    case 'cleanup':
      cleanup();
      break;
      
    case 'help':
    default:
      console.log(`
Usage: node scripts/merge-i18n.js <command>

Commands:
  merge     Merge module files into single files (default)
  validate  Validate merged files
  cleanup   Remove backup files
  help      Show this help message

Examples:
  node scripts/merge-i18n.js
  node scripts/merge-i18n.js merge
  node scripts/merge-i18n.js validate
`);
      break;
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { merge, validate, cleanup };

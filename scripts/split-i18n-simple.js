#!/usr/bin/env node

/**
 * 简化版本的国际化文件拆分脚本
 */

const fs = require('fs');
const path = require('path');

// 配置
const FRONTEND_DIR = path.join(__dirname, '../frontend');
const MESSAGES_DIR = path.join(FRONTEND_DIR, 'messages');
const MODULES_DIR = path.join(MESSAGES_DIR, 'modules');

console.log('🌐 I18n File Splitter - Simple Version');
console.log('════════════════════════════════════════');
console.log(`📁 Frontend dir: ${FRONTEND_DIR}`);
console.log(`📁 Messages dir: ${MESSAGES_DIR}`);
console.log(`📁 Modules dir: ${MODULES_DIR}`);

// 检查目录
function checkDirectories() {
  console.log('\n🔍 Checking directories...');
  console.log(`Frontend exists: ${fs.existsSync(FRONTEND_DIR)}`);
  console.log(`Messages exists: ${fs.existsSync(MESSAGES_DIR)}`);
  console.log(`Modules exists: ${fs.existsSync(MODULES_DIR)}`);
}

// 读取并解析原始文件
function loadOriginalFiles() {
  console.log('\n📖 Loading original files...');
  
  const files = {};
  
  // 读取中文文件
  const zhFile = path.join(MESSAGES_DIR, 'zh.json');
  if (fs.existsSync(zhFile)) {
    try {
      const zhContent = fs.readFileSync(zhFile, 'utf8');
      files.zh = JSON.parse(zhContent);
      console.log(`✅ Loaded zh.json (${Object.keys(files.zh).length} top-level keys)`);
    } catch (error) {
      console.error(`❌ Error loading zh.json: ${error.message}`);
    }
  } else {
    console.log(`❌ zh.json not found at: ${zhFile}`);
  }
  
  // 读取英文文件
  const enFile = path.join(MESSAGES_DIR, 'en.json');
  if (fs.existsSync(enFile)) {
    try {
      const enContent = fs.readFileSync(enFile, 'utf8');
      files.en = JSON.parse(enContent);
      console.log(`✅ Loaded en.json (${Object.keys(files.en).length} top-level keys)`);
    } catch (error) {
      console.error(`❌ Error loading en.json: ${error.message}`);
    }
  } else {
    console.log(`❌ en.json not found at: ${enFile}`);
  }
  
  return files;
}

// 创建模块文件
function createModuleFiles(files) {
  console.log('\n✂️  Creating module files...');
  
  Object.keys(files).forEach(lang => {
    const langDir = path.join(MODULES_DIR, lang);
    
    // 确保语言目录存在
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
      console.log(`📁 Created directory: ${langDir}`);
    }
    
    const data = files[lang];
    const keys = Object.keys(data);
    console.log(`\n📋 Processing ${lang} (${keys.length} modules):`);
    
    let totalLines = 0;
    
    keys.forEach(key => {
      const moduleFile = path.join(langDir, `${key}.json`);
      const moduleContent = JSON.stringify(data[key], null, 2);
      
      fs.writeFileSync(moduleFile, moduleContent, 'utf8');
      
      const lines = moduleContent.split('\n').length;
      totalLines += lines;
      
      console.log(`  📄 ${key}.json - ${lines} lines`);
    });
    
    console.log(`🔢 Total ${lang}: ${totalLines} lines`);
  });
}

// 验证拆分结果
function validateSplit() {
  console.log('\n✅ Validating split results...');
  
  ['zh', 'en'].forEach(lang => {
    const langDir = path.join(MODULES_DIR, lang);
    if (fs.existsSync(langDir)) {
      const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
      console.log(`📋 ${lang}: ${files.length} module files created`);
      
      files.forEach(file => {
        const filePath = path.join(langDir, file);
        const stats = fs.statSync(filePath);
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
        
        if (lines > 1000) {
          console.log(`⚠️  ${file} has ${lines} lines (>1000)`);
        }
      });
    }
  });
}

// 主函数
function main() {
  try {
    checkDirectories();
    const files = loadOriginalFiles();
    
    if (Object.keys(files).length === 0) {
      console.log('❌ No files loaded. Exiting...');
      return;
    }
    
    createModuleFiles(files);
    validateSplit();
    
    console.log('\n🎉 Split completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
    console.error('Stack trace:', error.stack);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { main };

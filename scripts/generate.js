// scripts/generate.js
const fs = require('fs');
const path = require('path');
const {
  mergeAllSources,
  generateM3U,
  generateTXT,
  fetchEPG,
  TARGET_CHANNELS_STD
} = require('../src/index');

const OUTPUT_DIR = path.join(__dirname, '../output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('🚀 开始生成 IPTV 源...');
  console.log(`📅 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  
  try {
    // 合并所有源
    const merged = await mergeAllSources();
    
    // 统计信息
    let totalSources = 0, availableChannels = 0;
    for (const ch of TARGET_CHANNELS_STD) {
      const count = (merged[ch] || []).length;
      totalSources += count;
      if (count > 0) availableChannels++;
    }
    console.log(`📊 完成: ${availableChannels}/${TARGET_CHANNELS_STD.length} 个频道可用, 共 ${totalSources} 条线路`);
    
    // 生成 M3U 完整版
    console.log('📝 生成 index.m3u...');
    const m3uFull = generateM3U(merged, true);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.m3u'), m3uFull, 'utf-8');
    
    // 生成 M3U 精简版
    console.log('📝 生成 simple.m3u...');
    const m3uSimple = generateM3U(merged, false);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'simple.m3u'), m3uSimple, 'utf-8');
    
    // 生成 TXT
    console.log('📝 生成 index.txt...');
    const txt = generateTXT(merged);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.txt'), txt, 'utf-8');
    
    // 获取 EPG
    if (true) {
      console.log('📡 获取 EPG...');
      const epg = await fetchEPG();
      if (epg) {
        fs.writeFileSync(path.join(OUTPUT_DIR, 'epg.xml'), epg, 'utf-8');
        console.log('✅ EPG 保存成功');
      } else {
        console.log('⚠️ EPG 获取失败');
      }
    }
    
    console.log('✅ 所有文件生成完毕!');
    console.log(`📁 输出目录: ${OUTPUT_DIR}`);
    
    // 生成 README 信息
    const readme = `
# IPTV 智能聚合（AI增强）

> 自动更新: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 📊 状态
- 可用频道: ${availableChannels}/${TARGET_CHANNELS_STD.length}
- 总源数: ${totalSources}
- 数据源: 4 个

## 📥 播放地址
- **M3U完整版**: https://raw.githubusercontent.com/[你的用户名]/[仓库名]/main/output/index.m3u
- **M3U精简版**: https://raw.githubusercontent.com/[你的用户名]/[仓库名]/main/output/simple.m3u
- **详细报告**: https://raw.githubusercontent.com/[你的用户名]/[仓库名]/main/output/index.txt
- **EPG数据**: https://raw.githubusercontent.com/[你的用户名]/[仓库名]/main/output/epg.xml

## ⏰ 更新频率
每天早上 8:00 (北京时间) 自动更新
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme, 'utf-8');
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();

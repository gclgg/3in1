// src/index.js
const axios = require('axios');

// ========== 源配置 ==========
const SOURCE_CONFIG = [
  {
    url: 'https://ip.gcl.de5.net/live.m3u',
    type: 'phoenix',
    channels: ['凤凰中文', '凤凰资讯']
  },
  {
    url: 'https://itv.gcl.de5.net/sub?950428=txt',
    type: 'cctv_txt',
    format: 'txt',
    channels: ['CCTV1', 'CCTV2', 'CCTV3', 'CCTV4', 'CCTV5', 'CCTV5+','CCTV6', 
               'CCTV7', 'CCTV8', 'CCTV9', 'CCTV10', 'CCTV11', 'CCTV12', 'CCTV13']
  },
  {
    url: 'http://fn.gcl.de5.net:5908/gsh950428',
    type: 'full_merge',
    channels: 'all'
  },
  {
    url: 'https://zb.gcl.de5.net/zubo_iptv_sorted.m3u',
    type: 'full_merge',
    channels: 'all'
  },
];

const EPG_CONFIG = {
  url: 'https://epg.gcl.de5.net/epg/51zmt.xml',
  enabled: true
};

const TARGET_CHANNELS_STD = [
  'CCTV1', 'CCTV2', 'CCTV3', 'CCTV4', 'CCTV5', 'CCTV5+', 'CCTV6',
  'CCTV7', 'CCTV8', 'CCTV9', 'CCTV10', 'CCTV11', 'CCTV12', 'CCTV13',
  '凤凰中文', '凤凰资讯'
];

const CHANNEL_NAME_MAP = {
  'cctv1': 'CCTV1', 'cctv-1': 'CCTV1', 'cctv-1 综合': 'CCTV1',
  'cctv2': 'CCTV2', 'cctv-2': 'CCTV2', 'cctv-2 财经': 'CCTV2',
  'cctv3': 'CCTV3', 'cctv-3': 'CCTV3', 'cctv-3 综艺': 'CCTV3',
  'cctv4': 'CCTV4', 'cctv-4': 'CCTV4', 'cctv-4 中文国际': 'CCTV4', 'cctv4-国际': 'CCTV4',
  'cctv5': 'CCTV5', 'cctv-5': 'CCTV5', 'cctv-5 体育': 'CCTV5',
  'cctv5+': 'CCTV5+', 'cctv-5+': 'CCTV5+', 'cctv-5+ 体育': 'CCTV5+',
  'cctv6': 'CCTV6', 'cctv-6': 'CCTV6', 'cctv-6 电影': 'CCTV6',
  'cctv7': 'CCTV7', 'cctv-7': 'CCTV7', 'cctv-7 国防军事': 'CCTV7',
  'cctv8': 'CCTV8', 'cctv-8': 'CCTV8', 'cctv-8 电视剧': 'CCTV8',
  'cctv9': 'CCTV9', 'cctv-9': 'CCTV9', 'cctv-9 纪录': 'CCTV9',
  'cctv10': 'CCTV10', 'cctv-10': 'CCTV10', 'cctv-10 科教': 'CCTV10',
  'cctv11': 'CCTV11', 'cctv-11': 'CCTV11', 'cctv-11 戏曲': 'CCTV11',
  'cctv12': 'CCTV12', 'cctv-12': 'CCTV12', 'cctv-12 社会与法': 'CCTV12',
  'cctv13': 'CCTV13', 'cctv-13': 'CCTV13', 'cctv-13 新闻': 'CCTV13',
  '凤凰中文': '凤凰中文', '凤凰卫视中文台': '凤凰中文', 'phoenix chinese': '凤凰中文',
  '凤凰资讯': '凤凰资讯', '凤凰卫视资讯台': '凤凰资讯', 'phoenix info': '凤凰资讯',
  '凤凰香港': '凤凰中文',
};

const LOGO_BASE_URL = 'https://logo.gcl.de5.net/tv/';
const LOGO_FILE_MAP = {
  '凤凰中文': '凤凰中文.png',
  '凤凰资讯': '凤凰资讯.png',
};

function getLogoUrl(channelName) {
  let fileName = LOGO_FILE_MAP[channelName];
  if (!fileName) fileName = `${channelName}.png`;
  return `${LOGO_BASE_URL}${encodeURIComponent(fileName)}`;
}

const CHANNEL_EPG_IDS = {
  'CCTV1': 'CCTV1', 'CCTV2': 'CCTV2', 'CCTV3': 'CCTV3', 'CCTV4': 'CCTV4',
  'CCTV5': 'CCTV5', 'CCTV5+': 'CCTV5+', 'CCTV6': 'CCTV6', 'CCTV7': 'CCTV7',
  'CCTV8': 'CCTV8', 'CCTV9': 'CCTV9', 'CCTV10': 'CCTV10', 'CCTV11': 'CCTV11',
  'CCTV12': 'CCTV12', 'CCTV13': 'CCTV13',
  '凤凰中文': 'FenghuangChinese',
  '凤凰资讯': 'FenghuangInfo'
};

// ========== 去重和排序 ==========
function deduplicateAndRank(urls) {
  if (urls.length <= 1) return urls;
  
  const scored = urls.map(url => {
    let score = 5;
    if (url.startsWith('https://')) score += 2;
    if (url.includes('cdn') || url.includes('cloudflare')) score += 1;
    if (url.includes('.m3u8')) score += 1;
    if (url.includes('gcl.de5.net')) score += 2;
    if (url.includes('token') || url.includes('sign')) score -= 1;
    return { url, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  const seen = new Set();
  const result = [];
  for (const item of scored) {
    try {
      const urlObj = new URL(item.url);
      const key = `${urlObj.hostname}${urlObj.pathname.slice(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item.url);
      }
    } catch {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        result.push(item.url);
      }
    }
  }
  
  return result;
}

// ========== 解析 M3U ==========
function parseM3UFiltered(content, sourceName, allowedChannels = null) {
  const lines = content.split('\n');
  const channelUrls = new Map();
  let currentChannelRaw = null;
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const match = line.match(/#EXTINF:-?\d+.*?,(.+)$/);
      if (match) {
        currentChannelRaw = match[1].trim().toLowerCase();
      }
    } else if (line && !line.startsWith('#') && currentChannelRaw) {
      if (line.startsWith('http://') || line.startsWith('https://')) {
        let stdName = CHANNEL_NAME_MAP[currentChannelRaw];
        if (!stdName) {
          const numMatch = currentChannelRaw.match(/cctv[-\s]*(\d+)/i);
          if (numMatch) stdName = `CCTV${numMatch[1]}`;
          else if (currentChannelRaw.includes('凤凰中文')) stdName = '凤凰中文';
          else if (currentChannelRaw.includes('凤凰资讯')) stdName = '凤凰资讯';
          else stdName = currentChannelRaw.toUpperCase();
        }
        if (TARGET_CHANNELS_STD.includes(stdName)) {
          if (allowedChannels && !allowedChannels.includes(stdName)) {
            currentChannelRaw = null;
            continue;
          }
          if (!channelUrls.has(stdName)) channelUrls.set(stdName, new Set());
          channelUrls.get(stdName).add(line);
        }
      }
      currentChannelRaw = null;
    }
  }

  const result = {};
  for (const [name, urlSet] of channelUrls) {
    result[name] = Array.from(urlSet);
  }
  return result;
}

// ========== 解析 TXT ==========
function parseTXTFiltered(content, sourceName, allowedChannels = null) {
  const lines = content.split('\n');
  const channelUrls = new Map();
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(',');
    if (parts.length < 2) continue;
    const rawName = parts[0].trim();
    const url = parts.slice(1).join(',').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) continue;
    
    let stdName = null;
    const lowerRawName = rawName.toLowerCase();
    if (CHANNEL_NAME_MAP[lowerRawName]) stdName = CHANNEL_NAME_MAP[lowerRawName];
    if (!stdName) {
      const cctvMatch = rawName.match(/cctv(\d+)/i);
      if (cctvMatch) {
        const num = parseInt(cctvMatch[1]);
        if (num >= 1 && num <= 17) stdName = `CCTV${num}`;
      }
    }
    if (stdName && TARGET_CHANNELS_STD.includes(stdName)) {
      if (!allowedChannels || allowedChannels.includes(stdName)) {
        if (!channelUrls.has(stdName)) channelUrls.set(stdName, new Set());
        channelUrls.get(stdName).add(url);
      }
    }
  }
  
  const result = {};
  for (const [name, urlSet] of channelUrls) {
    result[name] = Array.from(urlSet);
  }
  return result;
}

// ========== 合并所有源 ==========
async function mergeAllSources() {
  console.log('📊 开始合并源');
  const merged = {};
  for (const ch of TARGET_CHANNELS_STD) merged[ch] = [];

  for (let idx = 0; idx < SOURCE_CONFIG.length; idx++) {
    const config = SOURCE_CONFIG[idx];
    console.log(`📥 拉取源 ${idx+1}: ${config.url}`);
    try {
      const response = await axios.get(config.url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const content = response.data;
      let parsed;
      if (config.format === 'txt') {
        parsed = parseTXTFiltered(content, `源${idx+1}`, config.channels);
      } else if (config.channels === 'all') {
        parsed = parseM3UFiltered(content, `源${idx+1}`, null);
      } else {
        parsed = parseM3UFiltered(content, `源${idx+1}`, config.channels);
      }
      for (const [chName, urls] of Object.entries(parsed)) {
        if (merged[chName]) {
          for (const url of urls) {
            if (!merged[chName].includes(url)) merged[chName].push(url);
          }
        }
      }
    } catch (e) {
      console.error(`❌ 源 ${idx+1} 异常:`, e.message);
    }
  }
  
  // 智能去重
  console.log('🤖 智能去重中...');
  for (const chName of TARGET_CHANNELS_STD) {
    const urls = merged[chName] || [];
    if (urls.length > 1) {
      try {
        const optimized = deduplicateAndRank(urls);
        merged[chName] = optimized;
      } catch (e) {
        console.log(`⚠️ ${chName} 处理失败`);
      }
    }
  }
  
  return merged;
}

// ========== 生成 M3U ==========
function generateM3U(mergedChannels, includeAll = true) {
  const updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let m3u = '#EXTM3U\n';
  m3u += '# IPTV 指定源合并版 (AI智能增强)\n';
  m3u += `# 更新时间: ${updateTime} (北京时间)\n`;
 
  // 直接使用你的 EPG 地址
  const epgUrl = 'https://epg.gcl.de5.net/epg/51zmt.xml';
  m3u += `# EPG: ${epgUrl}\n\n`;
  m3u += `#EPG: ${epgUrl}\n\n`;

  m3u += `#EXTINF:-1 group-title="公    告" tvg-logo="https://gitee.com/gclgg/gcl/raw/master/%E5%9B%BD%E6%97%97.png",🕐 数据更新: ${updateTime}\n`;
  m3u += `https://logo.gcl.de5.net/mp4/你看那远山.mp4\n\n`;

  for (const chName of TARGET_CHANNELS_STD) {
    const urls = mergedChannels[chName] || [];
    const logo = getLogoUrl(chName);
    const tvgId = CHANNEL_EPG_IDS[chName] || chName;
    let groupTitle = '其他';
    if (chName.startsWith('CCTV')) groupTitle = '央    视';
    else if (chName.includes('凤凰')) groupTitle = '凤    凰';
    
    if (urls.length === 0) {
      m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-logo="${logo}" group-title="${groupTitle}",⚠️ ${chName} (暂无可用源)\n`;
      m3u += `${chName}_placeholder.m3u8\n\n`;
      continue;
    }
    const displayUrls = includeAll ? urls : urls.slice(0, 10);
    for (const url of displayUrls) {
      m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-logo="${logo}" group-title="${groupTitle}",${chName}\n`;
      m3u += `${url}\n`;
    }
    m3u += '\n';
  }
  return m3u;
}

// ========== 生成 TXT ==========
function generateTXT(mergedChannels) {
  const updateTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  let txt = '========== IPTV 指定源合并结果 ==========\n\n';
  txt += `🕐 更新时间: ${updateTime}\n`;
  txt += `🤖 AI功能: 智能去重 | 质量评分\n\n`;
  
  let totalValid = 0;
  for (const ch of TARGET_CHANNELS_STD) {
    totalValid += (mergedChannels[ch] || []).length;
  }
  txt += `📊 总计: ${totalValid} 个源\n\n`;
  
  for (const chName of TARGET_CHANNELS_STD) {
    const urls = mergedChannels[chName] || [];
    txt += `【${chName}】共 ${urls.length} 个源\n`;
    if (urls.length === 0) {
      txt += '  ⚠️ 未找到源\n\n';
      continue;
    }
    for (let i = 0; i < Math.min(urls.length, 10); i++) {
      txt += `   #${i+1} ${urls[i]}\n`;
    }
    if (urls.length > 10) txt += `  ... 还有 ${urls.length - 10} 个源\n`;
    txt += '\n';
  }
  return txt;
}

// ========== 获取 EPG ==========
async function fetchEPG() {
  try {
    const response = await axios.get(EPG_CONFIG.url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return response.data;
  } catch {
    return null;
  }
}

// ========== 导出函数 ==========
module.exports = {
  mergeAllSources,
  generateM3U,
  generateTXT,
  fetchEPG,
  TARGET_CHANNELS_STD,
  SOURCE_CONFIG,
  EPG_CONFIG
};

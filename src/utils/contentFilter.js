/**
 * 敏感词过滤系统
 * 用于自动审核评论和内容
 */

// 敏感词列表（可根据需要扩展）
const sensitiveWords = [
  // 政治敏感
  '反动', '暴乱', '独裁', '颠覆', '分裂', '独立', '疆独', '藏独', '台独',
  
  // 色情
  '色情', '淫秽', '嫖娼', '卖淫', '裸聊', '性服务', '援交',
  
  // 暴力
  '暴力', '恐怖', '炸弹', '枪支', '毒品', '冰毒', '海洛因', '大麻',
  
  // 赌博
  '赌博', '博彩', '彩票', '六合彩', '赌球', '赌马', '赌场',
  
  // 诈骗
  '诈骗', '传销', '洗脑', '非法集资', '洗钱', '套现', '黑产',
  
  // 侮辱性词汇
  '傻逼', '傻逼', '弱智', '脑残', '废物', '垃圾', '去死', '滚蛋'
];

// 违规类型分类
const violationTypes = {
  political: ['反动', '暴乱', '独裁', '颠覆', '分裂', '独立', '疆独', '藏独', '台独'],
  pornography: ['色情', '淫秽', '嫖娼', '卖淫', '裸聊', '性服务', '援交'],
  violence: ['暴力', '恐怖', '炸弹', '枪支', '毒品', '冰毒', '海洛因', '大麻'],
  gambling: ['赌博', '博彩', '彩票', '六合彩', '赌球', '赌马', '赌场'],
  fraud: ['诈骗', '传销', '洗脑', '非法集资', '洗钱', '套现', '黑产'],
  insult: ['傻逼', '傻逼', '弱智', '脑残', '废物', '垃圾', '去死', '滚蛋']
};

/**
 * 检测文本中的敏感词
 * @param {string} text - 要检测的文本
 * @returns {object} - 检测结果
 */
function detectSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return {
      hasViolation: false,
      violations: [],
      filteredText: text || ''
    };
  }

  const violations = [];
  let filteredText = text;
  
  // 检测每个敏感词
  sensitiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(text)) {
      // 确定违规类型
      let type = 'other';
      for (const [category, words] of Object.entries(violationTypes)) {
        if (words.includes(word)) {
          type = category;
          break;
        }
      }
      
      violations.push({
        word: word,
        type: type,
        typeName: getViolationTypeName(type)
      });
      
      // 替换敏感词为 ***
      filteredText = filteredText.replace(regex, '***');
    }
  });

  return {
    hasViolation: violations.length > 0,
    violations: violations,
    filteredText: filteredText,
    violationLevel: calculateViolationLevel(violations)
  };
}

/**
 * 获取违规类型名称
 */
function getViolationTypeName(type) {
  const typeNames = {
    political: '政治敏感',
    pornography: '色情低俗',
    violence: '暴力恐怖',
    gambling: '赌博违法',
    fraud: '诈骗传销',
    insult: '侮辱谩骂',
    other: '其他违规'
  };
  return typeNames[type] || '其他违规';
}

/**
 * 计算违规等级
 * - low: 轻微违规（如侮辱性词汇）
 * - medium: 中等违规（如色情、赌博）
 * - high: 严重违规（如政治敏感、暴力恐怖）
 */
function calculateViolationLevel(violations) {
  const hasHighRisk = violations.some(v => 
    ['political', 'violence', 'fraud'].includes(v.type)
  );
  
  const hasMediumRisk = violations.some(v => 
    ['pornography', 'gambling'].includes(v.type)
  );
  
  if (hasHighRisk) return 'high';
  if (hasMediumRisk) return 'medium';
  return 'low';
}

/**
 * 自动审核内容
 * @param {string} content - 内容
 * @returns {object} - 审核结果
 */
function autoModerate(content) {
  const detection = detectSensitiveWords(content);
  
  // 根据违规等级决定处理方式
  let action = 'approve'; // approve, reject, manual_review
  let reason = '';
  
  if (detection.violationLevel === 'high') {
    action = 'reject';
    reason = '内容包含严重违规信息：' + detection.violations.map(v => v.typeName).join('、');
  } else if (detection.violationLevel === 'medium') {
    action = 'reject';
    reason = '内容包含违规信息：' + detection.violations.map(v => v.typeName).join('、');
  } else if (detection.violationLevel === 'low') {
    // 轻度违规，替换敏感词后通过
    action = 'approve';
    reason = '内容已自动过滤敏感词';
  }
  
  return {
    action,
    reason,
    filteredContent: detection.filteredText,
    originalContent: content,
    violations: detection.violations,
    violationLevel: detection.violationLevel
  };
}

/**
 * 检查用户是否因违规需要被封号
 * @param {array} violations - 违规记录
 * @returns {boolean} - 是否需要封号
 */
function shouldBanUser(violations) {
  // 如果有一次严重违规，直接封号
  const hasSevereViolation = violations.some(v => v.level === 'high');
  if (hasSevereViolation) return true;
  
  // 如果有3次及以上中等违规，封号
  const mediumCount = violations.filter(v => v.level === 'medium').length;
  if (mediumCount >= 3) return true;
  
  // 如果有5次及以上轻度违规，封号
  const lowCount = violations.filter(v => v.level === 'low').length;
  if (lowCount >= 5) return true;
  
  return false;
}

module.exports = {
  detectSensitiveWords,
  autoModerate,
  shouldBanUser,
  sensitiveWords
};

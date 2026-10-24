/**
 * 页面解析（纯函数，可用 HTML fixture 单测）：
 * Boss直聘的 DOM 会变化，这里做多选择器兜底 + 宽松文本清洗，
 * 解析失败返回明确的 NOT_FOUND 结构而不是抛出猜测数据。
 */

function stripWhite(text) {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * 解析岗位详情页 → {company, position, salary, jd}
 * jd 保留换行结构（职责描述多段落）。
 */
export function parseJobDetail(html) {
  // 标题只取 h1 的第一个文本节点（K 数薪 usually 在 <em> 里）
  const h1 = html.match(/<h1[^>]*class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  const title = h1 ? stripWhite(h1[1].split('<')[0]) : (matchFirst(html, [/<title>([^<]*)<\/title>/]) ?? '');
  const company =
    matchFirst(html, [
      /class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/(?:h3|a|span)>/,
      /"brandName":"([^"]+)"/,
    ]) || '';
  const salary = matchFirst(html, [/<span[^>]*class="[^"]*salary[^"]*"[^>]*>([\s\S]*?)<\/span>/]) || '';

  const jd = extractJdBlock(html);
  return {
    position: stripWhite(title.split('-')[0]?.split('_')[0] ?? title),
    company: stripWhite(company),
    salary: stripWhite(salary),
    jd,
  };
}

/** 职位描述区块：优先 job-sec-text，其次 JSON-LD / ld+json 的 description */
function extractJdBlock(html) {
  const secMatch = html.match(/class="[^"]*job-sec-text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (secMatch) return cleanDomText(secMatch[1]);
  const ldMatch = html.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (ldMatch) {
    try {
      return JSON.parse(`"${ldMatch[1]}"`)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    } catch {
      return '';
    }
  }
  return '';
}

function cleanDomText(fragment) {
  return fragment
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function matchFirst(html, patterns) {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return cleanDomText(m[1]);
  }
  return null;
}

/**
 * 解析搜索结果页 → 职位卡片数组。
 * 页面是服务端渲染 + 客户端渲染混合，双路兜底：DOM 卡片 + 内嵌 JSON。
 */
export function parseSearchResults(html) {
  const results = [];
  const seen = new Set();

  // 路径一：DOM 卡片（.job-card-wrapper）
  const cardRe = /<div[^>]*class="[^"]*job-card-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*job-card-wrapper|$)/g;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const card = m[1];
    const title = matchFirst(card, [/class="[^"]*job-name[^"]*"[^>]*>([\s\S]*?)<\/span>/]);
    const company = matchFirst(card, [/class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/(?:a|h3|span)>/]);
    const salary = matchFirst(card, [/class="[^"]*salary[^"]*"[^>]*>([\s\S]*?)<\/span>/]);
    const link = matchFirst(card, [/href="(\/job_detail\/[^"]+\.html)"/]);
    if (title && company) {
      const key = `${company}|${title}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          position: title,
          company,
          salary,
          link: link ? `https://www.zhipin.com${link}` : '',
        });
      }
    }
  }

  // 路径二：内嵌 JSON（za-download-pc-data 或 window.__INITIAL_STATE__）
  if (results.length === 0) {
    const jsonMatch = html.match(/"jobList"\s*:\s*(\[[\s\S]*?\])\s*[},<]/);
    if (jsonMatch) {
      try {
        const list = JSON.parse(jsonMatch[1].replace(/,\s*$/, ''));
        for (const job of list) {
          if (!job?.jobName || !job?.brandName) continue;
          const key = `${job.brandName}|${job.jobName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          results.push({
            position: stripWhite(job.jobName),
            company: stripWhite(job.brandName),
            salary: stripWhite(job.salaryDesc ?? ''),
            link: job.jobHref?.startsWith('http') ? job.jobHref : `https://www.zhipin.com${job.jobHref ?? ''}`,
          });
        }
      } catch {
        // JSON 损坏则走失败路径
      }
    }
  }

  return results;
}

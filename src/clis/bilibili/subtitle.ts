import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { apiGet } from '../../bilibili.js';

cli({
  site: 'bilibili',
  name: 'subtitle',
  description: '获取 Bilibili 视频的字幕',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'bvid', required: true },
  ],
  columns: ['index', 'from', 'to', 'content'],
  func: async (page: IPage | null, kwargs: any) => {
    if (!page) throw new Error('Requires browser');
    // 1. 先前往视频详情页 (建立有鉴权的 Session，且这里不需要加载完整个视频)
    await page.goto(`https://www.bilibili.com/video/${kwargs.bvid}/`);

    // 2. 利用 __INITIAL_STATE__ 获取基础信息，拿 CID
    const cid = await page.evaluate(`(async () => {
      const state = window.__INITIAL_STATE__ || {};
      return state?.videoData?.cid;
    })()`);

    if (!cid) {
      throw new Error('无法在页面中提取到当前视频的 CID，请检查页面是否正常加载。');
    }

    // 3. 在 Node 端使用 apiGet 获取带 Wbi 签名的字幕列表
    // 之前纯靠 evaluate 里的 fetch 会失败，因为 B 站 /wbi/ 开头的接口强校验 w_rid，未签名直接被风控返回 403 HTML
    const payload = await apiGet(page, '/x/player/wbi/v2', {
      params: { bvid: kwargs.bvid, cid },
      signed: true, // 开启 wbi_sign 自动签名
    });

    if (payload.code !== 0) {
      throw new Error(`获取视频播放信息失败: ${payload.message} (${payload.code})`);
    }

    const subtitles = payload.data?.subtitle?.subtitles || [];
    if (subtitles.length === 0) {
      throw new Error('此视频没有发现外挂或智能字幕。');
    }

    const firstSubUrl = subtitles[0].subtitle_url;
    if (!firstSubUrl || firstSubUrl === '') {
      throw new Error('[风控拦截/未登录] 获取到的 subtitle_url 为空！请确保 CLI 已成功登录且风控未封锁此账号。');
    }

    const finalUrl = firstSubUrl.startsWith('//') ? 'https:' + firstSubUrl : firstSubUrl;


    // 4. 解析并拉取 CDN 的 JSON 文件
    const fetchJs = `
      (async () => {
         const url = '${finalUrl}';
         const res = await fetch(url);
         const text = await res.text();
         
         if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            return { error: 'HTML', text: text.substring(0, 100), url };
         }
         
         try {
             const subJson = JSON.parse(text);
             // B站真实返回格式是 { font_size: 0.4, font_color: "#FFFFFF", background_alpha: 0.5, background_color: "#9C27B0", Stroke: "none", type: "json" , body: [{from: 0, to: 0, content: ""}] }
             if (Array.isArray(subJson?.body)) return { success: true, data: subJson.body };
             if (Array.isArray(subJson)) return { success: true, data: subJson };
             return { error: 'UNKNOWN_JSON', data: subJson };
         } catch (e) {
             return { error: 'PARSE_FAILED', text: text.substring(0, 100) };
         }
      })()
    `;
    const items = await page.evaluate(fetchJs);

    if (items?.error) {
      console.error("[DEBUG] Subtitle Parse Error:", items);
      throw new Error(`字幕获取失败: ${items.error}`);
    }

    const finalItems = items?.data || [];
    if (!Array.isArray(finalItems)) {
      throw new Error('解析到的字幕列表对象不符合数组格式');
    }

    // 4. 数据映射
    return finalItems.map((item: any, idx: number) => ({
      index: idx + 1,
      from: Number(item.from || 0).toFixed(2) + 's',
      to: Number(item.to || 0).toFixed(2) + 's',
      content: item.content
    }));
  },
});

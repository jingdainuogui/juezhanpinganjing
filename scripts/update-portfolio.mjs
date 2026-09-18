import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";

const rootDir = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(rootDir, "data", "portfolio.js");
const BILIBILI_UID = "689060205";
const DOUYIN_SEC_UID = "MS4wLjABAAAAN7_ojbX4gwxLwND8g08YulTwitH6n34NiV7yOtN5yQo";
const headers = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/135 Safari/537.36",
  accept: "application/json, text/plain, */*"
};
const WBI_MIXIN_KEY_TABLE = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
  27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
  37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
  22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];

function durationToSeconds(value) {
  if (typeof value === "number") return Math.round(value);
  return String(value ?? "0").split(":").reduce((total, part) => total * 60 + Number(part || 0), 0);
}

async function fetchJson(url, extraHeaders = {}) {
  const response = await fetch(url, { headers: { ...headers, ...extraHeaders } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function getBilibiliDetails(bvid) {
  const payload = await fetchJson(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`);
  const cid = payload.data?.pages?.[0]?.cid;
  if (!cid) throw new Error(`No CID for ${bvid}`);
  return { cid, like: Number(payload.data?.stat?.like ?? 0) };
}

function getBilibiliMixinKey(imgUrl, subUrl) {
  const imgKey = path.basename(new URL(imgUrl).pathname, ".png");
  const subKey = path.basename(new URL(subUrl).pathname, ".png");
  const source = `${imgKey}${subKey}`;
  return WBI_MIXIN_KEY_TABLE.map((index) => source[index]).join("").slice(0, 32);
}

async function getBilibiliWorkUrl() {
  const nav = await fetchJson("https://api.bilibili.com/x/web-interface/nav");
  const imageUrl = nav.data?.wbi_img?.img_url;
  const subUrl = nav.data?.wbi_img?.sub_url;
  if (nav.code !== 0 || !imageUrl || !subUrl) throw new Error(`Bilibili nav API returned ${nav.code}`);

  const params = new URLSearchParams({
    mid: BILIBILI_UID,
    pn: "1",
    ps: "50",
    order: "pubdate",
    wts: String(Math.floor(Date.now() / 1000))
  });
  const query = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.replace(/[!'()*]/g, ""))}`)
    .join("&");
  const wRid = createHash("md5").update(`${query}${getBilibiliMixinKey(imageUrl, subUrl)}`).digest("hex");
  return `https://api.bilibili.com/x/space/wbi/arc/search?${query}&w_rid=${wRid}`;
}

async function getBilibiliWorks() {
  const endpoints = [`https://api.bilibili.com/x/space/arc/search?mid=${BILIBILI_UID}&pn=1&ps=50&order=pubdate`];
  try {
    endpoints.unshift(await getBilibiliWorkUrl());
  } catch (error) {
    console.warn(`Could not create signed Bilibili request: ${error.message}`);
  }
  let payload;
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const candidate = await fetchJson(endpoint);
      if (candidate.code === 0 && Array.isArray(candidate.data?.list?.vlist)) {
        payload = candidate;
        break;
      }
      lastError = new Error(`Bilibili archive API returned ${candidate.code}`);
    } catch (error) {
      lastError = error;
    }
  }
  if (!payload) throw lastError ?? new Error("Bilibili archive API unavailable");

  const tagged = [];
  for (const video of payload.data.list.vlist) {
    try {
      const details = await getBilibiliDetails(video.bvid);
      tagged.push({
        platform: "bilibili",
        bvid: video.bvid,
        cid: details.cid,
        title: video.title,
        cover: video.pic?.startsWith("//") ? `https:${video.pic}` : video.pic,
        duration: durationToSeconds(video.length),
        view: Number(video.play ?? 0),
        like: details.like,
        pubdate: Number(video.created ?? 0),
        link: `https://www.bilibili.com/video/${video.bvid}/`
      });
    } catch (error) {
      console.warn(`Skipped Bilibili video ${video.bvid}: ${error.message}`);
    }
  }
  return tagged;
}

async function getDouyinWorks() {
  const url = new URL("https://www.iesdouyin.com/web/api/v2/aweme/post/");
  url.searchParams.set("sec_uid", DOUYIN_SEC_UID);
  url.searchParams.set("count", "50");
  url.searchParams.set("max_cursor", "0");
  const payload = await fetchJson(url, { referer: `https://www.douyin.com/user/${DOUYIN_SEC_UID}` });
  const works = payload.aweme_list;
  if (!Array.isArray(works)) throw new Error("Douyin work list API returned no aweme_list");

  return works
    .slice(0, 50)
    .map((aweme) => ({
      platform: "douyin",
      title: aweme.desc || "抖音作品",
      cover: aweme.video?.cover?.url_list?.[0] || aweme.video?.origin_cover?.url_list?.[0] || "",
      duration: Math.round(Number(aweme.video?.duration ?? 0) / 1000),
      view: Number(aweme.statistics?.play_count ?? 0),
      like: Number(aweme.statistics?.digg_count ?? 0),
      pubdate: Number(aweme.create_time ?? 0),
      link: aweme.share_url || `https://www.douyin.com/video/${aweme.aweme_id}`
    }));
}

async function readPreviousItems() {
  try {
    const source = await fs.readFile(outputPath, "utf8");
    const sandbox = { window: {} };
    runInNewContext(source, sandbox, { timeout: 1000 });
    return Array.isArray(sandbox.window.PORTFOLIO_ITEMS) ? sandbox.window.PORTFOLIO_ITEMS : [];
  } catch {
    return [];
  }
}

async function main() {
  const previous = await readPreviousItems();
  const previousBilibili = previous.filter((item) => item.platform !== "douyin").map((item) => ({ ...item, platform: "bilibili" }));
  const previousDouyin = previous.filter((item) => item.platform === "douyin");

  let bilibili = previousBilibili;
  let douyin = previousDouyin;
  const failures = [];
  let hasFreshData = false;
  try {
    bilibili = await getBilibiliWorks();
    hasFreshData = true;
  } catch (error) {
    failures.push(`Bilibili: ${error.message}`);
  }
  try {
    douyin = await getDouyinWorks();
    hasFreshData = true;
  } catch (error) {
    failures.push(`Douyin: ${error.message}`);
  }

  const items = [...bilibili, ...douyin].sort((a, b) => b.pubdate - a.pubdate);
  if (!items.length) throw new Error(`No portfolio data available. ${failures.join(" | ")}`);

  const updatedAt = hasFreshData
    ? new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })
    : "暂未同步（展示本地快照）";
  const syncStatus = failures.length ? `部分平台同步失败：${failures.join(" | ")}` : "同步完成";
  const content = `window.PORTFOLIO_UPDATED_AT = ${JSON.stringify(updatedAt)};\nwindow.PORTFOLIO_SYNC_STATUS = ${JSON.stringify(syncStatus)};\nwindow.PORTFOLIO_ITEMS = ${JSON.stringify(items, null, 2)};\n`;
  await fs.writeFile(outputPath, content, "utf8");
  console.log(`Updated ${items.length} works (${bilibili.length} Bilibili, ${douyin.length} Douyin).`);
  if (failures.length) console.warn(`Preserved previous data for unavailable platforms: ${failures.join(" | ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

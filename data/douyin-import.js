// 从已登录的抖音创作者中心导入；后续补齐最近发布的 50 条作品。
window.DOUYIN_IMPORTED_ITEMS = [
  { platform: "douyin", title: "对位千珏，压力暴大 精彩时刻录的不多，后续会发完整录像", cover: "assets/portfolio-covers/eecb38fc433af506.webp", duration: 52, view: 1724, like: 17, pubdate: 1789554000, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "战斗爽", cover: "assets/portfolio-covers/78853d9535b12dcd.webp", duration: 71, view: 2131, like: 28, pubdate: 1789467600, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "白狗中单，在你脸上都看不到", cover: "assets/portfolio-covers/5f28c9f8f79bdaf2.webp", duration: 56, view: 1223, like: 25, pubdate: 1789381080, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "不知道说什么", cover: "assets/portfolio-covers/d8036241fef16a43.webp", duration: 53, view: 1098, like: 23, pubdate: 1789303080, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "敌方视角，真有点说法吧", cover: "assets/portfolio-covers/16ce876e1aee9455.webp", duration: 89, view: 474, like: 9, pubdate: 1789214340, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "星熊不好打肉，可以拿雪童子", cover: "assets/portfolio-covers/7b7d7cbac2ed00ea.webp", duration: 52, view: 1694, like: 20, pubdate: 1789122540, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "对面好像是沐茗", cover: "assets/portfolio-covers/df63dae2d97ada64.webp", duration: 99, view: 956, like: 18, pubdate: 1789035300, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "我可是式神海", cover: "assets/portfolio-covers/434a4596a995f20c.webp", duration: 52, view: 1108, like: 14, pubdate: 1788925920, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "鬼王降临。", cover: "assets/portfolio-covers/ef51c7d0e59528f4.webp", duration: 62, view: 1180, like: 22, pubdate: 1788872580, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "我不信", cover: "assets/portfolio-covers/a6385c1947d6b8cc.webp", duration: 20, view: 946, like: 45, pubdate: 1788610080, link: "https://v.douyin.com/4Tc5aBTnxho/" },
  { platform: "douyin", title: "带你感受平安京美术组的魅力", cover: "assets/portfolio-covers/982db25baee79a36.webp", duration: 20, view: 1108, like: 57, pubdate: 1788518340, link: "https://v.douyin.com/4Tc5aBTnxho/" }
];

const existingPortfolioItems = window.PORTFOLIO_ITEMS || [];
window.PORTFOLIO_ITEMS = [...existingPortfolioItems, ...window.DOUYIN_IMPORTED_ITEMS.filter((item) => !existingPortfolioItems.some((existing) => existing.platform === item.platform && existing.title === item.title))]
  .sort((left, right) => Number(right.pubdate) - Number(left.pubdate));
window.PORTFOLIO_UPDATED_AT = "2026-09-17 16:30（抖音创作者中心导入）";

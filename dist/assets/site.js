const Site = (() => {
  const backgroundCandidates = ["assets/bj-optimized.webp", "bj.png"];

  function applyBackground() {
    const bgLayer = document.querySelector("[data-bg-layer]");
    if (!bgLayer) return;

    const tryLoad = (index = 0) => {
      if (index >= backgroundCandidates.length) return;
      const candidate = backgroundCandidates[index];
      const img = new Image();
      img.onload = () => {
        bgLayer.style.backgroundImage =
          `linear-gradient(rgba(8, 18, 36, 0.32), rgba(8, 18, 36, 0.42)), url("${candidate}")`;
      };
      img.onerror = () => tryLoad(index + 1);
      img.src = candidate;
    };

    tryLoad();
  }

  function revealPage() {
    document.querySelectorAll(".hidden-until-ready").forEach((node, index) => {
      setTimeout(() => node.classList.add("is-ready"), index * 40);
    });
  }

  function initBirthdayCountdown() {
    const dayNode = document.getElementById("birthdayDays");
    const labelNode = document.getElementById("birthdayLabel");
    const yearNode = document.getElementById("birthdayYear");
    if (!dayNode || !labelNode || !yearNode) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    let nextBirthday = new Date(currentYear, 4, 7, 0, 0, 0, 0);
    if (now > nextBirthday) {
      nextBirthday = new Date(currentYear + 1, 4, 7, 0, 0, 0, 0);
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    dayNode.textContent = String(diffDays);
    yearNode.textContent = String(nextBirthday.getFullYear());
    labelNode.textContent =
      diffDays === 0
        ? "今天就是你的降临日，结界能量已经拉满。"
        : `距离你的降临还有 ${diffDays} 天`;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "待同步";
    if (typeof value === "number") return value.toLocaleString("zh-CN");
    return String(value);
  }

  function formatDuration(totalSeconds) {
    const seconds = Number(totalSeconds) || 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainSeconds = seconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
  }

  function formatDate(timestamp) {
    const date = new Date(Number(timestamp) * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  async function loadFans() {
    const nodes = document.querySelectorAll("[data-fan-platform]");
    if (!nodes.length) return;

    try {
      let data = null;

      try {
        const response = await fetch(`data/fans.json?t=${Date.now()}`);
        if (response.ok) {
          data = await response.json();
        }
      } catch {
        data = null;
      }

      if (!data && window.FANS_DATA) {
        data = window.FANS_DATA;
      }

      if (!data) throw new Error("fans data fetch failed");

      nodes.forEach((node) => {
        const platform = node.dataset.fanPlatform;
        const source = data.platforms?.[platform];
        if (!source) return;
        node.textContent = source.displayText === "Pending"
          ? "待同步"
          : source.displayText || formatNumber(source.followers);
      });

      const updatedNode = document.querySelector("[data-fans-updated]");
      if (updatedNode && data.lastUpdated) {
        updatedNode.textContent = `最近同步：${data.lastUpdated}`;
      }
    } catch {
      nodes.forEach((node) => {
        node.textContent = "同步失败";
      });
    }
  }

  function createGalleryCard(item, index) {
    const ratio = item.width && item.height ? `${item.width} / ${item.height}` : null;
    const article = document.createElement("article");
    article.className = "gallery-card p-3";
    article.innerHTML = `
      <button
        type="button"
        class="gallery-trigger group relative block w-full text-left"
        data-lightbox-src="${item.full}"
        data-lightbox-thumb="${item.thumb}"
        data-lightbox-title="式神图鉴 #${index + 1}"
      >
        <div class="gallery-thumb-wrap"${ratio ? ` style="aspect-ratio: ${ratio}"` : ""}>
          <img src="${item.thumb}" alt="式神图鉴 ${index + 1}" loading="lazy" decoding="async" class="gallery-thumb" />
          <div class="gallery-glow"></div>
          <div class="gallery-meta">
            <span class="pill rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md">式神图鉴</span>
            <span class="rounded-full border border-white/15 bg-slate-950/35 px-3 py-1 text-xs text-slate-100/88">点击放大</span>
          </div>
        </div>
      </button>
    `;
    return article;
  }

  function initGallery() {
    const gallery = document.getElementById("galleryGrid");
    const sentinel = document.getElementById("gallerySentinel");
    if (!gallery || !Array.isArray(window.SHIKIGAMI_IMAGES)) return;

    const images = window.SHIKIGAMI_IMAGES;
    const batchSize = 18;
    let cursor = 0;
    let loading = false;

    const renderBatch = () => {
      if (loading) return;
      loading = true;

      const fragment = document.createDocumentFragment();
      const nextImages = images.slice(cursor, cursor + batchSize);
      nextImages.forEach((item, idx) => {
        fragment.appendChild(createGalleryCard(item, cursor + idx));
      });
      gallery.appendChild(fragment);
      cursor += nextImages.length;
      loading = false;

      if (cursor >= images.length && sentinel) {
        sentinel.textContent = "结界到底部已抵达，所有式神均已显现。";
      }
    };

    renderBatch();

    if (sentinel) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && cursor < images.length) {
            renderBatch();
          }
        });
      }, { rootMargin: "320px 0px 320px 0px" });

      observer.observe(sentinel);
    }

    initImageLightbox();
  }

  function initImageLightbox() {
    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");
    const title = document.getElementById("lightboxTitle");
    if (!lightbox || !image || !title) return;

    const close = () => {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      image.removeAttribute("src");
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-lightbox-src]");
      if (trigger) {
        const thumbSrc = trigger.dataset.lightboxThumb || trigger.dataset.lightboxSrc;
        const fullSrc = trigger.dataset.lightboxSrc;
        image.src = thumbSrc;
        image.decoding = "async";
        title.textContent = trigger.dataset.lightboxTitle || "式神图鉴";
        lightbox.classList.add("is-open");
        document.body.style.overflow = "hidden";

        if (fullSrc && fullSrc !== thumbSrc) {
          const fullImage = new Image();
          fullImage.decoding = "async";
          fullImage.onload = () => {
            image.src = fullSrc;
          };
          fullImage.src = fullSrc;
        }
        return;
      }

      if (event.target === lightbox || event.target.closest("#lightboxClose")) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function createPortfolioCard(item, index) {
    const article = document.createElement("article");
    article.className = "gallery-card portfolio-card p-3";
    article.innerHTML = `
      <button
        type="button"
        class="group block w-full text-left"
        data-video-bvid="${item.bvid}"
        data-video-cid="${item.cid}"
        data-video-title="${item.title}"
      >
        <div class="gallery-thumb-wrap">
          <img src="${item.cover}" alt="${item.title}" loading="lazy" decoding="async" class="gallery-thumb portfolio-thumb" />
          <div class="gallery-glow"></div>
          <div class="portfolio-play">
            <span class="portfolio-play-button">播放</span>
          </div>
        </div>
        <div class="relative z-10 px-2 pb-2 pt-4">
          <div class="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-200/70">
            <span class="pill rounded-full px-3 py-1">作品 ${String(index + 1).padStart(2, "0")}</span>
            <span class="rounded-full border border-white/12 bg-white/8 px-3 py-1">${formatDuration(item.duration)}</span>
            <span class="rounded-full border border-white/12 bg-white/8 px-3 py-1">${formatDate(item.pubdate)}</span>
          </div>
          <h3 class="line-clamp-2 text-lg font-semibold leading-7 text-white">${item.title}</h3>
          <div class="mt-4 flex items-center justify-between gap-4 text-sm text-slate-200/72">
            <span>播放 ${formatNumber(item.view)}</span>
            <span>点赞 ${formatNumber(item.like)}</span>
          </div>
        </div>
      </button>
    `;
    return article;
  }

  function initPortfolio() {
    const grid = document.getElementById("portfolioGrid");
    const sentinel = document.getElementById("portfolioSentinel");
    if (!grid || !Array.isArray(window.PORTFOLIO_ITEMS)) return;

    const items = window.PORTFOLIO_ITEMS;
    const batchSize = 8;
    let cursor = 0;
    let loading = false;

    const renderBatch = () => {
      if (loading) return;
      loading = true;

      const fragment = document.createDocumentFragment();
      const nextItems = items.slice(cursor, cursor + batchSize);
      nextItems.forEach((item, idx) => {
        fragment.appendChild(createPortfolioCard(item, cursor + idx));
      });
      grid.appendChild(fragment);
      cursor += nextItems.length;
      loading = false;

      if (cursor >= items.length && sentinel) {
        sentinel.textContent = "作品集已经全部展开，继续向下就是你的完整轨迹。";
      }
    };

    renderBatch();

    if (sentinel) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && cursor < items.length) {
            renderBatch();
          }
        });
      }, { rootMargin: "320px 0px 320px 0px" });

      observer.observe(sentinel);
    }

    initVideoModal();
  }

  function initVideoModal() {
    const modal = document.getElementById("videoModal");
    const frame = document.getElementById("videoFrame");
    const title = document.getElementById("videoTitle");
    const meta = document.getElementById("videoMeta");
    const sourceLink = document.getElementById("videoSourceLink");
    if (!modal || !frame || !title || !meta) return;

    const close = () => {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      frame.src = "";
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-video-bvid]");
      if (trigger) {
        const bvid = trigger.dataset.videoBvid;
        const cid = trigger.dataset.videoCid;
        title.textContent = trigger.dataset.videoTitle || "作品播放";
        meta.textContent = `BV 号：${bvid}`;
        if (sourceLink) {
          sourceLink.href = `https://www.bilibili.com/video/${encodeURIComponent(bvid)}/`;
        }
        frame.src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&cid=${encodeURIComponent(cid)}&page=1&high_quality=1&danmaku=0&autoplay=1&as_wide=1`;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        return;
      }

      if (event.target === modal || event.target.closest("#videoModalClose")) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  async function initMessageBoard() {
    const list = document.getElementById("messageList");
    const form = document.getElementById("messageForm");
    const statusNode = document.getElementById("messageBoardStatus");
    if (!list || !form) return;

    const setStatus = (text) => {
      if (statusNode) statusNode.textContent = text;
    };

    if (window.supabase && window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.publishableKey) {
      try {
        const client = window.supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.publishableKey
        );

        const renderRemote = (messages, repliesByMessage) => {
          list.innerHTML = "";

          if (!messages.length) {
            list.innerHTML = `
              <div class="message-item px-5 py-6 text-sm text-slate-200/72">
                暂时还没有留言，第一条灵讯就由你来开启吧。
              </div>
            `;
            return;
          }

          messages.forEach((message, index) => {
            const replies = repliesByMessage.get(String(message.id)) || [];
            const item = document.createElement("article");
            item.className = "message-item p-5";
            item.innerHTML = `
              <div class="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <div class="flex items-center gap-3">
                    <strong class="text-base text-white">${message.author}</strong>
                    <span class="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-slate-100/74">${String(message.created_at).slice(0, 10)}</span>
                  </div>
                  <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200/82">${message.content}</p>
                </div>
                <span class="rounded-full border border-cyan-100/16 bg-cyan-100/10 px-3 py-1 text-xs text-cyan-50/88">灵讯 ${messages.length - index}</span>
              </div>
              <div class="relative z-10 mt-4 space-y-3">
                ${replies.map((reply) => `
                  <div class="reply-badge rounded-2xl px-4 py-3 text-sm leading-6">
                    <div class="mb-1 font-medium">站长回复</div>
                    <div>${reply.content}</div>
                  </div>
                `).join("")}
              </div>
            `;
            list.appendChild(item);
          });
        };

        const loadRemote = async () => {
          setStatus("在线留言板已连接，访客留言会直接写入云端。");

          const [{ data: messages, error: messageError }, { data: replies, error: replyError }] = await Promise.all([
            client
              .from("message_board_messages")
              .select("id, author, content, created_at")
              .eq("is_hidden", false)
              .order("created_at", { ascending: false }),
            client
              .from("message_board_replies")
              .select("id, message_id, content, created_at")
              .eq("is_hidden", false)
              .order("created_at", { ascending: true })
          ]);

          if (messageError) throw messageError;
          if (replyError) {
            console.warn("message_board_replies load failed:", replyError);
          }

          const replyMap = new Map();
          (replies || []).forEach((reply) => {
            const key = String(reply.message_id);
            if (!replyMap.has(key)) {
              replyMap.set(key, []);
            }
            replyMap.get(key).push(reply);
          });

          renderRemote(messages || [], replyMap);
        };

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const author = (form.querySelector("[name='author']").value.trim() || "匿名来客").slice(0, 20);
          const content = form.querySelector("[name='content']").value.trim();
          if (!content) return;

          setStatus("正在写入留言...");

          const { error } = await client.from("message_board_messages").insert({
            author,
            content: content.slice(0, 240)
          });

          if (error) {
            setStatus("留言写入失败，请先确认 Supabase SQL 已执行。");
            return;
          }

          form.reset();
          setStatus("留言已写入云端。");
          await loadRemote();
        });

        await loadRemote();
        return;
      } catch {
        setStatus("Supabase 连接失败，当前回退为本地留言模式。");
      }
    } else {
      setStatus("当前未检测到 Supabase 配置，正在使用本地留言模式。");
    }

    const storageKey = "onmyo-message-board";
    let seeded = [];
    let localMessages = [];

    try {
      let data = null;

      try {
        const response = await fetch(`data/messages.json?t=${Date.now()}`);
        if (response.ok) {
          data = await response.json();
        }
      } catch {
        data = null;
      }

      if (!data && window.MESSAGE_SEEDS) {
        data = { messages: window.MESSAGE_SEEDS };
      }

      if (data) {
        seeded = Array.isArray(data.messages) ? data.messages : [];
      }
    } catch {
      seeded = [];
    }

    try {
      localMessages = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(localMessages)) localMessages = [];
    } catch {
      localMessages = [];
    }

    const persist = () => {
      localStorage.setItem(storageKey, JSON.stringify(localMessages));
    };

    const render = () => {
      const merged = [...localMessages, ...seeded];
      list.innerHTML = "";

      if (!merged.length) {
        list.innerHTML = `
          <div class="message-item px-5 py-6 text-sm text-slate-200/72">
            暂时还没有留言，第一条灵讯就由你来开启吧。
          </div>
        `;
        return;
      }

      merged.forEach((message, index) => {
        const item = document.createElement("article");
        item.className = "message-item p-5";
        const replies = Array.isArray(message.replies) ? message.replies : [];
        item.innerHTML = `
          <div class="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3">
                <strong class="text-base text-white">${message.author}</strong>
                <span class="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-slate-100/74">${message.time}</span>
              </div>
              <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200/82">${message.content}</p>
            </div>
            <span class="rounded-full border border-cyan-100/16 bg-cyan-100/10 px-3 py-1 text-xs text-cyan-50/88">灵讯 ${merged.length - index}</span>
          </div>
          <div class="relative z-10 mt-4 space-y-3">
            ${replies.map((reply) => `
              <div class="reply-badge rounded-2xl px-4 py-3 text-sm leading-6">
                <div class="mb-1 font-medium">站长回复</div>
                <div>${reply.content}</div>
              </div>
            `).join("")}
          </div>
          <form data-reply-index="${index}" class="relative z-10 mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs uppercase tracking-[0.28em] text-cyan-100/66">Reply Slot</span>
              <span class="text-xs text-slate-300/56">本地演示回复，仅保存在当前浏览器</span>
            </div>
            <textarea class="message-textarea min-h-[88px] px-4 py-3 text-sm" placeholder="以站长身份补一条回复..."></textarea>
            <button type="submit" class="cta-button rounded-full px-4 py-2 text-sm text-white">写入本地回复</button>
          </form>
        `;
        list.appendChild(item);
      });
    };

    list.addEventListener("submit", (event) => {
      const replyForm = event.target.closest("[data-reply-index]");
      if (!replyForm) return;
      event.preventDefault();

      const textarea = replyForm.querySelector("textarea");
      const content = textarea.value.trim();
      if (!content) return;

      const replyIndex = Number(replyForm.dataset.replyIndex);
      const targetMessage = localMessages[replyIndex];
      if (!targetMessage) {
        alert("这条留言来自预置数据，当前版本不会直接改写 data/messages.json，但你可以手动去文件里补回复。");
        return;
      }

      targetMessage.replies = Array.isArray(targetMessage.replies) ? targetMessage.replies : [];
      targetMessage.replies.unshift({ content });
      persist();
      render();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const author = form.querySelector("[name='author']").value.trim() || "匿名来客";
      const content = form.querySelector("[name='content']").value.trim();
      if (!content) return;

      const now = new Date();
      localMessages.unshift({
        author,
        time: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
        content,
        replies: []
      });

      persist();
      form.reset();
      render();
    });

    render();
    setStatus("当前为本地演示留言板，留言保存在这台设备的浏览器里。");
  }

  function initQQCopy() {
    const button = document.getElementById("copyQQ");
    if (!button) return;

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("2409533154");
        button.textContent = "QQ 已复制";
      } catch {
        button.textContent = "复制失败";
      }

      setTimeout(() => {
        button.textContent = "复制 QQ 号";
      }, 1800);
    });
  }

  function init() {
    applyBackground();
    initBirthdayCountdown();
    loadFans();
    initGallery();
    initPortfolio();
    initMessageBoard();
    initQQCopy();
    revealPage();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Site.init);

(() => {
  "use strict";

  // ================================================================
  // Benchmarks
  // cpm  = USD per 1,000 average views for the primary deliverable
  // er   = healthy (likes + comments) / views
  // vr   = healthy views / followers
  // ================================================================
  const PLATFORMS = {
    instagram: { name: "Instagram", short: "IG", color: "#E1306C", bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", cpm: 12, er: 0.05, vr: 0.3,
      deliverables: [["Reel", 1], ["Carousel / static post", 0.7], ["Story set (3 frames)", 0.35], ["Link in bio (30 days)", 0.25]] },
    youtube: { name: "YouTube", short: "YT", color: "#FF0033", cpm: 25, er: 0.04, vr: 0.15, followersLabel: "Subscribers", viewsLabel: "Avg views / video",
      deliverables: [["Integration (60–90s)", 1], ["Dedicated video", 2.5], ["Shorts", 0.3], ["Community post", 0.1]] },
    tiktok: { name: "TikTok", short: "TT", color: "#25F4EE", bg: "#000", cpm: 8, er: 0.06, vr: 0.5,
      deliverables: [["Video", 1], ["Video + Spark Ads (30d)", 1.5], ["Story", 0.3]] },
    x: { name: "X / Twitter", short: "X", color: "#8b8b9a", bg: "#000", cpm: 6, er: 0.02, vr: 0.08, viewsLabel: "Avg impressions / post",
      deliverables: [["Post", 1], ["Thread", 1.6], ["Pinned post (7 days)", 0.6]] },
    linkedin: { name: "LinkedIn", short: "in", color: "#0A66C2", cpm: 30, er: 0.04, vr: 0.1, viewsLabel: "Avg impressions / post",
      deliverables: [["Post", 1], ["Document carousel", 1.2], ["Newsletter feature", 1.6]] },
    facebook: { name: "Facebook", short: "f", color: "#1877F2", cpm: 7, er: 0.02, vr: 0.06,
      deliverables: [["Video / Reel", 1], ["Post", 0.6]] },
    threads: { name: "Threads", short: "@", color: "#b0b0c0", bg: "#000", cpm: 6, er: 0.04, vr: 0.15,
      deliverables: [["Post", 1], ["Thread series", 1.4]] },
    snapchat: { name: "Snapchat", short: "SC", color: "#FFD60A", dark: true, cpm: 8, er: 0.03, vr: 0.3,
      deliverables: [["Story", 1], ["Spotlight", 0.8]] },
    // Twitch: "views" = avg unique viewers per stream, "posts" = streams per month.
    // Sponsorships price per stream, roughly $0.40 per unique viewer.
    twitch: { name: "Twitch", short: "TW", color: "#9146FF", cpm: 400, er: null, vr: 0.05,
      viewsLabel: "Avg unique viewers / stream", postsLabel: "Streams / month",
      deliverables: [["Sponsored segment (1h)", 1], ["Dedicated stream", 2.5], ["Panel + chatbot (30d)", 0.4]] },
  };

  const NICHES = {
    finance: ["Finance & investing", 1.8], business: ["Business & marketing", 1.6], tech: ["Tech & gadgets", 1.5],
    education: ["Education", 1.3], beauty: ["Beauty & skincare", 1.2], fashion: ["Fashion", 1.15], fitness: ["Fitness & health", 1.15],
    travel: ["Travel", 1.1], parenting: ["Parenting & family", 1.1], food: ["Food & cooking", 1.0], lifestyle: ["Lifestyle", 1.0],
    gaming: ["Gaming", 0.9], comedy: ["Comedy & entertainment", 0.85], music: ["Music & dance", 0.8],
  };

  // Approximate conversion from USD
  const CURRENCIES = { USD: ["$", 1], INR: ["₹", 88], EUR: ["€", 0.86], GBP: ["£", 0.75], AED: ["AED ", 3.67], CAD: ["CA$", 1.38], AUD: ["A$", 1.52] };

  const SAMPLE = {
    name: "", niche: "tech", currency: "USD", tier1: 42,
    platforms: [
      { id: "instagram", handle: "@yourhandle", followers: 184000, views: 62000, likes: 3900, comments: 140, posts: 14, growth: 4.2 },
      { id: "youtube", handle: "@yourchannel", followers: 96000, views: 21000, likes: 980, comments: 120, posts: 4, growth: 3.1 },
      { id: "tiktok", handle: "@yourhandle", followers: 241000, views: 88000, likes: 6100, comments: 210, posts: 20, growth: 6.5 },
      { id: "x", handle: "@yourhandle", followers: 18500, views: 2600, likes: 48, comments: 6, posts: 40, growth: 1.2 },
    ],
  };

  // ================================================================
  // Small helpers
  // ================================================================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v) => { const n = parseFloat(String(v).replace(/,/g, "")); return isFinite(n) ? n : 0; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtInt = (v) => Math.floor(v).toLocaleString("en-US");
  function fmtCompact(v, digits = 1) {
    const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(digits) + "B";
    if (a >= 1e6) return (v / 1e6).toFixed(digits) + "M";
    if (a >= 1e4) return (v / 1e3).toFixed(digits) + "K";
    return Math.round(v).toLocaleString("en-US");
  }
  let currency = "USD";
  function money(usd, compact = false) {
    const [sym, rate] = CURRENCIES[currency];
    const v = usd * rate;
    if (compact && currency === "INR" && v >= 1e5)
      return sym + (v >= 1e7 ? (v / 1e7).toFixed(2) + "Cr" : (v / 1e5).toFixed(2) + "L");
    if (compact && v >= 1e5) return sym + fmtCompact(v, v >= 1e6 ? 2 : 1);
    return sym + Math.round(roundNice(v)).toLocaleString(currency === "INR" ? "en-IN" : "en-US");
  }
  // Round prices to numbers a human would actually quote
  function roundNice(v) {
    if (v < 100) return Math.round(v / 5) * 5;
    if (v < 1000) return Math.round(v / 10) * 10;
    if (v < 10000) return Math.round(v / 50) * 50;
    return Math.round(v / 100) * 100;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add("hidden"), 3200);
  }

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
  };

  // ================================================================
  // Odometer: rolling digits like a live sub counter
  // ================================================================
  class Odometer {
    constructor(el, format = fmtInt) {
      this.el = el;
      this.format = format;
      this.inner = document.createElement("span");
      this.inner.className = "odo";
      el.innerHTML = "";
      el.appendChild(this.inner);
      this.str = null;
      this.shape = null;
    }
    set(v) {
      const str = this.format(v);
      if (str === this.str) return;
      this.str = str;
      this.el.setAttribute("aria-label", str);
      const shape = str.replace(/\d/g, "0");
      if (shape !== this.shape) {
        // Rebuild columns; preserve existing digits from the right so the
        // numbers keep rolling smoothly when a new digit is added.
        const prevDigits = this.cols ? this.cols.map((c) => c.dataset.d) : [];
        this.shape = shape;
        this.inner.innerHTML = "";
        this.cols = [];
        for (const ch of str) {
          if (/\d/.test(ch)) {
            const col = document.createElement("span");
            col.className = "odo-d";
            const strip = document.createElement("span");
            strip.className = "odo-strip";
            strip.innerHTML = "0123456789".split("").map((d) => `<span>${d}</span>`).join("");
            col.appendChild(strip);
            this.inner.appendChild(col);
            this.cols.push(strip);
          } else {
            const s = document.createElement("span");
            s.className = "odo-s";
            s.textContent = ch;
            this.inner.appendChild(s);
          }
        }
        const offset = this.cols.length - prevDigits.length;
        this.cols.forEach((s, i) => {
          const d = prevDigits[i - offset] ?? "0";
          s.style.transition = "none";
          s.style.transform = `translateY(-${d * 10}%)`;
        });
        void this.inner.offsetHeight; // flush so the next transform animates
        this.cols.forEach((s) => (s.style.transition = ""));
      }
      let i = 0;
      for (const ch of str) {
        if (/\d/.test(ch)) {
          const s = this.cols[i++];
          s.dataset.d = ch;
          s.style.transform = `translateY(-${+ch * 10}%)`;
        }
      }
    }
  }
  // Start at zero and roll up to the real number
  function rollIn(el, value, format, delay = 120) {
    const o = new Odometer(el, format);
    o.set(0);
    setTimeout(() => o.set(value), delay);
    return o;
  }

  // ================================================================
  // Model
  // ================================================================
  const TIERS = [[1e6, "Mega creator"], [5e5, "Macro creator"], [1e5, "Mid-tier creator"], [1e4, "Micro creator"], [0, "Nano creator"]];
  const MILESTONES = [1e3, 5e3, 1e4, 2.5e4, 5e4, 1e5, 2.5e5, 5e5, 1e6, 2.5e6, 5e6, 1e7, 2.5e7, 5e7, 1e8];

  function scoreRatio(actual, bench) { return clamp((actual / bench) * 65, 0, 100); }
  function scoreConversation(c) {
    // comments / likes. Very low = passive audience; very high = giveaways/bots.
    if (c < 0.002) return 25;
    if (c < 0.008) return 55;
    if (c <= 0.08) return 92;
    if (c <= 0.15) return 75;
    return 50;
  }
  function scoreGrowth(g) {
    if (g < 0) return 30;
    if (g < 0.5) return 55;
    if (g < 3) return 75;
    if (g <= 15) return 92;
    if (g <= 40) return 70;
    return 40; // sudden spikes often mean bought followers
  }

  function compute(profile) {
    const niche = NICHES[profile.niche]?.[1] ?? 1;
    const tier1 = clamp(num(profile.tier1), 0, 100);
    const geoMult = 0.5 + tier1 / 100; // 0% tier-1 → 0.5x, 100% → 1.5x
    const geoScore = 30 + tier1 * 0.7;

    const plats = profile.platforms.map((p) => {
      const def = PLATFORMS[p.id];
      const followers = num(p.followers), views = num(p.views), likes = num(p.likes);
      const comments = num(p.comments), posts = num(p.posts), growth = num(p.growth);
      const monthlyReach = views * posts;
      const er = def.er == null || views === 0 ? null : (likes + comments) / views;
      const vr = followers ? views / followers : 0;
      const conv = likes ? comments / likes : 0;
      const s = {
        engagement: er == null ? null : scoreRatio(er, def.er),
        reach: scoreRatio(vr, def.vr),
        conversation: def.er == null ? null : likes ? scoreConversation(conv) : 50,
        growth: scoreGrowth(growth),
        geography: geoScore,
      };
      const w = { engagement: 0.3, reach: 0.25, conversation: 0.15, growth: 0.15, geography: 0.15 };
      let tot = 0, wt = 0;
      for (const k in w) if (s[k] != null) { tot += s[k] * w[k]; wt += w[k]; }
      const quality = tot / wt;
      const qualityMult = 0.6 + (quality / 100) * 0.8;
      const base = Math.max(25, (views / 1000) * def.cpm * niche * geoMult * qualityMult);
      const rates = def.deliverables.map(([label, m]) => ({ label, usd: Math.max(25, base * m) }));
      return { ...p, def, followers, views, likes, comments, posts, growth, monthlyReach, er, vr, conv, scores: s, quality, base, rates };
    });

    const followers = plats.reduce((a, p) => a + p.followers, 0);
    const monthlyReach = plats.reduce((a, p) => a + p.monthlyReach, 0);
    const growth = followers ? plats.reduce((a, p) => a + p.followers * p.growth, 0) / followers : 0;

    // 12-month projection: each platform compounds at its own rate; views scale with audience
    const projection = [];
    for (let m = 0; m <= 12; m++) {
      let f = 0, r = 0;
      for (const p of plats) { const k = Math.pow(1 + p.growth / 100, m); f += p.followers * k; r += p.monthlyReach * k; }
      projection.push({ m, followers: f, reach: r });
    }
    const yearlyReach = projection.slice(1).reduce((a, x) => a + x.reach, 0);

    // Weighted aggregates
    const wavg = (key) => {
      let t = 0, w = 0;
      for (const p of plats) if (p.scores[key] != null) { t += p.scores[key] * p.followers; w += p.followers; }
      return w ? t / w : null;
    };
    const breakdown = {
      engagement: wavg("engagement"), reach: wavg("reach"), conversation: wavg("conversation"),
      growth: wavg("growth"), geography: geoScore,
    };
    const quality = followers ? plats.reduce((a, p) => a + p.quality * p.followers, 0) / followers : 0;
    const engPlats = plats.filter((p) => p.er != null);
    const viewsSum = engPlats.reduce((a, p) => a + p.views, 0);
    const er = viewsSum ? engPlats.reduce((a, p) => a + p.likes + p.comments, 0) / viewsSum : 0;
    const erBench = viewsSum ? engPlats.reduce((a, p) => a + p.def.er * p.views, 0) / viewsSum : 0;

    // Packages
    const primary = plats.map((p) => p.rates[0].usd);
    const single = Math.max(...primary, 0);
    const monthlyPkg = primary.reduce((a, v) => a + v, 0) * 2 * 0.85; // 2 primary posts / platform, 15% bundle discount
    const annual = monthlyPkg * 12 * 0.75 * 1.2; // 25% volume discount, +20% category exclusivity
    const avgDeal = primary.length ? primary.reduce((a, v) => a + v, 0) / primary.length : 0;

    const tier = TIERS.find(([t]) => followers >= t)[1];
    const authentic = clamp(62 + quality * 0.36, 55, 98);

    return {
      plats, followers, monthlyReach, dailyReach: monthlyReach / 30, yearlyReach, growth, projection,
      breakdown, quality, er, erBench, single, monthlyPkg, annual, avgDeal, tier, authentic, niche, tier1,
    };
  }

  function grade(q) {
    const ink = "var(--ink)", low = "var(--accent)";
    if (q >= 90) return ["A+", ink];
    if (q >= 80) return ["A", ink];
    if (q >= 70) return ["B+", ink];
    if (q >= 60) return ["B", ink];
    if (q >= 50) return ["C+", ink];
    if (q >= 40) return ["C", low];
    return ["D", low];
  }
  const barColor = (v) => (v >= 50 ? "var(--ink)" : "var(--accent)");

  function insights(r) {
    const out = [];
    const pct = (v) => (v * 100).toFixed(1) + "%";
    const eng = r.plats.filter((p) => p.er != null).sort((a, b) => b.er / b.def.er - a.er / a.def.er);
    if (eng.length) {
      const top = eng[0];
      out.push([top.er >= top.def.er ? "good" : "warn",
        `${top.def.name} is your most engaged audience: ${pct(top.er)} engagement vs ${pct(top.def.er)} typical. Lead your pitch with it.`]);
    }
    for (const p of r.plats) {
      if (p.vr < p.def.vr * 0.5 && p.followers > 0)
        out.push(["warn", `Only ${pct(p.vr)} of your ${p.def.name} followers see a typical post. Brands will price you on views, not followers.`]);
      if (p.er != null && p.likes > 0 && p.conv < 0.002)
        out.push(["warn", `Very few comments on ${p.def.name} relative to likes. Prompts and questions in captions raise perceived audience quality.`]);
      if (p.growth > 40)
        out.push(["bad", `${p.growth}% monthly growth on ${p.def.name} looks like a spike. Brands may audit it, so keep receipts of what went viral.`]);
    }
    if (r.tier1 < 25)
      out.push(["warn", `Only ${r.tier1}% of your audience is Tier-1. Global brands pay up to ~3x more per view for US/UK/EU audiences, so target local brands at local rates.`]);
    else if (r.tier1 >= 50)
      out.push(["good", `${r.tier1}% Tier-1 audience is a premium. Ask for global-brand rates.`]);
    if (r.niche >= 1.5) out.push(["good", `Your niche commands a ${r.niche}x CPM premium. Advertisers in it pay top dollar.`]);
    return out.slice(0, 5);
  }

  // ================================================================
  // Auth
  // ================================================================
  let user = null;
  const CLIENT_ID = (window.REACHLY_CONFIG && window.REACHLY_CONFIG.GOOGLE_CLIENT_ID) || "";

  function decodeJwt(token) {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(part).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(json);
  }

  function onGoogleCredential(resp) {
    try {
      const p = decodeJwt(resp.credential);
      signIn({ name: p.name, email: p.email, picture: p.picture, demo: false });
    } catch (e) {
      toast("Couldn't read Google sign-in response.");
    }
  }

  function initGoogle() {
    if (!CLIENT_ID) {
      $("#fallback-google").classList.remove("hidden");
      $("#demo-note").classList.remove("hidden");
      return;
    }
    let tries = 0;
    const wait = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(wait);
        google.accounts.id.initialize({ client_id: CLIENT_ID, callback: onGoogleCredential, auto_select: true });
        google.accounts.id.renderButton($("#google-btn"), { theme: "filled_black", size: "large", shape: "pill", text: "continue_with", width: 280 });
      } else if (++tries > 50) {
        clearInterval(wait);
        $("#fallback-google").classList.remove("hidden");
        $("#demo-note").textContent = "Couldn't load Google Sign-In (offline or blocked), so sign-in runs in demo mode.";
        $("#demo-note").classList.remove("hidden");
      }
    }, 100);
  }

  function signIn(u) {
    user = u;
    store.set("reachly:session", u);
    renderUserChips();
    const saved = store.get(dataKey());
    if (saved && saved.platforms?.length) showDashboard(saved);
    else showOnboarding(null);
  }

  function signOut() {
    store.del("reachly:session");
    if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
    user = null;
    profileCur = null;
    stopLive();
    $("#user-menu").classList.add("hidden");
    show("landing");
  }

  const dataKey = () => "reachly:data:" + (user?.email || "demo");

  function renderUserChips() {
    $$("[data-user-chip]").forEach((el) => {
      const first = (user.name || "?").split(" ")[0];
      el.innerHTML = (user.picture
        ? `<img src="${esc(user.picture)}" alt="" referrerpolicy="no-referrer" />`
        : `<span class="avatar">${esc(first[0] || "?")}</span>`) + `<span>${esc(first)}</span>`;
    });
    $("#menu-email").textContent = user.demo ? "Demo account (no Google Client ID set)" : user.email;
  }

  // ================================================================
  // Views
  // ================================================================
  function show(name) {
    $$(".view").forEach((v) => v.classList.add("hidden"));
    $("#view-" + name).classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // ---------- Onboarding ----------
  let selected = new Set();

  function buildSelectOptions() {
    const nicheOpts = Object.entries(NICHES).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("");
    $("#f-niche").innerHTML = nicheOpts;
    const curOpts = Object.keys(CURRENCIES).map((c) => `<option value="${c}">${c}</option>`).join("");
    $("#f-currency").innerHTML = curOpts;
    $("#d-currency").innerHTML = curOpts;
  }

  function logo(id) {
    const d = window.REACHLY_ICONS?.[id];
    return d ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>` : "";
  }
  function badge(def) {
    const id = Object.keys(PLATFORMS).find((k) => PLATFORMS[k] === def);
    return `<span class="p-badge" title="${def.name}">${logo(id) || def.short}</span>`;
  }

  function renderChips() {
    $("#platform-chips").innerHTML = Object.entries(PLATFORMS).map(([id, d]) =>
      `<button type="button" class="chip ${selected.has(id) ? "on" : ""}" data-id="${id}">${badge(d)}${d.name}</button>`).join("");
  }

  function platformForm(id, v = {}) {
    const d = PLATFORMS[id];
    const f = (key, label, ph, type = "number") =>
      `<label class="field"><span>${label}</span><input type="${type}" data-k="${key}" placeholder="${ph}" value="${esc(v[key] ?? "")}" min="0" step="any" /></label>`;
    const eng = d.er != null
      ? f("likes", "Avg likes / post", "e.g. 2500") + f("comments", "Avg comments / post", "e.g. 80")
      : "";
    return `<div class="card pform" data-platform="${id}">
      <div class="pform-head">${badge(d)} ${d.name}<button type="button" class="pform-remove" data-remove="${id}" aria-label="Remove ${d.name}">✕</button></div>
      <div class="pform-grid">
        ${f("handle", "Handle", "@you", "text")}
        ${f("followers", d.followersLabel || "Followers", "e.g. 120000")}
        ${f("views", d.viewsLabel || "Avg views / post", "e.g. 40000")}
        ${f("posts", d.postsLabel || "Posts / month", "e.g. 12")}
        ${eng}
        ${f("growth", "Monthly growth %", "e.g. 3.5")}
      </div>
    </div>`;
  }

  function renderForms(values = {}) {
    // keep whatever the user already typed
    const current = readForms();
    const merged = { ...values };
    for (const p of current) merged[p.id] = { ...(merged[p.id] || {}), ...p };
    $("#platform-forms").innerHTML = [...selected].map((id) => platformForm(id, merged[id])).join("");
    $("#platform-empty").classList.toggle("hidden", selected.size > 0);
  }

  function readForms() {
    return $$(".pform").map((el) => {
      const o = { id: el.dataset.platform };
      $$("input", el).forEach((i) => { if (i.value !== "") o[i.dataset.k] = i.type === "number" ? num(i.value) : i.value; });
      return o;
    });
  }

  function fillProfileForm(p) {
    $("#f-name").value = p.name || user?.name || "";
    $("#f-niche").value = p.niche || "lifestyle";
    $("#f-currency").value = p.currency || "USD";
    $("#f-tier1").value = p.tier1 ?? 30;
    $("#tier1-val").textContent = $("#f-tier1").value + "%";
    selected = new Set(p.platforms?.map((x) => x.id) || []);
    $("#platform-forms").innerHTML = "";
    renderChips();
    const vals = {};
    (p.platforms || []).forEach((x) => (vals[x.id] = x));
    renderForms(vals);
  }

  function showOnboarding(profile) {
    stopLive();
    fillProfileForm(profile || { name: user?.name, platforms: [] });
    $("#form-error").textContent = "";
    $("#btn-cancel-edit").classList.toggle("hidden", !profile);
    show("onboard");
  }

  function submitProfile() {
    const platforms = readForms();
    if (!platforms.length) return ($("#form-error").textContent = "Pick at least one platform.");
    $$(".pform input.invalid").forEach((i) => i.classList.remove("invalid"));
    for (const p of platforms) {
      const missing = ["followers", "views", "posts"].filter((k) => !num(p[k]));
      if (missing.length) {
        const form = $(`.pform[data-platform="${p.id}"]`);
        missing.forEach((k) => $(`input[data-k="${k}"]`, form).classList.add("invalid"));
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        return ($("#form-error").textContent = `Fill in the highlighted fields for ${PLATFORMS[p.id].name}.`);
      }
    }
    const profile = {
      name: $("#f-name").value.trim() || user?.name || "Creator",
      niche: $("#f-niche").value, currency: $("#f-currency").value, tier1: num($("#f-tier1").value), platforms,
    };
    store.set(dataKey(), profile);
    showDashboard(profile);
  }

  // ---------- Dashboard ----------
  let live = null;
  let profileCur = null;
  let resultCur = null;

  function stopLive() { if (live) { clearInterval(live); live = null; } }

  function showDashboard(profile) {
    profileCur = profile;
    currency = profile.currency || "USD";
    $("#d-currency").value = currency;
    $("#d-greeting").textContent = profile.name || "Creator";
    $("#d-subtitle").textContent = `${NICHES[profile.niche]?.[0] || "Creator"} · ${profile.platforms.length} platform${profile.platforms.length > 1 ? "s" : ""} · ${profile.tier1}% Tier-1 audience`;
    show("dashboard");
    render();
  }

  function render() {
    stopLive();
    const r = (resultCur = compute(profileCur));

    // ---- Live hero ----
    const perSecFollowers = (r.followers * (r.growth / 100)) / (30 * 86400);
    const perSecViews = r.monthlyReach / (30 * 86400);
    $("#d-tier").textContent = r.tier;
    $("#d-per-day").textContent = fmtCompact(perSecFollowers * 86400);
    $("#d-per-month").textContent = fmtCompact(r.followers * r.growth / 100);

    let liveFollowers = r.followers;
    const now = new Date();
    const secToday = (now - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 1000;
    let viewsToday = perSecViews * secToday;
    let sessionViews = 0;

    const oF = rollIn($("#d-live-followers"), liveFollowers);
    const oVT = rollIn($("#d-views-today"), viewsToday);
    const oVS = new Odometer($("#d-views-session"));
    oVS.set(0);

    setTimeout(() => {
      live = setInterval(() => {
        const jitter = () => 0.4 + Math.random() * 1.2; // natural, bursty feel
        liveFollowers += perSecFollowers * 1.5 * jitter();
        const dv = perSecViews * 1.5 * jitter();
        viewsToday += dv;
        sessionViews += dv;
        oF.set(liveFollowers);
        oVT.set(viewsToday);
        oVS.set(sessionViews);
      }, 1500);
    }, 1300);

    // ---- KPIs ----
    rollIn($("#k-daily"), r.dailyReach, (v) => fmtInt(v));
    rollIn($("#k-monthly"), r.monthlyReach, (v) => fmtInt(v));
    rollIn($("#k-yearly"), r.yearlyReach, (v) => fmtCompact(v, 2));
    rollIn($("#k-er"), r.er * 100, (v) => v.toFixed(2) + "%");
    $("#k-monthly-note").textContent = r.followers ? `${(r.monthlyReach / r.followers).toFixed(1)}x your total audience` : "";
    $("#k-er-note").textContent = r.erBench ? `${r.er >= r.erBench ? "above" : "below"} the ${(r.erBench * 100).toFixed(1)}% benchmark` : "";

    // ---- Quality ----
    const [g, gColor] = grade(r.quality);
    $("#q-grade").textContent = g;
    $("#q-grade").style.color = gColor;
    rollIn($("#q-score"), r.quality, (v) => Math.round(v) + "/100");
    const circ = 2 * Math.PI * 52;
    const gf = $("#gauge-fill");
    gf.style.stroke = gColor;
    gf.style.strokeDasharray = circ;
    gf.style.strokeDashoffset = circ;
    setTimeout(() => (gf.style.strokeDashoffset = circ * (1 - r.quality / 100)), 150);

    const labels = { engagement: "Engagement", reach: "View-through", conversation: "Comment depth", growth: "Growth health", geography: "Audience geography" };
    $("#q-bars").innerHTML = Object.entries(r.breakdown).filter(([, v]) => v != null).map(([k, v]) =>
      `<div><div class="q-bar-label"><span>${labels[k]}</span><b>${Math.round(v)}</b></div>
       <div class="q-bar"><div data-w="${v}" style="background:${barColor(v)}"></div></div></div>`).join("");
    setTimeout(() => $$("#q-bars .q-bar > div").forEach((b) => (b.style.width = b.dataset.w + "%")), 150);
    $("#q-authentic").textContent = `~${Math.round(r.authentic)}% · ${fmtCompact(r.followers * r.authentic / 100)} people`;
    $("#q-insights").innerHTML = insights(r).map(([c, t]) => `<li class="${c}">${esc(t)}</li>`).join("");

    renderMoney(r);
    renderChart(r, $("#chart-toggle .active").dataset.mode);
    renderDonut(r);
    renderFun(r);
    renderMilestone(r);
    renderBreakdown(r);
  }

  function renderMoney(r) {
    const pk = [
      ["Single post", r.single * 0.8, r.single * 1.25, "your top platform"],
      ["Monthly package", r.monthlyPkg, r.monthlyPkg * 1.2, "2 posts / platform"],
      ["Annual ambassador", r.annual, r.annual * 1.2, "12 months + exclusivity"],
    ];
    $("#packages").innerHTML = pk.map(([n, , , d], i) =>
      `<div class="package ${i === 1 ? "featured" : ""}"><div class="p-name">${n}</div><div class="num-md" id="pk-${i}"></div><div class="p-desc">${d}</div></div>`).join("");
    pk.forEach(([, lo], i) => rollIn($("#pk-" + i), lo, (v) => money(v, true)));

    updateEarnings(r);

    $("#ratecard").innerHTML = r.plats.map((p) =>
      `<div class="rc-platform">
        <div class="rc-head">${badge(p.def)} ${p.def.name}<span class="q">quality ${Math.round(p.quality)}</span></div>
        ${p.rates.map((x) => `<div class="rc-row"><span>${x.label}</span><b>${money(x.usd * 0.8)} – ${money(x.usd * 1.25)}</b></div>`).join("")}
      </div>`).join("");
  }

  let earnOdo = null;
  function updateEarnings(r) {
    const deals = num($("#deals").value);
    $("#deals-val").textContent = deals;
    const m = r.avgDeal * deals;
    if (!earnOdo || !document.body.contains(earnOdo.m.el)) {
      earnOdo = { m: rollIn($("#earn-month"), m, (v) => money(v, true)), y: rollIn($("#earn-year"), m * 12, (v) => money(v, true)) };
    } else {
      earnOdo.m.set(m);
      earnOdo.y.set(m * 12);
    }
  }

  // ---- Charts (hand-rolled SVG) ----
  function renderChart(r, mode) {
    const W = 560, H = 260, P = { l: 52, r: 16, t: 20, b: 30 };
    const data = r.projection.map((x) => x[mode]);
    const max = Math.max(...data) * 1.08 || 1;
    const min = mode === "followers" ? Math.min(...data) * 0.92 : 0;
    const x = (i) => P.l + (i / 12) * (W - P.l - P.r);
    const y = (v) => P.t + (1 - (v - min) / (max - min || 1)) * (H - P.t - P.b);
    const months = [];
    const d0 = new Date();
    for (let i = 0; i <= 12; i++) months.push(new Date(d0.getFullYear(), d0.getMonth() + i, 1).toLocaleString("en", { month: "short" }));

    let grid = "";
    for (let i = 0; i <= 4; i++) {
      const v = min + ((max - min) * i) / 4;
      grid += `<line class="gridline" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmtCompact(v)}</text>`;
    }
    const xl = months.map((m, i) => (i % 2 === 0 ? `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${m}</text>` : "")).join("");
    const defs = "";
    let body;
    if (mode === "followers") {
      const pts = data.map((v, i) => `${x(i)},${y(v)}`);
      body = `<path d="M${pts.join(" L")} L${x(12)},${H - P.b} L${x(0)},${H - P.b} Z" class="area"/>
        <path class="line draw" d="M${pts.join(" L")}"/>
        <circle class="dot" cx="${x(12)}" cy="${y(data[12])}" r="4"/>
        <text class="chart-tip" x="${x(12) - 8}" y="${y(data[12]) - 12}" text-anchor="end">${fmtCompact(data[12])}</text>`;
    } else {
      const bw = ((W - P.l - P.r) / 13) * 0.6;
      body = data.map((v, i) =>
        `<rect class="bar${i === 12 ? " last" : ""}" style="animation-delay:${i * 50}ms" x="${x(i) - bw / 2}" y="${y(v)}" width="${bw}" height="${H - P.b - y(v)}" rx="1"/>`).join("") +
        `<text class="chart-tip" x="${x(12)}" y="${y(data[12]) - 8}" text-anchor="middle">${fmtCompact(data[12])}</text>`;
    }
    const hover = `<g class="hover hidden"><line class="hover-line" y1="${P.t}" y2="${H - P.b}"/>
      <rect class="hover-box" rx="4" width="118" height="42"/><text class="axis hv-m"></text><text class="chart-tip hv-v"></text></g>
      <rect class="hover-zone" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>`;
    const host = $("#proj-chart");
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="12-month projection">${defs}${grid}${xl}${body}${hover}</svg>`;
    const svg = $("svg", host), g = $(".hover", svg);
    const zone = $(".hover-zone", svg);
    zone.addEventListener("mousemove", (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const i = clamp(Math.round(((loc.x - P.l) / (W - P.l - P.r)) * 12), 0, 12);
      const cx = x(i), bx = clamp(cx - 59, P.l, W - P.r - 118);
      g.classList.remove("hidden");
      $(".hover-line", g).setAttribute("x1", cx); $(".hover-line", g).setAttribute("x2", cx);
      $(".hover-box", g).setAttribute("x", bx); $(".hover-box", g).setAttribute("y", P.t);
      const m = $(".hv-m", g), v = $(".hv-v", g);
      m.setAttribute("x", bx + 12); m.setAttribute("y", P.t + 16);
      m.textContent = i === 0 ? "Now" : `${months[i]} · month ${i}`;
      v.setAttribute("x", bx + 12); v.setAttribute("y", P.t + 33);
      v.textContent = fmtInt(data[i]) + (mode === "reach" ? " views" : "");
    });
    zone.addEventListener("mouseleave", () => g.classList.add("hidden"));
  }

  function renderDonut(r) {
    const R = 70, C = 2 * Math.PI * R;
    const total = r.followers || 1;
    let off = 0;
    const ranked = [...r.plats].sort((a, b) => b.followers - a.followers);
    const shade = (p) => ["var(--accent)", "var(--s1)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s2)"][ranked.indexOf(p) % 6];
    const arcs = ranked.map((p) => {
      const frac = p.followers / total;
      const a = `<circle class="seg-arc" cx="90" cy="90" r="${R}" fill="none" style="stroke:${shade(p)}" stroke-width="10"
        stroke-dasharray="0 ${C}" data-len="${Math.max(0, frac * C - 2)}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)"/>`;
      off += frac * C;
      return a;
    }).join("");
    $("#donut").innerHTML = `<svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r="${R}" fill="none" style="stroke:var(--line)" stroke-width="10"/>${arcs}
      <text class="donut-num" x="90" y="92" text-anchor="middle">${fmtCompact(r.followers)}</text>
      <text class="donut-lbl" x="90" y="110" text-anchor="middle">audience</text></svg>`;
    setTimeout(() => $$("#donut .seg-arc").forEach((c) => c.setAttribute("stroke-dasharray", `${c.dataset.len} ${C}`)), 100);
    $("#donut-legend").innerHTML = ranked.map((p) =>
      `<div class="legend-row"><span class="sw" style="background:${shade(p)}"></span>${p.def.name}<span class="pct">${fmtCompact(p.followers)} · ${((p.followers / total) * 100).toFixed(0)}%</span></div>`).join("");
  }

  function renderFun(r) {
    const places = [["Iceland", 3.9e5], ["Goa", 1.6e6], ["Paris", 2.1e6], ["Singapore", 5.9e6], ["London", 9e6], ["Mumbai", 2.1e7],
      ["Australia", 2.7e7], ["Canada", 4e7], ["the UK", 6.8e7], ["Germany", 8.4e7], ["Japan", 1.24e8], ["the USA", 3.4e8]];
    const beaten = [...places].reverse().find(([, n]) => r.monthlyReach >= n);
    const attentionYears = (r.monthlyReach * 20) / (365 * 86400); // ~20s average watch per view
    const adValue = (r.monthlyReach / 1000) * 10; // what the same impressions cost as paid social
    const chainKm = (r.followers * 0.75) / 1000;
    const perMin = r.monthlyReach / (30 * 1440);

    const cards = [
      ["Stadiums", r.followers / 90000, (v) => v.toFixed(1) + "x", "Wembley Stadiums you could fill with your audience"],
      ["Monthly views", r.monthlyReach, (v) => fmtCompact(v), beaten ? `monthly views, more than the population of ${beaten[0]}` : "monthly views, and growing toward Iceland's whole population"],
      ["Ad value", adValue, (v) => money(v, true), "what brands would pay in ads to buy your monthly reach"],
      ["Attention", attentionYears, (v) => v.toFixed(1) + " yrs", "of human attention spent on your content every month"],
      ["Human chain", chainKm, (v) => fmtCompact(v) + " km", `long if your followers held hands${chainKm > 42.2 ? ` (${(chainKm / 42.2).toFixed(0)} marathons)` : ""}`],
      ["Per minute", perMin, (v) => fmtCompact(v), "people watching you every single minute"],
    ];
    $("#fun-grid").innerHTML = cards.map((c, i) =>
      `<div class="fun"><span class="label">${c[0]}</span><div class="num-lg" id="fun-${i}"></div><div class="fun-text">${esc(c[3])}</div></div>`).join("");
    cards.forEach((c, i) => rollIn($("#fun-" + i), c[1], c[2], 200 + i * 120));
  }

  function renderMilestone(r) {
    const target = MILESTONES.find((m) => m > r.followers) || r.followers * 2;
    const prev = [...MILESTONES].reverse().find((m) => m <= r.followers) || 0;
    $("#m-target").textContent = fmtCompact(target, 1).replace(".0", "");
    let eta;
    if (r.growth <= 0) eta = "set a growth % to see ETA";
    else {
      const months = Math.log(target / r.followers) / Math.log(1 + r.growth / 100);
      const d = new Date();
      d.setDate(d.getDate() + Math.ceil(months * 30.4));
      eta = months < 1 ? `~${Math.ceil(months * 30.4)} days away` : `ETA ${d.toLocaleString("en", { month: "short", year: "numeric" })}`;
    }
    $("#m-eta").textContent = eta;
    const pct = ((r.followers - prev) / (target - prev)) * 100;
    setTimeout(() => ($("#m-bar").style.width = clamp(pct, 2, 100) + "%"), 200);
    $("#m-note").textContent = `${fmtInt(r.followers)} / ${fmtInt(target)}. ${fmtInt(target - r.followers)} to go at ${r.growth.toFixed(1)}% avg monthly growth.`;
  }

  function renderBreakdown(r) {
    const pct = (v) => (v == null ? "—" : (v * 100).toFixed(2) + "%");
    $("#breakdown").innerHTML = `<thead><tr><th>Platform</th><th>Audience</th><th>Avg views</th><th>Monthly reach</th><th>Engagement</th><th>View-through</th><th>Growth/mo</th><th>Quality</th><th>Primary rate</th></tr></thead>
    <tbody>${r.plats.map((p) => `<tr>
      <td><div class="td-plat">${badge(p.def)} ${p.def.name}${p.handle ? ` <span class="muted small">${esc(p.handle)}</span>` : ""}</div></td>
      <td>${fmtCompact(p.followers)}</td><td>${fmtCompact(p.views)}</td><td>${fmtCompact(p.monthlyReach)}</td>
      <td>${pct(p.er)}</td><td>${pct(p.vr)}</td><td>${p.growth}%</td>
      <td style="color:${barColor(p.quality)}">${Math.round(p.quality)}</td><td>${money(p.rates[0].usd)}</td></tr>`).join("")}</tbody>`;
  }

  // ================================================================
  // Landing demo counter
  // ================================================================
  let heroTimer = null;
  function renderLogoStrip() {
    $("#logo-strip").innerHTML = Object.entries(PLATFORMS).map(([id, d]) =>
      `<span title="${d.name}">${logo(id)}</span>`).join("");
  }

  // Plain-text media kit for pasting into emails / DMs to brands
  function mediaKit() {
    const r = resultCur, p = profileCur;
    const lines = [
      `${p.name}: Media Kit`,
      `${NICHES[p.niche]?.[0] || ""} creator · ${r.tier}`,
      "",
      `Total audience: ${fmtInt(r.followers)}`,
      `Monthly reach: ${fmtInt(r.monthlyReach)} views`,
      `Engagement rate: ${(r.er * 100).toFixed(2)}%`,
      `Audience quality: ${grade(r.quality)[0]} (${Math.round(r.quality)}/100)`,
      `Tier-1 audience: ${p.tier1}%`,
      "",
      "PLATFORMS",
      ...r.plats.map((x) => `• ${x.def.name}${x.handle ? " " + x.handle : ""}: ${fmtCompact(x.followers)} followers, ${fmtCompact(x.views)} avg views`),
      "",
      "RATES",
      ...r.plats.flatMap((x) => x.rates.slice(0, 2).map((d) => `• ${x.def.name} ${d.label}: ${money(d.usd)}`)),
      `• Monthly package: ${money(r.monthlyPkg)}`,
      `• Annual ambassador: ${money(r.annual)}`,
    ];
    return lines.join("\n");
  }

  async function copyMediaKit() {
    const text = mediaKit();
    try {
      await navigator.clipboard.writeText(text);
      toast("Media kit copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("Media kit copied to clipboard"); } catch { toast("Couldn't access the clipboard."); }
      ta.remove();
    }
  }

  function startHeroDemo() {
    const r = compute(SAMPLE);
    let f = r.followers;
    const now = new Date();
    let v = (r.monthlyReach / (30 * 86400)) * ((now - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 1000);
    const oF = rollIn($("#hero-odo"), f);
    const oV = rollIn($("#hero-odo-views"), v);
    rollIn($("#hero-odo-rate"), r.plats[0].rates[0].usd, (x) => "$" + fmtInt(roundNice(x)));
    // sped up on the landing page so it's visibly alive
    heroTimer = setInterval(() => {
      f += Math.ceil(Math.random() * 4);
      v += Math.ceil(Math.random() * 40);
      oF.set(f);
      oV.set(v);
    }, 1200);
  }

  // ================================================================
  // Wire up
  // ================================================================
  function init() {
    buildSelectOptions();
    initGoogle();
    renderLogoStrip();
    startHeroDemo();

    $("#fallback-google").addEventListener("click", () =>
      signIn({ name: "Demo Creator", email: "demo@reachly.local", picture: "", demo: true }));

    $("#platform-chips").addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (!c) return;
      const id = c.dataset.id;
      selected.has(id) ? selected.delete(id) : selected.add(id);
      renderChips();
      renderForms();
    });
    $("#f-tier1").addEventListener("input", (e) => ($("#tier1-val").textContent = e.target.value + "%"));
    $("#fill-sample").addEventListener("click", (e) => {
      e.preventDefault();
      $("#platform-forms").innerHTML = "";
      fillProfileForm({ ...SAMPLE, name: $("#f-name").value || user?.name });
    });
    $("#btn-analyze").addEventListener("click", submitProfile);
    $("#btn-edit").addEventListener("click", () => showOnboarding(profileCur));
    $("#btn-signout").addEventListener("click", signOut);
    $("#btn-cancel-edit").addEventListener("click", () => profileCur && showDashboard(profileCur));
    $("#btn-mediakit").addEventListener("click", copyMediaKit);
    $("#platform-forms").addEventListener("click", (e) => {
      const b = e.target.closest("[data-remove]");
      if (!b) return;
      selected.delete(b.dataset.remove);
      b.closest(".pform").remove();
      renderChips();
      renderForms();
    });
    $("#btn-user").addEventListener("click", (e) => { e.stopPropagation(); $("#user-menu").classList.toggle("hidden"); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".user-menu")) $("#user-menu").classList.add("hidden"); });
    $$(".brand").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      if (profileCur && user) showDashboard(profileCur);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    $("#d-currency").addEventListener("change", (e) => {
      currency = e.target.value;
      profileCur.currency = currency;
      store.set(dataKey(), profileCur);
      earnOdo = null;
      renderMoney(resultCur);
      renderFun(resultCur);
      renderBreakdown(resultCur);
    });
    $("#deals").addEventListener("input", () => updateEarnings(resultCur));
    $("#chart-toggle").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("#chart-toggle button").forEach((x) => x.classList.toggle("active", x === b));
      renderChart(resultCur, b.dataset.mode);
    });

    const session = store.get("reachly:session");
    if (session) signIn(session);
  }

  document.addEventListener("DOMContentLoaded", init);
})();

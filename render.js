/* 조승영 소개 페이지: content.json -> 화면. index.html과 admin.html 미리보기가 같이 씀 */
(function (g) {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // 허용 링크: https/http, mailto, tel, #탭id
  function safeHref(h) {
    h = String(h || "").trim();
    if (!h) return "";
    if (/^#[a-z0-9-]+$/i.test(h)) return h;
    if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
    return "";
  }
  function linkAttrs(h) {
    return /^https?:/i.test(h) ? ' target="_blank" rel="noopener"' : "";
  }
  function renderHero(p, avatarHtml) {
    p = p || {};
    var b = p.button || {};
    var bh = safeHref(b.href);
    return '<header class="hero" id="top">' + (avatarHtml || "") +
      '<p class="kicker">' + esc(p.kicker) + "</p><h1>" + esc(p.name) + "</h1>" +
      (p.alias ? '<p class="alias">' + esc(p.alias) + "</p>" : "") +
      '<p class="lead">' + esc(p.lead) + "</p>" +
      (p.affil ? '<p class="affil">' + esc(p.affil) + "</p>" : "") +
      (b.label && bh ? '<a class="button" href="' + esc(bh) + '"' + linkAttrs(bh) + ">" + esc(b.label) + "</a>" : "") +
      "</header>";
  }
  function renderQuick(list) {
    var out = (list || []).map(function (q) {
      var h = safeHref(q.href);
      return q.label && h ? '<a href="' + esc(h) + '"' + linkAttrs(h) + ">" + esc(q.label) + " →</a>" : "";
    }).join("");
    return out ? '<div class="quick">' + out + "</div>" : "";
  }
  function renderItem(it) {
    var h = safeHref(it.href);
    var title = esc(it.title);
    if (h && !it.linkLabel) title = '<a class="tlink" href="' + esc(h) + '"' + linkAttrs(h) + ">" + title + "</a>";
    return "<p><b>" + title + "</b>" +
      (it.text ? "<span>" + esc(it.text) + "</span>" : "") +
      (h && it.linkLabel ? '<a class="more" href="' + esc(h) + '"' + linkAttrs(h) + ">" + esc(it.linkLabel) + " →</a>" : "") +
      "</p>";
  }
  function renderTab(t, i) {
    var stat = t.stat && t.stat.value ? '<p class="stat">' + esc(t.stat.value) + '</p><p class="muted">' + esc(t.stat.label) + "</p>" : "";
    var items = !(t.items || []).length ? "" : t.layout === "links"
      ? '<div class="links">' + t.items.map(function (it) {
          var h = safeHref(it.href), label = esc(it.title) + (it.text ? "\u3000" + esc(it.text) : "");
          return h ? '<a href="' + esc(h) + '"' + linkAttrs(h) + ">" + label + "</a>" : "<p>" + label + "</p>";
        }).join("") + "</div>"
      : '<div class="list">' + t.items.map(renderItem).join("") + "</div>";
    return '<section id="' + esc(t.id) + '"' + (i % 2 ? ' class="alt"' : "") + ">" +
      '<p class="eyebrow">' + esc(String(i + 1).padStart(2, "0")) + " / " + esc(t.eyebrow) + "</p>" +
      "<h2>" + esc(t.title) + "</h2>" +
      (t.intro ? '<p class="copy">' + esc(t.intro) + "</p>" : "") + stat + items + "</section>";
  }
  function renderNav(d) {
    return '<nav class="tabs" aria-label="바로가기"><a class="brand" href="#top">' + esc((d.profile || {}).name) + "</a>" +
      '<div class="tablinks">' + (d.tabs || []).map(function (t) {
        return '<a href="#' + esc(t.id) + '" data-tab="' + esc(t.id) + '">' + esc(t.label || t.title) + "</a>";
      }).join("") + "</div></nav>";
  }
  function renderSite(d, opts) {
    opts = opts || {};
    return renderNav(d) + "<main>" + '<div class="intro">' + renderHero(d.profile, opts.avatarHtml) + renderQuick(d.quickLinks) + "</div>" +
      (d.tabs || []).map(renderTab).join("") +
      "<footer>" + esc((d.profile || {}).name) + (d.profile && d.profile.alias ? " · " + esc(d.profile.alias) : "") + "</footer></main>";
  }
  // 탭으로 이동: 화면보다 짧은 칸은 화면 가운데, 긴 칸은 맨 위부터
  function goTo(id, doc, smooth) {
    doc = doc || document;
    var el = doc.getElementById(id);
    if (!el) return false;
    var vh = g.innerHeight, h = el.offsetHeight;
    el.scrollIntoView({ block: h < vh * 0.9 ? "center" : "start", behavior: smooth ? "smooth" : "auto" });
    return true;
  }
  // 지금 보는 탭 표시 + 탭 링크 누르면 부드럽게 이동
  function wireNav(doc) {
    doc = doc || document;
    if (!doc.__goWired) {
      doc.__goWired = true;
      doc.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute("href").slice(1);
        if (id === "top") { e.preventDefault(); g.scrollTo({ top: 0, behavior: "smooth" }); history.replaceState(null, "", "#top"); return; }
        if (goTo(id, doc, true)) { e.preventDefault(); history.replaceState(null, "", "#" + id); }
      });
    }
    if (location.hash && !/[?&]preview=1/.test(location.search)) setTimeout(function () { goTo(location.hash.slice(1), doc, false); }, 0);
    var links = [].slice.call(doc.querySelectorAll(".tabs .tablinks a"));
    var bar = doc.querySelector(".tabs .tablinks");
    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-tab") === id;
        a.classList.toggle("on", on);
        if (on && bar) { var l = a.offsetLeft - 16; if (l < bar.scrollLeft || a.offsetLeft + a.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: l, behavior: "smooth" }); }
      });
    }
    if ("IntersectionObserver" in g) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: "-45% 0px -50% 0px" });
      [].forEach.call(doc.querySelectorAll("main section[id]"), function (s) { io.observe(s); });
    }
  }
  g.SiteRender = { renderSite: renderSite, wireNav: wireNav, goTo: goTo, safeHref: safeHref, esc: esc };
})(window);

// kr0 Asset Desk front end. No build step, no libraries.
"use strict";

const $ = (s) => document.querySelector(s);
const state = {
  config: null, assets: [], shown: [], cur: -1, picked: new Set(),
  filters: { grade: "none", source: "", origin: "", game: "", folder: "", tag: "", q: "" },
  suggestions: [], pageSize: 240, limit: 240,
};
const PROV_FIELDS = [
  ["origin", "Origin", "select"], ["creator", "Creator"], ["tool", "Tool"], ["model", "Model"],
  ["workflowId", "Workflow"], ["jobId", "Job"], ["parentIds", "Parents"], ["createdAt", "Created"],
  ["costCU", "Cost (CU)"], ["license", "Licence"], ["sourceUrl", "Source URL"],
  ["prompt", "Prompt", "textarea"], ["notes", "Notes", "textarea"],
];

async function api(path, body) {
  const opt = body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  const res = await fetch(path, opt);
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok || data.error) throw new Error(data.error || res.statusText);
  return data;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => (t.hidden = true), 2600);
}

function mediaUrl(a) {
  if (a.source === "scenario") return a.url;
  return `/api/file?root=${encodeURIComponent(a.root)}&path=${encodeURIComponent(a.path)}`;
}

function folderOf(a) { return (a.source === "scenario" ? "" : a.root + "/") + (a.folder || ""); }

function haystack(a) {
  const p = a.provenance || {};
  return [a.name, a.path, a.caption, (a.tags || []).join(" "), (a.collections || []).join(" "), p.prompt, p.creator, p.model, p.notes]
    .filter(Boolean).join(" ").toLowerCase();
}

function applyFilters() {
  const f = state.filters, words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  state.shown = state.assets.filter((a) => {
    if (f.grade === "none" && a.grade) return false;
    if ((f.grade === "up" || f.grade === "down") && a.grade !== f.grade) return false;
    if (f.source && a.source !== f.source) return false;
    if (f.origin && ((a.provenance || {}).origin || "unknown") !== f.origin) return false;
    if (f.game && a.game !== f.game) return false;
    if (f.folder && !folderOf(a).startsWith(f.folder)) return false;
    if (f.tag && !(a.tags || []).includes(f.tag)) return false;
    if (words.length) { const h = haystack(a); if (!words.every((w) => h.includes(w))) return false; }
    return true;
  });
  state.shown.sort((x, y) => String(y.provenance?.createdAt || "").localeCompare(String(x.provenance?.createdAt || "")));
  state.limit = state.pageSize;
  renderGrid();
}

function cardHtml(a, i) {
  const url = mediaUrl(a);
  let inner = `<span>${a.kind || "file"}</span>`;
  if (a.kind === "image" && url) inner = `<img loading="lazy" src="${url}" alt="">`;
  else if (a.kind === "video" && url) inner = `<video src="${url}" muted preload="metadata"></video>`;
  const badge = a.grade === "up" ? "👍" : a.grade === "down" ? "👎" : "";
  const cls = ["card", a.grade || "", i === state.cur ? "cur" : "", state.picked.has(a.id) ? "picked" : ""].join(" ");
  return `<div class="${cls}" data-i="${i}"><div class="img">${inner}</div><span class="src">${a.source === "scenario" ? "scn" : esc(a.root)}</span><span class="badge">${badge}</span><div class="meta">${esc(a.name || a.id)}</div></div>`;
}

function renderGrid() {
  const grid = $("#grid");
  const list = state.shown.slice(0, state.limit);
  grid.innerHTML = list.length ? list.map(cardHtml).join("") : `<div class="empty">Nothing here. Try another filter, or Scan folders / Sync Scenario.</div>`;
  if (state.shown.length > state.limit) grid.insertAdjacentHTML("beforeend", `<div class="empty"><button id="more">Show more (${state.shown.length - state.limit} left)</button></div>`);
  const graded = state.assets.filter((a) => a.grade).length;
  $("#count").textContent = `${state.shown.length} shown · ${graded}/${state.assets.length} graded`;
  renderSel();
}

function refreshCard(i) {
  const el = document.querySelector(`.card[data-i="${i}"]`);
  if (el) el.outerHTML = cardHtml(state.shown[i], i);
}

function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function renderSide() {
  // Folder tree, two levels deep, with counts.
  const counts = new Map();
  for (const a of state.assets) {
    const parts = folderOf(a).split("/").filter(Boolean);
    for (let d = 1; d <= Math.min(parts.length, 3); d++) {
      const key = parts.slice(0, d).join("/");
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const keys = [...counts.keys()].sort();
  $("#tree").innerHTML = `<div data-folder="" class="${state.filters.folder ? "" : "on"}">All folders</div>` + keys.map((k) => {
    const depth = k.split("/").length - 1;
    return `<div data-folder="${esc(k)}" class="${state.filters.folder === k ? "on" : ""}" style="padding-left:${6 + depth * 12}px">${esc(k.split("/").pop())} <small>${counts.get(k)}</small></div>`;
  }).join("");
  api("/api/tags").then(({ tags }) => {
    $("#tagcloud").innerHTML = tags.slice(0, 60).map(([t, n]) => `<span data-tag="${esc(t)}" class="${state.filters.tag === t ? "on" : ""}">${esc(t)} ${n}</span>`).join("") || `<small class="muted">No tags yet</small>`;
    $("#taglist").innerHTML = tags.map(([t]) => `<option value="${esc(t)}">`).join("");
  });
}

function current() { return state.shown[state.cur]; }

function select(i, scroll = true) {
  if (i < 0 || i >= state.shown.length) return;
  const prev = state.cur; state.cur = i;
  if (i >= state.limit) { state.limit = i + state.pageSize; renderGrid(); } else { refreshCard(prev); refreshCard(i); }
  if (scroll) document.querySelector(`.card[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" });
  renderDetail();
}

async function renderDetail() {
  const a = current(), d = $("#detail");
  if (!a) { d.hidden = true; return; }
  d.hidden = false;
  const url = mediaUrl(a);
  $("#preview").innerHTML = a.kind === "image" ? `<img src="${url}" alt="">` : a.kind === "video" ? `<video src="${url}" controls loop autoplay muted></video>` : a.kind === "audio" ? `<audio src="${url}" controls></audio>` : "No preview";
  $("#dname").textContent = a.name || a.id;
  document.querySelectorAll(".thumb").forEach((b) => b.classList.toggle("on", b.dataset.grade === a.grade));
  $("#dtags").innerHTML = (a.tags || []).map((t) => `<span>${esc(t)}<b data-untag="${esc(t)}">×</b></span>`).join("");
  renderProv(a);
  const where = [];
  if (a.source === "scenario") {
    where.push(`Scenario: <a href="${esc(a.provenance?.sourceUrl)}" target="_blank" rel="noopener">${esc(a.scenarioId)}</a>`);
    if (a.collections?.length) where.push("Collections: " + esc(a.collections.join(", ")));
    if (a.sourceTags?.length) where.push("Scenario tags: " + esc(a.sourceTags.join(", ")));
    if (a.caption) where.push("Caption: " + esc(a.caption));
    where.push(`<button id="push">Push tags and grade to Scenario</button>`);
  } else {
    where.push(`${esc(state.config.roots[a.root] || a.root)}${state.config.roots[a.root]?.includes("\\") ? "\\" : "/"}${esc(a.path)}`);
    if (a.size) where.push(`${(a.size / 1048576).toFixed(2)} MB`);
    if (a.sha256) where.push("sha256 " + esc(a.sha256.slice(0, 16)) + "…");
    if (a.retired) where.push("Retired");
  }
  if (a.width) where.push(`${a.width} × ${a.height}`);
  $("#where").innerHTML = where.map((w) => `<div>${w}</div>`).join("");
  $("#history").innerHTML = "";
  const id = a.id;
  const [{ suggestions }, { events }] = await Promise.all([api("/api/suggest?id=" + encodeURIComponent(id)), api("/api/history?id=" + encodeURIComponent(id))]);
  if (current()?.id !== id) return;
  state.suggestions = suggestions;
  $("#suggest").innerHTML = suggestions.slice(0, 9).map((s, i) => `<span data-addtag="${esc(s.tag)}" title="${esc(s.why)}${s.uses ? ` · used ${s.uses}×` : " · new tag"}"><i>${i + 1}</i>${esc(s.tag)}</span>`).join("");
  $("#history").innerHTML = events.reverse().map((e) => `<div>${esc(e.at)} ${esc(e.by)}: ${esc(Object.keys(e.data || {}).join(", ") || e.kind)}</div>`).join("") || "No changes yet";
}

function renderProv(a) {
  const p = a.provenance || {}, by = a.provenanceSetBy || {};
  $("#prov").innerHTML = PROV_FIELDS.map(([k, label, type]) => {
    const v = Array.isArray(p[k]) ? p[k].join(", ") : (p[k] ?? "");
    const lab = `<label class="${by[k] === "auto" ? "auto" : ""}" for="pv-${k}">${label}</label>`;
    if (type === "select") return lab + `<select id="pv-${k}" name="${k}">${state.config.origins.map((o) => `<option ${o === (v || "unknown") ? "selected" : ""}>${o}</option>`).join("")}</select>`;
    if (type === "textarea") return `${lab}<textarea id="pv-${k}" name="${k}" class="">${esc(v)}</textarea>`;
    return `${lab}<input id="pv-${k}" name="${k}" value="${esc(v)}">`;
  }).join("") + `<label for="pv-game">Game</label><select id="pv-game" name="__game"><option value="">none</option>${state.config.games.map((g) => `<option ${g === a.game ? "selected" : ""}>${g}</option>`).join("")}</select>`
    + `<label>C2PA</label><span>${p.c2pa ? "Content credentials in the file" + (p.c2paSigner ? ", signed by " + esc(p.c2paSigner) : "") : "none found"}</span>`;
}

async function patch(a, change) {
  const { asset } = await api("/api/asset", { id: a.id, patch: change });
  Object.assign(a, asset);
  return a;
}

async function grade(g) {
  const a = current(); if (!a) return;
  const value = a.grade === g ? null : g;
  await patch(a, { grade: value });
  refreshCard(state.cur);
  document.querySelectorAll(".thumb").forEach((b) => b.classList.toggle("on", b.dataset.grade === a.grade));
  // In "to grade" view, move on to the next one.
  if (value && state.cur < state.shown.length - 1) select(state.cur + 1);
  else renderDetail();
  $("#count").textContent = `${state.shown.length} shown · ${state.assets.filter((x) => x.grade).length}/${state.assets.length} graded`;
}

async function addTag(tag) {
  const a = current(); if (!a || !tag.trim()) return;
  await patch(a, { tags: [...(a.tags || []), tag] });
  renderDetail(); renderSide();
}

async function removeTag(tag) {
  const a = current(); if (!a) return;
  await patch(a, { tags: (a.tags || []).filter((t) => t !== tag) });
  renderDetail(); renderSide();
}

function renderSel() {
  $("#selinfo").hidden = state.picked.size === 0;
  $("#selcount").textContent = state.picked.size;
}

async function bulk(body) {
  const ids = [...state.picked];
  await api("/api/bulk", { ids, ...body });
  await load(false);
  toast(`Updated ${ids.length} assets`);
}

async function load(side = true) {
  const { assets } = await api("/api/assets");
  const curId = current()?.id;
  state.assets = assets;
  applyFilters();
  if (curId) { const i = state.shown.findIndex((a) => a.id === curId); if (i >= 0) select(i, false); }
  if (side) renderSide();
}

function wire() {
  document.querySelectorAll(".seg").forEach((seg) => seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    state.filters[seg.dataset.filter] = b.dataset.v; state.cur = -1; applyFilters();
  }));
  $("#game").innerHTML += state.config.games.map((g) => `<option>${g}</option>`).join("");
  $("#game").onchange = (e) => { state.filters.game = e.target.value; applyFilters(); };
  let qt; $("#q").oninput = (e) => { clearTimeout(qt); qt = setTimeout(() => { state.filters.q = e.target.value; applyFilters(); }, 150); };
  $("#tree").onclick = (e) => { const d = e.target.closest("[data-folder]"); if (!d) return; state.filters.folder = d.dataset.folder; applyFilters(); renderSide(); };
  $("#tagcloud").onclick = (e) => { const t = e.target.closest("[data-tag]"); if (!t) return; state.filters.tag = state.filters.tag === t.dataset.tag ? "" : t.dataset.tag; applyFilters(); renderSide(); };
  $("#grid").onclick = (e) => {
    if (e.target.id === "more") { state.limit += state.pageSize; renderGrid(); return; }
    const c = e.target.closest(".card"); if (!c) return;
    const i = +c.dataset.i;
    if (e.shiftKey || e.ctrlKey || e.metaKey) { togglePick(i); return; }
    select(i, false);
  };
  document.querySelectorAll(".thumb").forEach((b) => (b.onclick = () => grade(b.dataset.grade)));
  $("#tagin").onkeydown = async (e) => { if (e.key === "Enter") { e.preventDefault(); await addTag(e.target.value); e.target.value = ""; } if (e.key === "Escape") e.target.blur(); };
  $("#detail").addEventListener("click", async (e) => {
    if (e.target.dataset.untag) removeTag(e.target.dataset.untag);
    const s = e.target.closest("[data-addtag]"); if (s) addTag(s.dataset.addtag);
    if (e.target.id === "push") {
      try { const r = await api("/api/push-tags", { id: current().id }); toast(r.pushed.length ? "Pushed: " + r.pushed.join(", ") : "Scenario already has these tags"); }
      catch (err) { toast(err.message); }
    }
  });
  $("#prov").addEventListener("change", async (e) => {
    const a = current(), el = e.target;
    if (el.name === "__game") { await patch(a, { game: el.value || null }); return toast("Saved"); }
    let v = el.value;
    if (el.name === "parentIds") v = v.split(",").map((s) => s.trim()).filter(Boolean);
    if (el.name === "costCU") v = v === "" ? null : Number(v);
    try { await patch(a, { provenance: { [el.name]: v } }); el.previousElementSibling?.classList.remove("auto"); toast("Saved"); }
    catch (err) { toast(err.message); }
  });
  $("#scan").onclick = async () => { toast("Scanning…"); const r = await api("/api/scan", {}); toast(r.results.map((x) => `${x.label || x.root}: ${x.files ?? x.error}`).join(" · ")); load(); };
  $("#sync").onclick = async () => { toast("Syncing Scenario…"); try { const r = await api("/api/sync/scenario", {}); toast(`Scenario: ${r.scenario} assets`); load(); } catch (err) { toast(err.message); } };
  $("#export").onclick = () => {
    const ids = new Set(state.shown.map((a) => a.id));
    api("/api/export" + (state.filters.game ? "?game=" + state.filters.game : "")).then((m) => {
      m.assets = m.assets.filter((a) => ids.has(a.id));
      const blob = new Blob([JSON.stringify(m, null, 1)], { type: "application/json" });
      const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `asset-manifest${state.filters.game ? "-" + state.filters.game : ""}.json` });
      link.click();
    });
  };
  $("#manifest").onclick = async () => {
    const game = state.filters.game;
    if (!game) return toast("Pick a game first");
    try { const r = await api("/api/manifest/write", { game }); toast(`Wrote ${r.assets} assets to ${r.path}` + (r.heldUnknownOrigin.length ? ` · held back ${r.heldUnknownOrigin.length} with unknown origin (set it, then write again)` : "")); }
    catch (err) { toast(err.message); }
  };
  document.querySelectorAll("[data-bulk]").forEach((b) => (b.onclick = () => bulk({ patch: { grade: b.dataset.bulk } })));
  $("#bulktag").onkeydown = (e) => { if (e.key === "Enter" && e.target.value.trim()) { bulk({ addTags: [e.target.value] }); e.target.value = ""; } };
  $("#bulkorigin").onchange = (e) => { if (e.target.value) bulk({ patch: { provenance: { origin: e.target.value } } }); e.target.value = ""; };
  $("#bulkclear").onclick = () => { state.picked.clear(); renderGrid(); };

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "j") { e.preventDefault(); select(state.cur + 1); }
    else if (k === "ArrowLeft" || k === "k") { e.preventDefault(); select(Math.max(0, state.cur - 1)); }
    else if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      const cols = Math.max(1, Math.round($("#grid").clientWidth / (document.querySelector(".card")?.offsetWidth + 10 || 180)));
      select(Math.max(0, state.cur + (k === "ArrowDown" ? cols : -cols)));
    }
    else if (k === "u" || k === "+") grade("up");
    else if (k === "d" || k === "-") grade("down");
    else if (k === "0") { const a = current(); if (a?.grade) grade(a.grade); }
    else if (k === "t") { e.preventDefault(); $("#tagin").focus(); }
    else if (k === "/") { e.preventDefault(); $("#q").focus(); }
    else if (k === "x") togglePick(state.cur);
    else if (/^[1-9]$/.test(k) && state.suggestions[+k - 1]) addTag(state.suggestions[+k - 1].tag);
  });
}

function togglePick(i) {
  const a = state.shown[i]; if (!a) return;
  state.picked.has(a.id) ? state.picked.delete(a.id) : state.picked.add(a.id);
  refreshCard(i); renderSel();
}

(async function init() {
  state.config = await api("/api/config");
  wire();
  await load();
  if (state.shown.length) select(0);
})();

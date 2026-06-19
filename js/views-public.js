"use strict";
/* ============================================================
   PUBLIC VIEWS — home, activities, our story, our team
   ============================================================ */

function homeView() {
  const sorted = sortedActivities();
  // Temporary display-only index, read by activityCard()/the hero tiles below
  // to pick a deterministic fallback gradient for activities with no photo.
  sorted.forEach((activity, index) => { activity._i = index; });

  // The 3 most recent activities, reused for both the hero tiles and the
  // "Latest Activities" card grid further down this page.
  const featured = sorted.slice(0, 3);

  const heroTiles = featured.map((activity, index) => {
    const images = activeImages(activity);
    const hasImage = images.length > 0;
    const cover = hasImage ? bg(images[0]) : ('background:' + GRADS[index % GRADS.length]);
    const tileStyle = index === 0 ? 'grid-column:1 / -1;height:226px' : 'height:152px';
    const imageA11yAttrs = hasImage ? `role="img" aria-label="${attr(activity.title)}"` : 'aria-hidden="true"';
    return `
      <div ${imageA11yAttrs} style="position:relative;border-radius:18px;overflow:hidden;background:#E8F2EC;${tileStyle};${cover};box-shadow:var(--shadow-md)">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(16,36,26,.64),transparent 56%)"></div>
        <div style="position:absolute;left:14px;right:14px;bottom:12px;color:#fff">
          <div style="font-size:11px;opacity:.88;font-weight:600">${esc(fmtDate(activity.date))}</div>
          <div style="font-size:14px;font-weight:600;line-height:1.3;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(activity.title)}</div>
        </div>
      </div>`;
  }).join('');

  return `
  <main id="main-content" tabindex="-1" style="outline:none">
    <section style="position:relative;overflow:hidden">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="resp-grid hero-sec" style="max-width:1180px;margin:0 auto;padding:70px 24px 58px;display:grid;gap:50px;align-items:center;position:relative">
        <div style="animation:fadeUp .6s ease both">
          <span style="display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #DCEBE2;color:var(--primary);padding:7px 14px;border-radius:999px;font-size:12.5px;font-weight:600">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--primary)"></span>${T.hero_badge}
          </span>
          <h1 style="font-family:var(--font-display);font-weight:600;font-size:clamp(34px,4.4vw,58px);line-height:1.08;letter-spacing:-.5px;margin:18px 0 0;text-wrap:balance;color:var(--ink)">${esc(state.org.fullName.en)}</h1>
          <p style="font-size:16.5px;line-height:1.75;color:var(--ink-soft);margin:18px 0 0;max-width:520px">${esc(state.org.about.en)}</p>
          <div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">
            <button class="btn-primary" onclick="App.goActivities()" style="background:var(--primary);color:#fff;padding:13px 24px;border:none;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;box-shadow:0 12px 26px -12px var(--primary)">${T.cta_activities}</button>
            <button class="btn-ghost" onclick="App.goHistory()" style="background:#fff;color:#3a4d44;padding:13px 22px;border:1px solid #D2E5D9;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer">${T.cta_about}</button>
          </div>
        </div>
        ${heroTiles ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;animation:fadeUp .7s .12s ease both">${heroTiles}</div>`
          : `<div aria-hidden="true" style="height:380px;border-radius:22px;background:linear-gradient(135deg,var(--primary),var(--primary-strong));display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.9);font-family:var(--font-display);font-weight:600;font-size:56px">${esc(state.org.short)}</div>`}
      </div>
    </section>

    <section style="max-width:1180px;margin:0 auto;padding:54px 24px 20px">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:28px">
        <div>
          ${kicker(T.latest_kicker)}
          <h2 style="font-family:var(--font-display);font-weight:600;font-size:clamp(25px,2.6vw,34px);margin:10px 0 0;letter-spacing:-.4px;color:var(--ink)">${T.latest}</h2>
        </div>
        <button class="btn-outline" onclick="App.goActivities()" style="background:#fff;color:var(--primary);border:1px solid #D2E5D9;padding:10px 18px;border-radius:11px;font-weight:600;font-size:14px;cursor:pointer">${T.view_all} →</button>
      </div>
      ${featured.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:26px">${featured.map(activityCard).join('')}</div>`
        : `<div style="text-align:center;padding:60px 20px;background:#fff;border:1px dashed #CFE5D8;border-radius:20px;color:var(--muted)">${T.empty_pub}</div>`}
    </section>
  </main>`;
}

function activitiesView() {
  const sorted = sortedActivities();
  sorted.forEach((activity, index) => { activity._i = index; }); // see homeView() for why
  return `
  <main id="main-content" tabindex="-1" style="outline:none;max-width:1180px;margin:0 auto;padding:54px 24px 40px;animation:fadeIn .3s ease both">
    <div style="margin-bottom:30px">
      ${kicker(T.latest_kicker)}
      <h1 style="font-family:var(--font-display);font-weight:600;font-size:clamp(29px,3.2vw,42px);margin:10px 0 0;letter-spacing:-.4px;color:var(--ink)">${T.act_title}</h1>
      <p style="color:var(--muted);font-size:15px;margin:8px 0 0">${T.act_sub}</p>
    </div>
    ${sorted.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:26px">${sorted.map(activityCard).join('')}</div>`
      : `<div style="text-align:center;padding:70px 20px;background:#fff;border:1px dashed #CFE5D8;border-radius:20px;color:var(--muted)">${T.empty_pub}</div>`}
  </main>`;
}

function historyView() {
  // state.milestones is already sorted oldest -> newest by loadData() (see state.js)
  const milestones = state.milestones;
  const story = (state.org.history && state.org.history.story) || '';
  return `
  <main id="main-content" tabindex="-1" style="outline:none;animation:fadeIn .3s ease both">
    <section style="position:relative;overflow:hidden;border-bottom:1px solid #DCEBE2">
      <div class="hero-glow" aria-hidden="true"></div>
      <div style="max-width:820px;margin:0 auto;padding:64px 24px 48px;position:relative">
        ${kicker(T.hist_kicker)}
        <h1 style="font-family:var(--font-display);font-weight:600;font-size:clamp(31px,3.6vw,48px);margin:14px 0 0;letter-spacing:-.5px;color:var(--ink)">${T.hist_title}</h1>
        <p style="font-size:17px;line-height:1.8;color:var(--ink-soft);margin:20px 0 0;white-space:pre-wrap">${esc(story)}</p>
      </div>
    </section>
    <section style="max-width:820px;margin:0 auto;padding:48px 24px 50px">
      <h2 style="font-family:var(--font-display);font-weight:600;font-size:25px;margin:0 0 28px;color:var(--ink)">${T.timeline_title}</h2>
      <div>
        ${milestones.map(milestone => `
          <div style="display:grid;grid-template-columns:84px 1fr;gap:22px;position:relative">
            <div style="font-family:var(--font-display);font-weight:600;font-size:20px;color:var(--primary);text-align:right;padding-top:1px">${esc(milestone.year)}</div>
            <div style="border-left:2px solid #DCEBE2;padding:0 0 30px 24px;position:relative">
              <span aria-hidden="true" style="position:absolute;left:-8px;top:3px;width:14px;height:14px;border-radius:50%;background:var(--gold);border:3px solid var(--primary-pale);box-shadow:0 2px 6px -1px rgba(173,138,78,.6)"></span>
              <h3 style="font-family:var(--font-display);font-weight:600;font-size:18px;margin:0;color:var(--ink)">${esc(milestone.title)}</h3>
              <p style="margin:7px 0 0;font-size:15px;line-height:1.7;color:var(--ink-soft)">${esc(milestone.desc)}</p>
            </div>
          </div>`).join('')}
      </div>
    </section>
  </main>`;
}

function membersView() {
  const members = state.members;

  const memberCard = (member, index) => {
    const hasPhoto = !!member.photo;
    const avatar = hasPhoto ? bg(member.photo) : ('background:' + GRADS[index % GRADS.length]);
    const imageA11yAttrs = hasPhoto ? `role="img" aria-label="${attr(member.name)}"` : 'aria-hidden="true"';
    return `
    <div class="team-card" style="flex:0 1 250px;max-width:250px;min-width:200px;background:#fff;border:1px solid #DCEBE2;border-radius:20px;overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .25s ease,box-shadow .25s ease">
      <div ${imageA11yAttrs} style="height:230px;background:#E8F2EC;${avatar};display:flex;align-items:center;justify-content:center">
        ${!hasPhoto ? `<span style="font-family:var(--font-ui);font-weight:700;font-size:44px;color:rgba(255,255,255,.92)">${esc(initials(member.name))}</span>` : ''}
      </div>
      <div style="padding:20px 22px 24px">
        <h3 style="font-family:var(--font-display);font-weight:600;font-size:19px;margin:0;color:var(--ink)">${esc(member.name)}</h3>
        <div style="color:var(--primary);font-weight:600;font-size:14px;margin-top:4px">${esc(member.role)}</div>
      </div>
    </div>`;
  };

  // Members sharing the same `sort` rank are shown together in one row
  // (e.g. co-leads at rank 0), then rows are ordered by rank ascending.
  const rankOrder = [];
  const membersByRank = new Map();
  members.forEach(member => {
    const rank = member.sort || 0;
    if (!membersByRank.has(rank)) { membersByRank.set(rank, []); rankOrder.push(rank); }
    membersByRank.get(rank).push(member);
  });
  rankOrder.sort((a, b) => a - b);

  const rankRows = rankOrder
    .map(rank => `<div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-bottom:24px">${membersByRank.get(rank).map(memberCard).join('')}</div>`)
    .join('');

  return `
  <main id="main-content" tabindex="-1" style="outline:none;max-width:1180px;margin:0 auto;padding:54px 24px 40px;animation:fadeIn .3s ease both">
    <div style="margin-bottom:32px">
      ${kicker(T.team_kicker)}
      <h1 style="font-family:var(--font-display);font-weight:600;font-size:clamp(29px,3.2vw,42px);margin:10px 0 0;letter-spacing:-.4px;color:var(--ink)">${T.mem_title}</h1>
      <p style="color:var(--muted);font-size:15px;margin:8px 0 0">${T.mem_sub}</p>
    </div>
    ${members.length ? rankRows : `<div style="text-align:center;padding:70px 20px;background:#fff;border:1px dashed #CFE5D8;border-radius:20px;color:var(--muted)">${T.empty_members}</div>`}
  </main>`;
}

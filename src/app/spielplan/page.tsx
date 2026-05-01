export default function SpielplanPage() {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FC Köniz – Aktuelle Spiele</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: transparent; padding: 4px 0; }
          #root { min-height: 200px; }
          .fck-loading { text-align: center; color: #aaa; padding: 40px; font-size: 14px; }
          .fck-error { text-align: center; color: #e55; padding: 40px; font-size: 13px; }
          .league-block { margin-bottom: 28px; }
          .league-title {
            font-size: 16px; font-weight: 700; color: #1a1a1a;
            text-transform: uppercase; letter-spacing: 0.06em;
            margin-bottom: 14px; display: flex; align-items: center; gap: 10px;
          }
          .league-accent {
            display: inline-block; width: 4px; height: 20px;
            background: #C9A84C; border-radius: 2px; flex-shrink: 0;
          }
          .match-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
          }
          @media (max-width: 580px) { .match-grid { grid-template-columns: 1fr; } }
          .match-card {
            background: #fff; border: 1px solid #e5e5e5;
            border-radius: 10px; overflow: hidden;
          }
          .card-header {
            background: #1a1a1a; padding: 12px 16px; text-align: center;
          }
          .card-header span {
            font-size: 13px; font-weight: 700; color: #fff;
            letter-spacing: 0.06em; text-transform: uppercase;
          }
          .card-body { padding: 14px 16px 18px; }
          .meta { text-align: center; font-size: 12px; color: #777; line-height: 1.6; }
          .meta .sep { margin: 0 6px; opacity: 0.4; }
          .badge {
            display: inline-block; font-size: 9px; font-weight: 700;
            letter-spacing: 0.1em; text-transform: uppercase;
            padding: 2px 8px; border-radius: 3px; margin: 8px 0 10px;
          }
          .badge-home { background: rgba(201,168,76,0.15); color: #9a7a20; }
          .badge-away { background: #f0f0f0; color: #888; }
          .divider { height: 1px; background: #f0f0f0; margin: 0 0 14px; }
          .teams { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .team { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; min-width: 0; }
          .logo {
            width: 54px; height: 54px; border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 900; letter-spacing: 0.04em;
          }
          .logo-fck { background: #1a1a1a; border: 2px solid rgba(201,168,76,0.4); color: #C9A84C; }
          .logo-opp { background: #f0f0f0; border: 2px solid #e0e0e0; color: #888; }
          .team-name { font-size: 12px; font-weight: 500; color: #1a1a1a; text-align: center; line-height: 1.35; }
          .score { font-size: 24px; font-weight: 900; letter-spacing: 0.05em; flex-shrink: 0; padding-bottom: 22px; }
          .score-live { color: #1a1a1a; }
          .score-pending { color: #bbb; }
          .footer-note { text-align: center; font-size: 10px; color: #ccc; margin-top: 12px; padding-bottom: 4px; }
        `}</style>
      </head>
      <body>
        <div id="root"><div className="fck-loading">Spiele werden geladen…</div></div>
        <div className="footer-note">Daten: al-la.ch · Automatisch aktualisiert</div>
        <script dangerouslySetInnerHTML={{ __html: `
(function() {
  var LEAGUES = [
    { id: '36600', name: '2. Liga Interregional', teamLabel: '1. Mannschaft' },
    { id: '36601', name: '3. Liga', teamLabel: '2. Mannschaft' }
  ];
  var FCK_NAMES = ['FC Köniz', 'FC Koeniz', 'Köniz'];

  function isFCK(name) {
    return FCK_NAMES.some(function(n) { return name.indexOf(n) !== -1; });
  }

  function stripTags(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim()
      .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  }

  function abbr(name) {
    if (isFCK(name)) return 'FCK';
    var words = name.replace(/^(FC|SC|BSC|AS|CS|NK)\\s+/, '').split(/\\s+/);
    if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
    return words.map(function(w) { return w[0]; }).join('').substring(0, 3).toUpperCase();
  }

  function parseHTML(html, league) {
    var matches = [];
    var listStart = html.indexOf('nisListeRD list-group');
    if (listStart === -1) return matches;
    var listEnd = html.indexOf('nisRanglisteRD', listStart);
    var listHtml = html.slice(listStart, listEnd > listStart ? listEnd : listStart + 20000);

    var sections = listHtml.split('class="list-group-item sppTitel">');
    for (var s = 1; s < sections.length; s++) {
      var section = sections[s];
      var dm = section.match(/^\\s*((?:Mo|Di|Mi|Do|Fr|Sa|So))\\s+(\\d{2}\\.\\d{2}\\.\\d{4})/);
      if (!dm) continue;
      var dayName = dm[1], date = dm[2];
      var dateFormatted = dayName + '., ' + date;

      var parts = section.split('<a href="');
      for (var p = 1; p < parts.length; p++) {
        var part = parts[p];
        var urlEnd = part.indexOf('"');
        if (urlEnd === -1) continue;
        var rawUrl = part.substring(0, urlEnd);
        if (rawUrl.indexOf('tg=') === -1) continue;

        var closeIdx = part.indexOf('</a>');
        var mHtml = closeIdx !== -1 ? part.substring(0, closeIdx) : part.substring(0, 2000);

        var tm = mHtml.match(/class="[^"]*time[^"]*"[^>]*>\\s*(\\d{2}:\\d{2})\\s*</);
        var time = tm ? tm[1] + ' Uhr' : '';

        var taM = mHtml.match(/class="[^"]*teamA[^"]*"[^>]*>([\\s\\S]*?)<\\/div>/);
        var teamA = taM ? stripTags(taM[1]) : '';
        var tbM = mHtml.match(/class="[^"]*teamB[^"]*"[^>]*>([\\s\\S]*?)<\\/div>/);
        var teamB = tbM ? stripTags(tbM[1]) : '';

        if (!isFCK(teamA) && !isFCK(teamB)) continue;

        var scoreA = null, scoreB = null;
        var gm = mHtml.match(/class="[^"]*goals[^"]*"[^>]*>([\\s\\S]*?)<\\/div>/);
        if (gm) {
          var gt = stripTags(gm[1]);
          var sm = gt.match(/(\\d+)\\s*[:\\-]\\s*(\\d+)/);
          if (sm) { scoreA = sm[1]; scoreB = sm[2]; }
        }

        matches.push({
          leagueId: league.id, leagueName: league.name, teamLabel: league.teamLabel,
          dateFormatted: dateFormatted, time: time,
          teamA: teamA, teamB: teamB,
          scoreA: scoreA, scoreB: scoreB,
          isHome: isFCK(teamA)
        });
      }
    }
    return matches;
  }

  function renderCard(match) {
    var isHome = match.isHome;
    var leftName = isHome ? match.teamA : match.teamB;
    var rightName = isHome ? match.teamB : match.teamA;
    var hasScore = match.scoreA !== null;
    var scoreDisp = hasScore
      ? (isHome ? match.scoreA + ' : ' + match.scoreB : match.scoreB + ' : ' + match.scoreA)
      : '- : -';

    return '<div class="match-card">' +
      '<div class="card-header"><span>' + match.teamLabel + '</span></div>' +
      '<div class="card-body">' +
        '<div class="meta">' + match.dateFormatted + ', ' + match.time + '<span class="sep">|</span>Meisterschaft</div>' +
        '<div style="text-align:center">' +
          '<span class="badge ' + (isHome ? 'badge-home' : 'badge-away') + '">' +
            (isHome ? 'Heimspiel' : 'Auswärtsspiel') +
          '</span>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<div class="teams">' +
          '<div class="team">' +
            '<div class="logo ' + (isHome ? 'logo-fck' : 'logo-opp') + '">' + abbr(leftName) + '</div>' +
            '<div class="team-name">' + leftName + '</div>' +
          '</div>' +
          '<div class="score ' + (hasScore ? 'score-live' : 'score-pending') + '">' + scoreDisp + '</div>' +
          '<div class="team">' +
            '<div class="logo ' + (!isHome ? 'logo-fck' : 'logo-opp') + '">' + abbr(rightName) + '</div>' +
            '<div class="team-name">' + rightName + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderLeague(name, matches) {
    if (matches.length === 0) return '';
    return '<div class="league-block">' +
      '<div class="league-title"><span class="league-accent"></span>' + name + '</div>' +
      '<div class="match-grid">' + matches.map(renderCard).join('') + '</div>' +
    '</div>';
  }

  function render(allMatches) {
    var liga2 = allMatches.filter(function(m) { return m.leagueId === '36600'; });
    var liga3 = allMatches.filter(function(m) { return m.leagueId === '36601'; });
    var html = renderLeague('2. Liga Interregional', liga2) + renderLeague('3. Liga', liga3);
    document.getElementById('root').innerHTML = html || '<div class="fck-error">Keine aktuellen Spiele gefunden.</div>';
  }

  function fetchLeague(league) {
    var url = 'https://matchcenter.al-la.ch/default.aspx?v=1341&oid=4&lng=1&t=' + league.id + '&a=trr';
    return fetch(url, { headers: { 'Accept': 'text/html' } })
      .then(function(r) { return r.text(); })
      .then(function(html) { return parseHTML(html, league); });
  }

  Promise.all(LEAGUES.map(fetchLeague))
    .then(function(results) {
      var all = results.reduce(function(a, b) { return a.concat(b); }, []);
      render(all);
    })
    .catch(function(e) {
      document.getElementById('root').innerHTML = '<div class="fck-error">Fehler: ' + e.message + '</div>';
    });
})();
        `}} />
      </body>
    </html>
  )
}

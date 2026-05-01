import { NextResponse } from 'next/server'

export interface Match {
  leagueId: string
  leagueName: string
  teamLabel: string
  dayName: string
  date: string
  dateFormatted: string
  time: string
  type: string
  venue: string
  teamA: string
  teamB: string
  scoreA: string | null
  scoreB: string | null
  isHome: boolean
  matchUrl: string
}

const LEAGUES = [
  { id: '36600', name: '2. Liga Interregional', teamLabel: '1. Mannschaft' },
  { id: '36601', name: '3. Liga',               teamLabel: '2. Mannschaft' },
]

const FCKOENIZ_NAMES = ['FC Köniz', 'FC Koeniz', 'Köniz']

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'de-CH,de;q=0.9',
  'Referer': 'https://www.google.com/',
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function isFCKoeniz(name: string): boolean {
  return FCKOENIZ_NAMES.some(n => name.includes(n))
}

function parseMatches(html: string, league: typeof LEAGUES[0]): Match[] {
  const matches: Match[] = []

  const listStart = html.indexOf('nisListeRD list-group')
  if (listStart === -1) return matches
  const listEnd = html.indexOf('nisRanglisteRD', listStart)
  const listHtml = html.slice(listStart, listEnd > listStart ? listEnd : listStart + 20000)

  // Split by date headers
  const dateSections = listHtml.split('class="list-group-item sppTitel">')

  for (const section of dateSections) {
    // Extract date from start of section
    const dateMatch = section.match(/^\s*((?:Mo|Di|Mi|Do|Fr|Sa|So))\s+(\d{2}\.\d{2}\.\d{4})/)
    if (!dateMatch) continue

    const dayName = dateMatch[1]
    const date = dateMatch[2]
    const dateFormatted = `${dayName}., ${date}`

    // Split section into individual match links by splitting on <a href=
    const linkParts = section.split('<a href="')

    for (const part of linkParts.slice(1)) {
      // Get URL up to closing quote
      const urlEnd = part.indexOf('"')
      if (urlEnd === -1) continue
      const rawUrl = part.substring(0, urlEnd)
      if (!rawUrl.includes('tg=')) continue

      // Get HTML content up to closing </a>
      const closeIdx = part.indexOf('</a>')
      const matchHtml = closeIdx !== -1 ? part.substring(0, closeIdx) : part.substring(0, 2000)
      const matchUrl = `https://matchcenter.al-la.ch/${rawUrl.replace(/&amp;/g, '&')}`

      // Time
      const timeMatch = matchHtml.match(/class="[^"]*time[^"]*"[^>]*>\s*(\d{2}:\d{2})\s*</)
      const time = timeMatch ? `${timeMatch[1]} Uhr` : ''

      // Team A (home)
      const teamAMatch = matchHtml.match(/class="[^"]*teamA[^"]*"[^>]*>([\s\S]*?)<\/div>/)
      const teamA = teamAMatch ? stripTags(teamAMatch[1]) : ''

      // Team B (away)
      const teamBMatch = matchHtml.match(/class="[^"]*teamB[^"]*"[^>]*>([\s\S]*?)<\/div>/)
      const teamB = teamBMatch ? stripTags(teamBMatch[1]) : ''

      // Only include FC Köniz matches
      if (!isFCKoeniz(teamA) && !isFCKoeniz(teamB)) continue

      // Score
      let scoreA: string | null = null
      let scoreB: string | null = null
      const goalsMatch = matchHtml.match(/class="[^"]*goals[^"]*"[^>]*>([\s\S]*?)<\/div>/)
      if (goalsMatch) {
        const goalsText = stripTags(goalsMatch[1])
        const scoreMatch = goalsText.match(/(\d+)\s*[:\-]\s*(\d+)/)
        if (scoreMatch) {
          scoreA = scoreMatch[1]
          scoreB = scoreMatch[2]
        }
      }

      const isHome = isFCKoeniz(teamA)

      matches.push({
        leagueId: league.id,
        leagueName: league.name,
        teamLabel: league.teamLabel,
        dayName,
        date,
        dateFormatted,
        time,
        type: 'Meisterschaft',
        venue: isHome ? 'Sportplatz Köniz – Hauptplatz' : 'Auswärtsspiel',
        teamA,
        teamB,
        scoreA,
        scoreB,
        isHome,
        matchUrl,
      })
    }
  }

  return matches
}

async function fetchLeague(league: typeof LEAGUES[0]): Promise<Match[]> {
  const url = `https://matchcenter.al-la.ch/default.aspx?v=1341&oid=4&lng=1&t=${league.id}&a=trr`
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  return parseMatches(html, league)
}

export async function GET() {
  const results = await Promise.allSettled(LEAGUES.map(fetchLeague))

  const matches: Match[] = []
  const errors: string[] = []

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') {
      matches.push(...r.value)
    } else {
      errors.push(`${LEAGUES[i].name}: ${r.reason}`)
    }
  }

  return NextResponse.json({
    matches,
    errors: errors.length ? errors : undefined,
    updatedAt: new Date().toISOString(),
  })
}

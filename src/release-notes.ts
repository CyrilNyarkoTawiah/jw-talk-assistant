/* Release notes shown in the in-app update dialog — key = APP_VERSION.
   The weekly prep job must add an entry here whenever it bumps the version. */
export const RELEASE_NOTES: Record<string, string[]> = {
  '2.8.4': [
    'Internal: visit beacon reliability fix',
  ],
  '2.8.3': [
    'The update prompt now must be updated to continue — no more Later option',
  ],
  '2.8.2': [
    'Internal: activated private visit counting',
  ],
  '2.8.1': [
    'Internal plumbing for optional private visit counting (dormant until the owner deploys it)',
  ],
  '2.8.0': [
    'Five new weeks fully prepared — November 23 through December 27',
    'Tap the week pill on the L&M and Study pages to switch between weeks',
  ],
  '2.7.5': [
    'Fix: the refresh button on the news feed now works',
  ],
  '2.7.4': [
    'Fix: removed the last stretch of blank space at the bottom of the Home page',
  ],
  '2.7.3': [
    'Home page now ends at its footer — no blank space beneath',
    'Centered animated swipe bands (arrows in your swipe direction) and a refresh button on the news feed',
  ],
  '2.7.2': [
    'Swiping between Home and the news feed now always lands cleanly — no blank pages in either direction',
  ],
  '2.7.1': [
    'Discover feed polish — no blank space under Home, animated swipe arrows, sharper story pictures, cleaner tiles',
  ],
  '2.7.0': [
    'Swipe right on Home for the latest news from jw.org — a Discover-style feed (mobile only)',
    'One update dialog now shows everything new since your last update, with a single refresh',
  ],
  '2.6.3': [
    'Scroll memory refined — exact position, every time',
  ],
  '2.6.2': [
    'Scroll memory fix — now returns to the exact spot you left',
  ],
  '2.6.1': [
    'Scroll memory is now rock-solid — returns exactly where you left off',
  ],
  '2.6.0': [
    'Life & Ministry and the Watchtower Study now remember your scroll position when you switch pages',
  ],
  '2.5.4': [
    'Reverted the section colour experiment — kept only the part symbols',
  ],
  '2.5.3': [
    'Stronger colour separation between the three meeting parts',
  ],
  '2.5.2': [
    'Cleaner Life & Ministry sections — stronger colour separation, no repeated labels',
  ],
  '2.5.1': [
    'Life & Ministry part headers now carry their official symbols (treasure, megaphone, people) with larger, clearer headers',
  ],
  '2.5.0': [
    'Life & Ministry now divided into its three meeting parts with clean colour-coded headers',
    'Watchtower comments rewritten to sound natural, with main points and highlights for every paragraph',
    'Deeper insight & application now a clearly visible button on every study question',
  ],
  '2.4.5': [
    'Assignment 6 discussions now show the workbook picture with answers to the questions beneath it',
  ],
  '2.4.4': [
    'Fix: the installed app could go blank right after an update — smoother update handling',
  ],
  '2.4.3': [
    'Congregation Bible Study: prepared answers to every question in the chapter (Dig Deeper, Reflect, Meditate)',
  ],
  '2.4.2': [
    'New app icon — now the same gold book-and-check logo from the app corner',
  ],
  '2.4.1': [
    'Apply Yourself assignments now demonstrated around their LMD lesson points',
    'Elegant link styling — no underlines until hover',
    '“Built by C.N.T” credit on every page',
  ],
  '2.4.0': [
    'Update prompt now appears on every new release, even for the installed Chrome app',
    'Update dialog tells you what is new in each release',
    'App shell always loads the latest deployed version',
  ],
}

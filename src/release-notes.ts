/* Release notes shown in the in-app update dialog — key = APP_VERSION.
   The weekly prep job must add an entry here whenever it bumps the version. */
export const RELEASE_NOTES: Record<string, string[]> = {
  '2.4.0': [
    'Update prompt now appears on every new release, even for the installed Chrome app',
    'Update dialog tells you what is new in each release',
    'App shell always loads the latest deployed version',
  ],
}

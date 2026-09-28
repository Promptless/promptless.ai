declare module 'virtual:starport-search' {
  const config: import('./core/types').ClientConfig;
  export default config;
}
declare module 'virtual:starport-search/server' {
  export const artifactDir: string;
}
declare module 'turndown-plugin-gfm' {
  export const gfm: import('turndown').Plugin;
}

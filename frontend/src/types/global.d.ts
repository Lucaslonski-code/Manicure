declare global {
  var __DEV__: boolean;
}

declare module '*.mp3' {
  const content: string;
  export default content;
}

declare module '*.aac' {
  const content: string;
  export default content;
}

declare module '*.m4a' {
  const content: string;
  export default content;
}

export {};

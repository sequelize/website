// the goal of this file is to declare to typescript the different file types that webpack can import

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const src: string;
  export default src;
}

// Additional type declarations for modules that might not have proper TypeScript definitions

declare module "null-loader" {
  const loader: any;
  export default loader;
}

// Add types for Webpack config ignoreWarnings
declare module "webpack" {
  interface Configuration {
    ignoreWarnings?: Array<{
      module?: RegExp;
      message?: RegExp;
    }>;
  }
}

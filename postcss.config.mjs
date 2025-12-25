// /** @type {import('postcss-load-config').Config} */
// const config = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };

// export default config;
/** @type {import('postcss-load-config').Config} */
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'tailwindcss/nesting': {},  // Tailwind's official nesting plugin
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
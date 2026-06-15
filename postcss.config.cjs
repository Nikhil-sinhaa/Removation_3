/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},  // Tailwind's official nesting plugin
    tailwindcss: {},
    autoprefixer: {},
  },
};

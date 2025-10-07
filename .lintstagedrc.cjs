module.exports = {
  '*.{js,jsx,ts,tsx}': ['npx eslint --fix --max-warnings 100', 'npx prettier --write'],
  '*.{json,css,md}': ['npx prettier --write'],
};

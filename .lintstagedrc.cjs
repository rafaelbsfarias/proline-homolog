module.exports = {
  '*.{js,jsx,ts,tsx}': ['npx eslint --fix', 'npx prettier --write'],
  '*.{json,css,md}': ['npx prettier --write'],
};

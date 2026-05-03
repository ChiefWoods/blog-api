// eslint-disable-next-line import/no-anonymous-default-export
export default {
  "*.{js,jsx,ts,tsx,mjs,cjs}": (files) => [
    `oxlint --fix ${files.join(" ")}`,
    `oxfmt ${files.join(" ")}`,
  ],
};

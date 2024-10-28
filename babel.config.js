module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript",'babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './'
        }
      }]
    ]
  };
};

const webpack = require("webpack");
const path = require("path");

module.exports = (/* args, env */) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const mode = isDevelopment ? "development" : "production";
  const rootPath = path.resolve(__dirname);
  const publicPath = path.resolve(rootPath, isDevelopment ? "" : "docs");
  const outputPath = path.resolve(publicPath, "js");

  return {
    mode,
    entry: { index: "./src/index.tsx" },
    devtool: isDevelopment ? "inline-source-map" : undefined,
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      fallback: {
        path: false,
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      }),
    ],
    output: {
      filename: "[name].js",
      path: outputPath,
      publicPath: "js/",
    },
    optimization: {
      splitChunks: {
        name: "common",
        chunks: "all",
      },
    },
    devServer: {
      contentBase: publicPath,
      disableHostCheck: true,
      hot: true,
      open: true,
      port: 4000,
      publicPath: "/js/",
      watchContentBase: true,
    },
  };
};

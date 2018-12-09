const path = require('path');
module.exports = {
    entry: [
        "./source/drillphish.ts"
    ],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "drillphish.min.js"
    },
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        minimize: true
    },
    target: "web"
};
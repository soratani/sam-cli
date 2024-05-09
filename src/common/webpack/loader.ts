import { PackageInfo,   PACKAGE_TYPE, } from "@/utils/config";
import { RuleSetRule } from "webpack";
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import autoprefixer from 'autoprefixer';
import pxtorem from 'postcss-pxtorem';

export default function createModule(pkg: PackageInfo): RuleSetRule[] {
    const styleLess: any = {
        test: /\.(css|less)$/,
        exclude: /\.module\.(css|less)$/,
        use: [
            "css-loader",
            {
                loader: 'postcss-loader',
                options: {
                    postcssOptions: {
                        plugins: [
                            'postcss-preset-env',
                            autoprefixer(),
                            pxtorem({
                                rootValue: 16, // 基准值（浏览器默认字体大小为 16px）
                                unitPrecision: 5, // 单位精度
                                propList: ['*'], // 要转换的属性列表，'*' 表示所有单位为 px 的属性都会被转换
                                selectorBlackList: [], // 忽略不需要转换的选择器
                                replace: true, // 是否替换包含 rem 的属性值而不是添加 fallback
                                mediaQuery: true, // 允许在媒体查询中转换 px
                                minPixelValue: 0, // 设置最小转换数值，小于这个值的 px 不会被转换
                            }),
                        ]
                    }
                }
            },
            {
                loader: 'less-loader',
                options: {
                    lessOptions: {
                        javascriptEnabled: true
                    }
                }
            }
        ]
    }
    const styleModuleLess: any = {
        test: /\.module.(css|less)$/,
        use: [
            {
                loader: 'css-loader',
                options: {
                    esModule: false,
                    url: true,
                    modules: {
                        auto: true,
                        exportGlobals: true,
                    },
                },
            },
            {
                loader: 'postcss-loader',
                options: {
                    postcssOptions: {
                        plugins: [
                            'postcss-preset-env',
                            autoprefixer(),
                            pxtorem({
                                rootValue: 16, // 基准值（浏览器默认字体大小为 16px）
                                unitPrecision: 5, // 单位精度
                                propList: ['*'], // 要转换的属性列表，'*' 表示所有单位为 px 的属性都会被转换
                                selectorBlackList: [], // 忽略不需要转换的选择器
                                replace: true, // 是否替换包含 rem 的属性值而不是添加 fallback
                                mediaQuery: true, // 允许在媒体查询中转换 px
                                minPixelValue: 0, // 设置最小转换数值，小于这个值的 px 不会被转换
                            }),
                        ]
                    }
                }
            },
            {
                loader: 'less-loader',
                options: {
                    lessOptions: {
                        javascriptEnabled: true
                    }
                }
            },
        ]
    }
    
    const reactBabel: any = {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                        '@babel/preset-react',
                        '@babel/preset-typescript'
                    ],
                    cacheDirectory: true,
                    cacheCompression: false,
                    plugins: [
                        '@babel/plugin-transform-runtime',
                        '@babel/plugin-transform-modules-commonjs'
                    ].filter(Boolean)
                }
            }
        ]
    }
    const list = [
        reactBabel,
        {
            test: /\.(png|jpe?g|gif|webp|svg|ico)$/,
            type: 'asset',
            parser: {
                dataUrlCondition: {
                    maxSize: 8 * 1024
                }
            },
            generator: {
                filename: `static/image/[name].[contenthash:8][ext]`
            }
        },
        {
            test: /\.(woff2?|eot|ttf|otf|mp3|mp4|avi|mkv)$/i,
            type: 'asset/resource',
            generator: {
                filename: `static/media/[name].[contenthash:8][ext]`
            }
        },
    ];
    if (![PACKAGE_TYPE.APP].includes(pkg.type)) {
        styleLess.use.unshift(MiniCssExtractPlugin.loader)
        styleModuleLess.use.unshift(MiniCssExtractPlugin.loader)
    } else {
        styleLess.use.unshift("style-loader")
        styleModuleLess.use.unshift("style-loader")
    }
    if (pkg.theme) {
        styleLess.use.push({
            loader: 'style-resources-loader',
            options: {
                patterns: pkg.theme
            }
        })
        styleModuleLess.use.push({
            loader: 'style-resources-loader',
            options: {
                patterns: pkg.theme
            }
        })
    }
    return list.concat([styleLess, styleModuleLess]);
}
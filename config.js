const config = {
    rate: {
        windowMs: 5 * 60 * 1000,
        max: 100
    },
    proxies: {
        "profile": {
            guarded: true,
            target: "http://api.duckduckgo.com/",
            changeOrigin: true,
            pathRewrite: {
                [`^/search`]: "",
            }
        }
    }
}

export { config };
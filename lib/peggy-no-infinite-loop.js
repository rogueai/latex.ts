module.exports = {
    use: (config, options) => {
        config.passes.check = config.passes.check.filter((c) => c.name !== 'reportInfiniteRepetition');
    }
}

const { ethers } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr()

const main = async () => {
    await c.verify('SoulmetaFingerPlay', addrs.fingerPlay)
    const tokens = [
        {
            symbol: 'BNB',
            payId: 1,
            addr: ethers.constants.AddressZero,
            min: '0.02',
            decimals: 18
        },
        {
            symbol: 'SOUL',
            payId: 2,
            addr: '0x9c2DcEB3fEBEC3b7245a0c2395aFdd92d9364862',
            min: '2'
        },
        {
            symbol: 'KAKA',
            payId: 3,
            addr: '0x26a1BdFa3bb86b2744c4A42EBfDd205761d13a8a',
            min: '10'
        },
        {
            symbol: 'iZi',
            payId: 4,
            addr: '0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747',
            min: '1'
        },
        {
            symbol: 'USDT',
            payId: 5,
            addr: '0x55d398326f99059fF775485246999027B3197955',
            min: '4'
        },
        {
            symbol: 'STI',
            payId: 6,
            addr: '0x4f5f7a7Dca8BA0A7983381D23dFc5eaF4be9C79a',
            min: '10'
        },
        {
            symbol: 'FIST',
            payId: 7,
            addr: '0xc9882def23bc42d53895b8361d0b1edc7570bc6a',
            min: '1'
        },
        {
            symbol: 'GMT',
            payId: 8,
            addr: '0x3019bf2a2ef8040c242c9a4c5c4bd4c81678b2a1',
            min: '1'
        }
    ]

    for (let token of tokens) {
        if (token.payId === 1) {
            token.min = ethers.utils.parseUnits(token.min, token.decimals)
            continue
        }
        const c = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol:IERC20Metadata', token.addr)
        const symbol = await c.symbol()
        if (symbol !== token.symbol) {
            console.log('Errrrrrrrr', token, symbol)
            return
        }
        token.decimals = await c.decimals()
        token.min = ethers.utils.parseUnits(token.min, token.decimals)
    }
    console.log(tokens)

    const payIds_ = []
    const tokens_ = []
    const mins_ = []
    for (let token of tokens) {
        payIds_.push(token.payId)
        tokens_.push(token.addr)
        mins_.push(token.min)
    }

    const fingerPlay = await ethers.getContractAt('SoulmetaFingerPlay', addrs.fingerPlay)
    await fingerPlay.setCurrencys(payIds_, tokens_, mins_)



    console.log('~~~~~~~~~~~~~ Task Done ~~~~~~~~~~~~~')
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})

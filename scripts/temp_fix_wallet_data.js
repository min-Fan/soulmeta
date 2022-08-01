const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const fs = require('fs')

const addrs = getEnvAddr(network.config.chainId)
const toBN = (i) => ethers.BigNumber.from(i)

const fetchEvent = async () => {
    let smb = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    let smbc = await ethers.getContractAt('SoulmetaItemBuilder721', addrs.soul721)
    let filter1 = smb.filters.TransferSingle()

    const [fromBlock, toBlock, split] = [18530675, 18627268, 10000]
    const loop = Math.floor((toBlock - fromBlock) / split) + 2

    for (let i = 0; i < loop; i++) {
        const fromBlockCur = fromBlock + (i - 1) * split
        const toBlockCur = Math.min(fromBlock + i * split - 1, toBlock)
        let events1 = await smb.queryFilter(filter1, fromBlockCur, toBlockCur)

        let bMap
        if (i === 0) {
            bMap = []
        } else {
            bMap = require(`../fix_wallet_data/${i - 1}_wallet_${fromBlockCur - 1}.json`)
        }

        const eventList = events1.sort((a, b) => a.blockNumber - b.blockNumber)

        for (let event of eventList) {
            console.log(event)
            if (event.event === 'TransferSingle') {
                let { from, to, id, value } = event.args
                id = id.toNumber()
                if (value.gt(1)) {
                    if (from === '0x52d1aD18A878Cd4060c6a55340afbf191b4ee082') {
                        const builder = await smbc.ownerOf(id)

                        bMap.push({
                            txHash: event.transactionHash,
                            blockNumber: event.blockNumber,
                            builder,
                            value
                        })
                        console.log({
                            txHash: event.transactionHash,
                            blockNumber: event.blockNumber,
                            builder,
                            value
                        })
                    }
                }
            }
        }

        await fs.writeFileSync(`./fix_wallet_data/${i}_wallet_${toBlockCur}.json`, JSON.stringify(bMap))
        console.log(`Loop ${i} --- ${fromBlockCur} to ${toBlockCur} done`)
    }
}

const fixData = async () => {
    const controller = await ethers.getContractAt('SoulmetaController', addrs.controller)
    const bMap = require(`../fix_wallet_data/10_wallet_18627268.json`)

    const builders = bMap.map(item => item.builder)
    let sum = ethers.BigNumber.from(0)
    const fixValues = bMap.map(item => {

        const v = Number.parseInt(item.value.hex)
        console.log(item.value.hex, v, ethers.utils.parseEther(v - 1 + ''))

        if (item.builder === '0x7629fAc34Cc0ddBCc89f5B29395bC6e6028ed19a') {
            sum = sum.add(ethers.utils.parseEther(v - 1 + ''))
        }

        return ethers.utils.parseEther(v - 1 + '')
    })
    console.log(sum)


    // const SPLIT = 70
    // for (let i = 0; i < builders.length / SPLIT; i++) {
    //     const gas = await controller.fixWallet(
    //         builders.slice(i * SPLIT, (i + 1) * SPLIT),
    //         fixValues.slice(i * SPLIT, (i + 1) * SPLIT)
    //     )
        // console.log(builders.length, gas.eq ? gas : '')
    // }
}

async function main () {

    await fixData()
    console.log('done')
}


main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})

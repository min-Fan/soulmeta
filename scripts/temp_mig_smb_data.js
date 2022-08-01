const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const fs = require('fs')

const addrs = getEnvAddr(network.config.chainId)
const toBN = (i) => ethers.BigNumber.from(i)
let oldSmb, viewer, newSmb

async function deploy () {
    console.log('Deploying V2 on the chainId ' + network.config.chainId)

    const Smb = await ethers.getContractFactory('SoulmetaItem1155')
    newSmb = await Smb.deploy(
        'Soul Meta Box',
        'SMB',
        'https://soulmeta.io/nft-info/smb/',
        'https://soulmeta.io/nft-info/smb/'
    )
    await newSmb.deployed()
    console.log('newSmb deployed to: ', newSmb.address)

}

async function getDeployed () {
    oldSmb = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    newSmb = await ethers.getContractAt('SoulmetaItem1155', addrs.newSmb)
    // viewer = await ethers.getContractAt('SmbViewer', '0xAA3eD96CFeF0F5155e7B69446778d7120D33a702')
}

async function migrate () {
    let filter1 = oldSmb.filters.TransferSingle()
    let filter2 = oldSmb.filters.TransferBatch()


    // const bMap = {}
    // const burned = {}

    // const [fromBlock, toBlock, split] = [17082990, 18162741, 10000]
    const [fromBlock, toBlock, split] = [17082990, 18272116, 10000]
    const loop = Math.floor((toBlock - fromBlock) / split) + 2

    for (let i = 117; i < loop; i++) {

        const fromBlockCur = fromBlock + (i - 1) * split
        const toBlockCur = Math.min(fromBlock + i * split - 1, toBlock)
        let events1 = await oldSmb.queryFilter(filter1, fromBlockCur, toBlockCur)
        let events2 = await oldSmb.queryFilter(filter2, fromBlockCur, toBlockCur)

        let bMap, burned
        if (i === 0) {
            bMap = {}
            burned = {}
        } else {
            bMap = require(`../mig_smb_data/${i - 1}_smb_${fromBlockCur - 1}_balance.json`)
            burned = require(`../mig_smb_data/${i - 1}_smb_${fromBlockCur - 1}_burned.json`)
        }

        const eventList = events1.concat(events2).sort((a, b) => a.blockNumber - b.blockNumber)

        eventList.forEach(event => {
            if (event.event === 'TransferSingle') {
                let { from, to, id, value } = event.args
                id = id.toNumber()
                if (from !== ethers.constants.AddressZero) {
                    if (!bMap[from] || !bMap[from][id]) {
                        console.error('err tx', event.transactionHash)
                        console.error('err data', event.args)
                        return
                    } else {
                        const v = toBN(bMap[from][id]).sub(value)
                        if (!v.eq(0)) {
                            bMap[from][id] = v
                        } else {
                            delete bMap[from][id]
                        }
                    }
                }
                if (to !== ethers.constants.AddressZero) {
                    if (!bMap[to]) {
                        bMap[to] = {}
                    }
                    bMap[to][id] = bMap[to][id] ? toBN(bMap[to][id]).add(value) : value
                } else {
                    burned[id] = burned[id] ? toBN(burned[id]).add(value) : value
                }
            } else if (event.event === 'TransferBatch') {
                const from = event.args[1]
                const to = event.args[2]
                const ids = event.args[3]
                const values = event.args[4]
                for (let i in ids) {
                    const id = ids[i]
                    const value = values[i]
                    if (from !== ethers.constants.AddressZero) {
                        if (!bMap[from] || !bMap[from][id]) {
                            console.error('err tx', event.transactionHash)
                            console.error('err data', event.args)
                            return
                        } else {
                            const v = toBN(bMap[from][id]).sub(value)
                            if (!v.eq(0)) {
                                bMap[from][id] = v
                            } else {
                                delete bMap[from][id]
                            }
                        }
                    }
                    if (to !== ethers.constants.AddressZero) {
                        if (!bMap[to]) {
                            bMap[to] = {}
                        }
                        bMap[to][id] = bMap[to][id] ? toBN(bMap[to][id]).add(value) : value
                    } else {
                        burned[id] = burned[id] ? toBN(burned[id]).add(value) : value
                    }
                }
            }
        })

        await fs.writeFileSync(`./mig_smb_data/${i}_smb_${toBlockCur}_balance.json`, JSON.stringify(bMap))
        await fs.writeFileSync(`./mig_smb_data/${i}_smb_${toBlockCur}_burned.json`, JSON.stringify(burned))
        console.log(`Loop ${i} --- ${fromBlockCur} to ${toBlockCur} done`)
    }


}

const trimData = async () => {
    const bMap = require(`../mig_smb_data/116_smb_18242989_balance.json`)
    for (let addr of Object.keys(bMap)) {
        // for (let id of Object.keys(bMap[addr])) {
        //     if (toBN(bMap[addr][id]).eq(0)) {
        //         delete bMap[addr][id]
        //
        //         console.log(`delete ${addr} 's ${id}`)
        //     }
        // }
        if (Object.keys(bMap[addr]).length === 0) {
            delete bMap[addr]
            console.log(`DDeleteeee ${addr}`)
        }
    }
    await fs.writeFileSync(`./mig_smb_data/116_smb_18242989_balance.json`, JSON.stringify(bMap))
}

const init = async () => {
    const me = (await ethers.getSigners())[0].address
    await newSmb.setMinter(me, true)
}

const mint = async () => {
    const bMap = require(`../mig_smb_data/119_smb_18272116_balance.json`)

    const singleAddrs = []
    const singleIds = []
    const singleValues = []

    const errList = ["0xD9c9954d686FCbf5C3Eb9BE235285d606bAb8748","0x147Ac5F294E58FcB048467CAD6774C4e5D7B6a17","0x1cE584096304911b982276a664CDBb2739b54260","0xB8DD607be4B4a69Abf2BaD36817584c92A82DB8b","0xe811006f712ea338231065aBbb5Cec398a777c16","0xb9179D3d7329D266F973D93e4877CF315827EC8D","0x6B19dd486f94242d64F4f0193417429f240B6790","0x86d25DC931267B788a42ac9755D49FA00c290a77","0x6216C6A3eFe1df7Ea18aeAF58B89e1d4c1e2BFBB","0x20d9ac6c867ECE10196B91ea820f4071D8cBcEdc","0x48c0e432E15100E677eaA89Ad373F6A888A2ca79"]
    for (let addrIndex in Object.keys(bMap)) {
        const addr = Object.keys(bMap)[addrIndex]
        const l = Object.keys(bMap[addr]).length
        if (l > 100) {
            console.log(addr, l)
        }
    }


    return
    for (let addrIndex in Object.keys(bMap)) {
        const addr = Object.keys(bMap)[addrIndex]
        const l = Object.keys(bMap[addr]).length
        if (l === 1) {
            const id = Object.keys(bMap[addr])[0]
            singleAddrs.push(addr)
            singleIds.push(id)
            singleValues.push(bMap[addr][id])
            console.log(`loop ${addrIndex} added: ${addr}`)
        } else {
            if (addrIndex <= 706 && !errList.includes(addr)) {
                continue
            }


            const item = bMap[addr]
            const ids = []
            const values = []
            for (let id of Object.keys(item)) {
                ids.push(id)
                values.push(item[id])
            }

            if (ids.length < 16) {
                const gas = await newSmb.estimateGas.mintBatch(addr, ids, values)
                console.log(ids.length, gas.eq ? gas : '')
            } else {
                const SPLIT = 15
                console.log(`long length: ${ids.length}, split to run ${addrIndex}: ${addr}`)
                for (let i = 0; i < ids.length / SPLIT; i++) {
                    const gas = await newSmb.estimateGas.mintBatch(
                        addr,
                        ids.slice(i * SPLIT, (i + 1) * SPLIT),
                        values.slice(i * SPLIT, (i + 1) * SPLIT)
                    )
                    console.log(`loop ${i} ${gas.eq ? gas : ''}`)
                }
            }
            console.log(`run loop ${addrIndex} done: ${addr}`)
        }


    }


    const SPLIT = 15
    for (let i = 0; i < singleAddrs.length / SPLIT; i++) {
        const gas = await newSmb.estimateGas.mintMulti(
            singleAddrs.slice(i * SPLIT, (i + 1) * SPLIT),
            singleIds.slice(i * SPLIT, (i + 1) * SPLIT),
            singleValues.slice(i * SPLIT, (i + 1) * SPLIT)
        )
        console.log(singleIds.length,  gas.eq ? gas : '')
    }

}

const burn = async () => {
    const bMap = require(`../mig_smb_data/119_smb_18272116_burned.json`)
    const ids = []
    const values = []
    for (let id of Object.keys(bMap)) {
        ids.push(id)
        values.push(bMap[id])
    }
    const SPLIT = 15
    for (let i = 0; i < ids.length / SPLIT; i++) {
        const gas = await newSmb.mintToBurnBatch(
            ids.slice(i * SPLIT, (i + 1) * SPLIT),
            values.slice(i * SPLIT, (i + 1) * SPLIT)
        )
        console.log(`loop`, i, ids.length)
    }
}


async function main () {

    // await deploy()

    await getDeployed()
    // await migrate()
    // await trimData()

    // await init()

    // await mint()
    await burn()


    // let a = ethers.utils.parseUnits('5', 'gwei').mul(200000).mul(9000)
    // a = ethers.utils.formatEther(a)\
    // console.log(a)


    // let a = ethers.utils.parseUnits('5', 'gwei').mul(19418157).mul(37)
    // a = ethers.utils.formatEther(a)
    // console.log(a)
    console.log('done')
}


main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})

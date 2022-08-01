const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Testing CoreStore', function () {
    let signer, accounts
    let store

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Store = await ethers.getContractFactory('SoulmetaStore')
        store = await Store.deploy()

        await store.initialize(accounts[0])
    })

    it('createBox', async function () {
        let tokenId = 6356
        let amount = 3002
        let poolId = 652393

        let total_1 = await store.poolSizes(poolId)

        // ----------------------------铸造----------------------------
        await store.createBox(tokenId, amount, poolId)
        // ----------------------------铸造----------------------------

        // 652393盒子
        let balance = await store.boxPools(poolId, 0)
        expect(balance.tokenId).to.equal(tokenId)
        expect(balance.count).to.equal(amount)

        let total_2 = await store.poolSizes(poolId)
        expect(total_1.add(amount)).to.equal(total_2)

        let info = await store.positions(tokenId)
        expect(info.poolId).to.equal(poolId)
    })

    it('extractBox', async function () {
        let tokenId = 6356
        let amount = 3002
        let poolId = 652393

        // 铸造
        await store.createBox(tokenId, amount, poolId)
        let total_1 = await store.poolSizes(poolId)

        // 开启
        await store.extractBox(poolId)
        let total_2 = await store.poolSizes(poolId)

        expect(total_1.sub(1)).to.equal(total_2)
    })

    it('nftRemove', async function () {
        let tokenId = 6356
        let amount = 3002
        let poolId = 652393

        // 铸造 6356 -> 铸造 6357 -> 移除 6356 -> 铸造 6358 -> 铸造 6356
        await store.createBox(tokenId, amount, poolId)
        let boxPools_1 = await store.boxPools(poolId, 0)

        await store.createBox(tokenId+1, amount, poolId)
        let boxPools_2 = await store.boxPools(poolId, 1)

        await store.nftRemove(tokenId)
        let boxPools_3 = await store.boxPools(poolId, 0)

        await store.createBox(tokenId+2, amount, poolId)
        let boxPools_4 = await store.boxPools(poolId, 0)
        let boxPools_5 = await store.boxPools(poolId, 1)

        await store.createBox(tokenId, amount, poolId)
        let boxPools_6 = await store.boxPools(poolId, 2)

        expect(boxPools_1.tokenId).to.equal(tokenId)
        expect(boxPools_2.tokenId).to.equal(tokenId+1)
        expect(boxPools_3.tokenId).to.equal(tokenId+1)
        expect(boxPools_4.tokenId).to.equal(tokenId+1)
        expect(boxPools_5.tokenId).to.equal(tokenId+2)
        expect(boxPools_6.tokenId).to.equal(tokenId)
    })

    it('nftRemove edge value', async function () {
        let tokenId = 6356
        let amount = 3002
        let poolId = 652393
        let boxPools

        // 6356 6357
        await store.createBox(tokenId, amount, poolId)
        await store.createBox(tokenId+1, amount, poolId)

        // 
        await store.nftRemove(tokenId)
        await store.nftRemove(tokenId+1)

        // 6358
        await store.createBox(tokenId+2, amount, poolId)

        boxPools = await store.boxPools(poolId, 0)
        expect(boxPools.tokenId).to.equal(tokenId+2)

        // 6358 6356
        await store.createBox(tokenId, amount, poolId)
        await store.nftRemove(tokenId)
        // 6358 6357
        await store.createBox(tokenId+1, amount, poolId)
        await store.nftRemove(tokenId+1)
        // 6358 6356
        await store.createBox(tokenId, amount, poolId)
        
        boxPools = await store.boxPools(poolId, 1)
        expect(boxPools.tokenId).to.equal(tokenId)

        // 6356
        await store.nftRemove(tokenId+2)
        // 6356 6357
        await store.createBox(tokenId+1, amount, poolId)
        
        boxPools = await store.boxPools(poolId, 0)
        expect(boxPools.tokenId).to.equal(tokenId)

        boxPools = await store.boxPools(poolId, 1)
        expect(boxPools.tokenId).to.equal(tokenId+1)
    })
})
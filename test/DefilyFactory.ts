import { ethers } from "hardhat";
import { expect } from "chai";
import { DefilyFactory, DefilyPair, ERC20 } from "../typechain-types";

describe("DefilyFactory", () => {

    let defilyFactory: DefilyFactory;
    let defilyPair: DefilyPair;
    

    before(async () => {
        const [admin] = await ethers.getSigners();
        console.log("Deploying Defily Factory...");
        const DefilyFactory = await ethers.getContractFactory("DefilyFactory");
        defilyFactory = (await DefilyFactory.deploy(
          admin.address
        )) as DefilyFactory;
        await defilyFactory.deployed();
        console.log("Defily Factory deployed to: ", defilyFactory.address);
        console.log("----------------------------\n");

        console.log("Deploying Defily Pair...");
        const DefilyPair = await ethers.getContractFactory("DefilyPair");
        defilyPair = (await DefilyPair.deploy()) as DefilyPair;
        await defilyPair.deployed();
        console.log("Defily pair deployed to: ", defilyPair.address);
        console.log("----------------------------\n");
    })

    it("Should deploy Defily Factory", async () => {
        const [owner] = await ethers.getSigners();
        expect(await defilyFactory.feeToSetter()).to.equal(owner.address);
    })

    it("should create new pair liquidity pool", async() => {
        let testToken1: ERC20;
        let testToken2: ERC20;
        const ERC20 = await ethers.getContractFactory("ERC20");
        console.log("Deploying Test Token 1...")
        testToken1 = (await ERC20.deploy("Test Token 1", "TT1")) as ERC20;
        await testToken1.deployed();
        console.log("Test Token 1 deployed to: ", testToken1.address);
        console.log("----------------------------\n");

        console.log("Deploying Test Token 2...")
        testToken2 = (await ERC20.deploy("Test Token 2", "TT2")) as ERC20;
        await testToken2.deployed();
        console.log("Test Token 2 deployed to: ", testToken2.address);
        console.log("----------------------------\n");

        console.log("Creating new pair liquidity pool...")
        // await expect(defilyFactory.createPair(testToken1.address, testToken2.address)).to.emit(defilyFactory, "PairCreated");
        const tx = await defilyFactory.createPair(testToken1.address, testToken2.address);
        const receipt = await tx.wait();

        for (const event of receipt.events) {
            if (event.event === "PairCreated") {
                console.log(`Event ${event.event} emitted with args: ${event.args}}`)
            }
        }
        const pairAddress = await defilyFactory.allPairs(0);
        console.log("Pair address: ", pairAddress);
    })
})
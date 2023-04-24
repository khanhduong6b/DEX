import { ethers } from "hardhat";
import { expect } from "chai";
import { DefilyRouter, MockERC20, IDefilyPair, DefilyFactory, WETH9, DefilyERC20 } from "../typechain-types";
import { BigNumber } from "ethers";

describe("DefilyRouter", () => {
    
        let defilyRouter: DefilyRouter;
        let defilyFactory: DefilyFactory;
        let weth: WETH9;

        before(async () => {
            const [admin] = await ethers.getSigners();
            console.log("Deploying Defily Factory...");
            const DefilyFactory = await ethers.getContractFactory("DefilyFactory");
            defilyFactory = (await DefilyFactory.deploy(
              admin.address
            )) as DefilyFactory;
            console.log("Defily Factory deployed to: ", defilyFactory.address);
            console.log("----------------------------\n");

            console.log("Deploying WETH...");
            const WETH9 = await ethers.getContractFactory("WETH9");
            weth = (await WETH9.deploy()) as WETH9;
            console.log("WETH deployed to: ", weth.address);
            console.log("----------------------------\n");
    
            console.log("Deploying Defily Router...");
            const DefilyRouter = await ethers.getContractFactory("DefilyRouter");
            defilyRouter = (await DefilyRouter.deploy(defilyFactory.address, weth.address)) as DefilyRouter;
            console.log("Defily Router deployed to: ", defilyRouter.address);
            console.log("----------------------------\n");
        })
    
        it("Should deploy Defily Router", async () => {
            expect(await defilyRouter.factory()).to.equal(defilyFactory.address);
            expect(await defilyRouter.WETH()).to.equal(weth.address);
        })

        describe("add liquidity", async () => {
            let token1: MockERC20;
            let token2: MockERC20;
            let token3: MockERC20;
            let token4: MockERC20;

            before(async () => {
                console.log("Deploying Test Token 1...")
                const ERC20 = await ethers.getContractFactory("MockERC20");
                token1 = (await ERC20.deploy("Test Token 1", "TT1", ethers.utils.parseEther("1000000"))) as MockERC20;
                console.log("Test Token 1 deployed to: ", token1.address);
                console.log("----------------------------\n");

                console.log("Deploying Test Token 2...")
                const Token2 = await ethers.getContractFactory("ERC20");
                token2 = (await ERC20.deploy("Test Token 2", "TT2", ethers.utils.parseEther("1000000"))) as MockERC20;
                console.log("Test Token 2 deployed to: ", token2.address);
                console.log("----------------------------\n");

                console.log("Deploying Test Token 3...")
                const Token3 = await ethers.getContractFactory("ERC20");
                token3 = (await ERC20.deploy("Test Token 3", "TT3", ethers.utils.parseEther("1000000"))) as MockERC20;
                console.log("Test Token 3 deployed to: ", token3.address);
                console.log("----------------------------\n");

                console.log("Deploying Test Token 4...")
                const Token4 = await ethers.getContractFactory("ERC20");
                token4 = (await ERC20.deploy("Test Token 4", "TT4", ethers.utils.parseEther("1000000"))) as MockERC20;
                console.log("Test Token 4 deployed to: ", token4.address);
                console.log("----------------------------\n");
            })

            it("should create new pair erc20 liquidity pool", async() => {
                const [admin, ...lproviders] = await ethers.getSigners();
                const amountToken1 = ethers.utils.parseEther("100");
                const amountToken2 = ethers.utils.parseEther("100");
                const amountToken1Min = ethers.utils.parseEther("99");
                const amountToken2Min = ethers.utils.parseEther("99");
                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
                console.log(deadline);

                await token1.connect(lproviders[0]).mintTokens(amountToken1);
                await token2.connect(lproviders[0]).mintTokens(amountToken2);

                await token1.connect(lproviders[0]).approve(defilyRouter.address, amountToken1);
                await token2.connect(lproviders[0]).approve(defilyRouter.address, amountToken2);

                const tx = await defilyRouter.connect(lproviders[0]).addLiquidity(token1.address, token2.address, amountToken1, amountToken2, amountToken1Min, amountToken2Min, lproviders[0].address, deadline);
                const receipt = await tx.wait();

                // console.log(receipt);
                const firstPairAddr = await defilyFactory.getPair(token1.address, token2.address);
                console.log(firstPairAddr);
                const firstPairContract = await ethers.getContractAt("IDefilyPair", firstPairAddr) as IDefilyPair;
                const balance = await firstPairContract.balanceOf(lproviders[0].address);
                console.log(balance.toString());
                console.log(await token1.balanceOf(lproviders[0].address));
                console.log(await token2.balanceOf(lproviders[0].address));
            })

            it("should create another pair erc20 liquidity pool", async() => {
                const [admin, ...lproviders] = await ethers.getSigners();
                const amountTokenA = ethers.utils.parseEther("50");
                const amountTokenB = ethers.utils.parseEther("50");
                const amountTokenAMin = ethers.utils.parseEther("49");
                const amountTokenBMin = ethers.utils.parseEther("49");
                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
                console.log(deadline);

                await token3
                  .connect(lproviders[1])
                  .mintTokens(ethers.utils.parseEther("100"));
                await token4
                  .connect(lproviders[1])
                  .mintTokens(ethers.utils.parseEther("100"));

                await token3.connect(lproviders[1]).approve(defilyRouter.address, amountTokenA);
                await token4.connect(lproviders[1]).approve(defilyRouter.address, amountTokenB);

                const tx = await defilyRouter.connect(lproviders[1]).addLiquidity(token3.address, token4.address, amountTokenA, amountTokenB, amountTokenAMin, amountTokenBMin, lproviders[1].address, deadline);
                const receipt = await tx.wait();

                // console.log(receipt);
                const firstPairAddr = await defilyFactory.getPair(token3.address, token4.address);
                console.log(firstPairAddr);
                const firstPairContract = await ethers.getContractAt("IDefilyPair", firstPairAddr) as IDefilyPair;
                const balance = await firstPairContract.balanceOf(lproviders[1].address);
                console.log(balance.toString());
                console.log(await token3.balanceOf(lproviders[1].address));
                console.log(await token4.balanceOf(lproviders[1].address));
            })

            it("add liquidity to existence erc20 pool", async () => {
                const [admin, ...lproviders] = await ethers.getSigners();
                const amountTokenA = ethers.utils.parseEther("20");
                const amountTokenB = ethers.utils.parseEther("10");
                const amountTokenAMin = ethers.utils.parseEther("0");
                const amountTokenBMin = ethers.utils.parseEther("0");
                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
                console.log(deadline);
                
                await token1.connect(lproviders[1]).mintTokens(ethers.utils.parseEther("50"));
                await token2.connect(lproviders[1]).mintTokens(ethers.utils.parseEther("50"));

                await token1.connect(lproviders[1]).approve(defilyRouter.address, amountTokenA);
                await token2.connect(lproviders[1]).approve(defilyRouter.address, amountTokenB);

                const tx = await defilyRouter.connect(lproviders[1]).addLiquidity(token1.address, token2.address, amountTokenA, amountTokenB, amountTokenAMin, amountTokenBMin, lproviders[1].address, deadline);
                const receipt = await tx.wait();

                // console.log(receipt);
                const firstPairAddr = await defilyFactory.getPair(token1.address, token2.address);
                console.log(firstPairAddr);
                const firstPairContract = await ethers.getContractAt("IDefilyPair", firstPairAddr) as IDefilyPair;
                const balance = await firstPairContract.balanceOf(lproviders[1].address);
                console.log(balance.toString());
                console.log(await token1.balanceOf(lproviders[1].address));
                console.log(await token2.balanceOf(lproviders[1].address));
            })
        })

        describe("remove liquidity", () => {
            let token1: MockERC20
            let token2: MockERC20
            
            
            before(async () => {
                const [admin, ...lproviders] = await ethers.getSigners();
                 console.log("Deploying Test Token 1...");
                 const ERC20 = await ethers.getContractFactory("MockERC20");
                 token1 = (await ERC20.deploy(
                   "Test Token 1",
                   "TT1",
                   ethers.utils.parseEther("1000000")
                 )) as MockERC20;
                 console.log("Test Token 1 deployed to: ", token1.address);
                 console.log("----------------------------\n");

                 console.log("Deploying Test Token 2...");
                 const Token2 = await ethers.getContractFactory("ERC20");
                 token2 = (await ERC20.deploy(
                   "Test Token 2",
                   "TT2",
                   ethers.utils.parseEther("1000000")
                 )) as MockERC20;
                 console.log("Test Token 2 deployed to: ", token2.address);
                 console.log("----------------------------\n");

                console.log("adding liquidity to erc20 pool");
                
                const amountTokenA = ethers.utils.parseEther("50");
                const amountTokenB = ethers.utils.parseEther("50");
                const amountTokenAMin = ethers.utils.parseEther("0");
                const amountTokenBMin = ethers.utils.parseEther("0");
                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;

                await token1.connect(lproviders[0]).mintTokens(ethers.utils.parseEther("50"));
                await token2.connect(lproviders[0]).mintTokens(ethers.utils.parseEther("50"));

                await token1.connect(lproviders[0]).approve(defilyRouter.address, amountTokenA);
                await token2.connect(lproviders[0]).approve(defilyRouter.address, amountTokenB);

                await defilyRouter.connect(lproviders[0]).addLiquidity(token1.address, token2.address, amountTokenA, amountTokenB, amountTokenAMin, amountTokenBMin, lproviders[0].address, deadline);
            })

            it("should remove liquidity from erc20 pool", async () => {
                const [admin, ...lproviders] = await ethers.getSigners();
                console.log(`lprovider token1 balance before: ${await token1.balanceOf(lproviders[0].address)}`);
                console.log(`lprovider token2 balance before: ${await token2.balanceOf(lproviders[0].address)}`);
                const firstPairContract = await ethers.getContractAt("IDefilyPair", await defilyFactory.getPair(token1.address, token2.address)) as IDefilyPair;
                console.log(`lprovider defily lp balance before: ${await firstPairContract.balanceOf(lproviders[0].address)}`);
                console.log("provider address: ", lproviders[0].address);

                const amountTokenAMin = ethers.utils.parseEther("0");
                const amountTokenBMin = ethers.utils.parseEther("0");
                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
                const liquidity = await firstPairContract.balanceOf(lproviders[0].address);

                console.log("router address: ", defilyRouter.address);

                await firstPairContract.connect(lproviders[0]).approve(defilyRouter.address, liquidity)
                await defilyRouter.connect(lproviders[0]).removeLiquidity(token1.address, token2.address, liquidity, amountTokenAMin, amountTokenBMin, lproviders[0].address, deadline);

                console.log(`lprovider token1 balance after: ${await token1.balanceOf(lproviders[0].address)}`);
                console.log(`lprovider token2 balance after: ${await token2.balanceOf(lproviders[0].address)}`);
                console.log(`lprovider defily lp balance after: ${await firstPairContract.balanceOf(lproviders[0].address)}`);
            })
        })

        describe("swap", () => {
            let token1: MockERC20
            let token2: MockERC20

            before(async () => {
                const [admin, ...lproviders] = await ethers.getSigners();
                console.log("Deploying Test Token 1...");
                const ERC20 = await ethers.getContractFactory("MockERC20");
                token1 = (await ERC20.deploy("Test Token 1", "TT1", ethers.utils.parseEther("1000000"))) as MockERC20;
                console.log("Test Token 1 deployed to: ", token1.address);
                console.log("----------------------------\n");

                console.log("Deploying Test Token 2...");
                const Token2 = await ethers.getContractFactory("ERC20");
                token2 = (await ERC20.deploy("Test Token 2", "TT2", ethers.utils.parseEther("1000000"))) as MockERC20;
                console.log("Test Token 2 deployed to: ", token2.address);
                console.log("----------------------------\n");

                console.log("adding liquidity to erc20 pool");
                const amountTokenA = ethers.utils.parseEther("50");
                const amountTokenB = ethers.utils.parseEther("50");
                const amountTokenAMin = ethers.utils.parseEther("0");
                const amountTokenBMin = ethers.utils.parseEther("0");
                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;

                await token1.connect(lproviders[0]).mintTokens(ethers.utils.parseEther("50"));
                await token2.connect(lproviders[0]).mintTokens(ethers.utils.parseEther("50"));

                await token1.connect(lproviders[0]).approve(defilyRouter.address, amountTokenA);
                await token2.connect(lproviders[0]).approve(defilyRouter.address, amountTokenB);

                await defilyRouter.connect(lproviders[0]).addLiquidity(token1.address, token2.address, amountTokenA, amountTokenB, amountTokenAMin, amountTokenBMin, lproviders[0].address, deadline);
            })

            it("should swap erc20 tokens", async () => {
                const [admin, ...lproviders] = await ethers.getSigners();
                
                await token1.connect(lproviders[1]).mintTokens(ethers.utils.parseEther("50"));
                await token1.connect(lproviders[1]).approve(defilyRouter.address, ethers.utils.parseEther("50"));

                console.log(`lprovider token1 balance before: ${await token1.balanceOf(lproviders[1].address)}`);
                console.log(`lprovider token2 balance before: ${await token2.balanceOf(lproviders[1].address)}`);

                const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000;
                const amountIn = ethers.utils.parseEther("5");
                const amountOutMin = ethers.utils.parseEther("0");
                
                await defilyRouter.connect(lproviders[1]).swapExactTokensForTokens(amountIn, amountOutMin, [token1.address, token2.address], lproviders[1].address, deadline);

                console.log(`lprovider token1 balance after: ${await token1.balanceOf(lproviders[1].address)}`);
                console.log(`lprovider token2 balance after: ${await token2.balanceOf(lproviders[1].address)}`);
            })
        })
})
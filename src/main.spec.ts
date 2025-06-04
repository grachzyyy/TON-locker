import "@ton/test-utils";
import { toNano } from "@ton/core";
import { Blockchain } from "@ton/sandbox";
import { Locker } from "../output/locker_Locker";

it("should deploy correctly", async () => {
    const blockchain = await Blockchain.create();

    const contract = blockchain.openContract(await Locker.fromInit());

    const deployer = await blockchain.treasury("deployer");

    // call `receive()`
    const result = await contract.send(deployer.getSender(), { value: toNano(1) }, null);

    expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: contract.address,
        deploy: true,
        success: true,
    });
});

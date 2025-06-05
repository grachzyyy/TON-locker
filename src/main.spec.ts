// import {Blockchain, createShardAccount, SandboxContract, TreasuryContract} from '@ton/sandbox';
// import {beginCell, Cell, ContractProvider, Sender, toNano} from '@ton/core';
// import {Locker, OnlyTextCommentsSupported} from '../output/locker_Locker';
// import '@ton/test-utils';
// import {TransactionDescriptionGeneric} from "@ton/core/src/types/TransactionDescription";
// import {TransactionComputeVm} from "@ton/core/src/types/TransactionComputePhase";
// import {LockerBill, WithdrawFromBill} from "../output/locker_LockerBill";
// import { InvalidComment } from '../output/locker_Locker';

// const TIME = 1685889892;

// const sendDeploy = async (blockchain: Blockchain, contract: SandboxContract<Locker>) => {
//     await blockchain.setShardAccount(contract.address, createShardAccount({
//         address: contract.address,
//         code: contract.init!.code,
//         data: contract.init!.data,
//         balance: 0n,
//         workchain: 0
//     }));
// }

// const sendChar = async (contract: SandboxContract<Locker> | SandboxContract<LockerBill>, sender: Sender, options: {value: bigint, char: string}) => {
//     return await contract.send(sender, {value: options.value}, beginCell().storeUint(0, 32).storeStringTail(options.char).asSlice());
// }

// describe('Locker', () => {
//     let blockchain: Blockchain;
//     let locker: SandboxContract<Locker>;
//     let locker2: SandboxContract<Locker>;
//     let lockerBill: SandboxContract<LockerBill>;
//     let user: SandboxContract<TreasuryContract>;
//     let notUser: SandboxContract<TreasuryContract>;

//     beforeEach(async () => {
//         blockchain = await Blockchain.create();
//         blockchain.now = TIME;

//         user = await blockchain.treasury('user', {balance: toNano('11000000000')});
//         notUser = await blockchain.treasury('notUser', {balance: toNano('11000000000')});

//         locker = blockchain.openContract(
//             await Locker.fromInit(0n, 0n, BigInt(TIME + 100), BigInt(TIME + 1000), 600n, 60n)
//         );

//         lockerBill = blockchain.openContract(
//             await LockerBill.fromInit(locker.address, 0n, user.address, 0n)
//         );
        
//         await sendDeploy(blockchain, locker);
//     });

//     it('should deploy', async () => {
//         // the check is done inside beforeEach
//         // blockchain and locker are ready to use
//     });

//     it('get methods', async () => {
//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(0n);
//         expect(data.totalReward).toBe(0n);
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);
//     });

//     it('get_bill_address', async () => {
//         const data = await locker.getGetBillAddress(user.address);
//         expect(data.toString()).toBe(lockerBill.address.toString());
//     });


//     it('ignore bounced message', async () => {
//         // todo
//     });

//     it('bounce empty message', async () => {
//         const result = await locker.sendEmpty(user.getSender(), {
//             value: toNano('1'),
//         });
//         expect((result.transactions[1].description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1].description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(9); // Cell underflow
//     });

//     it('bounce unsupported op', async () => {
//         const result = await locker.sendInvalidOp(user.getSender(), {
//             value: toNano('1'),
//         });
//         expect((result.transactions[1].description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1].description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.only_text_comments_supported);
//     });

//     it('bounce unsupported message', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: "a"
//         });
//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(InvalidComment);
//     });

//     it('bounce unsupported message length', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: "aaa"
//         });
//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.invalid_comment_length);
//     });

//     it('bounce little reward from user', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('2'),
//             char: "r"
//         });
//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.not_enough_coins_for_reward);
//     });

//     it('bounce late reward from user', async () => {
//         blockchain.now = TIME + 101;
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('1000000'),
//             char: "r"
//         });
//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.deposits_time_ended);
//     });

//     it('accept reward from user', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('50'),
//             char: 'r'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(0n);
//         expect(data.totalReward).toBe(toNano('49'));
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);
//     });

//     it('accept twice reward from user', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('100000000'),
//             char: 'r'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(0n);
//         expect(data.totalReward).toBe(toNano('99999999'));
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);

//         const result2 = await sendChar(locker, user.getSender(), {
//             value: toNano('200000000'),
//             char: 'r'
//         });
//         expect(result2.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data2 = await locker.getGetLockerData();
//         expect(data2.totalCoinsLocked).toBe(0n);
//         expect(data2.totalReward).toBe(toNano('299999998'));
//         expect(data2.depositsEndTime).toBe(TIME + 100);
//         expect(data2.vestingStartTime).toBe(TIME + 1000);
//         expect(data2.vestingTotalDuration).toBe(600);
//         expect(data2.unlockPeriod).toBe(60);
//     });

//     it('bounce little deposit from user', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('2'),
//             char: "d"
//         });
//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.not_enough_coins_for_deposit);
//     });

//     it('bounce late deposit from user', async () => {
//         blockchain.now = TIME + 101;
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('1000000'),
//             char: "d"
//         });
//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.deposits_time_ended);
//     });

//     it('accept 5B reward and 5B deposit from user', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('5000000000'),
//             char: 'r'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(0n);
//         expect(data.totalReward).toBe(toNano('4999999999'));
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);

//         const result2 = await sendChar(locker, user.getSender(), {
//             value: toNano('5000000000'),
//             char: 'd'
//         });
//         expect(result2.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data2 = await locker.getGetLockerData();
//         expect(data2.totalCoinsLocked).toBe(toNano('4999999999'));
//         expect(data2.totalReward).toBe(toNano('4999999999'));
//         expect(data2.depositsEndTime).toBe(TIME + 100);
//         expect(data2.vestingStartTime).toBe(TIME + 1000);
//         expect(data2.vestingTotalDuration).toBe(600);
//         expect(data2.unlockPeriod).toBe(60);

//         expect(result2.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(LockerBill.opcodes.DepositToBill, 32).storeCoins(toNano('4999999999')).endCell()
//         });
//     });

//     it('accept deposit from user', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('50'),
//             char: 'd'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(toNano('49'));
//         expect(data.totalReward).toBe(0n);
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);

//         expect(result.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(Opcodes.deposit_to_bill, 32).storeCoins(toNano('49')).endCell()
//         });

//         const billData = await lockerBill.getData();
//         expect(billData.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData.userAddress.toString()).toBe(user.address.toString());
//         expect(billData.lastWithdrawTime).toBe(0);

//         // second deposit

//         blockchain.now = TIME + 1;

//         const result2 = await sendChar(locker, user.getSender(), {
//             value: toNano('50'),
//             char: 'd'
//         });
//         expect(result2.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data2 = await locker.getGetLockerData();
//         expect(data2.totalCoinsLocked).toBe(toNano('98'));
//         expect(data2.totalReward).toBe(0n);
//         expect(data2.depositsEndTime).toBe(TIME + 100);
//         expect(data2.vestingStartTime).toBe(TIME + 1000);
//         expect(data2.vestingTotalDuration).toBe(600);
//         expect(data2.unlockPeriod).toBe(60);

//         expect(result2.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(Opcodes.deposit_to_bill, 32).storeCoins(toNano('49')).endCell()
//         });

//         const billData2 = await lockerBill.getData();
//         expect(billData2.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData2.totalCoinsDeposit).toBe(toNano('98'));
//         expect(billData2.userAddress.toString()).toBe(user.address.toString());
//         expect(billData2.lastWithdrawTime).toBe(0);

//         // withdraw

//         blockchain.now = TIME + 1061;

//         const result3 = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result3.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data3 = await locker.getGetLockerData();
//         expect(data3.totalCoinsLocked).toBe(toNano('98'));
//         expect(data3.totalReward).toBe(0n);
//         expect(data3.depositsEndTime).toBe(TIME + 100);
//         expect(data3.vestingStartTime).toBe(TIME + 1000);
//         expect(data3.vestingTotalDuration).toBe(600);
//         expect(data3.unlockPeriod).toBe(60);

//         expect(result3.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(0, 32).storeUint('w'.charCodeAt(0), 8).endCell()
//         });

//         const billData3 = await lockerBill.getGetLockerBillData();
//         expect(billData3.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData3.totalCoinsDeposit).toBe(toNano('98'));
//         expect(billData3.userAddress.toString()).toBe(user.address.toString());
//         expect(billData3.lastWithdrawTime).toBe(TIME + 1061);

//         expect(result3.transactions).toHaveTransaction({
//             from: lockerBill.address,
//             to: locker.address,
//             success: true,
//             body: beginCell()
//                 .storeUint(LockerBill.opcodes.WithdrawFromBill, 32)
//                 .storeAddress(user.address)
//                 .storeCoins(toNano('98')) // total deposit
//                 .storeUint(0, 32) // last withdrawal
//                 .storeUint(TIME + 1061, 32) // now_time
//                 .endCell()
//         });

//         expect(result3.transactions).toHaveTransaction({
//             from: locker.address,
//             to: user.address,
//             value: 10779005000n,
//             success: true,
//             body: beginCell()
//                 .endCell()
//         });

//     });

//     it('reject withdraw_from_bill from user', async () => {
//         const result = await locker.sendWithdrawFromBill(user.getSender(), {
//             value: toNano('1'),
//             userAddress: user.address,
//             totalUserDeposit: toNano('98'),
//             lastWithdrawTime: 0
//         });
//         expect((result.transactions[1].description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1].description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.invalid_bill_sender);
//     });

//     it('reject withdraw from user with 0.5 ton', async () => {
//         blockchain.now = TIME + 1061;

//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('0.5'),
//             char: 'w'
//         });

//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.msg_value_at_least_one_ton);
//     });

//     it('reject early withdraw from user with', async () => {
//         blockchain.now = TIME + 101;

//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });

//         expect((result.transactions[1]!.description as TransactionDescriptionGeneric).aborted).toBeTruthy();
//         expect(((result.transactions[1]!.description as TransactionDescriptionGeneric).computePhase as TransactionComputeVm).exitCode).toBe(ErrorCodes.withdraw_time_not_started);
//     });

//     it('get_unlocked_amount', async () => {
//         expect(await locker.getGetUnlockedAmount(0, 10000n)).toBe(0n);
//         expect(await locker.getGetUnlockedAmount(TIME + 100, 10000n)).toBe(0n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1000, 10000n)).toBe(0n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1059, 10000n)).toBe(0n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1060, 10000n)).toBe(1000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1061, 10000n)).toBe(1000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1119, 10000n)).toBe(1000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1120, 10000n)).toBe(2000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1000 + 60 * 4 - 1, 10000n)).toBe(3000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1000 + 60 * 4, 10000n)).toBe(4000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1000 + 60 * 10 - 1, 10000n)).toBe(9000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1000 + 60 * 10, 10000n)).toBe(10000n);
//         expect(await locker.getGetUnlockedAmount(TIME + 1000000, 10000n)).toBe(10000n);
//     });

//     it('get_amount_to_withdraw', async () => {
//         const locker2 = blockchain.openContract(
//             Locker.createFromConfig(
//                 {
//                     totalCoinsLocked: 10000n,
//                     totalReward: 0n,
//                     depositsEndTime: TIME + 100,
//                     vestingStartTime: TIME + 1000,
//                     vestingTotalDuration: 600,
//                     unlockPeriod: 60,
//                     billCode: lockerBillCode
//                 },
//                 code
//             )
//         );
//         const deployer2 = await blockchain.treasury('deployer2');
//         await sendDeploy(blockchain, locker2);

//         // zero total_user_deposit

//         expect(await locker2.getAmountToWithdraw(TIME, 0, 0n)).toBe(0n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1060, 0, 0n)).toBe(0n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1120, 0, 0n)).toBe(0n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1000000, 0, 0n)).toBe(0n);

//         // total_user_deposit

//         expect(await locker2.getAmountToWithdraw(TIME, 0, 10000n)).toBe(0n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1060, 0, 10000n)).toBe(1000n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1120, 0, 10000n)).toBe(2000n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1000000, 0, 10000n)).toBe(10000n);

//         expect(await locker2.getAmountToWithdraw(TIME + 1000000, TIME + 1120, 10000n)).toBe(8000n);

//         expect(await locker2.getAmountToWithdraw(TIME, 0, 5000n)).toBe(0n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1060, 0, 5000n)).toBe(500n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1120, 0, 5000n)).toBe(1000n);
//         expect(await locker2.getAmountToWithdraw(TIME + 1000000, 0, 5000n)).toBe(5000n);

//         // reward

//         const locker3 = blockchain.openContract(
//             Locker.createFromConfig(
//                 {
//                     totalCoinsLocked: 10000n,
//                     totalReward: 500n,
//                     depositsEndTime: TIME + 100,
//                     vestingStartTime: TIME + 1000,
//                     vestingTotalDuration: 600,
//                     unlockPeriod: 60,
//                     billCode: lockerBillCode
//                 },
//                 code
//             )
//         );
//         const deployer3 = await blockchain.treasury('deployer3');
//         await sendDeploy(blockchain, locker3);

//         // zero total_user_deposit

//         expect(await locker3.getAmountToWithdraw(TIME, 0, 0n)).toBe(0n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1060, 0, 0n)).toBe(0n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1120, 0, 0n)).toBe(0n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1000000, 0, 0n)).toBe(0n);

//         // total_user_deposit

//         expect(await locker3.getAmountToWithdraw(TIME, 0, 10000n)).toBe(0n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1060, 0, 10000n)).toBe(1000n + 500n/10n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1120, 0, 10000n)).toBe(2000n + 500n*2n/10n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1000000, 0, 10000n)).toBe(10000n + 500n);

//         expect(await locker3.getAmountToWithdraw(TIME + 1000000, TIME + 1120, 10000n)).toBe(8000n + 500n*8n/10n);

//         expect(await locker3.getAmountToWithdraw(TIME, 0, 4000n)).toBe(0n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1060, 0, 4000n)).toBe(400n + 500n*4n/10n*1n/10n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1120, 0, 4000n)).toBe(800n + 500n*4n/10n*2n/10n);
//         expect(await locker3.getAmountToWithdraw(TIME + 1000000, 0, 4000n)).toBe(4000n + 500n*4n/10n);

//     });

//     it('withdraw_from_bill with 0 total_user_deposit', async () => {
//         const locker2 = blockchain.openContract(
//             Locker.createFromConfig(
//                 {
//                     totalCoinsLocked: 10000n,
//                     totalReward: 0n,
//                     depositsEndTime: TIME + 100,
//                     vestingStartTime: TIME + 1000,
//                     vestingTotalDuration: 600,
//                     unlockPeriod: 60,
//                     billCode: lockerBillCode
//                 },
//                 code
//             )
//         );
//         const deployer2 = await blockchain.treasury('deployer2');
//         await sendDeploy(blockchain, locker2);

//         const lockerBill2 = blockchain.openContract(
//             LockerBill.createFromConfig(
//                 {
//                     lockerAddress: locker2.address,
//                     userAddress: user.address,
//                 },
//                 lockerBillCode
//             )
//         );
//         await sendDeploy(blockchain, lockerBill2);

//         blockchain.now = TIME + 1061;

//         const result = await sendChar(locker2, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker2.address,
//             success: true,
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: locker2.address,
//             to: user.address,
//             success: true,
//             body: beginCell()
//                 .endCell()
//         });

//         const msg: any = result.transactions[result.transactions.length-1]!.inMessage;
//         expect(msg.info.value.coins).toBeGreaterThan(toNano('0.9'));
//         expect(msg.info.value.coins).toBeLessThan(toNano('1'));

//     });

//     it('withdraw_from_bill 40% and 100%', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('50'),
//             char: 'd'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(toNano('49'));
//         expect(data.totalReward).toBe(0n);
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);

//         expect(result.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(Locker.opcodes.DepositToBill, 32).storeCoins(toNano('49')).endCell()
//         });

//         const billData = await lockerBill.getGetLockerBillData();
//         expect(billData.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData.userAddress.toString()).toBe(user.address.toString());
//         expect(billData.lastWithdrawTime).toBe(0);

//         // withdraw

//         blockchain.now = TIME + 1000 + 60*4;

//         const result3 = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result3.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const billData3 = await lockerBill.getGetLockerBillData();
//         expect(billData3.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData3.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData3.userAddress.toString()).toBe(user.address.toString());
//         expect(billData3.lastWithdrawTime).toBe(TIME + 1000 + 60*4);

//         expect(result3.transactions).toHaveTransaction({
//             from: lockerBill.address,
//             to: locker.address,
//             success: true,
//             body: beginCell()
//                 .storeUint(LockerBill.opcodes.WithdrawFromBill, 32)
//                 .storeAddress(user.address)
//                 .storeCoins(toNano('49')) // total deposit
//                 .storeUint(0, 32) // last withdrawal
//                 .storeUint(TIME + 1000 + 60*4, 32) // now_time
//                 .endCell()
//         });

//         expect(result3.transactions).toHaveTransaction({
//             from: locker.address,
//             to: user.address,
//             success: true,
//             value: 20579005000n,
//             body: beginCell()
//                 .endCell()
//         });

//         // seconds withdraw

//         blockchain.now = TIME + 1000 + 60*10;

//         const result4 = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result4.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const billData4 = await lockerBill.getGetLockerBillData();
//         expect(billData4.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData4.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData4.userAddress.toString()).toBe(user.address.toString());
//         expect(billData4.lastWithdrawTime).toBe(TIME + 1000 + 60*10);

//         expect(result4.transactions).toHaveTransaction({
//             from: lockerBill.address,
//             to: locker.address,
//             success: true,
//             body: beginCell()
//                 .storeUint(LockerBill.opcodes.WithdrawFromBill, 32)
//                 .storeAddress(user.address)
//                 .storeCoins(toNano('49')) // total deposit
//                 .storeUint(TIME + 1000 + 60*4, 32) // last withdrawal
//                 .storeUint(TIME + 1000 + 60*10, 32) // now_time
//                 .endCell()
//         });

//         expect(result4.transactions).toHaveTransaction({
//             from: locker.address,
//             to: user.address,
//             success: true,
//             value: 30379173000n,
//             body: beginCell()
//                 .endCell()
//         });

//     });

//     it('withdraw_from_bill 20% and 100% with REWARD', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('50'),
//             char: 'd'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const resultD = await sendChar(locker, notUser.getSender(), {
//             value: toNano('200'),
//             char: 'd'
//         });
//         expect(resultD.transactions).toHaveTransaction({
//             from: notUser.address,
//             to: locker.address,
//             success: true,
//         });

//         const result2 = await sendChar(locker, notUser.getSender(), {
//             value: toNano('666'),
//             char: 'r'
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(toNano('49') + toNano('199'));
//         expect(data.totalReward).toBe(toNano('665'));
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);

//         expect(result.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(Locker.opcodes.DepositToBill, 32).storeCoins(toNano('49')).endCell()
//         });

//         const billData = await lockerBill.getGetLockerBillData();
//         expect(billData.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData.userAddress.toString()).toBe(user.address.toString());
//         expect(billData.lastWithdrawTime).toBe(0);

//         // withdraw

//         blockchain.now = TIME + 1000 + 60*2;

//         const result3 = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result3.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const billData3 = await lockerBill.getGetLockerBillData();
//         expect(billData3.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData3.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData3.userAddress.toString()).toBe(user.address.toString());
//         expect(billData3.lastWithdrawTime).toBe(TIME + 1000 + 60*2);

//         expect(result3.transactions).toHaveTransaction({
//             from: lockerBill.address,
//             to: locker.address,
//             success: true,
//             body: beginCell()
//                 .storeUint(LockerBill.opcodes.WithdrawFromBill, 32)
//                 .storeAddress(user.address)
//                 .storeCoins(toNano('49')) // total deposit
//                 .storeUint(0, 32) // last withdrawal
//                 .storeUint(TIME + 1000 + 60*2, 32) // now_time
//                 .endCell()
//         });

//         expect(result3.transactions).toHaveTransaction({
//             from: locker.address,
//             to: user.address,
//             success: true,
//             value: 37057230806n,
//             body: beginCell()
//                 .endCell()
//         });

//         // seconds withdraw

//         blockchain.now = TIME + 1000 + 60*10;

//         const result4 = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result4.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const billData4 = await lockerBill.getGetLockerBillData();
//         expect(billData4.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData4.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData4.userAddress.toString()).toBe(user.address.toString());
//         expect(billData4.lastWithdrawTime).toBe(TIME + 1000 + 60*10);

//         expect(result4.transactions).toHaveTransaction({
//             from: lockerBill.address,
//             to: locker.address,
//             success: true,
//             body: beginCell()
//                 .storeUint(LockerBill.opcodes.WithdrawFromBill, 32)
//                 .storeAddress(user.address)
//                 .storeCoins(toNano('49')) // total deposit
//                 .storeUint(TIME + 1000 + 60*2, 32) // last withdrawal
//                 .storeUint(TIME + 1000 + 60*10, 32) // now_time
//                 .endCell()
//         });

//         expect(result4.transactions).toHaveTransaction({
//             from: locker.address,
//             to: user.address,
//             success: true,
//             value: 145292076226n,
//             body: beginCell()
//                 .endCell()
//         });

//     });

//     it('withdraw_from_bill after vesting_start_period', async () => {
//         const result = await sendChar(locker, user.getSender(), {
//             value: toNano('50'),
//             char: 'd'
//         });
//         expect(result.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const data = await locker.getGetLockerData();
//         expect(data.totalCoinsLocked).toBe(toNano('49'));
//         expect(data.totalReward).toBe(0n);
//         expect(data.depositsEndTime).toBe(TIME + 100);
//         expect(data.vestingStartTime).toBe(TIME + 1000);
//         expect(data.vestingTotalDuration).toBe(600);
//         expect(data.unlockPeriod).toBe(60);

//         expect(result.transactions).toHaveTransaction({
//             from: locker.address,
//             to: lockerBill.address,
//             success: true,
//             body: beginCell().storeUint(Locker.opcodes.DepositToBill, 32).storeCoins(toNano('49')).endCell()
//         });

//         const billData = await lockerBill.getGetLockerBillData();
//         expect(billData.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData.userAddress.toString()).toBe(user.address.toString());
//         expect(billData.lastWithdrawTime).toBe(0);

//         // withdraw

//         blockchain.now = TIME + 100000;

//         const result3 = await sendChar(locker, user.getSender(), {
//             value: toNano('1'),
//             char: 'w'
//         });
//         expect(result3.transactions).toHaveTransaction({
//             from: user.address,
//             to: locker.address,
//             success: true,
//         });

//         const billData3 = await lockerBill.getGetLockerBillData();
//         expect(billData3.lockerAddress.toString()).toBe(locker.address.toString());
//         expect(billData3.totalCoinsDeposit).toBe(toNano('49'));
//         expect(billData3.userAddress.toString()).toBe(user.address.toString());
//         expect(billData3.lastWithdrawTime).toBe(TIME + 100000);

//         expect(result3.transactions).toHaveTransaction({
//             from: lockerBill.address,
//             to: locker.address,
//             success: true,
//             body: beginCell()
//                 .storeUint(LockerBill.opcodes.WithdrawFromBill, 32)
//                 .storeAddress(user.address)
//                 .storeCoins(toNano('49')) // total deposit
//                 .storeUint(0, 32) // last withdrawal
//                 .storeUint(TIME + 100000, 32) // now_time
//                 .endCell()
//         });

//         expect(result3.transactions).toHaveTransaction({
//             from: locker.address,
//             to: user.address,
//             success: true,
//             value: 49979355000n,
//             body: beginCell()
//                 .endCell()
//         });

//     });

// });

import "@stdlib/ownable";

message(0xd6416bfe) WithdrawFromBill {
    userAddress: Address;
    totalUserDeposit: Int as coins;
    lastWithdrawTime: Int as uint32;
    nowTime: Int as uint32;
}

const MsgValueAtLeastOneTon: Int = 60;
const OnlyBillSender: Int = 71;
const DepositsTimeEnded: Int = 72;
const WithdrawTimeNotStarted: Int = 73;
const NotEnoughCoinsForDeposit: Int = 74;
const NotEnoughCoinsForReward: Int = 75;
const InvalidStartTime: Int = 76;
const InvalidUnlockPeriod: Int = 77;

const MINIMUM_DEPOSIT: Int = ton("50");
const MINIMUM_REWARD: Int = ton("50");

asm fun mod(x: Int, y: Int): Int {
    MOD 
}

message(0x8ad026be) DepositToBill {
    amount: Int as coins;
}

struct LockerData { 
    totalCoinsLocked: Int as coins;
    totalReward: Int as coins;
    depositsEndTime: Int as uint32;
    vestingStartTime: Int as uint32;
    vestingTotalDuration: Int as uint32;
    unlockPeriod: Int as uint32;
}

contract Locker(
    totalCoinsLocked: Int as coins,
    totalReward: Int as coins,
    depositsEndTime: Int as uint32,
    vestingStartTime: Int as uint32,
    vestingTotalDuration: Int as uint32,
    unlockPeriod: Int as uint32
) {

    fun getUnlockedAmount(nowTime: Int, totalAmount: Int): Int {
        if (nowTime >= self.vestingStartTime + self.vestingTotalDuration) {
            return totalAmount;
        }

        if (nowTime < self.vestingStartTime + self.unlockPeriod) {
            return 0;
        }
        
        return muldivc(totalAmount, (nowTime - self.vestingStartTime) / self.unlockPeriod, self.vestingTotalDuration / self.unlockPeriod);
    }


    fun getAmountToWithdraw(nowTime: Int, lastWithdrawTime: Int, totalUserDeposit: Int): Int {
        let totalUserDepositAndReward = totalUserDeposit + muldivc(totalUserDeposit, self.totalReward, self.totalCoinsLocked);

        let oldAmountToSend = self.getUnlockedAmount(lastWithdrawTime, totalUserDepositAndReward);
        let currentAmountToSend = self.getUnlockedAmount(nowTime, totalUserDepositAndReward);
        return currentAmountToSend - oldAmountToSend;
    }


    inline fun checkLoadData() { 
        throwUnless(InvalidStartTime, self.depositsEndTime < self.vestingStartTime);
        throwUnless(InvalidUnlockPeriod, mod(self.vestingTotalDuration, self.unlockPeriod) == 0);
    }

    receive(msg: WithdrawFromBill) {
        self.checkLoadData();
        
        let billAddress: Address = contractAddress(initOf LockerBill(myAddress(), 0, msg.userAddress, 0));

        throwUnless(OnlyBillSender, sender() == billAddress);

        message(MessageParameters {
            bounce: false,
            to: msg.userAddress,
            value: self.getAmountToWithdraw(msg.nowTime, msg.lastWithdrawTime, msg.totalUserDeposit),
            mode: SendRemainingValue,
        });
    }

    receive("d") {  // deposit 
        self.checkLoadData();
        
        let value = context().value;
        throwUnless(NotEnoughCoinsForReward, value >= MINIMUM_REWARD);
        throwUnless(DepositsTimeEnded, now() < self.depositsEndTime);

        let amount = value - ton("1");
        self.totalCoinsLocked += amount; 

        deploy(DeployParameters {
            value: ton("0.5"),
            init: initOf LockerBill (myAddress(), 0, sender(), 0),
            body: DepositToBill { amount }.toCell(), 
        });
    }

    receive("r") { // reward 
        self.checkLoadData();
        let value = context().value;
        throwUnless(NotEnoughCoinsForReward, value >= MINIMUM_REWARD);
        throwUnless(DepositsTimeEnded, now() < self.depositsEndTime);

        self.totalReward += value - ton("1");
    }

    receive("w") { // withdraw message from locker 
        self.checkLoadData();
        
        let value = context().value;
        throwUnless(MsgValueAtLeastOneTon, value >= ton("1"));
        throwUnless(WithdrawTimeNotStarted, now() >= self.vestingStartTime + self.unlockPeriod);
        let billAddress = contractAddress(initOf LockerBill(myAddress(), 0, sender(), 0));

        message(MessageParameters {
            to: billAddress,
            value: 0,
            body: "w".asComment(),
            mode: SendRemainingValue,
        });
    }

    receive(s: Slice) { 
        self.checkLoadData();
        let msg = TextReciever.fromSlice(s);

        throwUnless(OnlyTextCommentsSupported, msg.op == 0);

        throw(InvalidComment); // we don't support any other comments 
    }

    get fun get_unlocked_amount(nowTime: Int, totalAmount: Int): Int {
        self.checkLoadData();
        return self.getUnlockedAmount(nowTime, totalAmount);
    }

    get fun get_amount_to_withdraw(nowTime: Int, lastWithdrawTime: Int, totalUserDeposit: Int): Int {   
        self.checkLoadData();
        return self.getAmountToWithdraw(nowTime, lastWithdrawTime, totalUserDeposit);
    }
    
    get fun get_locker_data(): LockerData {
        self.checkLoadData();
        return LockerData {
            totalCoinsLocked: self.totalCoinsLocked,
            totalReward: self.totalReward,
            depositsEndTime: self.depositsEndTime,
            vestingStartTime: self.vestingStartTime,
            vestingTotalDuration: self.vestingTotalDuration,
            unlockPeriod: self.unlockPeriod,
        };
    }

    get fun get_bill_address(userAddress: Address): Address {
        self.checkLoadData();
        return contractAddress(initOf LockerBill(myAddress(), 0, userAddress, 0));
    }

}



struct TextReciever { 
    op: Int as uint32;
}

struct LockerBillData { 
    lockerAddress: Address;
    totalCoinsDeposit: Int as coins;
    userAddress: Address;
    lastWithdrawTime: Int as uint32;
}

const OnlyLockerAddress: Int  = 80;
const OnlyUserAddress: Int = 82;
const OnlyTextCommentsSupported: Int = 61;
const InvalidComment: Int = 62;

contract LockerBill (
    lockerAddress: Address,
    totalCoinsDeposit: Int as coins,
    userAddress: Address,
    lastWithdrawTime: Int as uint32,
) {
    receive(msg: DepositToBill) { // probably deposit notify from locker
        throwUnless(OnlyLockerAddress, sender() == self.lockerAddress);
        self.totalCoinsDeposit += msg.amount;
    }

    receive("w") { // withdraw message from locker 
        throwUnless(OnlyLockerAddress, sender() == self.lockerAddress);

        let nowTime = now();
        
        message(MessageParameters {
            bounce: true,
            to: self.lockerAddress,
            value: 0,
            body: WithdrawFromBill {
                userAddress: self.userAddress,
                totalUserDeposit: self.totalCoinsDeposit,
                lastWithdrawTime: self.lastWithdrawTime,
                nowTime: nowTime,
            }.toCell(),
            mode: SendRemainingValue
        });
        
        self.lastWithdrawTime = nowTime;
    }

    receive("e") { // recover message, if the user mistakenly sent a deposit not to the locker but directly to the bill - we give him the opportunity to withdraw these coins
        throwUnless(OnlyUserAddress, sender() == self.userAddress);
            
        nativeReserve(ton("1"), 2); // implementation detail 
        
        cashback(sender());
    }

    receive(s: Slice) { 
        let msg = TextReciever.fromSlice(s);

        throwUnless(OnlyTextCommentsSupported, msg.op == 0);

        throw(InvalidComment); // If it is not "w" or "e" - we throw an error
    }

    get fun get_locker_bill_data(): LockerBillData {
        return LockerBillData {
            lockerAddress: self.lockerAddress,
            totalCoinsDeposit: self.totalCoinsDeposit,
            userAddress: self.userAddress,
            lastWithdrawTime: self.lastWithdrawTime,
        };
    }
}
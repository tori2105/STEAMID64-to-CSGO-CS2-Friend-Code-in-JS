"use strict";

const zero_bs = 0n;
const one_bs = 1n;
const n256_bs = 256n;

class ByteSwap {
    static from_little_endian(bytes) {
        let result = zero_bs;
        let base = one_bs;
       bytes.forEach(function (byte) {
            result = result + (base * (BigInt(byte)));
            base = base * n256_bs;
        });
        return result;
    }

    static from_big_endian(bytes) {
        const reversedBytes = new Uint8Array(bytes).reverse();
        return this.from_little_endian(reversedBytes);
    }

    static to_little_endian(bigNumber) {
        let result = new Uint8Array(8); 
        let i = 0;
        let tempBigNumber = bigNumber;
        while (tempBigNumber > zero_bs && i < 8) {
            result[i] = Number(tempBigNumber % n256_bs);
            tempBigNumber = tempBigNumber / n256_bs;
            i += 1;
        }
       return result;
    }

    static to_big_endian(bigNumber) {
        const littleEndianBytes = this.to_little_endian(bigNumber);
        return new Uint8Array(littleEndianBytes).reverse();
    }
}

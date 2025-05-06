"use strict";

const alnum_fc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ralnum_fc = {
    'A': 0n, 'B': 1n, 'C': 2n, 'D': 3n, 'E': 4n, 'F': 5n, 'G': 6n, 'H': 7n,
    'J': 8n, 'K': 9n, 'L': 10n, 'M': 11n, 'N': 12n, 'P': 13n, 'Q': 14n, 'R': 15n,
    'S': 16n, 'T': 17n, 'U': 18n, 'V': 19n, 'W': 20n, 'X': 21n, 'Y': 22n, 'Z': 23n,
    '2': 24n, '3': 25n, '4': 26n, '5': 27n, '6': 28n, '7': 29n, '8': 30n, '9': 31n,
};

const default_steam_id_fc = 0x110000100000000n;
const default_group_id_fc = 0x170000000000000n;

let byteSwap64_fc = (bigIntInput) => {
    const le_bytes = ByteSwap.to_little_endian(bigIntInput);
    const be_bytes_for_from_le = new Uint8Array(le_bytes).reverse(); 
    return ByteSwap.from_little_endian(be_bytes_for_from_le);
};


let b32_fc = (input) => {
    let res = "";
    let current_input = byteSwap64_fc(input);

    for (let i = 0; i < 13; i++) {
        if (i === 4 || i === 9) {
            res += "-";
        }
        res += alnum_fc[Number(current_input & 0x1Fn)]; // Use Number() for array indexing
        current_input >>= 5n;
    }
    return res;
};

let rb32_fc = (input_str) => {
    let res = 0n;
    let current_input_str = input_str;

    for (let i = 0; i < 13; i++) {
        if (i === 4 || i === 9) {
            current_input_str = current_input_str.slice(1);
        }
        res |= ralnum_fc[current_input_str[0]] << (5n * BigInt(i));
        current_input_str = current_input_str.slice(1);
    }
    // The result also needs to be byte-swapped back.
    return byteSwap64_fc(res);
};

let hash_steam_id_fc = (id) => {
    let account_id = id & 0xFFFFFFFFn;
    let strange_steam_id = account_id | 0x4353474F00000000n; // 'CSGO' in big-endian, low part is account_id

    // to_little_endian will produce [ acc_byte0, acc_byte1, acc_byte2, acc_byte3, 'O', 'G', 'S', 'C' ]
    let bytes_to_hash = ByteSwap.to_little_endian(strange_steam_id);

    if (typeof calculateMD5_hex !== 'function') {
        console.error("MD5 function 'calculateMD5_hex' is not defined. Please include an MD5 library and define this function.");
        throw new Error("Missing MD5 implementation.");
    }
    let hash_hex_string = calculateMD5_hex(bytes_to_hash);

    // Convert the first 4 bytes (8 hex characters) of the MD5 hex string into a Uint8Array
    let md5_first_4_bytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        md5_first_4_bytes[i] = parseInt(hash_hex_string.substring(i * 2, i * 2 + 2), 16);
    }

    return ByteSwap.from_little_endian(md5_first_4_bytes);
};

let make_u64_fc = (hi, lo) => {
   return (BigInt(hi) << 32n) | BigInt(lo);
};

class FriendCode {
    static encode(steamid_input) {
        let steamid = BigInt(steamid_input);
        let h = hash_steam_id_fc(steamid);
        let r = 0n;

        for (let i = 0; i < 8; i++) {
            let id_nibble = steamid & 0xFn;
            steamid >>= 4n;

            let hash_nibble = (h >> BigInt(i)) & 1n;

            let a = (r << 4n) | id_nibble; // r is BigInt, ensure operations maintain BigInt

            r = make_u64_fc(r >> 28n, a);
            r = make_u64_fc(r >> 31n, (a << 1n) | hash_nibble);
        }
        let res = b32_fc(r);

        if (res.slice(0, 5) === "AAAA-") { // Check for "AAAA-" prefix including hyphen
            res = res.slice(5);
        } else if (res.slice(0,4) == "AAAA" && res.length > 4 && res[4] !== '-') {
             //This case should not happen if b32_fc is correct, but as safety for AAAA not followed by hyphen
        }


        return res;
    }

    static __decode(friend_code_str) {
        if (typeof friend_code_str !== 'string' || (friend_code_str.length !== 10 && friend_code_str.length !==9 && friend_code_str.length !== 4 && friend_code_str.length !== 5) ) {
         if (friend_code_str.length !== 10) return null; // Sticking to original intent for internal __decode
        }

        let val_input_for_rb32;
       if (friend_code_str.length === 10 && friend_code_str.indexOf('-') === 5) {
            val_input_for_rb32 = "AAAA-" + friend_code_str;
        } else {
        return null;
        }


        let val = rb32_fc(val_input_for_rb32);
        let id = 0n;

        for (let i = 0; i < 8; i++) {
            val >>= 1n;
            let id_nibble = val & 0xFn;
            val >>= 4n;
           id <<= 4n;
            id |= id_nibble;
        }
        return id;
    }

    static decode(friend_code_str) {
        let id_decoded_val = FriendCode.__decode(friend_code_str);

        if (id_decoded_val !== null) {
            return (id_decoded_val | default_steam_id_fc).toString();
        }
        return "";
    }

    static encode_direct_challenge(account_id_input) {
        let account_id = BigInt(account_id_input);
        let r_val = () => (BigInt(Math.floor(Math.random() * 0x7fff)) << 16n) | BigInt(Math.floor(Math.random() * 0x7fff));
        r_val = () => BigInt(Math.floor(Math.random() * 0x7fffffff)) & ~0xFFFFn; 
        r_val = () => BigInt(Math.floor(Math.random() * 0x7fff)) << 16n; 

        let part1_steamid_data = r_val() | (account_id & 0x0000FFFFn);
        let part2_steamid_data = r_val() | ((account_id & 0xFFFF0000n) >> 16n);

        let part1_code = FriendCode.encode(part1_steamid_data);
        let part2_code = FriendCode.encode(part2_steamid_data);

        return `${part1_code}-${part2_code}`;
    }

    static encode_direct_group_challenge(group_id_input) {
        let group_id = BigInt(group_id_input);
        const challenge_marker = 0x10000n;

        let part1_group_data = challenge_marker | (group_id & 0x0000FFFFn);
        let part2_group_data = challenge_marker | ((group_id & 0xFFFF0000n) >> 16n);

        let part1_code = FriendCode.encode(part1_group_data);
        let part2_code = FriendCode.encode(part2_group_data);

        return `${part1_code}-${part2_code}`;
    }

    static decode_direct_challenge(challenge_code_str) {
        if (typeof challenge_code_str !== 'string' || challenge_code_str.length !== 21) {
    return "";
        }

        let part1_str_code = challenge_code_str.substring(0, 10);
        let part2_str_code = challenge_code_str.substring(11);

        let decoded_p1_val = FriendCode.__decode(part1_str_code);
        let decoded_p2_val = FriendCode.__decode(part2_str_code);

        if (decoded_p1_val === null || decoded_p2_val === null) {
            return "";
        }

        let p1_bigint = BigInt(decoded_p1_val);
        let p2_bigint = BigInt(decoded_p2_val);

        let type = "u";
       let reconstructed_id_32bit = (p1_bigint & 0x0000FFFFn) | ((p2_bigint & 0x0000FFFFn) << 16n);

        const challenge_marker = 0x10000n;
        if (((p1_bigint & 0xFFFF0000n) === challenge_marker || (p1_bigint >> 16n) === challenge_marker) &&
            ((p2_bigint & 0xFFFF0000n) === challenge_marker || (p2_bigint >> 16n) === challenge_marker) ) { // Check high 16 bits of p2_bigint
            type = "g";
            reconstructed_id_32bit = reconstructed_id_32bit | default_group_id_fc;
        } else {
            reconstructed_id_32bit = reconstructed_id_32bit | default_steam_id_fc;
        }
       return `${p1_bigint.toString()},${p2_bigint.toString()},${type},${reconstructed_id_32bit.toString()}`;
    }
}

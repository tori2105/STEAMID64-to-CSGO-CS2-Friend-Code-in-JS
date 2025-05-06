<p align="center"><img width="200px" height="auto" src="https://raw.githubusercontent.com/tori2105/iOS-App-Scripts/refs/heads/main/resources/bongo.png"></p>

### READ THIS CAREFULLY
<span><b><i>THIS THING IS BASED ON <a href="https://github.com/emily33901/js-csfriendcode">EMILY'S WORK</a> WHICH USING NODEJS</i></b><br>
With the help of chatbots, I managed to convert the code to Javascript. I didn't do much on this, but I hope I can help some noobs out there who are stuck reading the Steam API documentation like me.

### Put this inside your HTML body
```
<script src="https://cdn.jsdelivr.net/npm/js-md5@0.7.3/src/md5.min.js"></script>
<script>
function calculateMD5_hex(uint8Array) {
return md5(uint8Array);
}
</script>
<script src="https://raw.githubusercontent.com/tori2105/STEAMID64-to-CSGO-CS2-Friend-Code-in-JS/refs/heads/main/byteswap.js"></script>
<script src="https://raw.githubusercontent.com/tori2105/STEAMID64-to-CSGO-CS2-Friend-Code-in-JS/refs/heads/main/friendcode.js"></script>
```

### Example commands
<span>Convert SteamID64 to CS Friend Code</span>
```
console.log(FriendCode.encode("STEAMID64"))
```
<span>Convert CS Friend Code to SteamID64</span>
```
console.log(FriendCode.decode("FRIENDCODE"))
```

curl "https://api.github.com/repos/berty/berty/issues?per_page=100&page=1" >  berty.issues.json
curl "https://api.github.com/repos/berty/berty/issues?per_page=100&page=2" >> berty.issues.json
curl "https://api.github.com/repos/berty/berty/pulls?per_page=100&page=1" >  berty.pulls.json

curl "https://api.github.com/repos/berty/weshnet/issues?per_page=100&page=1" > weshnet.issues.json
curl "https://api.github.com/repos/berty/weshnet/pulls?per_page=100&page=1" > weshnet.pulls.json

curl "https://api.github.com/repos/berty/weshnet-expo/issues?per_page=100&page=1" > weshnet-expo.issues.json
curl "https://api.github.com/repos/berty/weshnet-expo/pulls?per_page=100&page=1" > weshnet-expo.pulls.json

curl "https://api.github.com/repos/berty/go-orbit-db/issues?per_page=100&page=1" > go-orbit-db.issues.json
curl "https://api.github.com/repos/berty/go-orbit-db/pulls?per_page=100&page=1" > go-orbit-db.pulls.json

curl "https://api.github.com/repos/berty/go-ipfs-log/issues?per_page=100&page=1" > go-ipfs-log.issues.json
curl "https://api.github.com/repos/berty/go-ipfs-log/pulls?per_page=100&page=1" > go-ipfs-log.pulls.json

curl "https://api.github.com/repos/ipfs-shipyard/gomobile-ipfs/issues?per_page=100&page=1" >  gomobile-ipfs.issues.json
curl "https://api.github.com/repos/ipfs-shipyard/gomobile-ipfs/pulls?per_page=100&page=1" >  gomobile-ipfs.pulls.json

curl "https://api.github.com/repos/berty/www.berty.tech/issues?per_page=100&page=1" > www.berty.tech.issues.json
curl "https://api.github.com/repos/berty/www.berty.tech/pulls?per_page=100&page=1" > www.berty.tech.pulls.json

curl "https://api.github.com/repos/berty/www.wesh.network/issues?per_page=100&page=1" > www.wesh.network.issues.json
curl "https://api.github.com/repos/berty/www.wesh.network/pulls?per_page=100&page=1" > www.wesh.network.pulls.json

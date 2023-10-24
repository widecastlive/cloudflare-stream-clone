#! /bin/sh
npm install -y
node index.js $1 $2

wget --retry-connrefused --waitretry=5 --read-timeout=20 --timeout=15 -t 10 --content-disposition -q --show-progress -P ./data/audio/ -i ./data/audio/segments.txt
wget --retry-connrefused --waitretry=5 --read-timeout=20 --timeout=15 -t 10 --content-disposition -q --show-progress -P ./data/360p/ -i ./data/360p/segments.txt
wget --retry-connrefused --waitretry=5 --read-timeout=20 --timeout=15 -t 10 --content-disposition -q --show-progress -P ./data/720p/ -i ./data/720p/segments.txt
wget --retry-connrefused --waitretry=5 --read-timeout=20 --timeout=15 -t 10 --content-disposition -q --show-progress -P ./data/1080p/ -i ./data/1080p/segments.txt

for file in ./data/*/*.mp4\?*; do mv "$file" "${file%%\?*}"; done

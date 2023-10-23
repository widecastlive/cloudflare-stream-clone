#! /bin/sh
yarn install -y
node index.js $1 $2

wget --content-disposition -P ./data/audio/ -i ./data/audio/segments.txt
wget --content-disposition -P ./data/360/ -i ./data/360/segments.txt
wget --content-disposition -P ./data/720/ -i ./data/720/segments.txt
wget --content-disposition -P ./data/1080/ -i ./data/1080/segments.txt

for file in ./data/*/*.mp4\?*; do mv "$file" "${file%%\?*}"; done

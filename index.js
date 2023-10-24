const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const fs = require("fs");
const { argv } = require("process");

const input = argv[2];
if (!input) throw Error("Missing input manifest URL");

const manifestFileName = argv[3] || "manifest.m3u8";

const formats = ["1920", "1280", "640"];

const base = input.substring(0, input.indexOf('/', 10));
const source = `${base}/${input.split('/')[3]}/${input.split('/')[4]}`;

const cleanup = ({ type = "manifest", source, manifest, target }) => {
	if (type === "manifest") {
		let manifestSource = source;
		const audio = manifest.mediaGroups.AUDIO.group_audio.original.uri;
		manifestSource = manifestSource.replace(audio, `audio/${manifestFileName}`);

		manifest.playlists.forEach(playlist => {
			if (!formats.includes(playlist.attributes.RESOLUTION.width)) return;
			const variant = playlist.attributes.RESOLUTION.height + "p";
			const uri = playlist.uri;
			manifestSource = manifestSource.replaceAll(uri, `${variant}/${manifestFileName}`);
		});

		return fs.writeFileSync(target, manifestSource);
	} else if (type === "segment") {
		let manifestSource = source;
		const init = manifest.segments[0].map.uri;
		let newinit = init.split("?")[0];
		newinit = newinit.split("/").pop();
		manifestSource = manifestSource.replace(init, newinit);

		manifest.segments.forEach(segment => {
			const uri = segment.uri;
			let newuri = uri.split("?")[0];
			newuri = newuri.split("/").pop();
			manifestSource = manifestSource.replaceAll(uri, newuri);
		});

		return fs.writeFileSync(target, manifestSource);
	}
};

const processPlaylist = async (variant, playlist) => {
	const parser = new m3u8Parser.Parser();
	console.log('<<', variant, `${source}/${playlist}`);
	const manifestSource = await axios.get(`${source}/${playlist}`).then(res => res.data);
	fs.mkdirSync(`./data/${variant}`, { recursive: true });
	fs.writeFileSync(`./data/${variant}/source_manifest.m3u8`, manifestSource);
	parser.push(manifestSource);
	parser.end();
	const manifest = parser.manifest;
	fs.writeFileSync(`./data/${variant}/source_manifest.json`, JSON.stringify(manifest));
	cleanup({ type: "segment", source: manifestSource, manifest, target: `./data/${variant}/${manifestFileName}` });
	const files = manifest.segments.map(segment => {
		const source = segment.uri.replaceAll("../", "");
		return `${base}/${source}`;
	});
	(() => {
		const source = manifest.segments[0].map.uri.replaceAll("../", "");
		files.push(`${base}/${source}`);
	})();
	return fs.writeFileSync(`./data/${variant}/segments.txt`, files.join("\n"));
};

const run = async (input) => {
	const parser = new m3u8Parser.Parser();
	const manifestSource = await axios.get(`${source}/${input}`).then(res => res.data);
	fs.mkdirSync(`./data`, { recursive: true });
	fs.writeFileSync("./data/source_manifest.m3u8", manifestSource);

	parser.push(manifestSource);
	parser.end();

	const manifest = parser.manifest;
	fs.writeFileSync(`./data/source_manifest.json`, JSON.stringify(manifest));
	cleanup({ type: "manifest", source: manifestSource, manifest, target: `./data/${manifestFileName}` });
	await processPlaylist("audio", manifest.mediaGroups.AUDIO.group_audio.original.uri);
	await Promise.all(manifest.playlists.map(playlist => {
		const variant = playlist.attributes.RESOLUTION.height + "p";
		return processPlaylist(variant, playlist.uri);
	}));
	console.log("Done");
};

run(input.split('/')[5]);

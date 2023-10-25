const { argv } = require("process");

const manifest = argv[2];
if (!manifest) throw Error("Missing input manifest URL");
const manifestFileName = argv[3] || "manifest.m3u8";

require("./process")({
	manifest,
	manifestFileName
});

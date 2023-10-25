const axios	= require('axios');
const m3u8Parser = require("m3u8-parser");
const fs = require("fs");
const exec = require('child_process').exec;

const main = require('../process');

jest.mock("axios");

jest.mock("axios");

beforeAll(async () => {
	const mockedManifest = fs.readFileSync("./__mocks__/mock.manifest.m3u8");
	const mockedVariantManifest = fs.readFileSync("./__mocks__/mock.variant.m3u8");
	axios.get.mockImplementation(u => {
		if (u.endsWith("manifest.m3u8")) {
			return Promise.resolve({ data: mockedManifest.toString() });
		} else {
			return Promise.resolve({ data: mockedVariantManifest.toString() });
		}
	});

	await main({ manifest: "manifest.m3u8", manifestFileName: "test.m3u8" });
});

afterAll(() => {
	jest.resetAllMocks();
	exec("rm -rf ./data");
});

describe("check process artefacts", () => {
	it('should have created all manifests', async () => {
		expect(fs.existsSync("./data/1080p/test.m3u8")).toBe(true);
		expect(fs.existsSync("./data/720p/test.m3u8")).toBe(true);
		expect(fs.existsSync("./data/360p/test.m3u8")).toBe(true);
		expect(fs.existsSync("./data/audio/test.m3u8")).toBe(true);
		expect(fs.existsSync("./data/test.m3u8")).toBe(true);
	});

	it("should correctly reference variants from main manifest", () => {
		const parser = new m3u8Parser.Parser();
		const manifestSource = fs.readFileSync("./data/test.m3u8").toString();
		parser.push(manifestSource);
		parser.end();
		const manifest = parser.manifest;
		for (const playlist of manifest.playlists) {
			const uri = playlist.uri;
			expect(fs.existsSync(`./data/${uri}`)).toBe(true);
		}
	});

	it("should correctly reference segments from variants", async () => {
		const parser = new m3u8Parser.Parser();
		const manifestSource = fs.readFileSync("./data/1080p/test.m3u8").toString();
		const segmentsLength = fs.readFileSync("./data/1080p/segments.txt").toString().split("\n").length;
		parser.push(manifestSource);
		parser.end();
		const manifest = parser.manifest;
		expect(manifest.segments.length + 1).toBe(segmentsLength);
	});
});
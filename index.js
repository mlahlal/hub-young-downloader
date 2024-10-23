import sqlite3 from "sqlite3";
import AdmZip from "adm-zip";
import PDFMerger from "pdf-merger-js";
import fetch from "node-fetch";
import fsExtra from "fs-extra";
import fs from "fs/promises";

class HubYoung {
	loginInfo;

	constructor(){}

	async login(username, psw) {
		this.loginInfo = await fetch("https://bce.mondadorieducation.it/app/mondadorieducation/login/hubLoginJsonp", {
			"credentials": "include",
			"headers": {
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
				"Accept": "application/json, text/plain, */*",
				"Accept-Language": "en-US,en;q=0.5",
				"Content-Type": "application/json",
				"Sec-Fetch-Dest": "empty",
				"Sec-Fetch-Mode": "cors",
				"Sec-Fetch-Site": "cross-site"
			},
			"referrer": "https://www.hubscuola.it/",
			"body": `{\"method\":\"POST\",\"headers\":{\"Content-Type\":\"application/json\"},\"body\":\"{\\\"idSito\\\":\\\"ED\\\",\\\"username\\\":\\\"${username}\\\",\\\"password\\\":\\\"${psw}\\\",\\\"rememberMe\\\":false,\\\"domain\\\":\\\"hubscuola\\\",\\\"gRecaptchaResponse\\\":\\\"\\\",\\\"verifyRecaptcha\\\":false,\\\"addFullProfile\\\":true,\\\"addHubEncryptedUser\\\":true,\\\"refreshLocalData\\\":true,\\\"activatePromos\\\":true}\"}`,
			"method": "POST",
			"mode": "cors"
		}).then((response)=>response.json());

		if (this.loginInfo.result == 'ERROR') {
			console.error("Le credenziali inserite sono errate");
			process.exit(1);
		}
	}

	async getBooks() {
		let books = await fetch(`https://bce.mondadorieducation.it/app/mondadorieducation/prodotto/listJsonp?idSito=ED&sessionId=${this.loginInfo.data.sessionId}&action=hubscuola&type=INT&excludedClassiAnagrafiche=RE-93%2C90-93`, {
			"credentials": "include",
			"headers": {
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
				"Accept": "*/*",
				"Accept-Language": "en-US,en;q=0.5",
				"Sec-Fetch-Dest": "script",
				"Sec-Fetch-Mode": "no-cors",
				"Sec-Fetch-Site": "cross-site"
			},
			"referrer": "https://www.hubscuola.it/",
			"method": "GET",
			"mode": "cors"
		}).then((response)=>response.json());

		this.bookList = [];

		for (const book of books.data) {
			let bookInfo = await fetch(`https://bce.mondadorieducation.it/app/mondadorieducation/prodotto/readComponentsJsonp?idSito=ED&sessionId=${this.loginInfo.data.sessionId}&isbn=${book.info.isbnArticoloSingolo}&tipoArticolo=SET_COMMERCIALE`, {
				"credentials": "include",
				"headers": {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
					"Accept": "*/*",
						"Accept-Language": "en-US,en;q=0.5",
						"Sec-Fetch-Dest": "script",
						"Sec-Fetch-Mode": "no-cors",
						"Sec-Fetch-Site": "cross-site"
				},
				"referrer": "https://www.hubscuola.it/",
				"method": "GET",
				"mode": "cors"
			}).then((response)=>response.json());

			for (const subBook of bookInfo.data) {
				if (subBook.tipo == "iflip") {
					let temp = {
						name: `${subBook.titolo} - ${subBook.info.titoloArticoloSingolo}`,
						value: `${subBook.isbn}`,
						description: `${subBook.isbn}`
					};
					this.bookList.push(temp);
				}
			}
		}

		return this.bookList;
	}

	async download(volumeId) {
		let bookLink = await fetch(`https://ms-api.hubscuola.it/go-young?iss=${volumeId}&usr=${this.loginInfo.data.profile.username}`, {
			"headers": {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate, br',
					'Connection': 'keep-alive',
					'Cookie': `minisitesSessionId=${this.loginInfo.data.sessionId}; hubEncryptedUser=${this.loginInfo.data.hubEncryptedUser}; bcejwt.loginToken=${this.loginInfo.data.loginToken};`,
					'Upgrade-Insecure-Requests': '1',
					'Sec-Fetch-Dest': 'document',
					'Sec-Fetch-Mode': 'navigate',
					'Sec-Fetch-Site': 'none',
					'Sec-Fetch-User': '?1',
					'Pragma': 'no-cache',
					'Cache-Control': 'no-cache',
					'TE': 'trailers'
			}
		}).then((response)=>response.url);

		let body =  `{"userData":{"browser":{"name":"Firefox","version":"125.0","major":"125"},"so":{"name":"Linux","version":"x86_64"},"app":{"name":"HUB Young","type":"young","version":"6.7"},"platform":"web","userAgent":"Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0"},"username":"${this.loginInfo.data.profile.username}","sessionId":"${this.loginInfo.data.sessionId}","jwt":"${this.loginInfo.data.hubEncryptedUser}"}`;

		let tokenSession = await fetch(`https://ms-api.hubscuola.it/user/internalLogin`, {
			"method": "POST",
			"headers": {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
				'Content-Type': "application/json",
				'Accept': 'application/json, text/plain, */*',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate, br',
				'Origin': 'https://young.hubscuola.it/',
				'Connection': 'keep-alive',
				'Referer': 'https://young.hubscuola.it/',
				'Sec-Fetch-Dest': 'empty',
				'Sec-Fetch-Mode': 'cors',
				'Sec-Fetch-Site': 'same-site',
				'Pragma': 'no-cache',
				'Cache-Control': 'no-cache',
				'TE': 'trailers',
				'Cookie': `minisitesSessionId=${this.loginInfo.data.sessionId}; hubEncryptedUser=${this.loginInfo.data.hubEncryptedUser}; bcejwt.loginToken=${this.loginInfo.data.loginToken};`
			},
			body: body
		}).then((response)=>response.json());

		let title = this.bookList.find(book => book.value == volumeId).name;
		volumeId = bookLink.split("/").pop();
		let token = tokenSession.tokenId;
		let platform = "hubyoung";

		await fsExtra.ensureDir("temp");

		// make sure folder is empty
		await fs.readdir("temp").then(async files => {
			for (const file of files) {
				await fsExtra.remove(`temp/${file}`);
			}
		});

		platform = platform === "hubyoung" ? "young" : "kids";

		console.log("Fetching book info...");
		console.log("Downloading chapter...");

		var res = await fetch(
			`https://ms-mms.hubscuola.it/downloadPackage/${volumeId}/publication.zip?tokenId=${token}`,
			{ headers: { "Token-Session": token } }
		);
		if (res.status !== 200) {
			console.error("API error:", res.status);
			reject(res.status);
		}

		console.log("Extracting...");

		const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
		await zip.extractAllTo("temp/extracted-files");

		console.log("Reading chapter list...");

		let db = new sqlite3.Database(
			"./temp/extracted-files/publication/publication.db",
			(err) => {
				if (err) {
					console.error(err.message);
					process.exit(1);
				}
			}
		);
		let chapters = await new Promise((resolve) => {
			db.get("SELECT offline_value FROM offline_tbl WHERE offline_path=?",[`meyoung/publication/${volumeId}`], (err, row) => {
				resolve(JSON.parse(row.offline_value).indexContents.chapters);
			});
		});
		db.close();

		console.log("Downloading pages...")

		for (const chapter of chapters) {
			const url = `https://ms-mms.hubscuola.it/public/${volumeId}/${chapter.chapterId}.zip?tokenId=${token}&app=v2`;
			var res = await fetch(url, {
				headers: { "Token-Session": token },
			}).then((res) => res.arrayBuffer());
			const zip = new AdmZip(Buffer.from(res));
			await zip.extractAllTo(`temp/build`);
		}

		console.log("Merging pages...");

		const merger = new PDFMerger();
		for (const chapter of chapters) {
			let base = `./temp/build/${chapter.chapterId}`;
			const files = fsExtra.readdirSync(base);
			for (const file of files) {
				if (file.includes(".pdf")) {
					await merger.add(`${base}/${file}`);
				}
			}
		}
		merger.save(`${title}.pdf`);

		fsExtra.removeSync("temp");

		console.log("Book saved");
	}
}

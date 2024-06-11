import select, { Separator } from '@inquirer/select';
import input from '@inquirer/input';
import password from '@inquirer/password';
import sqlite3 from "sqlite3";
import AdmZip from "adm-zip";
import PDFMerger from "pdf-merger-js";
import request from "sync-request";
import fsExtra from "fs-extra";
import yargs from "yargs";
import PromptSync from "prompt-sync";

const username = await input({ message: 'Enter your username' });
const psw = await password({ message: 'Enter your password', mask: true });


let loginInfo = await fetch("https://bce.mondadorieducation.it/app/mondadorieducation/login/hubLoginJsonp", {
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

let books = await fetch(`https://bce.mondadorieducation.it/app/mondadorieducation/prodotto/listJsonp?idSito=ED&sessionId=${loginInfo.data.sessionId}&action=hubscuola&type=INT&excludedClassiAnagrafiche=RE-93%2C90-93`, {
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

let bookList = [];

for (const book of books.data) {
	let bookInfo = await fetch(`https://bce.mondadorieducation.it/app/mondadorieducation/prodotto/readComponentsJsonp?idSito=ED&sessionId=${loginInfo.data.sessionId}&isbn=${book.info.isbnArticoloSingolo}&tipoArticolo=SET_COMMERCIALE`, {
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
			bookList.push(temp);
		}
	}
}

const answer = await select({
  message: 'Choose a book',
  choices: bookList,
});

let bookLink = await fetch(`https://ms-api.hubscuola.it/go-young?iss=${answer}&usr=${loginInfo.data.profile.username}`, {
	"headers": {
		'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
    		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    		'Accept-Language': 'en-US,en;q=0.5',
    		'Accept-Encoding': 'gzip, deflate, br',
    		'Connection': 'keep-alive',
    		'Cookie': `minisitesSessionId=${loginInfo.data.sessionId}; hubEncryptedUser=${loginInfo.data.hubEncryptedUser}; bcejwt.loginToken=${loginInfo.data.loginToken}; _iub_cs-19487504=%7B%22timestamp%22%3A%222024-06-10T20%3A00%3A09.374Z%22%2C%22version%22%3A%221.60.3%22%2C%22purposes%22%3A%7B%221%22%3Atrue%2C%223%22%3Afalse%2C%224%22%3Afalse%2C%225%22%3Afalse%7D%2C%22id%22%3A19487504%2C%22cons%22%3A%7B%22rand%22%3A%220774b6%22%7D%7D`,
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

let body =  `{"userData":{"browser":{"name":"Firefox","version":"125.0","major":"125"},"so":{"name":"Linux","version":"x86_64"},"app":{"name":"HUB Young","type":"young","version":"6.7"},"platform":"web","userAgent":"Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0"},"username":"${loginInfo.data.profile.username}","sessionId":"${loginInfo.data.sessionId}","jwt":"${loginInfo.data.hubEncryptedUser}"}`;

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
		'Cookie': `minisitesSessionId=${loginInfo.data.sessionId}; hubEncryptedUser=${loginInfo.data.hubEncryptedUser}; bcejwt.loginToken=${loginInfo.data.loginToken}; _iub_cs-19487504=%7B%22timestamp%22%3A%222024-06-10T20%3A00%3A09.374Z%22%2C%22version%22%3A%221.60.3%22%2C%22purposes%22%3A%7B%221%22%3Atrue%2C%223%22%3Afalse%2C%224%22%3Afalse%2C%225%22%3Afalse%7D%2C%22id%22%3A19487504%2C%22cons%22%3A%7B%22rand%22%3A%220774b6%22%7D%7D`
	},
	body: body
}).then((response)=>response.json());






let data;
let volumeId = bookLink.split("/").pop();
let token = tokenSession.tokenId;
let platform = "young";
let title = "libro";



async function initialize() {
    volumeId = argv.volumeId;
    token = argv.token;
    platform = argv.platform;

    fsExtra.mkdirSync("temp");

    while (!platform) {
        platform = prompt(
            "Input the platform (either 'hubyoung' or 'hubkids'): "
        );
        if (platform !== "hubyoung" && platform !== "hubkids") {
            console.log(
                "Invalid platform, please input either 'hubyoung' or 'hubkids'"
            );
            platform = null;
        }
    }
    platform = platform === "hubyoung" ? "young" : "kids";
    while (!volumeId) volumeId = prompt("Input the volume ID: ");
    while (!token) token = prompt("Input the token: ");

    let response = await fetch("https://ms-api.hubscuola.it/me" + platform + "/publication/" + volumeId, { method: "GET", headers: { "Token-Session": token, "Content-Type": "application/json" } });
    const code = response.status;
    if (code === 500) {
        console.log("Volume ID not valid");
    } else if (code === 401) {
        console.log("Token Session not valid, you may have copied it wrong or you don't own this book.");
    } else {
        let result = await response.json();
        title = result.title;
        console.log(`Downloading "${title}"...`);
    }
}

async function downloadZip() {
	fsExtra.mkdirSync("temp");
    const zipFilePath = "temp/data.zip";
    return new Promise(async (resolve, reject) => {
        var res = request(
            "GET",
            `https://ms-mms.hubscuola.it/downloadPackage/${volumeId}/publication.zip?tokenId=${token}`,
            { headers: { "Token-Session": token } }
        );
        if (res.statusCode !== 200) {
            console.error("Errore API:", res.statusCode);
            resolve();
        }
        await fsExtra.writeFile(zipFilePath, res.body, (err) => {
            if (err) {
                console.error(err);
                resolve();
            }

            console.log("Downloaded chapters...");
            resolve();
        });
    });
}

async function extractZip() {
    const zipFilePath = "temp/data.zip";
    const extractDir = "temp/extracted-files";
    const zip = new AdmZip(zipFilePath);

    zip.extractAllTo(extractDir);

    console.log("Extracted chapters...");
}

async function connectDb() {
    return new Promise((resolve, rejects) => {
        let db = new sqlite3.Database(
            "./temp/extracted-files/publication/publication.db",
            (err) => {
                if (err) {
                    console.error(err.message);
                }
            }
        );
        db.get(
            "SELECT offline_value FROM offline_tbl WHERE offline_path=?",
            [`meyoung/publication/${volumeId}`],
            (err, row) => {
                if (err) {
                    console.error(err);
                    resolve();
                }
                if (!row) {
                    resolve();
                }
                data = JSON.parse(row.offline_value).indexContents.chapters;
                console.log("Fetched chapters");
                resolve();
            }
        );
        db.close();
    });
}

async function extractPages() {
    for (const chapter of data) {
        const url = `https://ms-mms.hubscuola.it/public/${volumeId}/${chapter.chapterId}.zip?tokenId=${token}&app=v2`;
        var res = await fetch(url, {
            headers: { "Token-Session": token },
        }).then((res) => res.arrayBuffer());
        const zip = new AdmZip(Buffer.from(res));
        await zip.extractAllTo(`temp/build`);
    }
    console.log("Extracted pages...");
}

async function mergePages() {
    const merger = new PDFMerger();
    console.log("Merging pages...");
    for (const chapter of data) {
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

//await initialize();
await downloadZip();
extractZip();
await connectDb();
await extractPages();
mergePages();

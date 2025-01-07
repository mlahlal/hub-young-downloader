# hub-young-downloader
A package to list and retrieve books from HUB Young.

## Installation
This package is not published on npm. To install it, use the following command:
```
npm i github:mlahlal/hub-young-downloader#v5
```

## Basic Usage
```javascript
import { HubYoung } from 'hub-young-downloader';

const hubyoung = new HubYoung();

// Login to HubYoung
await hubyoung.login("username", "password");

// List the books linked with your account
let books = await hubyoung.getBooks();

// Download the first book
await hubyoung.download(books[0].value);
```

## Disclaimer

Remember that you are responsible for what you are doing on the internet and even tho this script exists it might not be legal in your country to create personal backups of books.

I may or may not update it depending on my needs tho I'm open to pullup requests ecc.

## Licence

This software uses the MIT License

## Special Mention
The foundation of this project was initially developed by [Leone25](github.com/Leone25).

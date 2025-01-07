declare module "hub-young-downloader" {
	export interface Book {
		name: string;
		value: string;
		thumbnail: string;
	}

	export class HubYoung {
		constructor(): void;
		login(username: string, psw: string): Promise<void>;
		getBooks(): Promise<Array<Book>>;
		download(volumeId: string): Promise<void>;
	}
}

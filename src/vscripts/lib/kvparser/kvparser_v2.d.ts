declare interface KVParserV2 {
	PATH : string
	VERSION : string

	// load KV string file, and no string copying during recursive GetKV
	LoadKV(file: string): Object;

	LoadKVFromFile(file: unknown): Object;

	// Print the KV in different formats
	PrintingKV(inTable: Object, level?: number): void;

	PrintKVToConsole(inTable: Object, level?: number): void;

	PrintKVToFile(file: unknown, inTable: Object, level?: number): void;

	// Internal functions

	// Recursive function to obtain a correct KV (no checking)
	GetKV(inTable: Object, start?: number): number
}

declare var KVParserV2 : KVParserV2;
declare enum KVParserV3_mode {
	// Duplicate keys will be combined if both values are tables, written over otherwise.
	DEFAULT = 0,
	// Duplicate keys will be written over.
	REPLACE = 1,
	// Duplicate keys will be renamed.
	UNIQUE = 2,
	// Returns arrays instead of tables, with array data containing {data.key} and {data.val}.
	ORDERED = 3,
}

declare interface KVParserV3 {
	MODE_DEFAULT : KVParserV3_mode.DEFAULT;
	MODE_REPLACE : KVParserV3_mode.REPLACE;
	MODE_UNIQUE : KVParserV3_mode.UNIQUE;
	MODE_ORDERED : KVParserV3_mode.ORDERED;

	// Loads a KV from a file. Base folder is "dota 2 beta/game/bin/<win32/win64>/". Can only be called in tools mode.
	// Supports referencing other files using "#base".
	LoadKeyValueFromFile(file_path: string, mode: KVParserV3_mode): Object;

	// Loads a KV from a string. Does not support referencing other files using "#base".
	LoadKeyValueFromString(path: string, mode: KVParserV3_mode): Object;

	PrintToConsole(inTable: Object): void;

	// Writes to opened file.
	PrintToFile(inTable: Object, file: unknown): void;

	// Writes as string to given table, split by newlines
	PrintToTable(inTable: Object, tab: Object): void;

	// Calls func( str ) for each line in produced KV string
	PrintToFunc(inTable: Object, func: (str: string) => void | any): void;

	// Legacy

	LoadKV(path: string): Object;

	LoadKVFromFile(file: unknown): Object;

	PrintKVToFile(file: unknown, inTable: Object, level?: undefined): Object;

	// Main

	Start(): {} | void;
	StartNew(): {} | void;

	Lexing(): void;
	LexingParsing(): void;

	Parsing(): Object;

	Insert : {
		[KVParserV3_mode.DEFAULT]: <T>(tab: Object, key: string | number, val: T) => T | void,
		[KVParserV3_mode.REPLACE]: (tab: Object, key: string | number, val: any) => void,
		[KVParserV3_mode.UNIQUE]: (tab: Object, key: string | number, val: any) => void,
		[KVParserV3_mode.ORDERED]: (tab: Object, key: string | number, val: any) => void
	};

	Referencing(path: string): Object;

	Printing(inTable: Object, func?: (str: string) => void | any, level?: number, ordered?: boolean): Object;

	// Helper

	GetLine(pos: number): number;

	DeepPrint(tab: Object, level?: number): void;

	InitToken(): void;

	DoToken(token_type: "string" | "{" | "}" | "base", a: number, b: number): void;
}

declare var PATH : string;

declare var KVParserV3 : KVParserV3;
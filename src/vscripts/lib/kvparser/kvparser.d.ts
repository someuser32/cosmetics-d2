declare enum KVParser_mode {
	// Duplicate keys will be combined if both values are tables, written over otherwise.
	DEFAULT = 0,
	// Duplicate keys will be written over.
	REPLACE = 1,
	// Duplicate keys will be renamed.
	UNIQUE = 2,
	// Returns arrays instead of tables, with array data containing {data.key} and {data.val}.
	ORDERED = 3,
}

declare interface KVParser {
	MODE_DEFAULT : KVParser_mode.DEFAULT;
	MODE_REPLACE : KVParser_mode.REPLACE;
	MODE_UNIQUE : KVParser_mode.UNIQUE;
	MODE_ORDERED : KVParser_mode.ORDERED;

	// Loads a KV from a file. Base folder is "dota 2 beta/game/bin/<win32/win64>/".
	// Supports referencing other files using "#base".
	// Can only be called in tools mode.
	LoadKeyValueFromFile(file_path: string, mode: KVParser_mode): Object;

	// Loads a KV from an opened file handle.
	// Supports referencing other files using "#base".
	// Can only be called in tools mode.
	LoadKeyValueFromFile(file_handle: unknown, mode: KVParser_mode): Object;

	// Loads a KV from an lua file using 'require'.
	// Does not support referencing other files using "#base".
	LoadKeyValueFromRequire(path: string, mode: KVParser_mode): Object;

	// Loads a KV from a string.
	// Does not support referencing other files using "#base".
	LoadKeyValueFromString(str: string, mode: KVParser_mode): Object;

	PrintToConsole(inTable: Object): void;

	// Writes to opened file.
	PrintToFile(inTable: Object, file: unknown): void;

	// Writes as string to given table, split by newlines
	PrintToTable(inTable: Object, tab: Object): void;

	// Calls func( str ) for each line in produced KV string
	PrintToFunc(inTable: Object, func: (str: string) => void | any): void;

	LoadKeyValueFromOpenFile2(file: unknown, mode: KVParser_mode): Object;

	LoadKeyValueFromOpenFile(file: string, mode: KVParser_mode): Object;

	// Legacy

	LoadKV(path: string): Object;

	LoadKVFromFile(file: unknown): Object;

	PrintKVToFile(file: unknown, inTable: Object, level?: undefined): Object;

	// Main

	Start(): {} | void;

	LexingParsing(): void;

	Insert : {
		[KVParser_mode.DEFAULT]: <T>(tab: Object, key: string | number, val: T) => T | void,
		[KVParser_mode.REPLACE]: (tab: Object, key: string | number, val: any) => void,
		[KVParser_mode.UNIQUE]: (tab: Object, key: string | number, val: any) => void,
		[KVParser_mode.ORDERED]: (tab: Object, key: string | number, val: any) => void
	};

	Referencing(path: string): Object;

	Printing(inTable: Object, func?: (str: string) => void | any, level?: number, ordered?: boolean): Object;

	// Helper

	GetLine(pos: number): number;

	DeepPrint(tab: Object, level?: number): void;
}

declare var PATH : string;

declare var KVParser : KVParser;
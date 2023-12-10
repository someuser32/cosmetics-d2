-- Created by Elfansoer

--------------------------------------------------------------------------------
-- Class Definition
if KVParserV2 then return end
KVParserV2 = {}

-- edit dis
KVParserV2.PATH = "scripts/vscripts/libraries/kvparser/"

-- dont edit dis, and all below
KVParserV2.VERSION = "1.0"

--------------------------------------------------------------------------------
-- load KV string file, and no string copying during recursive GetKV
function KVParserV2:LoadKV( path )
	-- get files
	-- load file
	if not pcall( function() self.loaded_string = require( path ) end ) then
		return
	end

	-- self.loaded_string = require( path )
	-- if not self.loaded_string then return end

	-- start parsing kv
	local ret = {}
	self:GetKV( ret )

	-- erase string
	self.loaded_string = nil

	-- return
	return ret
end

function KVParserV2:LoadKVFromFile( file )
	-- load file
	self.loaded_string = file:read("*all")

	-- start parsing kv
	local ret = {}
	self:GetKV( ret )

	-- erase string
	self.loaded_string = nil

	-- return
	return ret
end

--------------------------------------------------------------------------------
-- Print the KV in different formats
function KVParserV2:PrintingKV( inTable, level )
	if not level then level = 0 end

	for k,v in pairs(inTable) do
		print(string.rep("    ", level) .. k,v)
		if type(v)=="table" then
			self:PrintingKV( v, level+1 )
		end
	end
end

function KVParserV2:PrintKVToConsole( inTable, level )
	if not level then level = 0 end
	local indent = string.rep( "    ", level )

	-- give quote
	local Q = function( s )
		return '"' .. s .. '"'
	end

	local str
	for key,val in pairs(inTable) do
		-- check value
		if type( val )=="string" or type( val )=="number" then

			-- write key value
			print( indent .. Q(key) .. '\t' .. Q(val) )

		elseif type( val )=="table" then

			-- write key then newline and `{`, then another newline
			print( indent .. Q(key) )
			print( indent .. "{" )

			-- write child kv
			self:PrintKVToConsole( val, level+1 )

			-- close with `}`
			print( indent .. "}" )
		end
	end
end

function KVParserV2:PrintKVToFile( file, inTable, level )
	if not level then level = 0 end
	local indent = string.rep( "    ", level )

	-- give quote
	local Q = function( s )
		return '"' .. s .. '"'
	end

	local str
	for key,val in pairs(inTable) do
		-- check value
		if type( val )=="string" or type( val )=="number" then

			-- write key value
			file:write( indent .. Q(key) .. '\t' .. Q(val) .. '\n' )

		elseif type( val )=="table" then

			-- write key then newline and `{`, then another newline
			file:write( indent .. Q(key) .. '\n' )
			file:write( indent .. "{" .. '\n' )

			-- write child kv
			self:PrintKVToFile( file, val, level+1 )

			-- close with `}`
			file:write( indent .. "}" .. '\n' )
		end
	end
end


--------------------------------------------------------------------------------
-- Internal Functions

-- Recursive function to obtain a correct KV (no checking)
function KVParserV2:GetKV( inTable, start )
	if not start then start = 1 end

	local a,b,last = nil

	-- check what is next character
	a,b = string.find( self.loaded_string, '["{}]', start )
	local nextchar = string.sub( self.loaded_string, a, b )
	if nextchar=='}' then
		-- end of line of a table
		return 0
	end

	-- get key (it will not be a table. better not be or else the kv is wrong)
	a,b = string.find( self.loaded_string, '".-"', start )
	local key = string.sub( self.loaded_string, a+1, b-1 )
	last = b+1

	-- check if key already exist
	if inTable[key] then
		-- start from 2
		local number = 2

		-- test if numbered key exist
		local testkey = key .. "_" .. number
		while inTable[testkey] do
			-- increment number
			number = number + 1
			testkey = key .. "_" .. number
		end

		-- rename with number
		key = testkey
	end

	-- decide whether the value is another table or simple string
	a,b = string.find( self.loaded_string, '["{]', last )
	local char = string.sub( self.loaded_string, a, b )

	if char=='"' then		-- value is string
		-- get value
		a,b = string.find( self.loaded_string, '".-"', last )
		local val = string.sub( self.loaded_string, a+1, b-1 )
		last = b+1

		-- special case if the value uses backslash
		local special = string.sub( self.loaded_string, b-1, b-1 )
		if special=='\\' then
			local old_a = a

			while true do
				-- find next quotes but without backslash
				a,b = string.find( self.loaded_string, '["]', last )
				local beforequote = string.sub( self.loaded_string, a-1, b-1 )
				last = b+1

				-- escape if the quote is not backslashed
				if beforequote~="\\" then
					break
				end

			end

			-- rewrite val
			val = string.sub( self.loaded_string, old_a+1, b-1 )
		end

		-- register table, preferrably with numbers
		local newkey = tonumber(key) or key
		inTable[newkey] = val

		-- return last placed pointer
		return last

	elseif char=='{' then		-- value is another table
		-- skip the '{'
		last = b+1

		-- prepare new table
		local data = {}

		-- get kv
		while true do
			-- try obtain kv
			local last2 = self:GetKV( data, last )

			-- if it is empty or end of table, break
			if last2==0 then
				break
			end

			-- if it is not, continue
			last = last2
		end

		-- proceed to find '}'
		a,b = string.find( self.loaded_string, '}', last )
		last = b+1

		-- register table
		local newkey = tonumber(key) or key
		inTable[newkey] = data

		-- return last placed pointer
		return last
	end

end

--------------------------------------------------------------------------------
-- Finished Load
print( "KVParserV2 loaded." )

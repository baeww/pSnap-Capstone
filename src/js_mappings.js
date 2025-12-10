// Default JavaScript Code Mappings for Snap! Primitives

(function() {
    var mappings = {
        // Types & Delimiters
        // These keys are looked up by specific slot morphs
        // 'string': "'<#1>'", // This might double quote if input is already quoted? 
                              // But screenshot says: map String to code '<#1>'
        // 'number': '<#1>',
        
        // Operators
        reportSum: '(<#1> + <#2>)',
        reportVariadicSum: '(<#1>)', // MultiArgMorph handles the joining with +
        reportDifference: '(<#1> - <#2>)',
        reportProduct: '(<#1> * <#2>)',
        reportVariadicProduct: '(<#1>)', // MultiArgMorph handles the joining with *
        reportQuotient: '(<#1> / <#2>)',
        reportModulus: '(<#1> % <#2>)',
        reportRound: 'Math.round(<#1>)',
        reportMonadic: 'Math.<#1>(<#2>)', 
        reportRandom: '(Math.floor(Math.random() * (<#2> - <#1> + 1)) + <#1>)',
        reportLessThan: '(<#1> < <#2>)',
        reportGreaterThan: '(<#1> > <#2>)',
        reportEquals: '(<#1> === <#2>)',
        reportAnd: '(<#1> && <#2>)',
        reportVariadicAnd: '(<#1>)', // MultiArgMorph handles joining
        reportOr: '(<#1> || <#2>)',
        reportVariadicOr: '(<#1>)', // MultiArgMorph handles joining
        reportNot: '(!<#1>)',
        reportTrue: 'true',
        reportFalse: 'false',
        reportJoinWords: '(<#1> + <#2>)', // Binary version
        // reportJoinWords is variadic in v6+, but MultiArgMorph patch below handles it if mapped correctly
        
        reportLetter: '(<#2>)[<#1> - 1]',
        reportStringSize: '(<#1>.length)',
        reportUnicode: '(<#1>).charCodeAt(0)',
        reportUnicodeAsLetter: 'String.fromCharCode(<#1>)',
        reportMin: 'Math.min(<#1>)', // MultiArgMorph should join with comma
        reportMax: 'Math.max(<#1>)', // MultiArgMorph should join with comma
        reportIsA: "(typeof <#1> === 'number')", // Simplified based on screenshot "is 5 a Number?"

        // Variables
        doSetVar: '<#1> = <#2>;',
        doChangeVar: '<#1> += <#2>;',
        doShowVar: 'console.log(<#1>);',
        doHideVar: '',
        doDeclareVariables: 'var <#1>;', // script variables

        // Lists
        reportNewList: '[<#1>]',
        reportListLength: '(<#1>.length)',
        reportListItem: '<#2>[<#1> - 1]',
        reportListContains: '(<#2>).includes(<#1>)',
        doAddToList: '<#2>.push(<#1>);',
        
        // Control
        doIf: 'if (<#1>) {\n<#2>\n}',
        doIfElse: 'if (<#1>) {\n<#2>\n} else {\n<#3>\n}',
        doIfIsMasterThread: 'print("doIfIsMasterThread");',
        doRepeat: 'for (var i = 0; i < <#1>; i++) {\n<#2>\n}',
        doFor: 'for (var <#1> = <#2>; <#1> <= <#3>; <#1> += 1) {\n<#4>\n}',
        doReport: 'return <#1>;',
        doSayFor: 'console.log(<#1>);', // say ... for ... secs
        doSay: 'console.log(<#1>);',     // say ...
        
        // Misc
        // 'main': '<#1>', // Hat block mapping if needed
	Barrier: 'await barrierWait();',
        ParallelMaster: 'if ((typeof __isParallelMaster === "function" ? __isParallelMaster() : true)) {\n<#1>\n}',
        ParallelSingle: 'if ((typeof __isParallelSingle === "function" ? __isParallelSingle() : (typeof __isParallelMaster === "function" ? __isParallelMaster() : true))) {\n<#1>\n}',

    };

    // Helper to apply mappings
    window.loadJSMappings = function() {
        // Set basic type mappings directly if possible or via keys
        // Note: StageMorph.prototype.codeMappings is a simple object.
        // The keys 'string', 'number', 'boolTrue', 'boolFalse' are special.
        
        StageMorph.prototype.codeMappings['string'] = "'<#1>'";
        StageMorph.prototype.codeMappings['number'] = '<#1>';
        StageMorph.prototype.codeMappings['boolTrue'] = 'true';
        StageMorph.prototype.codeMappings['boolFalse'] = 'false';
        
        // Delimiters for MultiArgMorph
        StageMorph.prototype.codeMappings['parms_delim'] = ', ';
        StageMorph.prototype.codeMappings['tempvars_delim'] = ', ';
        StageMorph.prototype.codeMappings['list_delim'] = ', '; // reportNewList
        StageMorph.prototype.codeMappings['join_delim'] = ' + '; // reportJoinWords

        for (var key in mappings) {
            if (!StageMorph.prototype.codeMappings[key]) {
                StageMorph.prototype.codeMappings[key] = mappings[key];
            }
        }

        // Patch MultiArgMorph to support variadic delimiters
        if (typeof MultiArgMorph !== 'undefined') {
            MultiArgMorph.prototype.mappedCode = function (definitions) {
                var block = this.parentThatIsA(BlockMorph),
                    key = '',
                    code,
                    items = '',
                    itemCode,
                    delim,
                    count = 0,
                    parts = [];
            
                if (block) {
                    if (block instanceof RingMorph) {
                        key = 'parms_';
                    } else if (block.selector === 'doDeclareVariables') {
                        key = 'tempvars_';
                    } else if (block.selector === 'reportVariadicProduct') {
                        delim = ' * ';
                    } else if (block.selector === 'reportVariadicSum') {
                        delim = ' + ';
                    } else if (block.selector === 'reportVariadicAnd') {
                        delim = ' && ';
                    } else if (block.selector === 'reportVariadicOr') {
                        delim = ' || ';
                    } else if (block.selector === 'reportJoinWords') {
                        delim = ' + '; // Join takes arguments and adds them
                    } else if (block.selector === 'reportNewList') {
                        delim = ', ';
                    } else if (block.selector === 'reportVariadicMin') {
                        delim = ', ';
                    } else if (block.selector === 'reportVariadicMax') {
                        delim = ', ';
                    }
                }
            
                code = StageMorph.prototype.codeMappings[key + 'list'] || '<#1>';
                itemCode = StageMorph.prototype.codeMappings[key + 'item'] || '<#1>';
                delim = delim || StageMorph.prototype.codeMappings[key + 'delim'] || ' ';
            
                this.inputs().forEach(input =>
                    parts.push(itemCode.replace(/<#1>/g, input.mappedCode(definitions)))
                );
                parts.forEach(part => {
                    if (count) {
                        items += delim;
                    }
                    items += part;
                    count += 1;
                });
                code = code.replace(/<#1>/g, items);
                return code;
            };
        }
    };
})();


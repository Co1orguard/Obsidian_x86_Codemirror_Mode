// x86-assembly.js

CodeMirror.defineMode("x86-assembly", function(config) {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }


  var keywords = words("mov add sub jmp je jne cmp call ret nop eax ebx ecx edx push pop");

  var registers = words("eax ebx ecx edx esi edi ebp esp");

  var directives = words("SECTION GLOBAL EXTERN");

  var isOperatorChar = /[+\-*&%=<>!?|]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    
    // Handle registers in square brackets
    if (ch === '[') {
      while ((ch = stream.next()) != null) {
        if (ch === ']') {
          break;
        }
      }
      return "variable-2"; // Tokenize the register in square brackets
    }
    
    // Handle function labels
    if (/[a-zA-Z_]/.test(ch)) {
      stream.eatWhile(/[\w_\$]/);
      if (stream.eat(":")) {
        return "variable-3"; // Tokenize the function label
      }
    }


    
    // Handle comments
    if (ch == ";") {
      stream.skipToEnd();
      return "comment";
    }

    // Handle strings
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }

    // Handle numbers
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }

    // Handle operators
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }

    // Handle registers
    if (/[a-zA-Z_]/.test(ch)) {
      stream.eatWhile(/[\w_]/);
      var cur = stream.current();
      if (registers.propertyIsEnumerable(cur)) return "variable-2";
    }

    // Handle keywords and directives
    stream.eatWhile(/[\w_]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) return "keyword";
    if (directives.propertyIsEnumerable(cur)) return "def";

    return null;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped) state.tokenize = null;
      return "string";
    };
  }

  // Interface

  return {
    startState: function() {
      return { tokenize: null };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      return style;
    },

    electricChars: "{}"
  };
});

// Define MIME types for x86 assembly
CodeMirror.defineMIME("text/x-x86-assembly", "x86-assembly");
CodeMirror.defineMIME("text/x-asm", "x86-assembly");
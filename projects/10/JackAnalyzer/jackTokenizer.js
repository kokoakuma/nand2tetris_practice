const fs = require('fs');
const path = require('path');

const {
  TOKEN_TYPE,
  KEYWORDS,
  SYMBOLS,
} = require('./constants');
const { builtinModules } = require('module');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

class JackTokenizer {
  constructor(filePath) {
    let fileContent = fs.readFileSync(path.resolve(__dirname, filePath), { encoding: 'utf-8'});

    while (fileContent.indexOf('/*') !== -1) {
      const index = fileContent.indexOf('/*');
      const index2 = fileContent.indexOf('*/');
      fileContent = fileContent.slice(0, index) + fileContent.slice(index2+2);
    }
    const lines = fileContent.split(/\n/).filter((line) => {
      return line.trim() !== '' && line.trim().startsWith('//');
    })

    const linesWithoutComments = lines.map((line) => {
      return line.split('//')[0].trim();
    });

    this.tokens = [];
    const reg = /[\{\}\(\)[\]\.,;\+\-\*\&\|<>=~]/;

    const parserUnit = (unit) => {
      while (unit) {
        if (unit.match(reg)) {
          const index = unit.match(reg).index;
          if (index !== 0) {
            this.tokens.push(unit.slice(0, index)); // 区切りの前までを入れる
          }
          this.tokens.push(unit.slice(index, index+1)); // 区切りとなる演算子などを入れる
          unit = unit.slice(index+1);　// 残りをunitに入れる
        } else {
          this.tokens.push(unit); // もう区切りがない場合、全部入れる
          unit = '';
        }
      }
    };

    linesWithoutComments.forEach((line) => {
      while (line) {
        const doubleQuoteIndex = line.indexOf('"');
        const spaceIndex = line.indexOf(' ');
        if (line.startsWith('"')) {
          const index = line.indexOf('"', 1);
          this.tokens.push(line.slice(0, index + 1));
          line = line.slice(index + 1).trim();
        } else if (doubleQuoteIndex !== -1 && spaceIndex !== -1 && doubleQuoteIndex < spaceIndex) {
          let unit = lien.slice(0, doubleQuoteIndex);
          parserUnit(unit);
          line = line.slice(doubleQuoteIndex).trim();
        } else if (spaceIndex !== -1) {
          let unit = line.slice(0, spaceIndex);
          parserUnit(unit);
          line = line.slice(spaceIndex +  1).trim();
        } else {
          parserUnit(line);
          line = '';
        }
      }
    });

    this.tokenCounter = 0;
    this.currentToken = this.tokens[this.tokenCounter];
  }

  hasMoreTokens() {
    return this.tokens.length > this.tokenCounter;
  }

  advance() {
    if (!this.hasMoreTokens()) return;
    this.tokenCounter += 1;
    this.currentToken = this.tokens[this.tokenCounter];
    return;
  };

  tokenType() {
    if (Object.values(KEYWORDS).includes(this.currentToken)) {
      return TOKEN_TYPE.KEYWORD;
    } else if (Object.values(SYMBOLS).includes(this.currentToken)) {
      return TOKEN_TYPE.SYMBOL;
    } else if (this.currentToken.match(/^[0-9]+$/) && Number(this.currentToken) <= 32767) {
      return TOKEN_TYPE.INT_CONST;
    } else if (this.currentToken.match(/^[a-zA-z_][a-zA-Z0-9_]*$/)) {
      return TOKEN_TYPE.IDENTIFER;
    } else if (this.currentToken.match(/^"[^"\n]*"$/)) {
      return TOKEN_TYPE.STRING_CONST;
    } else {
      throw new Error(`invalid tokenType. currentToke: ${this.currentToken}`)
    }
  }

  keyWord() {
    if (this.tokenType() !== TOKEN_TYPE.KEYWORD) return;
    return this.currentToken;
  }

  symbol() {
    if (this.tokenType() !== TOKEN_TYPE.SYMBOL) return;
    return this.currentToken;
  }

  identifer() {
    if(this.tokenType() !== TOKEN_TYPE.IDENTIFER) return;
    return this.currentToken;
  }

  intVal() {
    if(this.tokenType() !== TOKEN_TYPE.INT_CONST) return;
    return this.currentToken;
  }

  stingVal() {
    if(this.tokenType() !== TOKEN_TYPE.STRING_CONST) return;
    return this.currentToken.slice(1, -1);
  }
};

module.exports = JackTokenizer;
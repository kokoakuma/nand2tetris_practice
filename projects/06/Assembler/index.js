const fs = require('fs');
const inputPath = '../pong/Pong.asm';
const outputPath = __dirname + '/../pong/Pong1.hack';

const { A_COMMAND, C_COMMAND, L_COMMAND } = require('./constant');
const Parser = require('./parser');
const Code = require('./code');
const SymbolTable = require('./symbolTable');

const assembler = () => {
  const parser = new Parser(inputPath);
  const code = new Code();
  const symbolTable = new SymbolTable();
  let romAddress = 0;
  let ramAddress = 16;

  while (parser.hasMoreCommands()) {
    if (parser.commandType() === A_COMMAND || parser.commandType() === C_COMMAND) {
      romAddress += 1;
    } else if (parser.commandType() === L_COMMAND) {
      const symbol = parser.symbol();
      if(!symbolTable.isContained(symbol)) {
        let address = ('000000' + romAddress.toString(16)).slice(-6);
        symbolTable.addEntry(symbol, address);
      }
    } else {
      throw new Error('invalid commandType');
    }
    parser.advance();
  }

  parser.lineCounter = 0;
  parser.currentCommand = parser.instructions[0];

  let machineCode;
  const machineCodes = []

  while (parser.hasMoreCommands()) {
    if (parser.commandType() === C_COMMAND) {
      const destMnemonic = parser.dest();
      const compMnemonic = parser.comp();
      const jumpMnemonic = parser.jump();

      const dest = code.dest(destMnemonic);
      const comp = code.comp(compMnemonic);
      const jump = code.jump(jumpMnemonic);

      machineCodes.push('111' + comp + dest + jump);
    } else if (parser.commandType() === A_COMMAND) {
      const symbol = parser.symbol();
      // シンボルが文字の場合
      if (isNaN(symbol)) {
        let address;
        if (symbolTable.isContained(symbol)) {
          address = symbolTable.getAddress(symbol);
        } else {
          address = '0x' + ('0000' + ramAddress.toString(16)).slice(-4);
          symbolTable.addEntry(symbol, address);
          ramAddress += 1;
        }
        machineCode = ('0000000000000000' + parseInt(address, 16).toString(2)).slice(-16);
      } else { // シンボルが数字の場合
        machineCode = ('0000000000000000' + parseInt(symbol).toString(2)).slice(-16);
      }

      machineCodes.push(machineCode);
    }

    parser.advance();
  }

  fs.writeFileSync(outputPath, machineCodes.join('\n'));
};

assembler();


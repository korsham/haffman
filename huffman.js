const fs = require("fs");

function getParametersOfProgram() {
    let operatingMode;
    let pathToReadableFile;
    let pathToWritableFile;

    process.argv.forEach((val, index) => {
        if (index == 2)
            operatingMode = val;
        if (index == 3)
            pathToReadableFile = val;
        if (index == 4)
            pathToWritableFile = val;
    });

    if (operatingMode != 'code' && operatingMode != 'decode') {
        console.error('ОШИБКА!\nНе указан или указан неверно режим работы программы');
        process.exit(-1);
    }
    if (pathToReadableFile == undefined || pathToWritableFile == undefined) {
        console.error('ОШИБКА!\nДолжны быть указаны пути к читаемому файлу и файлу для записи');
        process.exit(-1);
    }
    if (pathToReadableFile == pathToWritableFile) {
        console.error('ОШИБКА!\nЧитается и записывается один и тот же файл');
        process.exit(-1);
    }

    return new Array(operatingMode, pathToReadableFile, pathToWritableFile);
}

function Node(letter, frequency, used, parent, code) {
    this.letter = letter;
    this.frequency = frequency;
    this.used = used;
    this.parent = parent;
    this.code = code;
}

function GenerateFrequenciesAlphabet(text) {
    let frequenciesAlphabet = new Array();
    for (let i = 0; i < text.length; i++) {
        frequenciesAlphabet[text.charAt(i)] = 0;
    }
    for (let i = 0; i < text.length; i++) {
        frequenciesAlphabet[text.charAt(i)]++;
    }

    return frequenciesAlphabet;
}

function GetLowestFrequencyNode(frequenciesTree, text, code) {
    let minIndex = -1;
    let minFrequency = text.length;
    for (let i = 0; i < frequenciesTree.length; i++) {
        if ((!frequenciesTree[i].used) && (frequenciesTree[i].frequency <= minFrequency)) {
            minIndex = i;
            minFrequency = frequenciesTree[i].frequency;
        }
    }
    let node = frequenciesTree[minIndex];
    GenerateUsedNode(node, frequenciesTree.length, code);

    return node;
}

function GenerateUsedNode(node, parent, code) {
    node.used = true;
    node.parent = parent;
    node.code = code;
}

function GenerateFrequenciesTree(frequenciesAlphabet, text) {

    let frequenciesTree = new Array();
    for (i in frequenciesAlphabet)
        frequenciesTree.push(new Node(i, frequenciesAlphabet[i], false, null, ''));

    let treeLength = frequenciesTree.length;
    for (let i = 0; i < treeLength - 1; i++) {
        let firstItem = GetLowestFrequencyNode(frequenciesTree, text, 0);
        let secondItem = GetLowestFrequencyNode(frequenciesTree, text, 1);
        let newNode = new Node(firstItem.letter + secondItem.letter,
            firstItem.frequency + secondItem.frequency,
            false,
            null,
            '')
        frequenciesTree.push(newNode);
    }

    return frequenciesTree;
}

function GenerateCodesTable(frequenciesTree) {
    let codesTable = new Array();
    for (i = 0; i < frequenciesTree.length; i++) {
        let node = frequenciesTree[i];
        if (node.letter.length == 1) {
            let code = '';
            if (!node.parent)
                code = '0';
            codesTable[node.letter] = GenerateSymbolCode(node, frequenciesTree, code);
        }
    }

    return codesTable;
}

function GenerateSymbolCode(node, frequenciesTree, code) {
    if (!node.parent)
        return code;
    return GenerateSymbolCode(frequenciesTree[node.parent], frequenciesTree, node.code + code);
}

function code(text) {
    let frequenciesAlphabet = GenerateFrequenciesAlphabet(text);
    let frequenciesTree = GenerateFrequenciesTree(frequenciesAlphabet, text);
    let codesTable = GenerateCodesTable(frequenciesTree);
    let codedText = '';

    for (i = 0; i < text.length; i++)
        codedText += codesTable[text[i]];
    codedText += '#\n#';
    for (let symbol in codesTable)
        codedText += codesTable[symbol] + '#\n#' + symbol + '#\n#';

    return codedText;
}

function decode(text) {
    if (text.length == 0)
        return text;

    let splitedText = text.split('#\n#');
    let codedText = splitedText[0];
    let codesTable = new Array();
    for (let i = 1; i < splitedText.length; i += 2) {
        if (splitedText[i])
            codesTable[splitedText[i]] = splitedText[i + 1];
    }

    let decodedText = '';
    let curCode = '';
    for (let i = 0; i <= codedText.length;) {
        if (curCode in codesTable) {
            decodedText += codesTable[curCode];
            curCode = '';
        }
        else {
            curCode += codedText.charAt(i);
            i++;
        }
    }

    return decodedText;
}

function perform(option, pathToReadableFile, pathToWritableFile) {
    fs.readFile(pathToReadableFile, (err, data) => {
        if (err) {
            if (err.code == 'ENOENT') {
                console.error('ОШИБКА!\nПути ' + pathToReadableFile + ' не существует');
                process.exit(-1);
            }
            if (err.code == 'EISDIR') {
                console.error('ОШИБКА!\nОжидался путь до файла\n(указан путь до каталога)');
                process.exit(-1);
            }
            if (err.code == 'EACCES') {
                console.error('ОШИБКА!\nОтказано в доступе к файлу ' + pathToReadableFile);
                process.exit(-1);
            }
        }

        let text = data.toString();
        let newText;
        if (option == 'code')
            newText = code(text);
        else
            newText = decode(text);

        fs.writeFile(pathToWritableFile, newText, (err) => {
            if (err) {
                if (err.code == 'EACCES')
                    console.error('ОШИБКА!\nОтказано в доступе к файлу ' + pathToWritableFile);
                process.exit(-1);
            }
        });
    });
}

function main() {
    let parametersOfProgram = getParametersOfProgram();
    let operatingMode = parametersOfProgram[0];
    let pathToReadableFile = parametersOfProgram[1];
    let pathToWritableFile = parametersOfProgram[2];

    if (operatingMode == 'code')
        perform('code', pathToReadableFile, pathToWritableFile);
    else
        perform('decode', pathToReadableFile, pathToWritableFile);
}


main();
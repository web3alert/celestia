
import { fromBase64, toHex } from '@cosmjs/encoding'
import { sha256 } from '@cosmjs/crypto'
import protobuf from 'protobufjs'
import path from "path"
import fs from "fs"

export function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })
    return arrayOfFiles
}

export function formatBalance(raw: number, decimals: number, symbol: string, formatType: 'raw' | 'human'): string | number {
    const rawBalance = (raw / Math.pow(10, decimals));
    if(formatType == 'raw'){
        return rawBalance;
    }
    else {
        let format = "";
        let stringBalance = rawBalance.toString()
        if (stringBalance.includes('e')) {
            stringBalance = rawBalance.toFixed(decimals)
        }
        const splited = stringBalance.split('.');
        if (splited.length == 2 && splited[1].length > 4) {
            const firstNotZero = [...splited[1]].findIndex(char => char != '0')
            if (firstNotZero < 4) {
                format = rawBalance.toFixed(4);
            }
            else if (firstNotZero > decimals - 4) {
                format = rawBalance.toFixed(decimals)
            }
            else format = rawBalance.toFixed(firstNotZero + 1)
        } else {
            format = rawBalance.toString();
        }
    
        let result = format + ' ' + symbol;
    
        return result;
    }
}
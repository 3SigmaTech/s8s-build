
import fs from 'fs';
import { paths } from './paths';

export const makeDirs = () => {
    if (!fs.existsSync(paths.build + paths.vendor.dest)) {
        fs.mkdirSync(paths.build + paths.vendor.dest, { recursive: true });
    }
    if (!fs.existsSync(paths.build + paths.js.dest)) {
        fs.mkdirSync(paths.build + paths.js.dest, { recursive: true });
    }
    if (!fs.existsSync(paths.dist + paths.js.dest)) {
        fs.mkdirSync(paths.dist + paths.js.dest, { recursive: true });
    }
}

export const isIrrelevantFile = (flnm:string) => {
    if (!fs.existsSync(flnm)) {
        return true;
    }
    let file = fs.readFileSync(flnm, 'utf-8');
    
    let commentRegex = /\s*\/\/.*\n+/g;
    let multilineRegex = /\/\*([\s\S]*)?\*\//g;
    let blankRegex = /\s/g;

    file = file.replaceAll(commentRegex, '');
    file = file.replaceAll(multilineRegex, '');
    file = file.replaceAll(blankRegex, '');

    if (!file.length) {
        return true;
    }

    return false;
}

const permutations = (inputArr:any[]) => {
    let result:any[] = [];

    const permute = (arr:any[], m:any[] = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }
    permute(inputArr)
    return result;
}
export const powerSet = (arr:any[]) => {
    let set:any[] = [],
        listSize = arr.length,
        combinationsCount = (1 << listSize);

    for (let i = 1; i < combinationsCount; i++) {
        let combination = [];
        for (let j = 0; j < listSize; j++) {
            if ((i & (1 << j))) {
                combination.push(arr[j]);
            }
        }
        set.push(combination);
    }
    return set;
}

export const allPossibleCombinations = (arr:any[]) => {
    let pSet = powerSet(arr);
    let combos:any[] = [];
    for (let i = 0; i < pSet.length; i++) {
        if (!pSet[i]) {
            continue;
        }
        combos = combos.concat(permutations(pSet[i]));
    }
    return combos;
}

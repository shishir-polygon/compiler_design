const fs = require('fs');

let lexer = (sourceCode) => {
    return sourceCode.split('\n').map(line => {
        return line.split(' ').map(token => {
            if (token === 'sat') {
                return { type: 'assignment' };
            } else if (token === 'jug') {
                return { type: 'operator', value: '+' };
            } else if (token === 'shera') {
                return { type: 'print' };
            } else if (token === 'to') {
                return { type: 'to' };
            } else if (token === 'if') {
                return { type: 'if' };
            } else if (token === 'else') {
                return { type: 'else' };
            } else if (token === '==') {
                return { type: 'equals' };
            } else if (isNaN(token)) {
                return { type: 'variable', value: token };
            } else if (!isNaN(token)) {
                return { type: 'value', value: parseInt(token) };
            }
        });
    });
}

function parser(tokens) {
    let currentAssignment = null;
    let inIfBlock = false;
    return {
        type: 'Program',
        statements: tokens.map(line => {
            console.log(line)
            if (line[0].type === 'assignment') {
                return { type: 'assignment', lhs: line[3].value, rhs: line[1].value };
            } else if (line[0].type === 'operator') {
                return { type: 'operator', value: '+', lhs: line[3].value, rhs: line[1].value };
            } else if (line[0].type === 'print') {
                return { type: 'print', lhs: line[1].value };
            } else if (line[0].type === 'if') {
                currentAssignment = { type: 'if', condition: null, statements: [] };
                inIfBlock = true;
                if (line[2].type === 'equals' && inIfBlock) {
                    currentAssignment.condition = {
                        type: 'equals',
                        lhs: line[1].value,
                        rhs: line[3].value,
                    };
                }
                return currentAssignment;

            } else if (line[0].type === 'print') {
                if (currentAssignment) {
                    return currentAssignment;
                    // currentAssignment = null;
                }
                return { type: 'print', lhs: line[0].value };
            } else if (line[0].type === 'else') {
                if (currentAssignment && currentAssignment.type === 'if') {
                    return currentAssignment;
                }
                inIfBlock = false;
            }
        }),
    };
}

function generator(ast) {
    let targetCode = `@.str = private unnamed_addr constant [4 x i8] c"%d\\0A\\00"\n`;
    targetCode += `define i32 @main() {\n`;

    let tempCounter = 0;
    let inIfBlock = false;
    let checks = {};
    let checkvaluess = {};
    ast.statements.forEach(statement => {
        if (statement.type === 'assignment') {
            if (statement.lhs in checks) {
                checks[statement.lhs] = statement.rhs;
            } else {
                targetCode += `%${statement.lhs} = alloca i32\n`;
                checks[statement.lhs] = statement.rhs;
            }
            targetCode += `store i32 ${statement.rhs}, i32* %${statement.lhs}\n`;
        } else if (statement.type === 'operator') {
            let t1 = `%t${tempCounter++}`;
            checkvaluess['t1'] = t1;
            let t2 = `%t${tempCounter++}`;
            checkvaluess['t2'] = t2;

            targetCode += `${t1} = load i32, i32* %${statement.lhs}\n`;
            targetCode += `${t2} = add i32 ${t1}, ${statement.rhs}\n`;
            targetCode += `store i32 ${t2}, i32* %${statement.lhs}\n`;
        } else if (statement.type === 'if') {
            inIfBlock = true;
            // Generate code for if statement
            if (statement.condition.type === 'equals') {
                let storedValue = `%t${tempCounter++}`;
                let lhs = statement.condition.lhs;
                let rhs = statement.condition.rhs;
                let conditionCode = `%t${tempCounter} = icmp eq i32 ${checkvaluess['t2']}, ${rhs}`;
                tempCounter++;

            }
        } else if (statement.type === 'print') {
            let r1 = `%t${tempCounter++}`;
            targetCode += `${r1} = load i32, i32* %${statement.lhs}\n`;
            targetCode += `call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str, i64 0, i64 0), i32 ${r1})\n`;
        }
    });

    targetCode += `ret i32 0\n`;
    targetCode += `}\n`;
    targetCode += `declare i32 @printf(i8*, ...)\n`;

    return targetCode;
}

function build(targetCode) {
    fs.writeFileSync('./test.ll', targetCode);
    let exec = require('child_process').exec;
    exec('clang -S test.ll', (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        } else {
            console.log(stdout);
        }
    });
    exec('clang test.ll -o test.o', (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        } else {
            console.log(stdout);
        }
    });
}

function main() {
    let sourceCode = fs.readFileSync('./test.boss', 'utf8');
    let tokens = lexer(sourceCode);
    console.log(tokens);
    console.log("============================\n\n");
    let ast = parser(tokens);
    console.log(ast);
    let targetCode = generator(ast);
    console.log(targetCode);

    build(targetCode);
}

main();

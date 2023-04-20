#! /usr/bin/env node
// -*- js -*-

import * as fs from "fs";

(function() {
    fs.readFile('./package.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/"name": "{{PACKAGE_NAME}}"/g, '"name": "@3SigmaTech/{{PACKAGE_NAME}}"');

        fs.writeFile('./package.json', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
})();

const {readFileSync, writeFileSync} = require("fs");

const ljs = require('./dist/latex.js')
const { createHTMLWindow } = require('svgdom')

global.window = createHTMLWindow()
global.document = window.document

let latex = readFileSync('test.tex').toString();
// console.log(latex);

let generator = new ljs.HtmlGenerator({ hyphenate: true })

let doc = ljs.parse(latex, { generator: generator }).htmlDocument('file:///home/mzugno/Git/LaTeX.js/dist/')

// console.log(doc.documentElement.outerHTML)

writeFileSync('test.html', doc.documentElement.outerHTML);
import * as he from 'he'
import { parse, SyntaxError } from './latex-parser'
// const {parse, SyntaxError} = require("pegjs-loader!./latex-parser.pegjs");
import { Generator } from './generator'
import { HtmlGenerator } from './html-generator'

export {
    he,
    parse,
    SyntaxError,
    Generator,
    HtmlGenerator
}

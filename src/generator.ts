import {Length, lengthFactory, TLength} from './types';
import {LaTeX as Macros} from "./latex.ltx";
import {diacritics, symbols} from './symbols';
import {LocationRange} from "pegjs";
import {PEG} from 'pegjs';
import {SVG, registerWindow} from '@svgdotjs/svg.js';
import {Base} from "./documentclasses/base";

import katex from 'katex/dist/katex';

type SyntaxError = PEG.SyntaxError

export class Stack<T> extends Array<T> {

  constructor(t?: T) {
    t ? super(t) : super();
    Object.setPrototypeOf(this, Stack.prototype);
  }

  get top() {
    return this[this.length - 1];
  }

  set top(t: T) {
    this[this.length - 1] = t;
  }

}

class Attr {
  fontFamily: string
  fontWeight: string
  fontShape: string
  fontSize: string
  textDecoration: string
}

class Entry {
  name: string
  args: Array<string>
  parsed: Array<string>
  attrs: Partial<Attr>
  align: string;
  currentlabel: {
    id: string,
    label: Text
  }
  lengths: Map<string, Length> = new Map();
}

export abstract class Generator {
  // public instance vars (vars beginning with "_" are meant to be private!)

  documentClass: Base = null;     // name of the default document class until \documentclass{}, then the actual class instance
  documentTitle: string = null

  _options: {
    documentClass: Base,
    hyphenate: boolean,
    styles: Array<string>,
    languagePatterns,
    precision: number,
    CustomMacros
  }
  protected _stack = new Stack<Partial<Entry>>();
  protected _counters = new Map();
  protected _resets = new Map();
  protected _macros: Macros;
  protected _uid = 1;
  protected _curArgs = new Stack<Partial<Entry>>();
  protected _groups = new Stack<number>();
  protected _labels = new Map();
  protected _refs = new Map();
  protected _marginpars: string[] = [];
  protected _continue = 0;
  _toc;

  length: TLength = lengthFactory(this);

  zero = new this.length(0, "sp");

  abstract inline: string;
  abstract linebreak: string;

  constructor(options) {
    this._options = options;
    this._macros = new Macros(this, this._options.CustomMacros);
    // this.reset();
  }

  reset() {
    this.length = lengthFactory(this);
    this.documentClass = this._options.documentClass;
    this.documentTitle = "untitled";
    this._uid = 1;
    // this._macros = {};
    this._curArgs = new Stack<Partial<Entry>>();
    // TODO create new Entry isntance
    this._stack = new Stack({
      attrs: {},
      align: null,
      currentlabel: {
        id: "",
        label: document.createTextNode("")
      },
      lengths: new Map()
    });
    this._groups = new Stack<number>();
    this._groups.push(0);
    this._labels = new Map();
    this._refs = new Map();
    this._marginpars = [];
    this._counters = new Map();
    this._resets = new Map();
    this._continue = 0;
    this.newCounter('enumi');
    this.newCounter('enumii');
    this.newCounter('enumiii');
    this.newCounter('enumiv');
    this._macros.initCounters();
  }

  nextId() {
    return this._uid++;
  }

  round(value): number {
    let factor = Math.pow(10, this._options.precision);
    return Math.round(value * factor) / factor;
  }

  setTitle(title) {
    return this.documentTitle = title.textContent;
  }

  error(e) {
    console.error(e);
    throw new Error(e);
  }

  setErrorFn(fn) {
    this.error = fn;
  }

  location(): LocationRange {
    // FIXME return this.error("location function not set!");
    return new class implements PEG.LocationRange {
      end: PEG.Location;
      start: PEG.Location;
    }
  }

  hasSymbol(name) {
    return symbols.has(name);
  }

  symbol(name) {
    if (!this.hasSymbol(name)) {
      this.error("no such symbol: " + name);
    }
    return symbols.get(name);
  }

  hasMacro(name: string): boolean {
    let m = this._macros[name];
    return name !== 'constructor' && typeof m == 'function' && (this._macros.hasOwnProperty(name) || Macros.prototype.hasOwnProperty(name));
  }

  isHmode(macro) {
    let arg = this._macros.args[macro];
    return !arg || !arg[0] || arg[0] == 'H';
  }

  isVmode(macro) {
    let arg = this._macros.args[macro];
    return arg && arg[0] && arg[0] === 'V';
  }

  isHVmode(macro) {
    let arg = this._macros.args[macro];
    return arg && arg[0] && arg[0] === 'HV';
  }

  isPreamble(macro) {
    let arg = this._macros.args[macro];
    return arg && arg[0] && arg[0] === 'P';
  }

  macro(name, args?) {
    if (symbols.has(name)) {
      return [this.createText(symbols.get(name))];
    }
    let macro = this._macros[name];
    return macro.apply(this._macros, args)?.filter((x) => !!x).map((x) => {
      if (typeof x === 'string' || x instanceof String) {
        return this.createText(x);
      } else {
        return this.addAttributes(x);
      }
    });
  }

  beginArgs(macro: string) {
    let arg = this._macros.args[macro];
    this._curArgs.push(arg ? {
      name: macro,
      args: arg.slice(1),
      parsed: []
    } : {
      args: [],
      parsed: []
    });
  }

  // if next char matches the next arg of a branch, choose that branch
  // return true if there was a matched branch, false otherwise
  selectArgsBranch(nextChar) {
    let in$ = (x, xs) => {
      var i = -1, l = xs.length >>> 0;
      while (++i < l) if (x === xs[i]) return true;
      return false;
    }
    var branches, i$, len$, b, ref$;
    let optArgs = ['o?', 'i?', 'k?', 'kv?', 'n?', 'l?', 'c-ml?', 'cl?'];
    if (Array.isArray(this._curArgs.top.args[0])) {
      branches = this._curArgs.top.args[0];
      for (i$ = 0, len$ = branches.length; i$ < len$; ++i$) {
        b = branches[i$];
        if ((nextChar === '[' && in$(b[0], optArgs)) || (nextChar === '{' && !in$(b[0], optArgs))) {
          this._curArgs.top.args.shift();
          (ref$ = this._curArgs.top.args).unshift.apply(ref$, b);
          return true;
        }
      }
    }
  }

  // check the next argument type to parse, returns true if arg is the next expected argument
  // if the next expected argument is an array, it is treated as a list of alternative next arguments
  nextArg(arg) {
    if (this._curArgs.top.args[0] === arg) {
      this._curArgs.top.args.shift();
      return true;
    }
  }

  argError(m) {
    return this.error("macro \\" + this._curArgs.top.name + ": " + m);
  }

  endArgs() {
    let x = this._curArgs.pop();
    x.args.length === 0 || this.error("grammar error: arguments for " + x.name + " have not been parsed: " + x.args);
    return x.parsed;
  }

  begin(env_id) {
    if (!this.hasMacro(env_id)) {
      this.error("unknown environment: " + env_id);
    }
    this.startBalanced();
    this.enterGroup();
    this.beginArgs(env_id);
  }

  end(id, end_id) {
    var end;
    if (id !== end_id) {
      this.error("environment '" + id + "' is missing its end, found '" + end_id + "' instead");
    }
    if (this.hasMacro("end" + id)) {
      end = this.macro("end" + id);
    }
    this.exitGroup();
    this.isBalanced() || this.error(id + ": groups need to be balanced in environments!");
    this.endBalanced();
    return end;
  }

  enterGroup(copyAttrs: boolean = false) {
    copyAttrs == null && (copyAttrs = false);
    this._stack.push({
      attrs: copyAttrs
        ? Object.assign({}, this._stack.top.attrs)
        : {},
      align: null,
      currentlabel: Object.assign({}, this._stack.top.currentlabel),
      lengths: new Map(this._stack.top.lengths)
    });
    ++this._groups.top;
  }

  exitGroup() {
    --this._groups.top >= 0 || this.error("there is no group to end here");
    this._stack.pop();
  }

  startBalanced() {
    this._groups.push(0);
  }

  endBalanced() {
    this._groups.pop();
    return this._groups.length;
  }

  isBalanced() {
    return this._groups.top === 0;
  }

  addParsedArg(a) {
    this._curArgs.top.parsed.push(a);
  }

  parsedArgs() {
    return this._curArgs.top.parsed;
  }

  preExecMacro() {
    this.macro(this._curArgs.top.name, this.parsedArgs());
  }

  newLength(l: string) {
    if (this.hasLength(l)) {
      this.error("length " + l + " already defined!");
    }
    this._stack.top.lengths.set(l, this.zero);
  }

  hasLength(l) {
    return this._stack.top.lengths.has(l);
  }

  setLength(id, length) {
    if (!this.hasLength(id)) {
      this.error("no such length: " + id);
    }
    this._stack.top.lengths.set(id, length);
  }

  getLength(l) {
    if (!this.hasLength(l)) {
      this.error("no such length: " + l);
    }
    return this._stack.top.lengths.get(l);
  }

  'continue'() {
    this._continue = this.location().end.offset;
  }

  'break'() {
    if (this.location().end.offset > this._continue) {
      this._continue = 0;
    }
  }

  setAlignment(align) {
    this._stack.top.align = align;
  }

  alignment() {
    return this._stack.top.align;
  }

  // theLength(id){
  //   var l;
  //   l = this.create(this.inline, undefined, "the");
  //   l.setAttribute("display-var", id);
  //   return l;
  // }
  setFontFamily(family) {
    this._stack.top.attrs.fontFamily = family;
  }

  setFontWeight(weight) {
    this._stack.top.attrs.fontWeight = weight;
  }

  setFontShape(shape) {
    if (shape === "em") {
      if (this._activeAttributeValue("fontShape") === "it") {
        shape = "up";
      } else {
        shape = "it";
      }
    }
    this._stack.top.attrs.fontShape = shape;
  }

  setFontSize(size) {
    this._stack.top.attrs.fontSize = size;
  }

  setTextDecoration(decoration) {
    this._stack.top.attrs.textDecoration = decoration;
  }

  _inlineAttributes() {
    let cur = this._stack.top.attrs;
    return [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration].join(' ').replace(/\s+/g, ' ').trim();
  }

  _activeAttributeValue(attr) {
    for (let level = this._stack.length - 1; level >= 0; --level) {
      let value = this._stack[level].attrs[attr];
      if (value) {
        return value;
      }
    }
  }

  addToReset(c: string, parent: string) {
    if (!this.hasCounter(parent)) {
      this.error("no such counter: " + parent);
    }
    if (!this.hasCounter(c)) {
      this.error("no such counter: " + c);
    }
    this._resets.get(parent).push(c);
  }

  newCounter(c: string, parent?: string) {
    if (this.hasCounter(c)) {
      this.error("counter " + c + " already defined!");
    }
    this._counters.set(c, 0);
    this._resets.set(c, []);
    if (parent) {
      this.addToReset(c, parent);
    }
    // TODO FIXME
    if (!this.hasMacro('the' + c)) {
      // this.error("macro \\the" + c + " already defined!");
      this._macros['the' + c] = () => {
        return [this.arabic(this.counter(c))];
      };
    }
  }


  hasCounter(c: string) {
    return this._counters.has(c);
  }

  setCounter(c: string, v: number) {
    if (!this.hasCounter(c)) {
      this.error("no such counter: " + c);
    }
    this._counters.set(c, v);
  }

  stepCounter(c: string) {
    this.setCounter(c, this.counter(c) + 1);
    this.clearCounter(c);
  }

  counter(c: string) {
    if (!this.hasCounter(c)) {
      this.error("no such counter: " + c);
    }
    return this._counters.get(c);
  }

  abstract create(element, macro?, style?: string);

  abstract anchor(id: string);

  abstract createFragment(elements);

  abstract createText(element);

  abstract addAttributes(element);

  abstract createVSpace(length: Length);

  abstract createVSpaceSkip(skip: string);

  abstract get block(): string;

  abstract link(id?: string);

  abstract createPicture(size, offset, content);

  abstract createHSpace(l);

  abstract createImage(width, height, url);

  abstract hasAttribute(el, att): boolean;

  abstract addAttribute(el, att);

  abstract get title(): string;

  abstract get titlepage(): string;

  abstract get author(): string;

  abstract get date(): string;

  abstract get list(): string;

  abstract get unorderedList(): string;

  abstract get orderedList(): string;

  abstract get descriptionList(): string;

  abstract get listitem(): string;

  abstract get term(): string;

  abstract get description(): string;

  abstract get itemlabel(): string;

  abstract get quote(): string;

  abstract get quotation(): string;

  abstract get verse(): string;

  abstract multicols(cols);

  abstract get KaTeX(): katex;

  get SVG() {
    // TODO FIXME
    // register window and document
    registerWindow(window, document)
    return SVG;
  }

  refCounter(c, id?) {
    let el;
    if (!id) {
      id = c + "-" + this.nextId();
      el = this.create(this.anchor(id));
    }
    this._stack.top.currentlabel = {
      id: id,
      label: this.createFragment([
        ...this.hasMacro('p@' + c) ? this.macro('p@' + c) : [],
        ...this.macro('the' + c)])
    };
    return el;
  }

  clearCounter(c: string) {
    this._resets.get(c).forEach((r) => {
      this.clearCounter(r);
      this.setCounter(r, 0);
    });
  }

  alph(num) {
    return String.fromCharCode(96 + num);
  }

  Alph(num) {
    return String.fromCharCode(64 + num);
  }

  arabic(num: number) {
    return String(num);
  }

  roman(num) {
    var lookup;
    lookup = [['m', 1000], ['cm', 900], ['d', 500], ['cd', 400], ['c', 100], ['xc', 90], ['l', 50], ['xl', 40], ['x', 10], ['ix', 9], ['v', 5], ['iv', 4], ['i', 1]];
    return this._roman(num, lookup);
  }

  Roman(num) {
    var lookup;
    lookup = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
    return this._roman(num, lookup);
  }

  _roman(num, lookup) {
    var roman, i$, len$, i;
    roman = "";
    for (i$ = 0, len$ = lookup.length; i$ < len$; ++i$) {
      i = lookup[i$];
      while (num >= i[1]) {
        roman += i[0];
        num -= i[1];
      }
    }
    return roman;
  }

  fnsymbol(num) {
    switch (num) {
      case 1:
        return this.symbol('textasteriskcentered');
      case 2:
        return this.symbol('textdagger');
      case 3:
        return this.symbol('textdaggerdbl');
      case 4:
        return this.symbol('textsection');
      case 5:
        return this.symbol('textparagraph');
      case 6:
        return this.symbol('textbardbl');
      case 7:
        return this.symbol('textasteriskcentered') + this.symbol('textasteriskcentered');
      case 8:
        return this.symbol('textdagger') + this.symbol('textdagger');
      case 9:
        return this.symbol('textdaggerdbl') + this.symbol('textdaggerdbl');
      default:
        return this.error("fnsymbol value must be between 1 and 9");
    }
  }

  setLabel(label) {
    var i$, ref$, len$, r;
    if (this._labels.has(label)) {
      this.error("label " + label + " already defined!");
    }
    if (!this._stack.top.currentlabel.id) {
      console.warn("warning: no \\@currentlabel available for label " + label + "!");
    }
    this._labels.set(label, this._stack.top.currentlabel);
    if (this._refs.has(label)) {
      for (i$ = 0, len$ = (ref$ = this._refs.get(label)).length; i$ < len$; ++i$) {
        r = ref$[i$];
        while (r.firstChild) {
          r.removeChild(r.firstChild);
        }
        r.appendChild(this._stack.top.currentlabel.label.cloneNode(true));
        r.setAttribute("href", "#" + this._stack.top.currentlabel.id);
      }
      this._refs['delete'](label);
    }
  }

  ref(label) {
    var that, el;
    if (that = this._labels.get(label)) {
      return this.create(this.link("#" + that.id), that.label.cloneNode(true));
    }
    el = this.create(this.link("#"), this.createText("??"));
    if (!this._refs.has(label)) {
      this._refs.set(label, [el]);
    } else {
      this._refs.get(label).push(el);
    }
    return el;
  }

  startsection(sec, level, star, toc, ttl) {
    if (toc == ttl && ttl == undefined) {
      if (!star && this.counter("secnumdepth") >= level) {
        this.stepCounter(sec);
        this.refCounter(sec, "sec-" + this.nextId());
      }
      return;
    }
    let el;
    if (!star && this.counter("secnumdepth") >= level) {
      if (sec === 'chapter') {
        let chaphead = this.create(this.block, this.macro('chaptername').concat(this.createText(this.symbol('space')), this.macro('the' + sec)));
        el = this.create(this[sec], [chaphead, ttl]);
      } else {
        el = this.create(this[sec], this.macro('the' + sec).concat(this.createText(this.symbol('quad')), ttl));
      }
      let ref: string = this._stack.top.currentlabel.id;
      if (ref) {
        el.id = ref;
      }
    } else {
      el = this.create(this[sec], ttl);
    }
    return el;
  }

  startlist() {
    this.stepCounter('@listdepth');
    if (this.counter('@listdepth') > 6) {
      this.error("too deeply nested");
    }
    return true;
  }

  endlist() {
    this.setCounter('@listdepth', this.counter('@listdepth') - 1);
    this['continue']();
  }

  logUndefinedRefs() {
    var keys, ref;
    if (this._refs.size === 0) {
      return;
    }
    keys = this._refs.keys();
    while (!(ref = keys.next()).done) {
      console.warn("warning: reference '" + ref.value + "' undefined");
    }
    console.warn("There were undefined references.");
  }

  marginpar(txt) {
    let id = this.nextId();
    let marginPar = this.create(this.block, [this.create(this.inline, null, "mpbaseline"), txt]);
    marginPar.id = id;
    this._marginpars.push(marginPar);
    let marginRef = this.create(this.inline, null, "mpbaseline");
    marginRef.id = "marginref-" + id;
    return marginRef;
  }

}
// TODO FIXME
import {Generator} from "./generator";
import {merge, mergeWith} from 'lodash';
import {symbols} from './symbols';

import {Length, Vector} from './types';
import * as builtinDocumentclasses from './documentclasses';
import * as builtinPackages from './packages';

export enum FontAttribute {
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SHAPE
}

/**
 * This is where most macros are defined. This file is like base/latex.ltx in LaTeX.
 *
 * By default, a macro takes no arguments and is a horizontal-mode macro.
 * See below for the description of how to declare arguments.
 *
 * A macro must return an array with elements of type Node or String (text).
 *
 * This class should be independent of HtmlGenerator and just work with the generator interface.
 *
 * State is held that is relevant to the particular macros and/or documentclass.
 */
export class LaTeX {
  // args: declaring arguments for a macro. If a macro doesn't take arguments and is a
  //       horizontal-mode macro, args can be left undefined for it.
  //
  // syntax: see README.md
  private _args = {};

  providedPackages = ['calc', 'pspicture', 'picture', 'pict2e', 'keyval', 'comment'];

  _title: string = null;
  _author: string = null;
  _date: string = null;
  _thanks: string = null;

  g: Generator;

  documentClass: string;

  constructor(generator: Generator, CustomMacros) {
    this.initArgs();

    if (CustomMacros) {
      merge(this, new CustomMacros(generator));
      merge(this._args, CustomMacros.args);
      CustomMacros.symbols?.forEach((value, key) => {
        symbols.set(key, value);
      })
    }
    this.g = generator;


  }

  private initArgs() {
    this._args = {
      'empty': ['HV'],
      'par': ['V'],
      'item': ['V'],
      'onecolumn': ['V'],
      'twocolumn': ['V', 'o?'],
      'smallbreak': ['V'],
      'medbreak': ['V'],
      'bigbreak': ['V'],
      'addvspace': ['V', 'l'],
      'marginpar': ['H', 'g'],
      'title': ['HV', 'g'],
      'author': ['HV', 'g'],
      'and': ['H'],
      'date': ['HV', 'g'],
      'thanks': ['HV', 'g'],
      'emph': ['H', 'X', 'g'],
      'centering': ['HV'],
      'raggedright': ['HV'],
      'raggedleft': ['HV'],
      'center': ['V'],
      'flushleft': ['V'],
      'flushright': ['V'],
      'titlepage': ['V'],
      'quote': ['V'],
      'quotation': ['V'],
      'verse': ['V'],
      'itemize': ['V', 'X', 'items'],
      'enumerate': ['V', 'X', 'enumitems'],
      'description': ['V', 'X', 'items'],
      'picture': ['H', 'v', 'v?', 'h'],
      'hspace': ['H', 's', 'l'],
      'label': ['HV', 'g'],
      'ref': ['H', 'g'],
      // TODO: not true, these should be usable in V-mode as well, they don't \leavevmode :(
      'llap': ['H', 'hg'],
      'rlap': ['H', 'hg'],
      'clap': ['H', 'hg'],
      'mash': ['H', 'hg'],
      'hphantom': ['H', 'hg'],
      'vphantom': ['H', 'hg'],
      'phantom': ['H', 'hg'],
      // TODO: end
      'underline': ['H', 'hg'],
      'mbox': ['H', 'hg'],
      'makebox': ['H', 'v?', 'l?', 'i?', 'hg'],
      'fbox': ['H', 'hg'],
      'framebox': ['H', 'v?', 'l?', 'i?', 'hg'],
      'parbox': ['H', 'i?', 'l?', 'i?', 'l', 'g'],
      'thicklines': ['HV'],
      'thinlines': ['HV'],
      'linethickness': ['HV', 'l'],
      'arrowlength': ['HV', 'l'],
      'dashbox': ['H', 'cl', 'v', 'i?', 'g'],
      'frame': ['H', 'hg'],
      'put': ['H', 'v', 'g', 'is'],
      'multiput': ['H', 'v', 'v', 'n', 'g'],
      'qbezier': ['H', 'n?', 'v', 'v', 'v'],
      'cbezier': ['H', 'n?', 'v', 'v', 'v', 'v'],
      'circle': ['H', 's', 'cl'],
      'line': ['H', 'v', 'cl'],
      'vector': ['H', 'v', 'cl'],
      'Line': ['H', 'v', 'v'],
      'Vector': ['H', 'v', 'v'],
      'oval': ['H', 'cl?', 'v', 'i?'],
      'newlength': ['HV', 'm'],
      'setlength': ['HV', 'm', 'l'],
      'addtolength': ['HV', 'm', 'l'],
      'newcounter': ['HV', 'i', 'i?'],
      'stepcounter': ['HV', 'i'],
      'addtocounter': ['HV', 'i', 'n'],
      'setcounter': ['HV', 'i', 'n'],
      'refstepcounter': ['H', 'i'],
      'alph': ['H', 'i'],
      'Alph': ['H', 'i'],
      'arabic': ['H', 'i'],
      'roman': ['H', 'i'],
      'Roman': ['H', 'i'],
      'fnsymbol': ['H', 'i'],
      'input': ['V', 'g'],
      'include': ['V', 'g'],
      'documentclass': ['P', 'kv?', 'k', 'k?'],
      'usepackage': ['P', 'kv?', 'csv', 'k?'],
      'includeonly': ['P', 'csv'],
      'makeatletter': ['P'],
      'makeatother': ['P'],
      // ignored
      'pagestyle': ['HV', 'i'],
      'linebreak': ['HV', 'n?'],
      'nolinebreak': ['HV', 'n?'],
      'fussy': ['HV'],
      'sloppy': ['HV'],
      // these make no sense without page breaks
      'pagebreak': ['HV', 'n?'],
      'nopagebreak': ['HV', 'n?'],
      'samepage': ['HV'],
      'enlargethispage': ['HV', 's', 'l'],
      'newpage': ['HV'],
      'clearpage': ['HV'],
      'cleardoublepage': ['HV'],
      'vfill': ['HV'],
      'thispagestyle': ['HV', 'i']
    };
    ['rm', 'sf', 'tt', 'md', 'bf', 'up', 'it', 'sl', 'sc', 'normal'].forEach((l) => {
      this._args['text' + l] = ['H', 'X', 'g'];
    });
    ['rm', 'sf', 'tt'].forEach((f) => {
      this._args[`${f}family`] = ['HV'];
    });
    ['md', 'bf'].forEach((f) => {
      this._args[`${f}series`] = ['HV'];
    });
    ['up', 'it', 'sl', 'sc'].forEach((f) => {
      this._args[`${f}shape`] = ['HV'];
    });
    ['normalfont', 'em'].forEach((f) => {
      this._args[f] = ['HV'];
    });
    ['tiny', 'scriptsize', 'footnotesize', 'small', 'normalsize', 'large', 'Large', 'LARGE', 'huge', 'Huge'].forEach((f) => {
      this._args[f] = ['HV'];
    });
  }

  initCounters() {

    this.g.newCounter("secnumdepth");
    this.g.newCounter("tocdepth");

    this.g.newCounter("footnote");
    this.g.newCounter("mpfootnote");

    this.g.newCounter("@listdepth");
    this.g.newCounter("@itemdepth");
    this.g.newCounter("@enumdepth");

    this.g.newLength("@@size");

    // picture lengths
    this.g.newLength("unitlength");
    this.g.setLength("unitlength", new this.g.length(1, "pt"));

    this.g.newLength("@wholewidth");
    this.g.setLength("@wholewidth", new this.g.length(0.4, "pt"));

    this.g.newLength("paperheight");
    this.g.newLength("paperwidth");

    this.g.newLength("oddsidemargin");
    this.g.newLength("evensidemargin");

    this.g.newLength("textheight");
    this.g.newLength("textwidth");

    this.g.newLength("marginparwidth");
    this.g.newLength("marginparsep");
    this.g.newLength("marginparpush");

    this.g.newLength("columnwidth");
    this.g.newLength("columnsep");
    this.g.newLength("columnseprule");

    this.g.newLength("linewidth");

    this.g.newLength("leftmargin");
    this.g.newLength("rightmargin");
    this.g.newLength("listparindent");
    this.g.newLength("itemindent");
    this.g.newLength("labelwidth");
    this.g.newLength("labelsep");

    this.g.newLength("leftmargini");
    this.g.newLength("leftmarginii");
    this.g.newLength("leftmarginiii");
    this.g.newLength("leftmarginiv");
    this.g.newLength("leftmarginv");
    this.g.newLength("leftmarginvi");

    this.g.newLength("fboxrule");
    this.g.newLength("fboxsep");

    this.g.newLength("tabbingsep");
    this.g.newLength("arraycolsep");
    this.g.newLength("tabcolsep");
    this.g.newLength("arrayrulewidth");
    this.g.newLength("doublerulesep");
    this.g.newLength("footnotesep");
    this.g.newLength("topmargin");
    this.g.newLength("headheight");
    this.g.newLength("headsep");
    this.g.newLength("footskip");

    this.g.newLength("topsep");
    this.g.newLength("partopsep");
    this.g.newLength("itemsep");
    this.g.newLength("parsep");
    this.g.newLength("floatsep");
    this.g.newLength("textfloatsep");
    this.g.newLength("intextsep");
    this.g.newLength("dblfloatsep");
    this.g.newLength("dbltextfloatsep");
  }

  empty() {

  }

  get args() {
    return this._args;
  }

  set args(args) {
    this._args = args;
  }

  TeX() {
    var tex, e;
    this.g.enterGroup();
    tex = this.g.create(this.g.inline);
    tex.setAttribute('class', 'tex');
    tex.appendChild(this.g.createText('T'));
    e = this.g.create(this.g.inline, this.g.createText('e'), 'e');
    tex.appendChild(e);
    tex.appendChild(this.g.createText('X'));
    this.g.exitGroup();
    return [tex];
  }

  LaTeX() {
    var latex, a, e;
    this.g.enterGroup();
    latex = this.g.create(this.g.inline);
    latex.setAttribute('class', 'latex');
    latex.appendChild(this.g.createText('L'));
    a = this.g.create(this.g.inline, this.g.createText('a'), 'a');
    latex.appendChild(a);
    latex.appendChild(this.g.createText('T'));
    e = this.g.create(this.g.inline, this.g.createText('e'), 'e');
    latex.appendChild(e);
    latex.appendChild(this.g.createText('X'));
    this.g.exitGroup();
    return [latex];
  }

  today() {
    return [new Date().toLocaleDateString('en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })];
  }

  newline() {
    return [this.g.create(this.g.linebreak)];
  }

  negthinspace() {
    return [this.g.create(this.g.inline, undefined, 'negthinspace')];
  }

  onecolumn() {

  }

  twocolumn() {

  }

  smallbreak() {
    return [this.g.createVSpaceSkip('smallskip')];
  }

  medbreak() {
    return [this.g.createVSpaceSkip('medskip')];
  }

  bigbreak() {
    return [this.g.createVSpaceSkip('bigskip')];
  }

  addvspace(l) {
    // TODO not correct?
    return this.g.createVSpace(l);
  }

  marginpar(txt) {
    return [this.g.marginpar(txt)];
  }

  abstractname() {
    return ['Abstract'];
  }

  title(t) {
    this._title = t;
  }

  author(a) {
    this._author = a;
  }

  date(d) {
    this._date = d;
  }

  and() {
    return this.g.macro('quad');
  }

  thanks() {
    // TODO FIXME
    // return this._footnote;
  }

  private createFontAttribute(arg, att: FontAttribute, value: string) {
    if (!arg) {
      this.g.enterGroup();
      switch (att) {
        case FontAttribute.FONT_FAMILY:
          return this.g.setFontFamily(value);
        case FontAttribute.FONT_WEIGHT:
          return this.g.setFontWeight(value);
        case FontAttribute.FONT_SHAPE:
          return this.g.setFontShape(value);
        default:
          break;
      }
    } else {
      arg = this.g.addAttributes(arg);
      this.g.exitGroup();
      return [arg];
    }
  }

  textrm(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_FAMILY, 'rm');
  }

  textsf(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_FAMILY, 'sf');
  }

  texttt(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_FAMILY, 'tt');
  }

  textmd(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_WEIGHT, 'md');
  }

  textbf(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_WEIGHT, 'bf');
  }

  textup(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_SHAPE, 'up');
  }

  textit(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_SHAPE, 'it');
  }

  textsl(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_SHAPE, 'sl');
  }

  textsc(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_SHAPE, 'sc');
  }

  textnormal(arg) {
    if (!arg) {
      this.g.enterGroup();
      this.g.setFontFamily("rm");
      this.g.setFontWeight("md");
      return this.g.setFontShape("up");
    } else {
      arg = this.g.addAttributes(arg);
      this.g.exitGroup();
      return [arg];
    }
  }

  emph(arg) {
    return this.createFontAttribute(arg, FontAttribute.FONT_SHAPE, 'em');
  }

  rmfamily() {
    this.g.setFontFamily('rm');
  }

  sffamily() {
    this.g.setFontFamily('sf');
  }

  ttfamily() {
    this.g.setFontFamily('tt');
  }

  mdseries() {
    this.g.setFontWeight('md');
  }

  bfseries() {
    this.g.setFontWeight('bf');
  }

  upshape() {
    this.g.setFontShape('up');
  }

  itshape() {
    this.g.setFontShape('it');
  }

  slshape() {
    this.g.setFontShape('sl');
  }

  scshape() {
    this.g.setFontShape('sc');
  }

  em() {
    this.g.setFontShape('em');
  }

  normalfont() {
    this.g.setFontFamily('rm');
    this.g.setFontWeight('md');
    this.g.setFontShape('up');
  }

  tiny() {
    this.g.setFontSize('tiny');
  }

  scriptsize() {
    this.g.setFontSize('scriptsize');
  }

  footnotesize() {
    this.g.setFontSize('footnotesize');
  }

  small() {
    this.g.setFontSize('small');
  }

  normalsize() {
    this.g.setFontSize('normalsize');
  }

  large() {
    this.g.setFontSize('large');
  }

  Large() {
    this.g.setFontSize('Large');
  }

  LARGE() {
    this.g.setFontSize('LARGE');
  }

  huge() {
    this.g.setFontSize('huge');
  }

  Huge() {
    this.g.setFontSize('Huge');
  }

  theenumi() {
    return [this.g.arabic(this.g.counter('enumi'))];
  }

  theenumii() {
    return [this.g.alph(this.g.counter('enumii'))];
  }

  theenumiii() {
    return [this.g.roman(this.g.counter('enumiii'))];
  }

  theenumiv() {
    return [this.g.Alph(this.g.counter('enumiv'))];
  }

  labelenumi() {
    return this.theenumi().concat(".");
  }

  labelenumii() {
    return ["(", ...this.theenumii(), ")"];
  }

  labelenumiii() {
    return this.theenumiii().concat(".");
  }

  labelenumiv() {
    return this.theenumiv().concat(".");
  }

  'p@enumii'() {
    return this.theenumi();
  }

  'p@enumiii'() {
    return this.theenumi().concat("(", this.theenumii(), ")");
  }

  'p@enumiv'() {
    return this["p@enumiii"]().concat(this.theenumiii());
  }

  labelitemi() {
    return [this.g.symbol('textbullet')];
  }

  labelitemii() {
    this.normalfont();
    this.bfseries();
    return [this.g.symbol('textendash')];
  }

  labelitemiii() {
    return [this.g.symbol('textasteriskcentered')];
  }

  labelitemiv() {
    return [this.g.symbol('textperiodcentered')];
  }

  // TODO: LaTeX doesn't allow hyphenation in alignment, but with e.g. \RaggedRight, it does. (package ragged2e)
  centering() {
    this.g.setAlignment('centering');
  }

  raggedright() {
    this.g.setAlignment('raggedright');
  }

  raggedleft() {
    this.g.setAlignment('raggedleft');
  }

  // alignment environments using a list:  flushleft, flushright, center
  center() {
    this.g.startlist();
    return [this.g.create(this.g.list, null, "center")];
  }

  endcenter() {
    this.g.endlist();
  }

  flushleft() {
    this.g.startlist();
    return [this.g.create(this.g.list, null, "flushleft")];
  }

  endflushleft() {
    this.g.endlist();
  }

  flushright() {
    this.g.startlist();
    return [this.g.create(this.g.list, null, "flushright")];
  }

  endflushright() {
    this.g.endlist();
  }

  titlepage() {
    return [this.g.create(this.g.titlepage)];
  }

  quote() {
    this.g.startlist();
    return [this.g.create(this.g.quote)];
  }

  endquote() {
    this.g.endlist();
  }

  quotation() {
    this.g.startlist();
    return [this.g.create(this.g.quotation)];
  }

  endquotation() {
    this.g.endlist();
  }

  verse() {
    this.g.startlist();
    return [this.g.create(this.g.verse)];
  }

  endverse() {
    this.g.endlist();
  }

  itemize(items) {
    if (arguments.length === 0) {
      this.g.startlist();
      this.g.stepCounter('@itemdepth');
      if (this.g.counter('@itemdepth') > 4) {
        this.g.error("too deeply nested");
      }
      return;
    }
    let label = "labelitem" + this.g.roman(this.g.counter('@itemdepth'));
    return [this.g.create(this.g.unorderedList, items.map((item) => {
      var makelabel;
      this.g.enterGroup();
      makelabel = this.g.create(this.g.itemlabel, this['llap'](item.label !== null
        ? item.label
        : this.g.macro(label)));
      this.g.exitGroup();
      return this.g.create(this.g.listitem, [makelabel, item.text]);
    }))];
  }

  enditemize() {
    this.g.endlist();
    this.g.setCounter('@itemdepth', this.g.counter('@itemdepth') - 1);
  }

  enumerate(items) {
    if (arguments.length === 0) {
      this.g.startlist();
      this.g.stepCounter('@enumdepth');
      if (this.g.counter('@enumdepth') > 4) {
        this.g.error("too deeply nested");
      }
      return;
    }
    let itemCounter = "enum" + this.g.roman(this.g.counter('@enumdepth'));
    this.g.setCounter(itemCounter, 0);
    return [this.g.create(this.g.orderedList, items.map((item) => {
      var label, makelabel;
      label = this.g.create(this.g.inline, item.label.node);
      if (item.label.id) {
        label.id = item.label.id;
      }
      makelabel = this.g.create(this.g.itemlabel, this['llap'](label));
      return this.g.create(this.g.listitem, [makelabel, item.text]);
    }))];
  }

  endenumerate() {
    this.g.endlist();
    this.g.setCounter('@enumdepth', this.g.counter('@enumdepth') - 1);
  }

  description(items) {
    if (arguments.length === 0) {
      this.g.startlist();
      return;
    }
    return [this.g.create(this.g.descriptionList, items.map((item) => {
      var dt, dd;
      dt = this.g.create(this.g.term, item.label);
      dd = this.g.create(this.g.description, item.text);
      return this.g.createFragment([dt, dd]);
    }))];
  }

  enddescription() {
    this.g.endlist();
  }

  picture(size, offset, content) {
    return [this.g.createPicture(size, offset, content)];
  }

  hspace(s, l) {
    return [this.g.createHSpace(l)];
  }

  label(label) {
    this.g.setLabel(label.textContent);
  }

  ref(label) {
    return [this.g.ref(label.textContent)];
  }

  llap(txt) {
    return [this.g.create(this.g.inline, txt, "hbox llap")];
  }

  rlap(txt) {
    return [this.g.create(this.g.inline, txt, "hbox rlap")];
  }

  clap(txt) {
    return [this.g.create(this.g.inline, txt, "hbox clap")];
  }

  smash(txt) {
    return [this.g.create(this.g.inline, txt, "hbox smash")];
  }

  hphantom(txt) {
    return [this.g.create(this.g.inline, txt, "phantom hbox smash")];
  }

  vphantom(txt) {
    return [this.g.create(this.g.inline, txt, "phantom hbox rlap")];
  }

  phantom(txt) {
    return [this.g.create(this.g.inline, txt, "phantom hbox")];
  }

  underline(txt) {
    return [this.g.create(this.g.inline, txt, "hbox underline")];
  }

  mbox(txt) {
    return this.makebox(undefined, undefined, undefined, txt);
  }

  makebox(vec, width, pos, txt) {
    if (vec) {
      if (width && pos) {
        this.g.error("expected \\makebox(width,height)[position]{text} but got two optional arguments!");
      }
      pos = width;
      return [txt];
    } else {
      return this._box(width, pos, txt, "hbox");
    }
  }

  fbox(txt) {
    return this.framebox(undefined, undefined, undefined, txt);
  }

  framebox(vec, width, pos, txt) {
    if (vec) {
      if (width && pos) {
        return this.g.error("expected \\framebox(width,height)[position]{text} but got two optional arguments!");
      }
    } else {
      if (txt.hasAttribute != null && !width && !pos && !this.g.hasAttribute(txt, "frame")) {
        this.g.addAttribute(txt, "frame");
        return [txt];
      } else {
        return this._box(width, pos, txt, "hbox frame");
      }
    }
  }

  _box(width, pos, txt, classes) {
    var content, box;
    if (width) {
      if (!pos) {
        pos = "c";
      }
      switch (pos) {
        case "s":
          classes += " stretch";
          break;
        case "c":
          classes += " clap";
          break;
        case "l":
          classes += " rlap";
          break;
        case "r":
          classes += " llap";
          break;
        default:
          this.g.error("unknown position: " + pos);
      }
    }
    content = this.g.create(this.g.inline, txt);
    box = this.g.create(this.g.inline, content, classes);
    if (width) {
      box.setAttribute("style", "width:" + width.value);
    }
    return [box];
  }

  parbox(pos, height, innerPos, width, txt) {
    var classes, style, content, box;
    if (!pos) {
      pos = "c";
    }
    if (!innerPos) {
      innerPos = pos;
    }
    classes = "parbox";
    style = "width:" + width.value + ";";
    if (height) {
      classes += " pbh";
      style += "height:" + height.value + ";";
    }
    switch (pos) {
      case "c":
        classes += " p-c";
        break;
      case "t":
        classes += " p-t";
        break;
      case "b":
        classes += " p-b";
        break;
      default:
        this.g.error("unknown position: " + pos);
    }
    switch (innerPos) {
      case "s":
        classes += " stretch";
        break;
      case "c":
        classes += " p-cc";
        break;
      case "t":
        classes += " p-ct";
        break;
      case "b":
        classes += " p-cb";
        break;
      default:
        this.g.error("unknown inner-pos: " + innerPos);
    }
    content = this.g.create(this.g.inline, txt);
    box = this.g.create(this.g.inline, content, classes);
    box.setAttribute("style", style);
    return [box];
  }

  thinlines() {
    this.g.setLength('@wholewidth', new this.g.length(0.4, "pt"));
  }

  thicklines() {
    this.g.setLength('@wholewidth', new this.g.length(0.8, "pt"));
  }

  linethickness(l) {
    if (l.unit !== "sp") {
      this.g.error("relative units for \\linethickness not supported!");
    }
    this.g.setLength('@wholewidth', l);
  }

  arrowlength(l) {
    this.g.setLength('@arrowlength', l);
  }

  maxovalrad() {
    return "20pt";
  }

  qbeziermax() {
    return 500;
  }

  frame(txt) {
    var el, w;
    el = this.g.create(this.g.inline, txt, "hbox pframe");
    w = this.g.getLength('@wholewidth');
    el.setAttribute("style", "border-width:" + w.value);
    return [el];
  }

  put(v, obj) {
    var wrapper, strut;
    wrapper = this.g.create(this.g.inline, obj, "put-obj");
    if (v.y.cmp(this.g.zero) >= 0) {
      wrapper.setAttribute("style", "left:" + v.x.value);
      if (v.y.cmp(this.g.zero) > 0) {
        strut = this.g.create(this.g.inline, undefined, "strut");
        strut.setAttribute("style", "height:" + v.y.value);
      }
    } else {
      wrapper.setAttribute("style", "left:" + v.x.value + ";bottom:" + v.y.value);
    }
    return this.rlap(this.g.create(this.g.inline, [wrapper, strut], "picture"));
  }

  // \multiput(x,y)(delta_x,delta_y){n}{obj}
  multiput(v, dv, n, obj) {
    var res, i$, i;
    res = [];
    for (i$ = 0; i$ < n; ++i$) {
      i = i$;
      res = res.concat(this['put'](v.add(dv.mul(i)), obj.cloneNode(true)));
    }
    return res;
  }

  // \qbezier[N](x1, y1)(x, y)(x2, y2)
  qbezier(N, v1, v, v2) {
    return [this._path("M" + v1.x.pxpct + "," + v1.y.pxpct + " Q" + v.x.pxpct + "," + v.y.pxpct + " " + v2.x.pxpct + "," + v2.y.pxpct, N)];
  }

  // \cbezier[N](x1, y1)(x, y)(x2, y2)(x3, y3)
  cbezier(N, v1, v, v2, v3) {
    return [this._path("M" + v1.x.pxpct + "," + v1.y.pxpct + " C" + v.x.pxpct + "," + v.y.pxpct + " " + v2.x.pxpct + "," + v2.y.pxpct + " " + v3.x.pxpct + "," + v3.y.pxpct, N)];
  }

  // typeset an SVG path, optionally with N+1 points instead of smooth
  // (https://github.com/Pomax/bezierjs for calculating bezier points manually)
  _path(p, N) {
    var linethickness, svg, draw, path, pw, lenSection, bbox;
    linethickness = this.g.getLength('@wholewidth');
    svg = this.g.create(this.g.inline, undefined, "picture-object");
    draw = this.g.SVG().addTo(svg);
    path = draw.path(p).stroke({
      color: "#000",
      width: linethickness.value
    }).fill('none');
    if (N > 0) {
      N = Math.min(N, this['qbeziermax']() - 1);
      pw = linethickness.px;
      lenSection = (path.length() - (N + 1) * pw) / N;
      if (lenSection > 0) {
        path.stroke({
          dasharray: pw + " " + this.g.round(lenSection)
        });
      }
    }
    bbox = path.bbox();
    bbox.x -= linethickness.px;
    bbox.y -= linethickness.px;
    bbox.width += linethickness.px * 2;
    bbox.height += linethickness.px * 2;
    svg.setAttribute("style", "left:" + this.g.round(bbox.x) + "px;bottom:" + this.g.round(bbox.y) + "px");
    draw.size(this.g.round(bbox.width) + "px", this.g.round(bbox.height) + "px").viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));
    draw.flip('y', 0);
    return this.g.create(this.g.inline, svg, "picture");
  }

  circle(s, d) {
    var svg, linethickness, draw, offset;
    d = d.abs();
    svg = this.g.create(this.g.inline, undefined, "picture-object");
    linethickness = this.g.getLength('@wholewidth');
    draw = this.g.SVG().addTo(svg);
    if (s) {
      offset = d.div(2).mul(-1).value;
      draw.size(d.value, d.value).stroke({
        color: "#000",
        width: "0"
      }).circle(d.value).cx(d.div(2).value).cy(d.div(2).value).fill("");
    } else {
      offset = d.div(2).add(linethickness).mul(-1).value;
      draw.size(d.add(linethickness.mul(2)).value, d.add(linethickness.mul(2)).value).stroke({
        color: "#000",
        width: linethickness.value
      }).circle(d.value).cx(d.div(2).add(linethickness).value).cy(d.div(2).add(linethickness).value).fill("none");
    }
    svg.setAttribute("style", "left:" + offset + ";bottom:" + offset);
    draw.flip('y', 0);
    return [this.g.create(this.g.inline, svg, "picture")];
  }

  line(v, l) {
    return [this._line.apply(this, this._slopeLengthToCoords(v, l))];
  }

  vector(v, l) {
    return [this._vector.apply(this, this._slopeLengthToCoords(v, l))];
  }

  Line(vs, ve) {
    return [this._line(vs, ve)];
  }

  Vector(vs, ve) {
    return [this._vector(vs, ve)];
  }

  _slopeLengthToCoords(v: Vector, l: Length) {
    var ref$, linethickness, zero, x, y;
    if (v.x.value === (ref$ = v.y.value) && ref$ === 0) {
      this.g.error("illegal slope (0,0)");
    }
    if (v.x.unit !== v.y.unit || v.x.unit !== "sp") {
      this.g.error("relative units not allowed for slope");
    }
    linethickness = this.g.getLength('@wholewidth');
    zero = new this.g.length(0, l.unit);
    if (v.x.px === 0) {
      x = zero;
      y = l;
    } else {
      x = l;
      y = x.mul(Math.abs(v.y.ratio(v.x)));
    }
    if (v.x.cmp(zero) < 0) {
      x = x.mul(-1);
    }
    if (v.y.cmp(zero) < 0) {
      y = y.mul(-1);
    }
    return [new Vector(zero, zero), new Vector(x, y)];
  }

  _line(vs, ve) {
    var svg, draw, linethickness, bbox;
    if (vs.x.unit !== vs.y.unit || vs.x.unit !== "sp") {
      this.g.error("relative units not allowed for line");
    }
    if (ve.x.unit !== ve.y.unit || ve.x.unit !== "sp") {
      this.g.error("relative units not allowed for line");
    }
    svg = this.g.create(this.g.inline, undefined, "picture-object");
    draw = this.g.SVG().addTo(svg);
    linethickness = this.g.getLength('@wholewidth');
    bbox = draw.line(vs.x.px, vs.y.px, ve.x.px, ve.y.px).stroke({
      color: "#000",
      width: linethickness.value
    }).bbox();
    bbox.x -= linethickness.px;
    bbox.y -= linethickness.px;
    bbox.width += linethickness.px * 2;
    bbox.height += linethickness.px * 2;
    if (bbox.x > 0 || bbox.y > 0) {
      console.error("line: bbox.x/y > 0!!", bbox.x, bbox.y);
    }
    svg.setAttribute("style", "left:" + this.g.round(bbox.x) + "px;bottom:" + this.g.round(bbox.y) + "px");
    draw.size(this.g.round(bbox.width) + "px", this.g.round(bbox.height) + "px").viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));
    draw.flip('y', 0);
    return this.g.create(this.g.inline, svg, "picture");
  }

  _vector(vs, ve) {
    var linethickness, svg, draw, hl, hw, max, hhl, al, s, bbox;
    if (vs.x.unit !== vs.y.unit || vs.x.unit !== "sp") {
      this.g.error("relative units not allowed for vector");
    }
    if (ve.x.unit !== ve.y.unit || ve.x.unit !== "sp") {
      this.g.error("relative units not allowed for vector");
    }
    linethickness = this.g.getLength('@wholewidth');
    svg = this.g.create(this.g.inline, undefined, "picture-object");
    draw = this.g.SVG();
    hl = 6.5;
    hw = 3.9;
    max = new this.g.length(0.6, "pt");
    if (linethickness.cmp(max) < 0) {
      hl = this.g.round(hl * max.ratio(linethickness));
      hw = this.g.round(hw * max.ratio(linethickness));
    }
    hhl = linethickness.mul(hl / 2);
    al = ve.sub(vs).norm();
    if (al.cmp(hhl) < 0) {
      s = ve.shift_start(hhl);
    } else {
      s = new Vector(this.g.zero, this.g.zero);
    }
    ve = ve.shift_end(hhl.mul(-1));
    bbox = draw.line(s.x.px, s.y.px, ve.x.px, ve.y.px).stroke({
      color: "#000",
      width: linethickness.value
    }).marker('end', hl, hw, (marker) => {
      return marker.path("M0,0 Q" + this.g.round(2 * hl / 3) + "," + this.g.round(hw / 2) + " " + hl + "," + this.g.round(hw / 2) + " Q" + this.g.round(2 * hl / 3) + "," + this.g.round(hw / 2) + " 0," + hw + " z");
    }).bbox();
    bbox.x -= linethickness.px + hhl.px;
    bbox.y -= linethickness.px + hhl.px;
    bbox.width += linethickness.px + hhl.px * 2;
    bbox.height += linethickness.px + hhl.px * 2;
    if (bbox.x > 0 || bbox.y > 0) {
      console.error("vector: bbox.x/y > 0!!", bbox.x, bbox.y);
    }
    svg.setAttribute("style", "left:" + this.g.round(bbox.x) + "px;bottom:" + this.g.round(bbox.y) + "px");
    draw.size(this.g.round(bbox.width) + "px", this.g.round(bbox.height) + "px").viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));
    draw.flip('y', 0);
    draw.addTo(svg);
    return this.g.create(this.g.inline, svg, "picture");
  }

  oval(maxrad, size, part) {
    var linethickness, rad, draw, oval, rect, bbox, clip, svg;
    linethickness = this.g.getLength('@wholewidth');
    if (!maxrad) {
      maxrad = new this.g.length(20, "px");
    }
    if (!part) {
      part = "";
    }
    if (size.x.cmp(size.y) < 0) {
      rad = size.x.div(2);
    } else {
      rad = size.y.div(2);
    }
    if (maxrad.cmp(rad) < 0) {
      rad = maxrad;
    }
    draw = this.g.SVG();
    oval = draw.rect(size.x.value, size.y.value).radius(rad.value).move(size.x.div(-2).value, size.y.div(-2).value).stroke({
      color: "#000",
      width: linethickness.value
    }).fill("none");
    rect = {
      x: size.x.div(-2).sub(linethickness),
      y: size.y.div(-2).sub(linethickness),
      w: size.x.add(linethickness.mul(2)),
      h: size.y.add(linethickness.mul(2))
    };
    if (part.includes('l')) {
      rect = this._intersect(rect, {
        x: size.x.div(-2).sub(linethickness),
        y: size.y.div(-2).sub(linethickness),
        w: size.x.div(2).add(linethickness),
        h: size.y.add(linethickness.mul(2))
      });
    }
    if (part.includes('t')) {
      rect = this._intersect(rect, {
        x: size.x.div(-2).sub(linethickness),
        y: size.y.div(-2).sub(linethickness),
        w: size.x.add(linethickness.mul(2)),
        h: size.y.div(2).add(linethickness)
      });
    }
    if (part.includes('r')) {
      rect = this._intersect(rect, {
        x: this.g.zero,
        y: size.y.div(-2).sub(linethickness),
        w: size.x.div(2).add(linethickness),
        h: size.y.add(linethickness.mul(2))
      });
    }
    if (part.includes('b')) {
      rect = this._intersect(rect, {
        x: size.x.div(-2).sub(linethickness),
        y: this.g.zero,
        w: size.x.add(linethickness.mul(2)),
        h: size.y.div(2).add(linethickness)
      });
    }
    bbox = oval.bbox();
    bbox.x -= linethickness.px;
    bbox.y -= linethickness.px;
    bbox.width += linethickness.px * 2;
    bbox.height += linethickness.px * 2;
    if (bbox.x > 0 || bbox.y > 0) {
      console.error("oval: bbox.x/y > 0!!", bbox.x, bbox.y);
    }
    clip = draw.clip().add(draw.rect(rect.w.value, rect.h.value).move(rect.x.value, rect.y.value));
    clip.flip('y', 0);
    oval.clipWith(clip);
    svg = this.g.create(this.g.inline, undefined, "picture-object");
    svg.setAttribute("style", "left:" + this.g.round(bbox.x) + "px;bottom:" + this.g.round(bbox.y) + "px");
    draw.size(this.g.round(bbox.width) + "px", this.g.round(bbox.height) + "px").viewbox(this.g.round(bbox.x), this.g.round(bbox.y), this.g.round(bbox.width), this.g.round(bbox.height));
    draw.flip('y', 0);
    draw.addTo(svg);
    return [this.g.create(this.g.inline, svg, "picture")];
  }

  _intersect(r1, r2) {
    return {
      x: this.g.length.max(r1.x, r2.x),
      y: this.g.length.max(r1.y, r2.y),
      w: this.g.length.max(this.g.zero, this.g.length.min(r1.x.add(r1.w), r2.x.add(r2.w)).sub(this.g.length.max(r1.x, r2.x))),
      h: this.g.length.max(this.g.zero, this.g.length.min(r1.y.add(r1.h), r2.y.add(r2.h)).sub(this.g.length.max(r1.y, r2.y)))
    };
  }

  newlength(id){
    this.g.newLength(id);
  }
  setlength(id, l){
    this.g.setLength(id, l);
  }
  addtolength(id, l){
    this.g.setLength(id, this.g.getLength(id).add(l));
  }

  newcounter(c, p) {
    this.g.newCounter(c, p);
  }

  stepcounter(c) {
    this.g.stepCounter(c);
  }

  addtocounter(c, n) {
    this.g.setCounter(c, this.g.counter(c) + n);
  }

  setcounter(c, n) {
    this.g.setCounter(c, n);
  }

  refstepcounter(c) {
    this.g.stepCounter(c);
    return [this.g.refCounter(c)];
  }

  alph(c) {
    return [this.g['alph'](this.g.counter(c))];
  }

  Alph(c) {
    return [this.g['Alph'](this.g.counter(c))];
  }

  arabic(c) {
    return [this.g['arabic'](this.g.counter(c))];
  }

  roman(c) {
    return [this.g['roman'](this.g.counter(c))];
  }

  Roman(c) {
    return [this.g['Roman'](this.g.counter(c))];
  }

  fnsymbol(c) {
    return [this.g['fnsymbol'](this.g.counter(c))];
  }

  input(file) {
  }

  include(file) {
  }

  documentclass(options, documentclass, version) {
    // TODO FIXME typescript implementation
    var Class, importDocumentclass, this$ = this;
    this['documentclass'] = () => {
      this.g.error("Two \\documentclass commands. The document may only declare one class.");
    };
    Class = builtinDocumentclasses.default[documentclass];
    let args = this._args;
    importDocumentclass = () => {
      this$.g.documentClass = new Class(this$.g, options);
      merge(this$, this$.g.documentClass);
      merge(args, Class.args);
    };
    if (!Class) {
      // TODO FIXME promise is resolved AFTER HtmlGenerator#applyLengthsAndGemotryToDom
      import('./documentclasses/' + documentclass).then((Export) => {
        Class = Export['default'] || Export[Object.getOwnPropertyNames(Export)[0]];
        importDocumentclass();
      })['catch']((e) => {
        return console.error("error loading documentclass \"" + documentclass + "\": " + e);
      });
    } else {
      importDocumentclass();
    }
  }

  usepackage(opts, packages, version) {
    // TODO FIXME refactor in typescript
    var options, i$, len$, pkg, Package, importPackage, e, this$ = this;
    // TODO FIXME documentClass is handled first as a string, then as a class
    options = Object.assign({}, this.g.documentClass['options'], opts)
    let args = this._args;
    for (i$ = 0, len$ = packages.length; i$ < len$; ++i$) {
      pkg = packages[i$];
      if (this.providedPackages.includes(pkg)) {
        continue;
      }
      try {
        Package = builtinPackages.default[pkg];
        importPackage = fn$;
        if (!Package) {
          import("./packages/" + pkg).then(fn1$)['catch'](fn2$);
        } else {
          importPackage();
        }
      } catch (e$) {
        e = e$;
        console.error("error loading package \"" + pkg + "\": " + e);
      }
    }

    function fn$() {
      var ref$;
      let p = new Package(this$.g, options);
      merge(this$, p);
      merge(args, p.args);
      if ((ref$ = p.symbols) != null) {
        ref$.forEach((value, key) => {
          return symbols.set(key, value);
        });
      }
    }

    function fn1$(Export) {
      Package = Export['default'] || Export[Object.getOwnPropertyNames(Export)[0]];
      importPackage();
    }

    function fn2$(e) {
      throw e;
    }
  }

  includeonly(filelist) {
  }

  makeatletter() {
  }

  makeatother() {
  }

  // TODO FIXME ignored
  pagestyle(s) {
  }

  linebreak(o) {
  }

  nolinebreak(o) {
  }

  fussy() {
  }

  sloppy() {
  }

  // TODO FIXME  these make no sense without pagebreaks
  pagebreak(o) {
  }

  nopagebreak(o) {
  }

  samepage() {
  }

  enlargethispage(s, l) {
  }

  newpage() {
  }

  clearpage() {
  }

  cleardoublepage() {
  }

  vfill() {
  }

  thispagestyle(s) {
  }
}

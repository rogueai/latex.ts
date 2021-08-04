import {Generator} from "./generator";
import {ligatures, diacritics} from './symbols';

import {SVG} from '@svgdotjs/svg.js';
import katex from 'katex/dist/katex';
import Hypher from 'hypher/lib/hypher';
import * as hEn from 'hyphenation.en-us';
import * as he from 'he';
import {flattenDeep, compact} from 'lodash';
import {Length} from "./types";

he.decode.options.strict = true;

export class HtmlGenerator extends Generator {
  readonly sp: string = ' ';
  readonly brsp = '\u200B ';// U+200B + ' ' breakable but non-collapsible space
  readonly nbsp = he.decode("&nbsp;");// U+00A0
  readonly visp = he.decode("&blank;");// U+2423  visible space
  readonly zwnj = he.decode("&zwnj;");// U+200C  prevent ligatures
  readonly shy = he.decode("&shy;");// U+00AD  word break/hyphenation marker
  readonly thinsp = he.decode("&thinsp;");// U+2009

  static readonly blockRegex = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i;
  isBlockLevel = (el) => {
    return HtmlGenerator.blockRegex.test(el.nodeName);
  };
  static readonly inline = 'span';
  static readonly block = 'div';

  // TODO FIXME
  get KaTeX(): katex {
    return katex;
  }

  part = "part";
  chapter = "h1";
  section = "h2";
  subsection = "h3";
  subsubsection = "h4";
  paragraph = "h5";
  subparagraph = "h6";
  linebreak = "br";
  par = "p";

  verbatim = "pre";
  img = "img";

  listitem = "li";
  term = "dt";
  description = "dd";

  _h: Hypher;
  _dom: DocumentFragment;

  constructor(options) {
    super(options);
    this._options = Object.assign({
      documentClass: "article",
      styles: [],
      hyphenate: true,
      languagePatterns: hEn,
      precision: 3
    }, options);
    if (this._options.hyphenate) {
      this._h = new Hypher(this._options.languagePatterns);
    }
    this.reset();
  }

  reset() {
    super.reset();
    this._dom = document.createDocumentFragment();
  }

  character(c) {
    return c;
  }

  textquote(q) {
    switch (q) {
      case '`':
        return this.symbol('textquoteleft');
      case '\'':
        return this.symbol('textquoteright');
    }
  }

  hyphen() {
    if (this._activeAttributeValue('fontFamily') === 'tt') {
      return '-';
    } else {
      return he.decode("&hyphen;");
    }
  }

  ligature(l) {
    if (this._activeAttributeValue('fontFamily') === 'tt') {
      return l;
    } else {
      return ligatures.get(l);
    }
  }

  hasDiacritic(d) {
    return diacritics.has(d);
  }

  diacritic(d, c) {
    if (!c) {
      return diacritics.get(d)[1];
    } else {
      return c + diacritics.get(d)[0];
    }
  }

  controlSymbol(c) {
    switch (c) {
      case '/':
        return this.zwnj;
      case ',':
        return this.thinsp;
      case '-':
        return this.shy;
      case '@':
        return '\u200B';
      default:
        return this.character(c);
    }
  }

  htmlDocument(baseURL) {
    var doc, charset, ref$, base;
    doc = document.implementation.createHTMLDocument(this.documentTitle);
    charset = document.createElement("meta");
    charset.setAttribute("charset", "UTF-8");
    doc.head.appendChild(charset);
    if (!baseURL) {
      baseURL = (ref$ = window.location) != null ? ref$.href : void 8;
    }
    if (baseURL) {
      base = document.createElement("base");
      base.href = baseURL;
      doc.head.appendChild(base);
      doc.head.appendChild(this.stylesAndScripts(baseURL));
    } else {
      doc.head.appendChild(this.stylesAndScripts());
    }
    doc.body.appendChild(this.domFragment());
    this.applyLengthsAndGeometryToDom(doc.documentElement);
    return doc;
  }

  stylesAndScripts(baseURL?) {
    var el, createStyleSheet, createScript, i$, ref$, len$, style;
    el = document.createDocumentFragment();
    createStyleSheet = (url) => {
      var link;
      link = document.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.href = url;
      return link;
    };
    createScript =  (url) => {
      var script;
      script = document.createElement("script");
      script.src = url;
      return script;
    };
    if (baseURL) {
      el.appendChild(createStyleSheet(new URL("css/katex.css", baseURL).toString()));
      // TODO FIXME
      // el.appendChild(createStyleSheet(new URL(this.documentClass.css, baseURL).toString()));
      el.appendChild(createStyleSheet(new URL(this.documentClass.css, baseURL).toString()));
      for (i$ = 0, len$ = (ref$ = this._options.styles).length; i$ < len$; ++i$) {
        style = ref$[i$];
        el.appendChild(createStyleSheet(new URL(style, baseURL).toString()));
      }
      el.appendChild(createScript(new URL("js/base.js", baseURL).toString()));
    } else {
      el.appendChild(createStyleSheet("css/katex.css"));
      // TODO FIXME
      // el.appendChild(createStyleSheet(this.documentClass.css));
      el.appendChild(createStyleSheet(`css/${this.documentClass}.css`));
      for (i$ = 0, len$ = (ref$ = this._options.styles).length; i$ < len$; ++i$) {
        style = ref$[i$];
        el.appendChild(createStyleSheet(style));
      }
      el.appendChild(createScript("js/base.js"));
    }
    return el;
  }

  domFragment() {
    var el;
    el = document.createDocumentFragment();
    el.appendChild(this.create(this.block, this._dom, "body"));
    if (this._marginpars.length) {
      el.appendChild(this.create(this.block, this.create(this.block, this._marginpars, "marginpar"), "margin-right"));
    }
    return el;
  }

  /* write the TeX lengths and page geometry to the DOM */
  applyLengthsAndGeometryToDom(el) {
    var twp, mlwp, mrwp, mpwp;
    el.style.setProperty('--size', this.getLength('@@size').value);
    twp = 100 * this.getLength('textwidth').ratio(this.getLength('paperwidth'));
    mlwp = 100 * this.getLength('oddsidemargin').add(new this.length(1, "in")).ratio(this.getLength('paperwidth'));
    mrwp = Math.max(100 - twp - mlwp, 0);
    el.style.setProperty('--textwidth', this.round(twp) + "%");
    el.style.setProperty('--marginleftwidth', this.round(mlwp) + "%");
    el.style.setProperty('--marginrightwidth', this.round(mrwp) + "%");
    if (mrwp > 0) {
      mpwp = 100 * 100 * this.getLength('marginparwidth').ratio(this.getLength('paperwidth')) / mrwp;
      el.style.setProperty('--marginparwidth', this.round(mpwp) + "%");
    } else {
      el.style.setProperty('--marginparwidth', "0px");
    }
    el.style.setProperty('--marginparsep', this.getLength('marginparsep').value);
    el.style.setProperty('--marginparpush', this.getLength('marginparpush').value);
  }

  createDocument(fs) {
    this.appendChildren(this._dom, fs);
  }

  // TODO FIXME combine create methods
  private _create(type, classes?) {
    let el = document.createElement(type);
    if (classes) {
      el.setAttribute("class", classes);
    }
    return el;
  }

  create(type, children?, classes?) {
    var el;
    classes == null && (classes = "");
    if (typeof type === "function") {
      el = type();
      if (el.hasAttribute("class")) {
        classes = el.getAttribute("class") + " " + classes;
      }
    } else if (typeof type === 'object') {
      el = type;
      if (el.hasAttribute("class")) {
        classes = el.getAttribute("class") + " " + classes;
      }
    } else {
      el = document.createElement(type);
    }
    if (this.alignment()) {
      classes += " " + this.alignment();
    }
    if (this._continue && this.location().end.offset > this._continue) {
      classes = classes + " continue";
      this['break']();
    }
    if (classes.trim()) {
      el.setAttribute("class", classes.replace(/\s+/g, ' ').trim());
    }
    return this.appendChildren(el, children);
  }


  //   ======
  get titlepage() {
    return this._create(this.block, "titlepage");
  }

  get title() {
    return this._create(this.block, "title");
  }

  get author() {
    return this._create(this.block, "author");
  }

  get date() {
    return this._create(this.block, "date");
  }

  abstract() {
    return this._create(this.block, "abstract");
  }

  get list() {
    return this._create(this.block, "list");
  }

  get unorderedList() {
    return this._create("ul", "list");
  }

  get orderedList() {
    return this._create("ol", "list");
  }

  get descriptionList() {
    return this._create("dl", "list");
  }

  get itemlabel() {
    return this._create(this.inline, "itemlabel");
  }

  get quote() {
    return this._create(this.block, "list quote");
  }

  get quotation() {
    return this._create(this.block, "list quotation");
  }

  get verse() {
    return this._create(this.block, "list verse");
  }

  multicols(c) {
    return () => {
      var el;
      el = this._create(this.block, "multicols");
      el.setAttribute("style", "column-count:" + c);
      return el;
    };
  }

  anchor(id) {
    return () => {
      var el;
      el = document.createElement("a");
      if (id != null) {
        el.id = id;
      }
      return el;
    };
  }

  link(url?) {
    return () => {
      var el;
      el = document.createElement("a");
      if (url) {
        el.setAttribute("href", url);
      }
      return el;
    };
  }

  get verb() {
    return this._create("code", "tt");
  }

  image(width, height, url) {
    return () => {
      var el;
      el = this._create(this.img);
      el.src = url;
      el.height = height;
      el.width = width;
      return el;
    };
  }

  get picture() {
    return this._create(this.inline, "picture");
  }

  get pictureCanvas() {
    return this._create(this.inline, "picture-canvas");
  }


  createFragment(elements: any) {
    var children, f;
    children = compact(flattenDeep(arguments));
    if (arguments.length > 0 && (!children || !children.length)) {
      return;
    }
    if (children.length === 1 && children[0].nodeType) {
      return children[0];
    }
    f = document.createDocumentFragment();
    return this.appendChildren(f, children);
  }

  createImage(width, height, url) {
    return this.create(this.image(width, height, url));
  }

  createText(t) {
    if (!t) {
      return;
    }
    return this.addAttributes(document.createTextNode(this._options.hyphenate ? this._h.hyphenateText(t) : t));
  }

  createVerbatim(t) {
    if (!t) {
      return;
    }
    return document.createTextNode(t);
  }

  createVSpace(length: Length) {
    var span;
    span = document.createElement("span");
    span.setAttribute("class", "vspace");
    span.setAttribute("style", "margin-bottom:" + length.value);
    return span;
  }

  createVSpaceInline(length) {
    var span;
    span = document.createElement("span");
    span.setAttribute("class", "vspace-inline");
    span.setAttribute("style", "margin-bottom:" + length.value);
    return span;
  }

  createVSpaceSkip(skip: string) {
    var span;
    span = document.createElement("span");
    span.setAttribute("class", "vspace " + skip);
    return span;
  }

  createVSpaceSkipInline(skip) {
    var span;
    span = document.createElement("span");
    span.setAttribute("class", "vspace-inline " + skip);
    return span;
  }

  get inline(): string {
    return HtmlGenerator.inline;
  }

  get block(): string {
    return HtmlGenerator.block;
  }

  createPicture(size, offset, content) {
    var canvas, pic;
    canvas = this.create(this.pictureCanvas);
    this.appendChildren(canvas, content);
    if (offset) {
      canvas.setAttribute("style", "left:" + offset.x.mul(-1).value + ";bottom:" + offset.y.mul(-1).value);
    }
    pic = this.create(this.picture);
    pic.appendChild(canvas);
    pic.setAttribute("style", "width:" + size.x.value + ";height:" + size.y.value);
    return pic;
  }

  createBreakSpace(length) {
    var span;
    span = document.createElement("span");
    span.setAttribute("class", "breakspace");
    span.setAttribute("style", "margin-bottom:" + length.value);
    return this.addAttributes(span);
  }

  createHSpace(length) {
    var span;
    span = document.createElement("span");
    span.setAttribute("style", "margin-right:" + length.value);
    return span;
  }

  parseMath(math, display) {
    var f;
    f = document.createDocumentFragment();
    katex.render(math, f, {
      displayMode: !!display,
      throwOnError: false
    });
    return f;
  }

  addAttribute(el, attrs) {
    if (el.hasAttribute("class")) {
      attrs = el.getAttribute("class") + " " + attrs;
    }
    el.setAttribute("class", attrs);
  }

  hasAttribute(el, attr) {
    return el.hasAttribute("class") && RegExp('\\b' + attr + '\\b').test(el.getAttribute("class"));
  }

  addAttributes(nodes) {
    var attrs;
    attrs = this._inlineAttributes();
    if (!attrs) {
      return nodes;
    }
    if (nodes instanceof window.Element) {
      if (this.isBlockLevel(nodes)) {
        return this.create(this.block, nodes, attrs);
      } else {
        return this.create(this.inline, nodes, attrs);
      }
    } else if (nodes instanceof window.Text || nodes instanceof window.DocumentFragment) {
      return this.create(this.inline, nodes, attrs);
    } else if (Array.isArray(nodes)) {
      return nodes.map((node) => {
        return this.create(this.inline, node, attrs);
      });
    } else {
      console.warn("addAttributes got an unknown/unsupported argument:", nodes);
    }
    return nodes;
  }

  private appendChildren(parent, children) {
    var i$, to$, i;
    if (children) {
      if (Array.isArray(children)) {
        for (i$ = 0, to$ = children.length; i$ <= to$; ++i$) {
          i = i$;
          if (children[i] != null) {
            parent.appendChild(children[i]);
          }
        }
      } else {
        parent.appendChild(children);
      }
    }
    return parent;
  }

  debugDOM(oParent, oCallback) {
    var oNode;
    if (oParent.hasChildNodes()) {
      oNode = oParent.firstChild;
      for (; oNode; oNode = oNode.nextSibling) {
        this.debugDOM(oNode, oCallback);
      }
    }
    oCallback.call(oParent);
  }

  debugNode(n) {
    if (!n) {
      return;
    }
    if (typeof n.nodeName != "undefined") {
      console.log(n.nodeName + ":", n.textContent);
    } else {
      console.log("not a node:", n);
    }
  }

  debugNodes(l) {
    var i$, len$, n;
    for (i$ = 0, len$ = l.length; i$ < len$; ++i$) {
      n = l[i$];
      this.debugNode(n);
    }
  }

  // debugNodeContent(){
  //   if (this.nodeValue) {
  //     console.log(this.nodeValue);
  //   }
  // }
}
import {Generator} from "../generator";

export abstract class Base {
  args = {
    'part': ['V', 's', 'X', 'o?', 'g'],
    'section': ['V', 's', 'X', 'o?', 'g'],
    'subsection': ['V', 's', 'X', 'o?', 'g'],
    'subsubsection': ['V', 's', 'X', 'o?', 'g'],
    'paragraph': ['V', 's', 'X', 'o?', 'g'],
    'subparagraph': ['V', 's', 'X', 'o?', 'g'],
    'maketitle': ['V']
  };
  options = {};

  abstract get css();
  
  g: Generator;

  constructor(generator: Generator, options: {}) {
    this.g = generator;
    this.options = options;

    this.g.newCounter("part");
    this.g.newCounter("section");
    this.g.newCounter("subsection", "section");
    this.g.newCounter("subsubsection", "subsection");
    this.g.newCounter("paragraph", "subsubsection");
    this.g.newCounter("subparagraph", "paragraph");

    this.g.newCounter("figure");
    this.g.newCounter("table");

    // default: letterpaper, 10pt, onecolumn, oneside
    // TODO FIXME make this configurable:
    // fontsize can be applied globally in the documentclass:
    // \documentclass[12pt]{article}
    this.g.setLength('paperheight', new this.g.length(11, "in"));
    this.g.setLength('paperwidth', new this.g.length(8.5, "in"));
    this.g.setLength('@@size', new this.g.length(14, "pt"));

    for (let opt in this.options) {
      opt = Object.keys(opt)[0];
      switch (opt) {
        case "oneside":
          break;
        case "twoside":
          break;
        case "onecolumn":
          break;
        case "twocolumn":
          break;
        case "titlepage":
          break;
        case "notitlepage":
          break;
        case "fleqn":
          break;
        case "leqno":
          break;
        case "a4paper":
          this.g.setLength('paperheight', new this.g.length(297, "mm"));
          this.g.setLength('paperwidth', new this.g.length(210, "mm"));
          break;
        case "a5paper":
          this.g.setLength('paperheight', new this.g.length(210, "mm"));
          this.g.setLength('paperwidth', new this.g.length(148, "mm"));
          break;
        case "b5paper":
          this.g.setLength('paperheight', new this.g.length(250, "mm"));
          this.g.setLength('paperwidth', new this.g.length(176, "mm"));
          break;
        case "letterpaper":
          this.g.setLength('paperheight', new this.g.length(11, "in"));
          this.g.setLength('paperwidth', new this.g.length(8.5, "in"));
          break;
        case "legalpaper":
          this.g.setLength('paperheight', new this.g.length(14, "in"));
          this.g.setLength('paperwidth', new this.g.length(8.5, "in"));
          break;
        case "executivepaper":
          this.g.setLength('paperheight', new this.g.length(10.5, "in"));
          this.g.setLength('paperwidth', new this.g.length(7.25, "in"));
          break;
        case "landscape":
          let tmp = this.g.getLength('paperheight');
          this.g.setLength('paperheight', this.g.getLength('paperwidth'));
          this.g.setLength('paperwidth', tmp);
          break;
        default:
          let value = parseFloat(opt);
          if (!isNaN(value) && opt.endsWith("pt") && String(value) === opt.substring(0, opt.length - 2)) {
            this.g.setLength('@@size', new this.g.length(value, "pt"));
          }
      }
    }
    let pt345 = new this.g.length(345, "pt");
    let inch = new this.g.length(1, "in");
    let textwidth = this.g.getLength('paperwidth').sub(inch.mul(2));
    if (textwidth.cmp(pt345) === 1) {
      textwidth = pt345;
    }
    this.g.setLength('textwidth', textwidth);

    this.g.setLength('marginparsep', new this.g.length(11, "pt"));
    this.g.setLength('marginparpush', new this.g.length(5, "pt"));
    let margins = this.g.getLength('paperwidth').sub(this.g.getLength('textwidth'));
    let oddsidemargin = margins.mul(0.5).sub(inch);
    let marginparwidth = margins.mul(0.5).sub(this.g.getLength('marginparsep')).sub(inch.mul(0.8));
    if (marginparwidth.cmp(inch.mul(2)) === 1) {
      marginparwidth = inch.mul(2);
    }
    this.g.setLength('oddsidemargin', oddsidemargin);
    this.g.setLength('marginparwidth', marginparwidth);
  }

  get contentsname() {
    return ["Contents"];
  }

  get listfigurename() {
    return ["List of Figures"];
  }

  get listtablename() {
    return ["List of Tables"];
  }

  get partname() {
    return ["Part"];
  }

  get figurename() {
    return ["Figure"];
  }

  get tablename() {
    return ["Table"];
  }

  get appendixname() {
    return ["Appendix"];
  }

  get indexname() {
    return ["Index"];
  }

  part(s, toc, ttl) {
    return [this.g.startsection('part', 0, s, toc, ttl)];
  }

  section(s, toc, ttl) {
    return [this.g.startsection('section', 1, s, toc, ttl)];
  }

  subsection(s, toc, ttl) {
    return [this.g.startsection('subsection', 2, s, toc, ttl)];
  }

  subsubsection(s, toc, ttl) {
    return [this.g.startsection('subsubsection', 3, s, toc, ttl)];
  }

  paragraph(s, toc, ttl) {
    return [this.g.startsection('paragraph', 4, s, toc, ttl)];
  }

  subparagraph(s, toc, ttl) {
    return [this.g.startsection('subparagraph', 5, s, toc, ttl)];
  }

  thepart() {
    return [this.g.Roman(this.g.counter('part'))];
  }

  thesection() {
    return [this.g.arabic(this.g.counter('section'))];
  }

  thesubsection() {
    return this.thesection().concat("." + this.g.arabic(this.g.counter('subsection')));
  }

  thesubsubsection() {
    return this.thesubsection().concat("." + this.g.arabic(this.g.counter('subsubsection')));
  }

  theparagraph() {
    return this.thesubsubsection().concat("." + this.g.arabic(this.g.counter('paragraph')));
  }

  thesubparagraph() {
    return this.theparagraph().concat("." + this.g.arabic(this.g.counter('subparagraph')));
  }

  _title: string;
  _author: string;
  _date: string;
  _thanks: string;

  // title = () => {
  // };
  // author = () => {
  // };
  // date = () => {
  // };
  // thanks = () => {
  // };
  // and = () => {
  // };
  // TODO FIXME
  //maketitle = () => {};
  maketitle() {
    this.g.setTitle(this._title);
    let that;
    let title = this.g.create(this.g.title, this._title);
    let author = this.g.create(this.g.author, this._author);
    let date = this.g.create(this.g.date, (that = this._date)
      ? that
      : this.g.macro('today'));
    let maketitle = this.g.create(this.g.list, [this.g.createVSpace(new this.g.length(2, "em")), title, this.g.createVSpace(new this.g.length(1.5, "em")), author, this.g.createVSpace(new this.g.length(1, "em")), date, this.g.createVSpace(new this.g.length(1.5, "em"))], "center");
    this.g.setCounter('footnote', 0);
    this._title = null;
    this._author = null;
    this._date = null;
    this._thanks = null;
    //this['title'] = this['author'] = this['date'] = this['thanks'] = this['and'] = this['maketitle'] = () => {
    //};

    return [maketitle];
  }
}
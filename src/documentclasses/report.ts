import {Base} from "./base";
import {Generator} from "../generator";

export class Report extends Base {

  _chaptername = ['Chapter'];
  _thechapterFn = this.g.arabic;

  constructor(generator: Generator, options) {
    super(generator, options);

    this.g.newCounter('chapter');
    this.g.addToReset('section', 'chapter');

    this.g.setCounter('secnumdepth', 2);
    this.g.setCounter('tocdepth', 2);

    this.g.addToReset('figure', 'chapter');
    this.g.addToReset('table', 'chapter');
    this.g.addToReset('footnote', 'chapter');


    this._args['part'] = ['V', 's', 'X', 'o?', 'g'];
    this._args['chapter'] = ['V', 's', 'X', 'o?', 'g'];
    this._args['abstract'] = ['V'];
    this._args['tableofcontents'] = ['V'];
    this._args['appendix'] = ['V'];
  }

  get css() {
    return 'css/book.css';
  }

  chaptername() {
    return this._chaptername;
  }

  bibname() {
    return ["Bibliography"];
  }

  part(s, toc, ttl) {
    return [this.g.startsection('part', -1, s, toc, ttl)];
  }

  chapter(s, toc, ttl) {
    return [this.g.startsection('chapter', 0, s, toc, ttl)];
  }

  thechapter() {
    return [this._thechapterFn(this.g.counter('chapter'))];
  }

  thesection() {
    return this.thechapter().concat("." + this.g.arabic(this.g.counter('section')));
  }

  thefigure() {
    return (this.g.counter('chapter') > 0
      ? this.thechapter().concat(".")
      : []).concat(this.g.arabic(this.g.counter('figure')));
  }

  thetable() {
    return (this.g.counter('chapter') > 0
      ? this.thechapter().concat(".")
      : []).concat(this.g.arabic(this.g.counter('table')));
  }

  tableofcontents() {
    return this.section(true, undefined, this.g.macro('contentsname')).concat([this.g._toc]);
  }

  abstract() {
    this.g.setFontSize("small");
    this.g.enterGroup();
    this.g.setFontWeight("bf");
    let head = this.g.create(this.g.list, this.g.macro("abstractname"), "center");
    this.g.exitGroup();
    // return head;
    return [head].concat(this.g.quotation);
  }

  endabstract() {
    // TODO FIXME
    // this.endquotation();
    this.g.endlist();
  }

  appendix() {
    this.g.setCounter('chapter', 0);
    this.g.setCounter('section', 0);
    this._chaptername = this.appendixname
    this._thechapterFn = this.g.Alph;
  }

}
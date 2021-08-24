import {Generator} from "../generator";
import {Report} from "./report";

export class Book extends Report {

  _mainmatter = true;

  constructor(generator: Generator, options) {
    super(generator, options);

    this._args['frontmatter'] = ['V'];
    this._args['mainmatter'] = ['V'];
    this._args['backmatter'] = ['V'];
  }

  chapter(s, toc, ttl) {
    return [this.g.startsection('chapter', 0, s || !this._mainmatter, toc, ttl)];
  }

  mainmatter() {
    this._mainmatter = true;
  }

  frontmatter() {
    this._mainmatter = false;
  }

  backmatter() {
    this._mainmatter = false;
  }
}
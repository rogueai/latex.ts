import {Base} from "./base";
import {Generator} from "../generator";

export class Article extends Base {
  
  constructor(generator: Generator, options) {
    super(generator, options);
    this.g.setCounter('secnumdepth', 3);
    this.g.setCounter('tocdepth', 3);
    this._args['tableofcontents'] = ['V'];
    this._args['abstract'] = ['V'];
    this._args['appendix'] = ['V'];
  }
 
  get css() {
    return 'css/article.css';
  }
  refname() {
    return ['References'];
  }

  tableofcontents(){
    return this.section(true, undefined, this.g.macro('contentsname')).concat([this.g._toc]);
  }

  abstract(){
    this.g.setFontSize("small");
    this.g.enterGroup();
    this.g.setFontWeight("bf");
    let head = this.g.create(this.g.list, this.g.macro("abstractname"), "center");
    this.g.exitGroup();
    // return head;
    return [head].concat(this.g.quotation);
  }

  endabstract(){
    // TODO FIXME
    // this.endquotation();
    this.g.endlist();
  }   
  
  appendix(){
    this.g.setCounter('section', 0);
    this.g.setCounter('subsection', 0);
    // TODO FIXME @see Report.ts for a better approach
    // thesection is defined in Base.ts
    this['thesection'] = function(){
      return [this.g.Alph(this.g.counter('section'))];
    };
  }
}
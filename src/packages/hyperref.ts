import {Generator} from "../generator";

export class Hyperref {
  args = {};
  g: Generator;

  constructor(generator, options) {
    this.g = generator;
    this.args = {
      'href': ['H', 'o?', 'u', 'g'],
      'url': ['H', 'u'],
      'nolinkurl': ['H', 'u']
    }
  }

  href(opt, url, txt) {
    return [this.g.create(this.g.link(url)), txt];
  }

  url(url) {
    return [this.g.create(this.g.link(url), this.g.createText(url))];
  }

  nolinkurl(url) {
    return [this.g.create(this.g.link(), this.g.createText(url))];
  }


  // TODO
  // \hyperbaseurl  HV u

  // \hyperref[label]{link text} --- like \ref{label}, but use "link text" for display
  // args.\hyperref =    <[ H o? g ]>
  // \hyperref           : (label, txt) -> [ @g.ref label ]
}
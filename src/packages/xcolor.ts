import {Generator} from "../generator";

export class XColor {

  g: Generator;
  options;
  args = {
    'definecolorset': ['P', 'i?', 'c-ml', 'ie', 'ie', 'c-ssp'],
    'definecolor': ['P', 'i?', 'i', 'c-ml', 'c-spl'],
    'color': ["HV", [['c-ml?', 'c-spl'], ['c']]],
    'textcolor': ["HV", [['c-ml?', 'c-spl'], ['c']], "g"],
    'colorbox': ['H', 'i?', 'c', 'g'],
    'fcolorbox': ['H', 'i?', 'c', 'c', 'g'],
  };

  colors = new Map([
    ["red", {}],
    ["green", {}],
    ["blue", {}],
    ["cyan", {}],
    ["magenta", {}],
    ["yellow", {}],
    ["black", {}],
    ["gray", {}],
    ["white", {}],
    ["darkgray", {}],
    ["lightgray", {}],
    ["brown", {}],
    ["lime", {}],
    ["olive", {}],
    ["orange", {}],
    ["pink", {}],
    ["purple", {}],
    ["teal", {}],
    ["violet", {}]
  ]);

  constructor(generator, options) {
    // var i$, ref$, len$, opt, results$ = [];
    this.g = generator;
    if (options) {
      this.options = options;
    }
    // TODO FIXME code below does absolutely nothing
    // for (i$ = 0, len$ = (ref$ = this.options).length; i$ < len$; ++i$) {
    //   opt = ref$[i$];
    //   opt = Object.keys(opt)[0];
    //   switch (opt) {
    //     case "natural":
    //       break;
    //     case "rgb":
    //       break;
    //     case "cmy":
    //       break;
    //     case "cmyk":
    //       break;
    //     case "hsb":
    //       break;
    //     case "gray":
    //       break;
    //     case "RGB":
    //       break;
    //     case "HTML":
    //       break;
    //     case "HSB":
    //       break;
    //     case "Gray":
    //       break;
    //     case "monochrome":
    //       break;
    //     case "dvipsnames":
    //       break;
    //     case "dvipsnames*":
    //       break;
    //     case "svgnames":
    //       break;
    //     case "svgnames*":
    //       break;
    //     case "x11names":
    //       break;
    //     case "x11names*":
    //       break;
    //     default:
    //
    //   }
    // }
  }

  definecolorset(type, models, hd, tl, setspec) {
    var i$, len$, spec;
    if (type !== null && type !== "named" && type !== "ps") {
      this.g.error("unknown color type");
    }
    if (!hd) {
      hd = "";
    }
    if (!tl) {
      tl = "";
    }
    for (i$ = 0, len$ = setspec.length; i$ < len$; ++i$) {
      spec = setspec[i$];
      this.definecolor(type, hd + spec.name + tl, models, spec.speclist);
    }
  }

  definecolor(type, name, models, colorspec) {
    var color, i$, ref$, len$, i, model;
    if (type !== null && type !== "named" && type !== "ps") {
      this.g.error("unknown color type");
    }
    if (models.models.length !== colorspec.length) {
      this.g.error("color models and specs don't match");
    }
    color = {};
    for (i$ = 0, len$ = (ref$ = models.models).length; i$ < len$; ++i$) {
      i = i$;
      model = ref$[i$];
      color[model] = colorspec[i];
    }
    this.colors.set(name, color);
  }

  color() {

  }

  textcolor() {

  }

  colorbox(model, color, text) {
  }

  fcolorbox(model, color, text) {
  }
}
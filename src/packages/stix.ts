import {Generator} from "../generator";
import * as he from "he";

export class Stix {

  g: Generator;

  symbols: Map<string, string>;
  
  constructor(generator, options) {
    this.g = generator;

    generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2664", "\\varspadesuit", true);     // ♤
    generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2665", "\\varheartsuit", true);     // ♥
    generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2666", "\\vardiamondsuit", true);   // ♦
    generator.KaTeX.__defineSymbol("math", "main", "textord", "\u2667", "\\varclubsuit", true);      // ♧


    this.symbols = new Map([
      // greek letters - lower case
      ['checkmark', he.decode('&check;')],      // ✓    U+2713
    ]);
  }

}
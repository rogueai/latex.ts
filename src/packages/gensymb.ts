import * as he from 'he';

export  class Gensymb {
  args = {}

  symbols = new Map([
    ['degree', he.decode('&deg;')], // °   U+00B0
    ['celsius','\u2103'], // ℃
    ['perthousand', he.decode('&permil;')], // ‰   U+2030
    ['ohm','\u2126'], // Ω
    ['micro', he.decode('&mu;')], // μ   U+03BC
  ]);
  constructor(generator, options) {
    // TODO: implement package options  
  }
}
// types/jspdf.d.ts
import 'jspdf'; // Import the original jsPDF module

declare module 'jspdf' {
  interface GStateOptions {
    opacity: number;
  }

  class GState {
    constructor(options: GStateOptions);
  }

  interface jsPDF {
    setGState(gstate: GState): void;
    GState: typeof GState;
  }
}

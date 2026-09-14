// pdfjs-dist's browser build touches DOM globals (like DOMMatrix) as soon as
// the module is evaluated, which breaks if it's ever imported during SSR.
// Loading it lazily, only from client-side effects, keeps it out of the
// server render entirely.
let modulePromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfjs() {
  if (!modulePromise) {
    modulePromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return modulePromise;
}

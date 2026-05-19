/**
 * Contratos de adaptadores futuros para ingestão de projetos arquitetônicos.
 * NÃO IMPLEMENTADOS — apenas a interface, para preparar OCR / IA Vision /
 * Autodesk Forge / DWG / BIM / IFC / Revit.
 */

import type { EntidadeArquitetonica } from "../types";

export type FonteParser =
  | "ocr"
  | "ia_vision"
  | "autodesk_forge"
  | "dwg"
  | "bim"
  | "ifc"
  | "revit";

export interface ParserInput {
  projeto_id: string;
  arquivo_url: string;
  tipo_arquivo: string;
  layers?: string[];
  cotas?: boolean;
}

export interface ParserOutput {
  fonte: FonteParser;
  entidades: Omit<EntidadeArquitetonica, "id">[];
  paginas: number;
  metadados: Record<string, unknown>;
}

export interface ParserAdapter {
  readonly fonte: FonteParser;
  readonly versao: string;
  suporta(tipoArquivo: string): boolean;
  parse(input: ParserInput): Promise<ParserOutput>;
}
// src/lib/motivoNa.ts
//
// Motivos de "não aplicável" que NÃO devem virar pendência visível em nenhuma tela do
// relatório (nem no resultado logo após a análise em src/pages/Analise.tsx, nem na página
// salva do projeto em src/pages/ProjectDetails.tsx, nem no PDF exportado por nenhuma das
// duas):
//   - "nao_existe": elemento simplesmente não existe nesse projeto (ex: piscina, playground,
//     cilindro portátil de gás quando só há compressor fixo, rampa quando não há desnível)
//   - "dispensado": dispensa legal explícita já identificada no próprio projeto (ex:
//     blindagem de raio-x dispensada para consultório individual Classe I/II)
//   - "verificar_in_loco": regra marcada como verificado_em_vistoria — falta de dado no
//     papel é esperada, o fiscal confere presencialmente (ex: material/acesso do abrigo de
//     resíduos)
//
// Quando motivo_na é null/undefined (análises salvas antes dessas categorias existirem, ou a
// IA esqueceu de preencher o campo), a pendência aparece por padrão — nunca esconde algo por
// falta de classificação.
//
// Centralizado aqui porque essa mesma lista já teve que ser corrigida em duas telas
// separadas (Analise.tsx e ProjectDetails.tsx) que foram ficando dessincronizadas uma da
// outra — qualquer ajuste futuro nessa lista deve valer para as duas ao mesmo tempo.

export const MOTIVOS_NA_OCULTOS = ["nao_existe", "dispensado", "verificar_in_loco"];

export function ehPendenciaVisivel(motivoNa: string | null | undefined): boolean {
  return !MOTIVOS_NA_OCULTOS.includes(motivoNa as string);
}

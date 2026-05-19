# Adapters de Ingestão — Preparação Futura

Esta pasta define apenas contratos para integrações futuras:

- OCR — extração de texto de PDFs escaneados.
- IA Vision — detecção de ambientes via visão computacional.
- Autodesk Forge — API cloud para DWG/Revit.
- Parser DWG — leitura nativa de blocos e layers.
- BIM / IFC / Revit — leitura de entidades estruturadas e cotas.

Nenhum adapter está implementado. Eles devem implementar `ParserAdapter` e
produzir `EntidadeArquitetonica[]` consumidos pelo `regulatoryEngine`.
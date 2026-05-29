

type EntidadeInsert = any;

export function getMockEntitiesForType(tipo: string, projetoId: string): EntidadeInsert[] {
  const t = tipo.toLowerCase();
  
  if (t.includes("hospital")) {
    return [
      {
        projeto_id: projetoId,
        tipo: "recepcao",
        ambiente: "recepcao_central",
        coord_x: 2,
        coord_y: 2,
        largura: 5.0,
        altura: 4.0,
        pagina: 1,
        metadados: { acessivel: false }
      },
      {
        projeto_id: projetoId,
        tipo: "corredor",
        ambiente: "corredor_assistencial",
        coord_x: 2,
        coord_y: 6,
        largura: 1.8, // Fails RDC 50 (needs 2.00m for assistencial context) but passes NBR 9050 (>=1.20)
        altura: 15.0,
        pagina: 1,
        metadados: { contexto: "assistencial" }
      },
      {
        projeto_id: projetoId,
        tipo: "sanitario_pcd",
        ambiente: "sanitario_pcd_1",
        coord_x: 5,
        coord_y: 8,
        largura: 1.5, // Fails NBR 9050 area (1.5 * 1.8 = 2.7m2 < 3.20m2)
        altura: 1.8,
        pagina: 1,
        metadados: {}
      },
      {
        projeto_id: projetoId,
        tipo: "porta",
        ambiente: "sanitario_pcd_1",
        coord_x: 5,
        coord_y: 8.1,
        largura: 0.70, // Fails NBR 9050 door width (needs >= 0.80m)
        altura: 2.10,
        pagina: 1,
        metadados: {}
      },
      {
        projeto_id: projetoId,
        tipo: "consultorio",
        ambiente: "consultorio_1",
        coord_x: 8,
        coord_y: 8,
        largura: 3.0, // Fails RDC 50 area (3.0 * 2.2 = 6.6m2 < 7.50m2)
        altura: 2.2,
        pagina: 1,
        metadados: {}
        // Missing lavatorio in this environment -> Fails RDC 50 lavatorio_consultorio
      },
      {
        projeto_id: projetoId,
        tipo: "cme",
        ambiente: "cme_central",
        coord_x: 12,
        coord_y: 12,
        largura: 6.0,
        altura: 5.0,
        pagina: 2,
        metadados: { renovacoes_h: 4 } // Fails RDC 50 ventilation (needs >= 6)
      }
    ];
  }
  
  if (t.includes("cme") || t.includes("central de materiais")) {
    return [
      {
        projeto_id: projetoId,
        tipo: "cme",
        ambiente: "cme_expurgo",
        coord_x: 10,
        coord_y: 10,
        largura: 4.0,
        altura: 3.0,
        pagina: 1,
        metadados: { renovacoes_h: 3 } // Fails RDC 50 ventilation
      },
      {
        projeto_id: projetoId,
        tipo: "area_limpa",
        ambiente: "cme_expurgo",
        coord_x: 10.0,
        coord_y: 10.0,
        largura: 1.0,
        altura: 1.0,
        pagina: 1,
        metadados: {}
      },
      {
        projeto_id: projetoId,
        tipo: "area_contaminada",
        ambiente: "cme_expurgo",
        coord_x: 10.4, // Distance between limpa and contaminada is 0.4m < 1m -> Fails RDC 50 fluxo_limpo_sujo
        coord_y: 10.0,
        largura: 1.0,
        altura: 1.0,
        pagina: 1,
        metadados: {}
      },
      {
        projeto_id: projetoId,
        tipo: "esterilizacao",
        ambiente: "sala_esterilizacao",
        coord_x: 15,
        coord_y: 10,
        largura: 2.0, // Fails RDC 15 area (2.0 * 2.5 = 5.0m2 < 6.00m2)
        altura: 2.5,
        pagina: 1,
        metadados: {}
      }
      // Missing parede with divisoria_entre: true -> Fails RDC 15 barreira_cme
    ];
  }
  
  if (t.includes("clínica") || t.includes("clinica")) {
    return [
      {
        projeto_id: projetoId,
        tipo: "recepcao",
        ambiente: "recepcao_clinica",
        coord_x: 2,
        coord_y: 2,
        largura: 4.0,
        altura: 4.0,
        pagina: 1,
        metadados: { acessivel: true } // Passes recepcao acessivel
      },
      {
        projeto_id: projetoId,
        tipo: "sanitario_pcd",
        ambiente: "sanitario_pcd_clinica",
        coord_x: 6,
        coord_y: 2,
        largura: 1.6, // Fails NBR 9050 area (1.6 * 1.8 = 2.88m2 < 3.20m2)
        altura: 1.8,
        pagina: 1,
        metadados: {}
      },
      {
        projeto_id: projetoId,
        tipo: "consultorio",
        ambiente: "consultorio_1",
        coord_x: 8,
        coord_y: 2,
        largura: 3.0, // Fails RDC 50 area (3.0 * 2.4 = 7.2m2 < 7.50m2)
        altura: 2.4,
        pagina: 1,
        metadados: {}
        // Missing lavatorio in this environment -> Fails RDC 50 lavatorio_consultorio
      },
      {
        projeto_id: projetoId,
        tipo: "corredor",
        ambiente: "corredor_principal",
        coord_x: 2,
        coord_y: 6,
        largura: 1.10, // Fails NBR 9050 circ_min (needs >= 1.20m)
        altura: 10.0,
        pagina: 1,
        metadados: {}
      }
    ];
  }
  
  if (t.includes("consultório") || t.includes("consultorio")) {
    return [
      {
        projeto_id: projetoId,
        tipo: "consultorio",
        ambiente: "consultorio_principal",
        coord_x: 2,
        coord_y: 2,
        largura: 3.0, // Passes area (3.0 * 2.8 = 8.4m2 >= 7.50m2)
        altura: 2.8,
        pagina: 1,
        metadados: {}
        // Missing lavatorio -> Fails RDC 50 lavatorio_consultorio
      },
      {
        projeto_id: projetoId,
        tipo: "sanitario",
        ambiente: "sanitario_comum",
        coord_x: 5,
        coord_y: 2,
        largura: 1.5,
        altura: 1.5,
        pagina: 1,
        metadados: {}
      }
      // Missing sanitario_pcd -> Fails NBR 9050 san_pcd_presenca
    ];
  }
  
  if (t.includes("laboratório") || t.includes("laboratorio")) {
    return [
      {
        projeto_id: projetoId,
        tipo: "recepcao",
        ambiente: "recepcao_lab",
        coord_x: 2,
        coord_y: 2,
        largura: 5.0,
        altura: 3.5,
        pagina: 1,
        metadados: { acessivel: true }
      },
      {
        projeto_id: projetoId,
        tipo: "expurgo",
        ambiente: "expurgo_lab",
        coord_x: 8,
        coord_y: 2,
        largura: 2.5,
        altura: 2.5,
        pagina: 1,
        metadados: { isolado: false } // Fails RDC 15 expurgo_separado
      },
      {
        projeto_id: projetoId,
        tipo: "consultorio",
        ambiente: "sala_coleta",
        coord_x: 5,
        coord_y: 5,
        largura: 3.0,
        altura: 3.0,
        pagina: 1,
        metadados: {}
        // Missing lavatorio -> Fails RDC 50 lavatorio_consultorio
      },
      {
        projeto_id: projetoId,
        tipo: "porta",
        ambiente: "sala_coleta",
        coord_x: 5,
        coord_y: 5.1,
        largura: 0.75, // Fails NBR 9050 door width
        altura: 2.10,
        pagina: 1,
        metadados: {}
      },
      {
        projeto_id: projetoId,
        tipo: "sanitario_pcd",
        ambiente: "sanitario_pcd_lab",
        coord_x: 8,
        coord_y: 5,
        largura: 2.0, // Passes area (2.0 * 1.8 = 3.6m2 >= 3.2m2)
        altura: 1.8,
        pagina: 1,
        metadados: {}
      }
    ];
  }
  
  // Default / Outro
  return [
    {
      projeto_id: projetoId,
      tipo: "recepcao",
      ambiente: "recepcao_outros",
      coord_x: 2,
      coord_y: 2,
      largura: 3.5,
      altura: 3.0,
      pagina: 1,
      metadados: { acessivel: false } // Fails recepcao
    },
    {
      projeto_id: projetoId,
      tipo: "porta",
      ambiente: "recepcao_outros",
      coord_x: 2,
      coord_y: 2.1,
      largura: 0.70, // Fails door
      altura: 2.10,
      pagina: 1,
      metadados: {}
    }
    // Missing sanitário PCD
  ];
}

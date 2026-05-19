import type {
  EntidadeArquitetonica,
  RegraRegulatoria,
  ResultadoValidacao,
  TipoValidacao,
} from "../types";

type Validator = (
  regra: RegraRegulatoria,
  entidades: EntidadeArquitetonica[],
) => ResultadoValidacao[];

function compara(op: string | undefined, a: number, b: number): boolean {
  switch (op) {
    case ">":
      return a > b;
    case ">=":
      return a >= b;
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case "==":
      return a === b;
    default:
      return a >= b;
  }
}

function aplicaveis(
  regra: RegraRegulatoria,
  entidades: EntidadeArquitetonica[],
): EntidadeArquitetonica[] {
  const alvo = new Set(regra.ambiente_aplicavel);
  return entidades.filter((e) => alvo.has(e.tipo) || (e.ambiente && alvo.has(e.ambiente)));
}

const dimensional: Validator = (regra, entidades) => {
  const { campo = "largura", operador = ">=", valor = 0 } = regra.parametros;
  return aplicaveis(regra, entidades).map((e) => {
    const observado =
      campo === "largura" ? e.largura : campo === "altura" ? e.altura : undefined;
    if (observado == null) {
      return {
        regra_id: regra.id,
        entidade_id: e.id,
        status: "nao_aplicavel",
        severidade_efetiva: regra.severidade,
        valor_observado: null,
        detalhes: { motivo: `Campo ${campo} ausente.` },
      };
    }
    const ok = compara(operador, observado, valor);
    return {
      regra_id: regra.id,
      entidade_id: e.id,
      status: ok ? "conforme" : "inconforme",
      severidade_efetiva: ok ? "informativo" : regra.severidade,
      valor_observado: observado,
      detalhes: { campo, operador, esperado: valor, observado },
    };
  });
};

const areaMinima: Validator = (regra, entidades) => {
  const { valor = 0 } = regra.parametros;
  return aplicaveis(regra, entidades).map((e) => {
    const area =
      e.largura != null && e.altura != null ? Number(e.largura) * Number(e.altura) : undefined;
    if (area == null) {
      return {
        regra_id: regra.id,
        entidade_id: e.id,
        status: "nao_aplicavel",
        severidade_efetiva: regra.severidade,
        valor_observado: null,
        detalhes: { motivo: "Área não calculável." },
      };
    }
    const ok = area >= valor;
    return {
      regra_id: regra.id,
      entidade_id: e.id,
      status: ok ? "conforme" : "inconforme",
      severidade_efetiva: ok ? "informativo" : regra.severidade,
      valor_observado: Number(area.toFixed(2)),
      detalhes: { area_minima: valor, area_observada: area },
    };
  });
};

const presencial: Validator = (regra, entidades) => {
  const dep = regra.parametros.dependencia as string | undefined;
  const presentes = aplicaveis(regra, entidades);
  const min = regra.parametros.min_quantidade ?? 1;

  if (dep) {
    return presentes.map((e) => {
      const tem = entidades.some(
        (x) => x.tipo === dep && (x.ambiente === e.ambiente || x.ambiente === e.tipo),
      );
      return {
        regra_id: regra.id,
        entidade_id: e.id,
        status: tem ? "conforme" : "inconforme",
        severidade_efetiva: tem ? "informativo" : regra.severidade,
        valor_observado: tem ? 1 : 0,
        detalhes: { dependencia: dep },
      };
    });
  }

  const ok = presentes.length >= min;
  return [
    {
      regra_id: regra.id,
      status: ok ? "conforme" : "inconforme",
      severidade_efetiva: ok ? "informativo" : regra.severidade,
      valor_observado: presentes.length,
      detalhes: { min_quantidade: min, encontrados: presentes.length },
    },
  ];
};

const fluxo: Validator = (regra, entidades) => {
  const alvo = aplicaveis(regra, entidades);
  const tipos = new Set(alvo.map((e) => e.tipo));
  const proibido = regra.parametros.cruzamento === "proibido";
  const cruza =
    tipos.has("area_limpa") &&
    tipos.has("area_contaminada") &&
    alvo.some((a) =>
      alvo.some(
        (b) =>
          a.id !== b.id &&
          a.tipo === "area_limpa" &&
          b.tipo === "area_contaminada" &&
          Math.hypot(Number(a.coord_x) - Number(b.coord_x), Number(a.coord_y) - Number(b.coord_y)) < 1,
      ),
    );
  const ok = proibido ? !cruza : true;
  return [
    {
      regra_id: regra.id,
      status: ok ? "conforme" : "inconforme",
      severidade_efetiva: ok ? "informativo" : regra.severidade,
      valor_observado: cruza ? 1 : 0,
      detalhes: { cruzamento_detectado: cruza },
    },
  ];
};

const barreira: Validator = (regra, entidades) => {
  const entre = (regra.parametros.entre as string[]) ?? [];
  const possui = entre.every((t) => entidades.some((e) => e.tipo === t));
  const temParede = entidades.some(
    (e) => e.tipo === "parede" && (e.metadados as any)?.divisoria_entre,
  );
  const ok = possui ? temParede : true;
  return [
    {
      regra_id: regra.id,
      status: ok ? "conforme" : "inconforme",
      severidade_efetiva: ok ? "informativo" : regra.severidade,
      valor_observado: temParede ? 1 : 0,
      detalhes: { entre, barreira_detectada: temParede },
    },
  ];
};

const ventilacao: Validator = (regra, entidades) => {
  const alvo = aplicaveis(regra, entidades);
  const renov = regra.parametros.renovacoes_h ?? 0;
  return alvo.map((e) => {
    const r = Number((e.metadados as any)?.renovacoes_h ?? 0);
    const ok = r >= renov;
    return {
      regra_id: regra.id,
      entidade_id: e.id,
      status: ok ? "conforme" : "inconforme",
      severidade_efetiva: ok ? "informativo" : regra.severidade,
      valor_observado: r,
      detalhes: { renovacoes_min: renov, renovacoes_observadas: r },
    };
  });
};

export const VALIDATORS: Record<TipoValidacao, Validator> = {
  dimensional,
  area_minima: areaMinima,
  presencial,
  fluxo,
  barreira,
  ventilacao,
};

export function executarRegra(
  regra: RegraRegulatoria,
  entidades: EntidadeArquitetonica[],
): ResultadoValidacao[] {
  const validator = VALIDATORS[regra.tipo_validacao];
  if (!validator) return [];
  return validator(regra, entidades);
}
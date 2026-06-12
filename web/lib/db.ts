import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "..", "data", "fiscalio.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return db;
}

export interface Indicador {
  clave: string;
  valor: number;
  unidad: string;
  vigencia_inicio: string;
  vigencia_fin: string | null;
  fuente: string;
  fuente_url: string;
  fundamento: string | null;
  publicado_dof: string | null;
}

export interface TarifaRenglon {
  orden: number;
  limite_inferior: number;
  limite_superior: number | null;
  cuota_fija: number;
  porcentaje: number;
}

export interface Tarifa {
  clave: string;
  descripcion: string;
  fundamento: string;
  vigencia_inicio: string;
  fuente: string;
  fuente_url: string;
  publicado_dof: string | null;
  renglones: TarifaRenglon[];
}

export function getIndicadoresVigentes(): Indicador[] {
  return getDb()
    .prepare(
      `SELECT clave, valor, unidad, vigencia_inicio, vigencia_fin, fuente,
              fuente_url, fundamento, publicado_dof
       FROM indicadores WHERE vigencia_fin IS NULL ORDER BY clave`
    )
    .all() as Indicador[];
}

export function getHistorial(clave: string): Indicador[] {
  return getDb()
    .prepare(
      `SELECT clave, valor, unidad, vigencia_inicio, vigencia_fin, fuente,
              fuente_url, fundamento, publicado_dof
       FROM indicadores WHERE clave = ? ORDER BY vigencia_inicio DESC`
    )
    .all(clave) as Indicador[];
}

export function getTarifaVigente(clave: string): Tarifa | null {
  const tarifa = getDb()
    .prepare(
      `SELECT id, clave, descripcion, fundamento, vigencia_inicio, fuente,
              fuente_url, publicado_dof
       FROM tarifas WHERE clave = ? AND vigencia_fin IS NULL
       ORDER BY vigencia_inicio DESC LIMIT 1`
    )
    .get(clave) as (Tarifa & { id: number }) | undefined;
  if (!tarifa) return null;

  const renglones = getDb()
    .prepare(
      `SELECT orden, limite_inferior, limite_superior, cuota_fija, porcentaje
       FROM tarifa_renglones WHERE tarifa_id = ? ORDER BY orden`
    )
    .all(tarifa.id) as TarifaRenglon[];

  const { id: _id, ...rest } = tarifa;
  return { ...rest, renglones };
}

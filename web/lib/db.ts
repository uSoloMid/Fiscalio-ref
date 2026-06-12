import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "..", "data", "fiscalio.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true, timeout: 15000 });
    db.pragma("busy_timeout = 15000");
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

export interface NotaDof {
  cod_nota: number;
  fecha: string;
  edicion: string;
  titulo: string;
  organismo: string | null;
  url: string;
}

/** Últimas notas fiscales del DOF descargadas por el scraper. Vacío si aún no corre. */
export function getNotasDofFiscales(limite = 25): NotaDof[] {
  try {
    return getDb()
      .prepare(
        `SELECT cod_nota, fecha, edicion, titulo, organismo, url
         FROM dof_notas WHERE es_fiscal = 1 ORDER BY fecha DESC, cod_nota DESC LIMIT ?`
      )
      .all(limite) as NotaDof[];
  } catch {
    return []; // la tabla puede no existir si el scraper no ha corrido
  }
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

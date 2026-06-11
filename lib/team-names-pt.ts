import type { Team } from "@/types/domain";

const BY_ISO2: Record<string, string> = {
  ar: "Argentina",
  at: "Áustria",
  au: "Austrália",
  ba: "Bósnia e Herzegovina",
  be: "Bélgica",
  br: "Brasil",
  ca: "Canadá",
  cd: "República Democrática do Congo",
  ch: "Suíça",
  ci: "Costa do Marfim",
  co: "Colômbia",
  cv: "Cabo Verde",
  cw: "Curaçao",
  cz: "Tchéquia",
  de: "Alemanha",
  dz: "Argélia",
  ec: "Equador",
  eg: "Egito",
  eng: "Inglaterra",
  es: "Espanha",
  fr: "França",
  "gb-eng": "Inglaterra",
  "gb-sct": "Escócia",
  gh: "Gana",
  hr: "Croácia",
  ht: "Haiti",
  iq: "Iraque",
  ir: "Irã",
  jo: "Jordânia",
  jp: "Japão",
  kr: "Coreia do Sul",
  ma: "Marrocos",
  mx: "México",
  nl: "Holanda",
  no: "Noruega",
  nz: "Nova Zelândia",
  pa: "Panamá",
  pt: "Portugal",
  py: "Paraguai",
  qa: "Catar",
  sa: "Arábia Saudita",
  sco: "Escócia",
  se: "Suécia",
  sn: "Senegal",
  tn: "Tunísia",
  tr: "Turquia",
  us: "Estados Unidos",
  uy: "Uruguai",
  uz: "Uzbequistão",
  za: "África do Sul"
};

const BY_FIFA: Record<string, string> = {
  ALG: "Argélia",
  ARG: "Argentina",
  AUS: "Austrália",
  AUT: "Áustria",
  BEL: "Bélgica",
  BIH: "Bósnia e Herzegovina",
  BRA: "Brasil",
  CAN: "Canadá",
  CIV: "Costa do Marfim",
  COL: "Colômbia",
  CPV: "Cabo Verde",
  COD: "República Democrática do Congo",
  CRO: "Croácia",
  CUW: "Curaçao",
  CZE: "Tchéquia",
  ECU: "Equador",
  EGY: "Egito",
  ENG: "Inglaterra",
  ESP: "Espanha",
  FRA: "França",
  GER: "Alemanha",
  GHA: "Gana",
  HAI: "Haiti",
  IRQ: "Iraque",
  IRN: "Irã",
  JOR: "Jordânia",
  JPN: "Japão",
  KOR: "Coreia do Sul",
  KSA: "Arábia Saudita",
  MAR: "Marrocos",
  MEX: "México",
  NED: "Holanda",
  NOR: "Noruega",
  NZL: "Nova Zelândia",
  PAN: "Panamá",
  PAR: "Paraguai",
  POR: "Portugal",
  QAT: "Catar",
  RSA: "África do Sul",
  SCO: "Escócia",
  SEN: "Senegal",
  SUI: "Suíça",
  SWE: "Suécia",
  TUN: "Tunísia",
  TUR: "Turquia",
  URU: "Uruguai",
  USA: "Estados Unidos",
  UZB: "Uzbequistão"
};

const BY_ENGLISH_NAME: Record<string, string> = {
  algeria: "Argélia",
  argentina: "Argentina",
  australia: "Austrália",
  austria: "Áustria",
  belgium: "Bélgica",
  "bosnia and herzegovina": "Bósnia e Herzegovina",
  brazil: "Brasil",
  canada: "Canadá",
  "cape verde": "Cabo Verde",
  colombia: "Colômbia",
  croatia: "Croácia",
  curaçao: "Curaçao",
  curacao: "Curaçao",
  "czech republic": "Tchéquia",
  "democratic republic of the congo": "República Democrática do Congo",
  ecuador: "Equador",
  egypt: "Egito",
  england: "Inglaterra",
  france: "França",
  germany: "Alemanha",
  ghana: "Gana",
  haiti: "Haiti",
  iran: "Irã",
  iraq: "Iraque",
  "ivory coast": "Costa do Marfim",
  japan: "Japão",
  jordan: "Jordânia",
  mexico: "México",
  morocco: "Marrocos",
  netherlands: "Holanda",
  "new zealand": "Nova Zelândia",
  norway: "Noruega",
  panama: "Panamá",
  paraguay: "Paraguai",
  portugal: "Portugal",
  qatar: "Catar",
  "saudi arabia": "Arábia Saudita",
  scotland: "Escócia",
  senegal: "Senegal",
  "south africa": "África do Sul",
  "south korea": "Coreia do Sul",
  spain: "Espanha",
  sweden: "Suécia",
  switzerland: "Suíça",
  tunisia: "Tunísia",
  turkey: "Turquia",
  "united states": "Estados Unidos",
  uruguay: "Uruguai",
  uzbekistan: "Uzbequistão"
};

function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase();
}

export function getTeamDisplayName(team: Pick<Team, "name" | "iso2" | "fifa_code">): string {
  const iso2 = team.iso2?.toLowerCase();
  if (iso2 && BY_ISO2[iso2]) return BY_ISO2[iso2];

  const fifa = team.fifa_code?.toUpperCase();
  if (fifa && BY_FIFA[fifa]) return BY_FIFA[fifa];

  const byEnglishName = BY_ENGLISH_NAME[normalizeLookupKey(team.name)];
  if (byEnglishName) return byEnglishName;

  return team.name;
}

export function localizeTeam<T extends Team>(team: T): T {
  return {
    ...team,
    name: getTeamDisplayName(team)
  };
}

export function localizeTeamName(name: string): string {
  return BY_ENGLISH_NAME[normalizeLookupKey(name)] ?? name;
}

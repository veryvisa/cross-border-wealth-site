// 讲座系列工具的纯函数（规格＝正本第 6.3 节；测试＝scripts/test-calc.mjs 用正本给出的案例 A/B/P 核对）。
// 所有数字是教学示意：忽略扣除、配偶抵免与汇率；税率表须在讲前对照 IRC §2001(c) 法条。

/** IRC §2001(c) 联邦遗产税率表（🟡 用前核对法条） */
export const BRACKETS = [
  [10000, 0.18, 0], [20000, 0.20, 1800], [40000, 0.22, 3800], [60000, 0.24, 8200], [80000, 0.26, 13000],
  [100000, 0.28, 18200], [150000, 0.30, 23800], [250000, 0.32, 38800], [500000, 0.34, 70800],
  [750000, 0.37, 155800], [1000000, 0.39, 248300], [Infinity, 0.40, 345800],
];
export function tentativeTax(x) {
  if (!(x > 0)) return 0;
  let lower = 0;
  for (const [upper, rate, baseTax] of BRACKETS) {
    if (x <= upper) return baseTax + rate * (x - lower);
    lower = upper;
  }
  return 0;
}
/** 统一抵免 = tax(基本免税额)；2026 年 US$15,000,000 → 5,945,800 */
export function unifiedCredit(exclusion = 15000000) { return tentativeTax(exclusion); }

/** 遗产税暴露估算（正本 6.3(d)）：W 全球遗产，S 美国 situs，status: 'ca' 加拿大居民非美国公民 / 'nrnc' 其他 */
export function estateExposure({ W, S, status = 'ca', exclusion = 15000000, domesticCredit = 13000 }) {
  const pre = tentativeTax(S);
  const treaty = status === 'ca' && W > 0 ? unifiedCredit(exclusion) * S / W : 0;
  const credit = Math.max(domesticCredit, treaty);
  const due = Math.max(0, pre - credit);
  return {
    pre, treaty, credit, due,
    mustFile: S > 60000,
    smallEstate: status === 'ca' && W > 0 && W <= 1200000,
    note: status === 'ca' ? '条约比例抵免以提交 706-NA 并披露全球遗产为前提' : '仅国内法信用额 US$13,000；须核对本国与美国是否另有条约',
  };
}

/** 加拿大死亡视同处置估算（6.3(e)）：inclusion 计入率 1/2；rate 边际税率（小数） */
export function deemedDisposition({ fmv, acb, rate, inclusion = 0.5 }) {
  const gain = Math.max(0, fmv - acb);
  const included = gain * inclusion;
  const tax = included * rate;
  return { gain, included, tax };
}
export function combinedBurden({ usTax, caTax, fmv }) { return fmv > 0 ? (usTax + caTax) / fmv : 0; }

/** BC 遗嘱认证费（Probate Fee Act，✅ O12）：仅对 BC 境内及经遗产代理人转移的资产；另有约 C$200 申请费不计入 */
export function bcProbateFee(value) {
  if (!(value > 25000)) return 0;
  const band1 = Math.max(0, Math.min(value, 50000) - 25000);
  const band2 = Math.max(0, value - 50000);
  return Math.ceil(band1 / 1000) * 6 + Math.ceil(band2 / 1000) * 14;
}

/** SPT（6.3(b)）：years = [{year, days, exempt}] 按年份升序；判最后一年 */
export function spt(years) {
  const ys = [...years].sort((a, b) => a.year - b.year);
  const c = (i) => { const r = ys[i]; return r && !r.exempt ? r.days : 0; };
  const n = ys.length - 1;
  const cur = c(n), w = cur + c(n - 1) / 3 + c(n - 2) / 6;
  return { current: cur, weighted: Math.round(w * 100) / 100, meets: cur >= 31 && w >= 183 };
}
/** 学生豁免：入学当年起 5 个日历年（任何一部分日历年都算一年） */
export function exemptYears(entryYear, n = 5) { return Array.from({ length: n }, (_, i) => entryYear + i); }

/** 3520 合并门槛（6.3(c)）：rows = [{donor, relation, kind:'individual'|'estate'|'company'|'partnership', amount, direct:boolean}] */
export function form3520(rows, { individualThreshold = 100000, entityThreshold = 20573, itemize = 5000, recipientIsUSPerson = true } = {}) {
  const counted = rows.filter(r => !r.direct && r.amount > 0);
  const indiv = counted.filter(r => r.kind === 'individual' || r.kind === 'estate');
  const ent = counted.filter(r => r.kind === 'company' || r.kind === 'partnership');
  const sumIndiv = indiv.reduce((a, r) => a + r.amount, 0);
  const sumEnt = ent.reduce((a, r) => a + r.amount, 0);
  const excluded = rows.filter(r => r.direct).reduce((a, r) => a + r.amount, 0);
  return {
    recipientIsUSPerson, sumIndiv, sumEnt, excluded,
    partIV: recipientIsUSPerson && sumIndiv > individualThreshold,
    entityHit: recipientIsUSPerson && sumEnt > entityThreshold,
    itemized: indiv.filter(r => r.amount > itemize),
  };
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

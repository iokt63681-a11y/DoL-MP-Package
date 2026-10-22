"use strict";

/* DoL-MP server v0.6.0 — 真实时间线机制 + 原生遭遇战完整NPC保留 + PvP体位/破处/逃跑判定 + 图论最短路支援
 * 核心机制：
 * 1. 房间码、房主审批、位置/外观/性格快照同步、交易、基础互动、断线清理
 * 2. 时间线机制重构（v0.6.0）：
 *    - 分头行动时（syncMode = false）各自时间独立流动，互不干扰
 *    - 组队同行时（syncMode = true）各自行动扣减自己的时间线，实时时钟推进在组队下同步流动
 *    - 新增「同步时间线」（sync_timeline）：发起同步的玩家可选择房间内任意队友，将自己的时间线同步至目标玩家的时间线
 * 3. 遭遇战与 PvP 深度拟真（v0.6.0）：
 *    - 支援队友（assist_combat / startAutoCoopCombat）完整保留被支援者当前的 $NPCList 快照与遭遇战上下文，绝不用随机 NPC 替代
 *    - 玩家双方主动挑起遭遇战（PvP / 温存）时，对手名称与破处记录（takeVirginity）均为对方玩家的真实联机昵称 ID
 *    - 默认动作绝不自动把私处贴过去，仅当一方主动选择贴近/插入互动时才会在对方界面触发对称的被插入/侵犯状态
 *    - 新增 PvP 逃跑体能与意志属性判定（mp_escape），对齐原版挣脱机制
 * 4. 基于图论（Dijkstra 最短路算法）的「赶去支援」与「会合」动态耗时计算
 */

const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT || 8787);
const HUB_PASSAGE = "联机会客厅";
const BEDROOM_PASSAGE = "多人卧室";
const MAX_PLAYERS = 8;
const MAX_MSG = 256 * 1024;
const CHAT_INTERVAL_MS = 400;
const REQUEST_TTL_MS = 60000;
const VOTE_TTL_MS = 15000;
const COMBAT_TURN_TIMEOUT_MS = 120000;
const CONSENT_TTL_MS = 30000;
const SYNC_TTL_MS = 30000;
const COOP_MATCH_WINDOW_MS = 20000;
const COOP_AUTO_PULL_MS = 350;
const EVENT_ARBITRATION_MS = 220;

const SAFE_PASSAGES = new Set([
  "Orphanage", "Bedroom", "Bathroom", "Garden", "Domus Street", "Barb Street",
  "Danube Street", "Connudatus Street", "Cliff Street", "Wolf Street", "High Street",
  "Starfish Street", "Nightingale Street", "Oxford Street", "Mer Street", "Elk Street",
  "Harvest Street", "Park", "Beach", "Sea Beach", "Sea Rocks", "Rocks", "Rocks Pool",
  "Rocks Dive", "Beach Cave", "Beach Cave Entrance", "Forest", "Deep Forest",
  "Hallways", "School", "School Hallways", "School Front", "School Front Courtyard",
  "School Library", "School Toilets", "Canteen", "Classroom", "Science Classroom",
  "Maths Classroom", "English Classroom", "History Classroom", "Swimming Pool",
  "Shopping Centre", "Shopping Centre Top", "Temple", "Temple Garden", "Temple Quarters",
  "Brothel", "Pub", "Hospital Courtyard", "Police Station", "Ocean Breeze", "Adult Shop",
  "Arcade", "Docks", "Farmland", "Cottage", "Sewers", "Sewers Lake",
  "Residential Alleyways", "Commercial Alleyways", "Industrial Alleyways", "Park Toilets",
  "联机会客厅", "多人卧室"
]);

/* ---------------- DoL 全镇地图拓扑与 Dijkstra 最短路引擎 ---------------- */

const NODE_CN = {
  "Orphanage": "孤儿院",
  "Bedroom": "孤儿院卧室",
  "Bathroom": "孤儿院浴室",
  "Garden": "孤儿院花园",
  "Domus Street": "宅邸街",
  "Barb Street": "倒钩街",
  "Danube Street": "多瑙河街",
  "Connudatus Street": "康努达图斯街",
  "Cliff Street": "峭壁街",
  "Wolf Street": "狼街",
  "High Street": "高街",
  "Starfish Street": "星鱼街",
  "Nightingale Street": "夜莺街",
  "Oxford Street": "牛津街",
  "Mer Street": "梅尔街",
  "Elk Street": "麋鹿街",
  "Harvest Street": "丰收街",
  "Residential Alleyways": "住宅区小巷",
  "Commercial Alleyways": "商业区小巷",
  "Industrial Alleyways": "工业区小巷",
  "Park": "公园",
  "Beach": "海滩",
  "Sea Rocks": "海礁",
  "Beach Cave": "海滩洞穴",
  "Forest": "森林",
  "Deep Forest": "深林",
  "Cottage": "伊甸木屋",
  "Wolf Cave": "狼穴",
  "School Front Courtyard": "学校前院",
  "Hallways": "学校走廊",
  "School Library": "学校图书馆",
  "Swimming Pool": "学校泳池",
  "Shopping Centre": "购物中心",
  "Temple": "神殿",
  "Hospital Courtyard": "医院",
  "Police Station": "警察局",
  "Ocean Breeze": "海风咖啡馆",
  "Brothel": "妓院",
  "Pub": "酒吧",
  "Adult Shop": "成人店",
  "Arcade": "游戏厅",
  "Docks": "码头",
  "Farmland": "农场",
  "Kylar Manor": "凯拉尔庄园",
  "Sewers": "下水道"
};

const WALK_EDGES = [
  ["Bedroom", "Orphanage", 1],
  ["Bathroom", "Orphanage", 1],
  ["Garden", "Orphanage", 1],
  ["Orphanage", "Domus Street", 1],
  ["Domus Street", "Barb Street", 5],
  ["Domus Street", "Danube Street", 5],
  ["Domus Street", "Residential Alleyways", 3],
  ["Barb Street", "Cliff Street", 5],
  ["Barb Street", "Connudatus Street", 5],
  ["Barb Street", "Residential Alleyways", 3],
  ["Barb Street", "Police Station", 2],
  ["Danube Street", "Wolf Street", 5],
  ["Danube Street", "Connudatus Street", 5],
  ["Danube Street", "Residential Alleyways", 3],
  ["Danube Street", "Kylar Manor", 3],
  ["Danube Street", "Forest", 8],
  ["Connudatus Street", "Cliff Street", 5],
  ["Connudatus Street", "Wolf Street", 5],
  ["Connudatus Street", "Residential Alleyways", 3],
  ["Connudatus Street", "Commercial Alleyways", 3],
  ["Cliff Street", "Starfish Street", 5],
  ["Cliff Street", "High Street", 5],
  ["Cliff Street", "Commercial Alleyways", 3],
  ["Cliff Street", "Ocean Breeze", 2],
  ["Cliff Street", "Beach", 5],
  ["Wolf Street", "Nightingale Street", 5],
  ["Wolf Street", "High Street", 5],
  ["Wolf Street", "Commercial Alleyways", 3],
  ["Wolf Street", "Temple", 2],
  ["Wolf Street", "Forest", 7],
  ["High Street", "Starfish Street", 5],
  ["High Street", "Nightingale Street", 5],
  ["High Street", "Park", 4],
  ["High Street", "Commercial Alleyways", 3],
  ["High Street", "Shopping Centre", 2],
  ["Starfish Street", "Mer Street", 5],
  ["Starfish Street", "Oxford Street", 5],
  ["Starfish Street", "Park", 4],
  ["Starfish Street", "Beach", 4],
  ["Starfish Street", "Arcade", 2],
  ["Nightingale Street", "Elk Street", 5],
  ["Nightingale Street", "Oxford Street", 5],
  ["Nightingale Street", "Park", 4],
  ["Nightingale Street", "Hospital Courtyard", 2],
  ["Oxford Street", "Mer Street", 5],
  ["Oxford Street", "Elk Street", 5],
  ["Oxford Street", "Park", 4],
  ["Oxford Street", "Industrial Alleyways", 3],
  ["Oxford Street", "School Front Courtyard", 2],
  ["Mer Street", "Harvest Street", 5],
  ["Mer Street", "Industrial Alleyways", 3],
  ["Mer Street", "Docks", 2],
  ["Elk Street", "Harvest Street", 5],
  ["Elk Street", "Industrial Alleyways", 3],
  ["Elk Street", "Adult Shop", 2],
  ["Harvest Street", "Industrial Alleyways", 3],
  ["Harvest Street", "Brothel", 2],
  ["Harvest Street", "Pub", 2],
  ["Harvest Street", "Farmland", 15],
  ["Residential Alleyways", "Commercial Alleyways", 4],
  ["Commercial Alleyways", "Park", 3],
  ["Commercial Alleyways", "Industrial Alleyways", 5],
  ["Industrial Alleyways", "Park", 3],
  ["Domus Street", "Sewers", 12],
  ["High Street", "Sewers", 12],
  ["Oxford Street", "Sewers", 12],
  ["Harvest Street", "Sewers", 12],
  ["Park", "Sewers", 12],
  ["School Front Courtyard", "Hallways", 1],
  ["Hallways", "School Library", 1],
  ["Hallways", "Swimming Pool", 2],
  ["Beach", "Sea Rocks", 3],
  ["Sea Rocks", "Beach Cave", 4],
  ["Forest", "Deep Forest", 10],
  ["Forest", "Cottage", 10],
  ["Deep Forest", "Cottage", 5],
  ["Deep Forest", "Wolf Cave", 6]
];

const BUS_STOPS = [
  "Domus Street", "Barb Street", "Danube Street", "Connudatus Street",
  "Cliff Street", "Wolf Street", "High Street", "Starfish Street",
  "Nightingale Street", "Oxford Street", "Mer Street", "Elk Street",
  "Harvest Street"
];

function matchPassageToGraphNode(rawPas) {
  const p = String(rawPas || "").trim();
  if (!p) return "";
  if (NODE_CN[p]) return p;
  if (p === HUB_PASSAGE || p === BEDROOM_PASSAGE || p.includes("Orphanage") || p.startsWith("Robin") || p.startsWith("Bailey")) return "Orphanage";
  if (p.startsWith("Bedroom")) return "Bedroom";
  if (p.startsWith("Bathroom")) return "Bathroom";
  if (p.startsWith("Domus")) return "Domus Street";
  if (p.startsWith("Barb")) return "Barb Street";
  if (p.startsWith("Danube")) return "Danube Street";
  if (p.startsWith("Connudatus")) return "Connudatus Street";
  if (p.startsWith("Cliff")) return "Cliff Street";
  if (p.startsWith("Wolf Cave") || p.startsWith("Wolf Pack")) return "Wolf Cave";
  if (p.startsWith("Wolf")) return "Wolf Street";
  if (p.startsWith("High") || p.startsWith("Street Photo High")) return "High Street";
  if (p.startsWith("Starfish")) return "Starfish Street";
  if (p.startsWith("Nightingale")) return "Nightingale Street";
  if (p.startsWith("Oxford")) return "Oxford Street";
  if (p.startsWith("Mer")) return "Mer Street";
  if (p.startsWith("Elk")) return "Elk Street";
  if (p.startsWith("Harvest")) return "Harvest Street";
  if (p.includes("Kylar Park") || p.startsWith("Park")) return "Park";
  if (p.includes("Manor Kylar") || p.startsWith("Kylar Manor")) return "Kylar Manor";
  if (p.includes("Sydney Temple") || p.startsWith("Temple")) return "Temple";
  if (p.includes("Sydney") || p.includes("Library")) return "School Library";
  if (p.includes("School") || p.includes("Classroom") || p.includes("Canteen") || p.includes("Hallways") || p.startsWith("Whitney")) return "Hallways";
  if (p.includes("Pool") || p.includes("Swimming")) return "Swimming Pool";
  if (p.includes("Beach Cave")) return "Beach Cave";
  if (p.includes("Rocks")) return "Sea Rocks";
  if (p.includes("Beach")) return "Beach";
  if (p.includes("Eden") || p.includes("Cottage")) return "Cottage";
  if (p.includes("Deep Forest")) return "Deep Forest";
  if (p.includes("Forest")) return "Forest";
  if (p.includes("Shopping") || p.includes("Clothing Shop") || p.includes("Hairdresser") || p.includes("Cosmetics")) return "Shopping Centre";
  if (p.includes("Brothel")) return "Brothel";
  if (p.includes("Pub")) return "Pub";
  if (p.includes("Hospital")) return "Hospital Courtyard";
  if (p.includes("Police")) return "Police Station";
  if (p.includes("Cafe") || p.includes("Ocean Breeze")) return "Ocean Breeze";
  if (p.includes("Adult Shop")) return "Adult Shop";
  if (p.includes("Arcade")) return "Arcade";
  if (p.includes("Docks")) return "Docks";
  if (p.includes("Farm") || p.includes("Alex")) return "Farmland";
  if (p.includes("Sewer") || p.includes("Drain")) return "Sewers";
  if (p.includes("Residential Alley")) return "Residential Alleyways";
  if (p.includes("Commercial Alley")) return "Commercial Alleyways";
  if (p.includes("Industrial Alley")) return "Industrial Alleyways";
  return "";
}

function resolveClientGraphNode(c) {
  if (!c) return "Orphanage";
  let node = matchPassageToGraphNode(c.passage);
  if (node) return node;
  if (c.combatReturnPassage) {
    node = matchPassageToGraphNode(c.combatReturnPassage);
    if (node) return node;
  }
  if (Array.isArray(c.recentPassages)) {
    for (let i = c.recentPassages.length - 1; i >= 0; i--) {
      node = matchPassageToGraphNode(c.recentPassages[i]);
      if (node) return node;
    }
  }
  const ml = String(c.mapLocation || c.location || "").toLowerCase().trim();
  const mapDict = {
    domus: "Domus Street", barb: "Barb Street", danube: "Danube Street",
    connudatus: "Connudatus Street", cliff: "Cliff Street", wolf: "Wolf Street",
    high: "High Street", starfish: "Starfish Street", nightingale: "Nightingale Street",
    oxford: "Oxford Street", mer: "Mer Street", elk: "Elk Street", harvest: "Harvest Street",
    park: "Park", beach: "Beach", forest: "Forest", school: "Hallways",
    home: "Orphanage", orphanage: "Orphanage", temple: "Temple",
    brothel: "Brothel", pub: "Pub", hospital: "Hospital Courtyard",
    alley: "Commercial Alleyways", sewers: "Sewers", farm: "Farmland", cabin: "Cottage"
  };
  if (mapDict[ml]) return mapDict[ml];
  return "Orphanage";
}

function runDijkstra(startNode, endNode, edges, weightMultiplier) {
  const mult = weightMultiplier || 1.0;
  if (startNode === endNode) {
    return { minutes: 1, path: [startNode] };
  }
  const adj = new Map();
  for (const [u, v, w] of edges) {
    const cost = Math.max(1, Math.round(w * mult));
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u).push({ to: v, w: cost });
    adj.get(v).push({ to: u, w: cost });
  }
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  dist.set(startNode, 0);

  while (true) {
    let u = null;
    let bestD = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < bestD) {
        bestD = d;
        u = node;
      }
    }
    if (u === null || u === endNode) break;
    visited.add(u);
    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;
      const alt = bestD + edge.w;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, u);
      }
    }
  }

  const total = dist.get(endNode);
  if (total === undefined || !Number.isFinite(total)) {
    return { minutes: 10, path: [startNode, endNode] };
  }
  const path = [];
  let cur = endNode;
  while (cur) {
    path.unshift(cur);
    if (cur === startNode) break;
    cur = prev.get(cur);
  }
  return { minutes: Math.max(1, total), path };
}

function calcShortestAssistTravel(helperClient, targetClient) {
  const fromNode = resolveClientGraphNode(helperClient);
  const toNode = resolveClientGraphNode(targetClient);
  const st = (helperClient && helperClient.stats) || {};

  if (fromNode === toNode) {
    const cn = NODE_CN[fromNode] || fromNode;
    return {
      fromNode,
      toNode,
      minutes: 1,
      seconds: 60,
      walkMinutes: 1,
      transportMinutes: 1,
      method: "同区域切入",
      busFare: 0,
      pathNodes: [fromNode],
      pathCn: [cn],
      routeSummary: cn,
    };
  }

  const walkRes = runDijkstra(fromNode, toNode, WALK_EDGES, 1.0);
  let best = {
    minutes: walkRes.minutes,
    path: walkRes.path,
    method: "徒步",
    busFare: 0,
  };

  const canTakeBus = (Number(st.money) || 0) >= 100 && (Number(st.exposed) || 0) <= 0;
  if (canTakeBus) {
    const busEdges = [...WALK_EDGES];
    for (let i = 0; i < BUS_STOPS.length; i++) {
      for (let j = i + 1; j < BUS_STOPS.length; j++) {
        busEdges.push([BUS_STOPS[i], BUS_STOPS[j], 4]);
      }
    }
    const busRes = runDijkstra(fromNode, toNode, busEdges, 1.0);
    if (busRes.minutes < best.minutes) {
      best = {
        minutes: busRes.minutes,
        path: busRes.path,
        method: "乘坐巴士",
        busFare: 100,
      };
    }
  }

  const hasWings = (Number(st.harpy) >= 6) || (Number(st.angel) >= 6) || (Number(st.demon) >= 6) || (Number(st.fallenangel) >= 2);
  if (hasWings) {
    const flyRes = runDijkstra(fromNode, toNode, WALK_EDGES, 0.5);
    if (flyRes.minutes < best.minutes) {
      best = {
        minutes: flyRes.minutes,
        path: flyRes.path,
        method: "展翼滑翔",
        busFare: 0,
      };
    }
  }

  const hasSprint = (Number(st.wolfgirl) >= 6) || (Number(st.cat) >= 6) || (Number(st.fox) >= 6) || (Number(st.cow) >= 6) || (Number(st.physique) >= 16000);
  if (hasSprint) {
    const sprintRes = runDijkstra(fromNode, toNode, WALK_EDGES, 0.7);
    if (sprintRes.minutes < best.minutes) {
      best = {
        minutes: sprintRes.minutes,
        path: sprintRes.path,
        method: "疾奔",
        busFare: 0,
      };
    }
  }

  const pathCn = best.path.map((n) => NODE_CN[n] || n);
  return {
    fromNode,
    toNode,
    minutes: best.minutes,
    seconds: best.minutes * 60,
    walkMinutes: walkRes.minutes,
    transportMinutes: best.minutes,
    method: best.method,
    busFare: best.busFare,
    pathNodes: best.path,
    pathCn,
    routeSummary: pathCn.join(" → "),
  };
}

const ROOM_CODE_LEN = 4;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ACTS = {
  handhold: { label: "牵手" },
  whisper: { label: "耳语" },
  caress: { label: "抚摸" },
  hug: { label: "拥抱" },
  kiss: { label: "亲吻" },
  rest: { label: "一起休息" },
  mutual: { label: "互相抚慰" },
  intimate: { label: "亲密互动" },
};

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0", maxPayload: MAX_MSG });

const clients = new Map();
const rooms = new Map();
const trades = new Map();
const acts = new Map();

/* ---------------- 基础工具 ---------------- */

function now() { return Date.now(); }
function send(ws, obj) { if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); }

function text(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function colour(value) {
  const s = String(value || "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return s;
  if (/^[a-z0-9 _-]{2,30}$/i.test(s)) return s;
  return "";
}

function clampNum(v, min, max, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function genPrngPack() {
  const seed = [];
  for (let i = 0; i < 16; i++) seed.push(crypto.randomInt(0, 256));
  return {
    rng: crypto.randomInt(1, 101),
    seedStr: seed.join(","),
  };
}

function validAppearance(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    sex: text(raw.sex, 20),
    hairColour: colour(raw.hairColour),
    skinColour: colour(raw.skinColour),
    eyeColour: colour(raw.eyeColour),
  };
}

function validJsonSnapshot(raw, maxBytes) {
  if (!raw || typeof raw !== "object") return null;
  try {
    const s = JSON.stringify(raw);
    if (s.length > (maxBytes || 32000)) return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function validStats(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    physique: clampNum(raw.physique, 0, 30000, 10000),
    physiquesize: clampNum(raw.physiquesize, 1000, 30000, 20000),
    willpower: clampNum(raw.willpower, 0, 2000, 500),
    willpowermax: clampNum(raw.willpowermax, 100, 2000, 1000),
    skulduggery: clampNum(raw.skulduggery, 0, 1200, 200),
    danceskill: clampNum(raw.danceskill, 0, 1200, 200),
    seductionskill: clampNum(raw.seductionskill, 0, 1200, 200),
    pain: clampNum(raw.pain, 0, 200, 0),
    arousal: clampNum(raw.arousal, 0, 10000, 100),
    arousalmax: clampNum(raw.arousalmax, 1000, 20000, 10000),
    stress: clampNum(raw.stress, 0, 10000, 0),
    trauma: clampNum(raw.trauma, 0, 5000, 0),
    tiredness: clampNum(raw.tiredness, 0, 2000, 0),
    money: clampNum(raw.money, 0, 100000000, 0),
    promiscuity: clampNum(raw.promiscuity, 0, 100, 0),
    exposed: clampNum(raw.exposed, 0, 10, 0),
    harpy: clampNum(raw.harpy, 0, 10, 0),
    wolfgirl: clampNum(raw.wolfgirl, 0, 10, 0),
    cat: clampNum(raw.cat, 0, 10, 0),
    fox: clampNum(raw.fox, 0, 10, 0),
    cow: clampNum(raw.cow, 0, 10, 0),
    demon: clampNum(raw.demon, 0, 10, 0),
    angel: clampNum(raw.angel, 0, 10, 0),
    fallenangel: clampNum(raw.fallenangel, 0, 10, 0),
  };
}

function genCode() {
  let code = "";
  do {
    code = "";
    for (let i = 0; i < ROOM_CODE_LEN; i++) {
      code += ROOM_CODE_CHARS[crypto.randomInt(ROOM_CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

function roomOf(client) { return client.roomCode ? rooms.get(client.roomCode) : null; }

function findClient(id) {
  for (const c of clients.values()) if (c.id === id) return c;
  return null;
}

function publicPlayer(c) {
  return {
    id: c.id,
    name: c.name,
    passage: c.passage,
    phase: c.phase,
    recentPassages: c.recentPassages || [],
    combatReturnPassage: c.combatReturnPassage || "",
    location: c.location,
    mapLocation: c.mapLocation,
    timeStamp: c.timeStamp || 25260,
    speechAttitude: c.speechAttitude || "neutral",
    appearance: c.appearance,
    combatSnapshot: c.combatSnapshot,
    stats: c.stats,
    inCombat: !!c.inCombat,
    combatId: c.combatId || "",
    combatInfo: c.combatInfo || null,
    isHost: !!c.isHost,
    inHub: c.passage === HUB_PASSAGE,
    inBedroom: c.passage === BEDROOM_PASSAGE,
    joinedAt: c.joinedAt,
    updatedAt: c.updatedAt || c.joinedAt,
  };
}

function roomPlayers(room) { return [...room.members].map(publicPlayer); }

function sendToRoom(room, obj, exceptId) {
  for (const c of room.members) if (c.id !== exceptId) send(c.ws, obj);
}

function setRoomSync(room, on, byName) {
  if (!room) return;
  room.syncMode = !!on;
  if (!room.syncMode) {
    for (const [, bucket] of room.linkVotes) {
      if (bucket.timer) clearTimeout(bucket.timer);
    }
    room.linkVotes.clear();
  }
  broadcastRoster(room);
  sendToRoom(room, { t: "sync_state", syncMode: room.syncMode, byName: byName || "" });
}

function broadcastRoster(room) {
  const all = roomPlayers(room);
  for (const c of room.members) {
    send(c.ws, {
      t: "roster",
      room: room.code,
      players: all.filter((p) => p.id !== c.id),
      clock: room.clock,
      prng: room.prng,
      syncMode: !!room.syncMode,
      hostId: room.hostId,
    });
  }
}

function sys(room, message) { sendToRoom(room, { t: "sys", text: message }); }

function sameLocation(a, b) {
  return !!a.passage && a.passage === b.passage;
}

function validItem(it) {
  if (!it || typeof it !== "object") return false;
  switch (it.kind) {
    case "money":
      return Number.isInteger(it.amount) && it.amount > 0 && it.amount <= 1000000;
    case "food":
      return typeof it.key === "string" && it.key.length > 0 && it.key.length <= 80 &&
        Number.isInteger(it.amount) && it.amount > 0 && it.amount <= 999;
    case "sextoy":
      return typeof it.category === "string" && typeof it.name === "string" &&
        it.category.length <= 80 && it.name.length <= 120;
    case "clothing":
      return typeof it.slot === "string" && typeof it.name === "string" &&
        it.slot.length <= 40 && it.name.length <= 120;
    default:
      return false;
  }
}

/* ---------------- 房间管理 ---------------- */

function addMember(room, client) {
  client.roomCode = room.code;
  client.isHost = room.hostId === client.id;
  client.joinedAt = now();
  client.updatedAt = now();
  room.members.add(client);
  send(client.ws, {
    t: "room_joined",
    code: room.code,
    host: client.isHost,
    needApproval: !!room.needApproval,
    players: roomPlayers(room),
    clock: room.clock,
    prng: room.prng,
    syncMode: !!room.syncMode,
  });
  broadcastRoster(room);
  sys(room, client.name + " 加入了房间");
}

function leaveRoom(client, reason) {
  const room = roomOf(client);
  client.roomCode = "";
  client.isHost = false;
  if (!room) return;

  const wasHost = room.hostId === client.id;
  room.members.delete(client);
  clearVotesForClient(room, client);
  removeClientFromCombatSessions(room, client);

  if (room.consentRequests) {
    for (const [reqId, entry] of room.consentRequests) {
      if (entry.fromId !== client.id && entry.toId !== client.id) continue;
      if (entry.timer) clearTimeout(entry.timer);
      room.consentRequests.delete(reqId);
      const otherId = entry.fromId === client.id ? entry.toId : entry.fromId;
      const other = findClient(otherId);
      if (other) send(other.ws, { t: "consensual_declined", reqId, byName: client.name, reason: "offline" });
    }
  }

  clearCoopPending(room, client);
  if (room.eventPending) room.eventPending.delete(client.id);
  if (room.eventPickPending) room.eventPickPending.delete(client.id);
  if (room.inlineDomPending) room.inlineDomPending.delete(client.id);
  if (room.syncRequests) {
    for (const [reqId, entry] of room.syncRequests) {
      if (entry.fromId !== client.id) continue;
      if (entry.timer) clearTimeout(entry.timer);
      room.syncRequests.delete(reqId);
    }
  }

  for (const [reqId, req] of room.pending) {
    if (req.client === client) {
      room.pending.delete(reqId);
      if (req.timer) clearTimeout(req.timer);
      const host = findClient(room.hostId);
      if (host) send(host.ws, { t: "join_cancelled", reqId, name: req.name });
    }
  }

  if (room.members.size === 0) {
    if (room.clockTimer) clearInterval(room.clockTimer);
    rooms.delete(room.code);
    return;
  }

  if (wasHost) {
    for (const [, req] of room.pending) {
      if (req.timer) clearTimeout(req.timer);
      send(req.client.ws, { t: "join_rejected", reason: "host_left" });
    }
    room.pending.clear();

    const next = room.members.values().next().value;
    room.hostId = next.id;
    next.isHost = true;
    sendToRoom(room, { t: "room_host_changed", hostId: next.id, hostName: next.name });
    sys(room, next.name + " 成为新房主");
  }

  broadcastRoster(room);
  if (reason !== "disconnect") sys(room, client.name + " 离开了房间");
}

function setupRoomClockTimer(room) {
  if (room.clockTimer) clearInterval(room.clockTimer);
  room.clockTimer = setInterval(() => {
    // 仅当开启组队同步（syncMode = true）且开启实时时钟时才同步推进；分开时各自流动
    if (!room.syncMode || !room.clock.running || room.members.size === 0) return;
    const someoneInCombat = [...room.members].some((m) => m.inCombat);
    if (someoneInCombat) return;

    const stepSeconds = 60 * (room.clock.speed || 1);
    room.clock.timeStamp += stepSeconds;
    room.prng = genPrngPack();
    sendToRoom(room, {
      t: "clock_tick",
      timeStamp: room.clock.timeStamp,
      stepSeconds,
      speed: room.clock.speed,
      running: room.clock.running,
      prng: room.prng,
    });
  }, 2500);
}

function createRoom(client, msg) {
  leaveRoom(client, "switch");
  const code = genCode();
  const room = {
    code,
    hostId: client.id,
    needApproval: !!msg.needApproval,
    syncMode: false,
    members: new Set(),
    pending: new Map(),
    clock: {
      timeStamp: 25260,
      speed: 1,
      running: false,
    },
    prng: genPrngPack(),
    linkVotes: new Map(),
    combats: new Map(),
    consentRequests: new Map(),
    syncRequests: new Map(),
    coopPending: new Map(),
    eventPending: new Map(),
    eventTimer: null,
    eventPickPending: new Map(),
    eventPickTimer: null,
    eventPickCooldownUntil: 0,
    inlineDomPending: new Map(),
    inlineDomTimer: null,
    inlineDomCooldownUntil: 0,
    clockTimer: null,
    createdAt: now(),
  };
  setupRoomClockTimer(room);
  rooms.set(code, room);
  if (msg.name) client.name = text(msg.name, 24) || client.name;
  addMember(room, client);
  send(client.ws, { t: "sys", text: "房间已创建，房间码 " + code });
  console.log(`[DoL-MP] room ${code} created by ${client.name}`);
}

function joinRoom(client, msg) {
  const code = text(msg.code, 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const room = rooms.get(code);
  if (!room) { send(client.ws, { t: "error", message: "房间不存在或已关闭" }); return; }
  if (client.roomCode === code) {
    send(client.ws, { t: "room_joined", code, host: client.isHost, needApproval: !!room.needApproval, players: roomPlayers(room), clock: room.clock, prng: room.prng, syncMode: !!room.syncMode });
    return;
  }
  if (client.roomCode) { send(client.ws, { t: "error", message: "请先离开当前房间" }); return; }
  if (room.members.size >= MAX_PLAYERS) { send(client.ws, { t: "error", message: "房间已满" }); return; }

  if (msg.name) client.name = text(msg.name, 24) || client.name;

  if (room.needApproval && room.hostId !== client.id) {
    const host = findClient(room.hostId);
    if (!host) { send(client.ws, { t: "error", message: "房主不在线，无法批准加入" }); return; }
    for (const [, req] of room.pending) {
      if (req.client === client) {
        send(client.ws, { t: "join_pending", code, reqId: req.reqId });
        return;
      }
    }
    const reqId = crypto.randomUUID();
    const entry = { reqId, client, name: client.name, at: now(), timer: null };
    room.pending.set(reqId, entry);
    send(host.ws, { t: "join_request", reqId, id: client.id, name: client.name });
    send(client.ws, { t: "join_pending", code, reqId });
    entry.timer = setTimeout(() => {
      if (room.pending.get(reqId) === entry) {
        room.pending.delete(reqId);
        send(client.ws, { t: "join_rejected", reason: "timeout" });
        const h = findClient(room.hostId);
        if (h) send(h.ws, { t: "join_cancelled", reqId, name: entry.name });
      }
    }, REQUEST_TTL_MS);
    return;
  }

  addMember(room, client);
}

function approveJoin(host, msg) {
  const room = roomOf(host);
  if (!room || room.hostId !== host.id) { send(host.ws, { t: "error", message: "只有房主可以批准" }); return; }
  const reqId = String(msg.reqId || "");
  const entry = room.pending.get(reqId);
  if (!entry) { send(host.ws, { t: "error", message: "申请已失效" }); return; }
  if (entry.timer) clearTimeout(entry.timer);
  room.pending.delete(reqId);

  const target = entry.client;
  if (clients.get(target.ws) !== target || target.ws.readyState !== target.ws.OPEN) {
    send(host.ws, { t: "error", message: "该玩家已离线" });
    return;
  }
  if (target.roomCode) { send(target.ws, { t: "join_rejected", reason: "busy" }); return; }
  if (room.members.size >= MAX_PLAYERS) { send(target.ws, { t: "join_rejected", reason: "full" }); return; }
  addMember(room, target);
}

function rejectJoin(host, msg) {
  const room = roomOf(host);
  if (!room || room.hostId !== host.id) { send(host.ws, { t: "error", message: "只有房主可以拒绝" }); return; }
  const reqId = String(msg.reqId || "");
  const entry = room.pending.get(reqId);
  if (!entry) { send(host.ws, { t: "error", message: "申请已失效" }); return; }
  if (entry.timer) clearTimeout(entry.timer);
  room.pending.delete(reqId);
  send(entry.client.ws, { t: "join_rejected", reason: "host" });
}

function setApproval(host, msg) {
  const room = roomOf(host);
  if (!room || room.hostId !== host.id) { send(host.ws, { t: "error", message: "只有房主可以修改设置" }); return; }
  room.needApproval = !!msg.needApproval;
  sendToRoom(room, { t: "room_settings", needApproval: room.needApproval });
  sys(room, "加入审批已" + (room.needApproval ? "开启" : "关闭"));
}

/* ---------------- 组队原生事件选项同步 ---------------- */

function groupedPeersInPassage(room, passage) {
  if (!room || !passage || !room.syncMode) return [];
  return [...room.members].filter((m) => m.passage === passage);
}

function clearVotesForClient(room, client) {
  if (!room || !room.linkVotes) return;
  for (const [pas, bucket] of room.linkVotes) {
    if (bucket.votes.has(client.id)) {
      bucket.votes.delete(client.id);
      checkAndCommitLinkVote(room, pas, false);
    }
  }
}

function handleLinkVote(client, msg) {
  const room = roomOf(client);
  if (!room) return;
  const passage = text(msg.passage || client.passage, 120);
  if (!passage) return;

  const peers = groupedPeersInPassage(room, passage);
  const linkIndex = clampNum(msg.linkIndex, 0, 500, 0);
  const linkText = text(msg.linkText, 120);
  const targetPassage = text(msg.targetPassage, 120);
  const linkKey = text(msg.linkKey || (targetPassage + "\u0001" + linkText), 240);
  const eventContext = validJsonSnapshot(msg.eventContext, 48000) || client.eventContext || null;

  if (peers.length <= 1 || !room.syncMode || msg.force) {
    room.prng = genPrngPack();
    const bucket = room.linkVotes.get(passage);
    if (bucket) {
      if (bucket.timer) clearTimeout(bucket.timer);
      room.linkVotes.delete(passage);
    }
    const targets = !room.syncMode ? [client] : (peers.length > 0 ? peers : [client]);
    for (const m of targets) {
      send(m.ws, {
        t: "link_commit",
        passage,
        linkIndex,
        linkKey,
        linkText,
        targetPassage,
        reason: "immediate",
        pickedBy: client.name,
        pickedById: client.id,
        eventContext,
        prng: room.prng,
      });
    }
    return;
  }

  let bucket = room.linkVotes.get(passage);
  if (!bucket) {
    bucket = {
      votes: new Map(),
      timer: setTimeout(() => {
        checkAndCommitLinkVote(room, passage, true);
      }, VOTE_TTL_MS),
    };
    room.linkVotes.set(passage, bucket);
  }

  bucket.votes.set(client.id, {
    id: client.id,
    name: client.name,
    linkIndex,
    linkKey,
    linkText,
    targetPassage,
    eventContext,
  });

  const voteList = [...bucket.votes.values()].map((v) => ({
    id: v.id,
    name: v.name,
    linkIndex: v.linkIndex,
    linkKey: v.linkKey,
    linkText: v.linkText,
    targetPassage: v.targetPassage,
  }));
  for (const m of peers) {
    send(m.ws, {
      t: "link_vote_status",
      passage,
      votes: voteList,
      totalNeeded: peers.length,
    });
  }

  checkAndCommitLinkVote(room, passage, false);
}

function checkAndCommitLinkVote(room, passage, isTimeout) {
  const bucket = room.linkVotes.get(passage);
  if (!bucket) return;
  const peers = groupedPeersInPassage(room, passage);
  if (peers.length === 0) {
    if (bucket.timer) clearTimeout(bucket.timer);
    room.linkVotes.delete(passage);
    return;
  }

  const allVoted = peers.every((m) => bucket.votes.has(m.id));
  if (!allVoted && !isTimeout) return;

  if (bucket.timer) clearTimeout(bucket.timer);
  room.linkVotes.delete(passage);

  const votesArr = [...bucket.votes.values()];
  if (votesArr.length === 0) return;

  const keyOf = (v) => v.linkKey || (v.targetPassage + "\u0001" + v.linkText);
  const firstKey = keyOf(votesArr[0]);
  const unanimous = votesArr.every((v) => keyOf(v) === firstKey);

  const winner = unanimous ? votesArr[0] : votesArr[crypto.randomInt(votesArr.length)];
  const reason = unanimous ? "unanimous" : "random";

  room.prng = genPrngPack();

  for (const m of peers) {
    send(m.ws, {
      t: "link_commit",
      passage,
      linkIndex: winner.linkIndex,
      linkKey: keyOf(winner),
      linkText: winner.linkText,
      targetPassage: winner.targetPassage,
      reason,
      pickedBy: winner.name,
      pickedById: winner.id,
      eventContext: winner.eventContext || null,
      votes: votesArr.map((v) => ({
        id: v.id,
        name: v.name,
        linkIndex: v.linkIndex,
        linkKey: keyOf(v),
        linkText: v.linkText,
        targetPassage: v.targetPassage,
      })),
      prng: room.prng,
    });
  }
}

/* ---------------- 原生遭遇战（PvP & 图论最短路支援 & 原版 NPC 完整保留 & 逃跑属性判定） ---------------- */

function initFighterState(c, ignorePainFull) {
  const st = c.stats || {};
  const hpMax = 275;
  const pain = clampNum(st.pain, 0, 100, 0);
  const hp = (!ignorePainFull && pain >= 100) ? 0 : Math.max(1, Math.round(hpMax * (1 - pain / 100)));
  const arMaxVar = clampNum(st.arousalmax, 1000, 20000, 10000);
  const arVar = clampNum(st.arousal, 0, arMaxVar, 0);
  const startAr = clampNum(Math.round((arVar / arMaxVar) * 500), 0, 495, 0);
  return {
    id: c.id,
    name: c.name,
    hp,
    hpMax,
    pain,
    arousal: startAr,
    arousalMax: 500,
    anger: 0,
    angerMax: 200,
    trust: 0,
    damageTaken: 0,
    arousalTaken: 0,
    lastSummary: "",
    lastActions: {},
    lastOrganStates: null,
  };
}

function serializeFighters(session) {
  const out = {};
  if (!session || !session.fighters) return out;
  for (const [id, f] of session.fighters) {
    out[id] = { ...f };
  }
  return out;
}

function removeClientFromCombatSessions(room, client) {
  if (!room || !room.combats) return;
  for (const [cid, session] of room.combats) {
    if (session.participants.has(client.id)) {
      session.participants.delete(client.id);
      session.readyTurns.delete(client.id);
      if (session.participants.size === 0) {
        if (session.turnTimer) clearTimeout(session.turnTimer);
        room.combats.delete(cid);
      } else {
        checkAndCommitCombatTurn(room, session, true);
      }
    }
  }
  client.combatId = "";
  client.inCombat = false;
}

function evaluateCombatActionDelta(actions, stats, organStates) {
  let dmg = 0;
  let arousalToTarget = 0;
  let arousalToSelf = 0;
  let angerDelta = 0;
  let trustDelta = 0;
  let alarm = 0;
  let positionChange = "";
  let escapeAttempt = false;
  let activeSexKind = ""; // "penis_to_vagina" | "penis_to_anus" | "vagina_to_penis" | "trib" | "oral_to_peer" | "kiss" | "handhold" | "caress"

  if (!actions || typeof actions !== "object") {
    return { dmg, arousalToTarget: 0, arousalToSelf: 0, angerDelta, trustDelta, alarm, positionChange, escapeAttempt, activeSexKind };
  }

  if (actions.bodyaction === "doggy" || actions.bodyaction === "missionary") {
    positionChange = actions.bodyaction;
  } else if (actions.bodyaction === "mp_escape") {
    escapeAttempt = true;
  }

  const physMult = clampNum(((stats && stats.physique) || 10000) / 10000, 0.75, 1.5, 1.0);
  const sedMult = clampNum(1 + (((stats && stats.seductionskill) || 200) / 1500), 1.0, 1.6, 1.1);

  const keys = ["leftaction", "rightaction", "feetaction", "mouthaction", "penisaction", "vaginaaction", "anusaction", "chestaction", "thighaction"];
  for (const k of keys) {
    const raw = actions[k];
    if (!raw || raw === "rest" || raw === 0 || raw === "none") continue;
    const s = String(raw);

    if (s === "lefthit" || s === "righthit" || s === "hit") {
      dmg += Math.round(30 * physMult);
      angerDelta += 14;
      trustDelta -= 8;
    } else if (s === "kick" || s === "feetkick") {
      dmg += Math.round(42 * physMult);
      angerDelta += 18;
      trustDelta -= 10;
    } else if (s === "bite") {
      dmg += Math.round(35 * physMult);
      angerDelta += 16;
      trustDelta -= 10;
    } else if (s === "spray") {
      dmg += 85;
      angerDelta += 25;
    } else if (s.includes("struggle") || s.includes("whack") || s === "headbutt" || s.startsWith("handpull") || s.startsWith("stopchoke")) {
      dmg += Math.round(16 * physMult);
      angerDelta += 8;
    } else if (s === "penistovagina" || s === "penisvaginafuck" || (k === "penisaction" && (s === "cooperate" || s === "vagina" || s === "penis"))) {
      activeSexKind = "penis_to_vagina";
      arousalToTarget += Math.round(75 * sedMult);
      arousalToSelf += 45;
      trustDelta += 10;
    } else if (s === "penistoanus" || s === "penisanusfuck" || (k === "penisaction" && s === "anus")) {
      activeSexKind = "penis_to_anus";
      arousalToTarget += Math.round(72 * sedMult);
      arousalToSelf += 45;
      trustDelta += 8;
    } else if (s === "vaginatopenis" || s === "vaginapenisfuck" || (k === "vaginaaction" && (s === "cooperate" || s === "penis" || s === "vagina"))) {
      activeSexKind = "vagina_to_penis";
      arousalToTarget += Math.round(75 * sedMult);
      arousalToSelf += 45;
      trustDelta += 10;
    } else if (s === "anustopenis" || (k === "anusaction" && (s === "cooperate" || s === "penis" || s === "anus"))) {
      activeSexKind = "anus_to_penis";
      arousalToTarget += Math.round(70 * sedMult);
      arousalToSelf += 42;
      trustDelta += 8;
    } else if (s === "vaginatovagina" || s === "trib") {
      activeSexKind = "trib";
      arousalToTarget += Math.round(68 * sedMult);
      arousalToSelf += 42;
      trustDelta += 10;
    } else if (s === "oral" || s === "suck" || s === "lick" || s === "peniskiss" || s === "penislick" || s === "vaginalick" || s === "vaginakiss") {
      if (!activeSexKind) activeSexKind = "oral_to_peer";
      arousalToTarget += Math.round(65 * sedMult);
      arousalToSelf += 20;
      trustDelta += 10;
    } else if (s === "kisslips" || s === "kiss" || s === "kissskin") {
      if (!activeSexKind) activeSexKind = "kiss";
      arousalToTarget += Math.round(45 * sedMult);
      arousalToSelf += 20;
      trustDelta += 12;
      angerDelta -= 5;
    } else if (s.includes("handhold")) {
      if (!activeSexKind) activeSexKind = "handhold";
      arousalToTarget += 20;
      arousalToSelf += 15;
      trustDelta += 14;
      angerDelta -= 6;
    } else if (
      s === "leftchest" || s === "rightchest" ||
      s === "leftplay" || s === "rightplay" ||
      s === "leftgrab" || s === "rightgrab" ||
      s === "leftstroke" || s === "rightstroke" ||
      s === "leftwork" || s === "rightwork" ||
      s === "leftclit" || s === "rightclit" ||
      s === "handedge" || s === "grab" || s === "vaginagrab" || s === "grabrub" || s === "vaginagrabrub" ||
      s === "cooperate" || s === "rub" || s === "fondle" || s === "caress"
    ) {
      if (!activeSexKind) activeSexKind = "caress";
      arousalToTarget += Math.round(55 * sedMult);
      arousalToSelf += 20;
      trustDelta += 10;
      angerDelta -= 5;
    } else if (s === "scream") {
      alarm = 1;
      angerDelta += 10;
    } else if (s === "plead" || s === "ask" || s === "apologise") {
      trustDelta += 12;
      angerDelta -= 10;
    }
  }

  // 若 organStates 中已处于持续插入状态且未脱出，保持对应的性交同步类型
  if (!activeSexKind && organStates && typeof organStates === "object") {
    if (organStates.penisstate === "penetrated" || organStates.penisuse === "vagina") {
      activeSexKind = "penis_to_vagina";
      arousalToTarget += 55;
      arousalToSelf += 40;
    } else if (organStates.penisstate === "otheranus" || organStates.penisuse === "anus") {
      activeSexKind = "penis_to_anus";
      arousalToTarget += 55;
      arousalToSelf += 40;
    } else if (organStates.vaginastate === "penetrated") {
      activeSexKind = "vagina_to_penis";
      arousalToTarget += 55;
      arousalToSelf += 40;
    } else if (organStates.anusstate === "penetrated") {
      activeSexKind = "anus_to_penis";
      arousalToTarget += 55;
      arousalToSelf += 40;
    }
  }

  return { dmg, arousalToTarget, arousalToSelf, angerDelta, trustDelta, alarm, positionChange, escapeAttempt, activeSexKind };
}

function handleAttackRequest(client, msg) {
  const room = roomOf(client);
  if (!room) { send(client.ws, { t: "error", message: "先加入房间" }); return; }
  const target = findClient(msg.to);
  if (!target || target.roomCode !== room.code) { send(client.ws, { t: "error", message: "对方不在同一房间" }); return; }
  if (msg.stats) {
    const st = validStats(msg.stats);
    if (st) client.stats = st;
  }

  if (msg.consensual) {
    if (target.inCombat || target.combatId) {
      send(client.ws, { t: "consensual_declined", reason: "busy", byName: target.name });
      return;
    }
    if (target.prefs && target.prefs.allowLewd === false) {
      send(client.ws, { t: "consensual_declined", reason: "prefs", byName: target.name });
      return;
    }
    if (!room.consentRequests) room.consentRequests = new Map();
    for (const [, old] of room.consentRequests) {
      if (old.fromId === client.id && old.toId === target.id) {
        send(target.ws, { t: "consensual_request", reqId: old.reqId, fromId: client.id, fromName: client.name, kind: "consensual" });
        send(client.ws, { t: "consensual_pending", reqId: old.reqId, toId: target.id, toName: target.name });
        return;
      }
    }
    const reqId = crypto.randomUUID();
    const entry = { reqId, fromId: client.id, toId: target.id, createdAt: now(), timer: null };
    room.consentRequests.set(reqId, entry);
    send(target.ws, { t: "consensual_request", reqId, fromId: client.id, fromName: client.name, kind: "consensual" });
    send(client.ws, { t: "consensual_pending", reqId, toId: target.id, toName: target.name });
    entry.timer = setTimeout(() => {
      if (room.consentRequests && room.consentRequests.get(reqId) === entry) {
        room.consentRequests.delete(reqId);
        send(client.ws, { t: "consensual_declined", reqId, byName: target.name, reason: "timeout" });
      }
    }, CONSENT_TTL_MS);
    return;
  }

  startPvpCombat(client, target, false, room);
}

function handleConsensualAnswer(client, msg, accept) {
  const room = roomOf(client);
  if (!room) return;
  const reqId = String(msg.reqId || "");
  const entry = room.consentRequests && room.consentRequests.get(reqId);
  if (!entry || entry.toId !== client.id) {
    send(client.ws, { t: "error", message: "邀请已失效" });
    return;
  }
  if (entry.timer) clearTimeout(entry.timer);
  room.consentRequests.delete(reqId);
  const from = findClient(entry.fromId);
  if (!from || from.roomCode !== room.code) {
    send(client.ws, { t: "error", message: "对方已离线" });
    return;
  }
  if (!accept) {
    send(from.ws, { t: "consensual_declined", reqId, byName: client.name, reason: "declined" });
    return;
  }
  if (client.inCombat || client.combatId || from.inCombat || from.combatId) {
    send(from.ws, { t: "consensual_declined", reqId, byName: client.name, reason: "busy" });
    return;
  }
  startPvpCombat(from, client, true, room);
}

function startPvpCombat(attacker, defender, consensual, room) {
  const client = attacker;
  const target = defender;
  removeClientFromCombatSessions(room, client);
  removeClientFromCombatSessions(room, target);

  const returnPassage = safeReturnPassage(client.combatReturnPassage || client.passage, "Orphanage");
  const targetReturnPassage = safeReturnPassage(target.combatReturnPassage || target.passage, returnPassage);

  const combatId = crypto.randomUUID();
  const session = {
    combatId,
    mode: "pvp",
    consensual: !!consensual,
    attackerId: client.id,
    defenderId: target.id,
    participants: new Set([client.id, target.id]),
    fighters: new Map([
      [client.id, initFighterState(client)],
      [target.id, initFighterState(target)],
    ]),
    readyTurns: new Map(),
    turnNumber: 1,
    lockedTargetId: "",
    sharedEnemy: null,
    turnTimer: null,
  };
  room.combats.set(combatId, session);

  room.prng = genPrngPack();
  client.inCombat = true;
  client.combatId = combatId;
  target.inCombat = true;
  target.combatId = combatId;

  const fightersObj = serializeFighters(session);
  const fClient = fightersObj[client.id];
  const fTarget = fightersObj[target.id];
  let instantFinish = false;
  let clientOutcome = "";
  let targetOutcome = "";
  if (fClient && fClient.hp <= 0) {
    instantFinish = true;
    clientOutcome = "me_pain_full";
    targetOutcome = "peer_down";
  } else if (fTarget && fTarget.hp <= 0) {
    instantFinish = true;
    clientOutcome = "peer_down";
    targetOutcome = "me_pain_full";
  }

  send(client.ws, {
    t: "pvp_combat_start",
    combatId,
    mode: "pvp",
    role: "attacker",
    returnPassage,
    opponent: publicPlayer(target),
    fighters: fightersObj,
    consensual: !!consensual,
    instantFinish,
    outcome: clientOutcome,
    prng: room.prng,
  });
  send(target.ws, {
    t: "pvp_combat_start",
    combatId,
    mode: "pvp",
    role: "defender",
    returnPassage: targetReturnPassage,
    opponent: publicPlayer(client),
    fighters: fightersObj,
    consensual: !!consensual,
    instantFinish,
    outcome: targetOutcome,
    prng: room.prng,
  });
  broadcastRoster(room);
  sys(room, consensual
    ? `${client.name} 与 ${target.name} 开始了亲密互动`
    : `${client.name} 对 ${target.name} 发起了袭击`);
}

function handleAssistCombat(client, msg) {
  const room = roomOf(client);
  if (!room) { send(client.ws, { t: "error", message: "先加入房间" }); return; }
  const target = findClient(msg.to);
  if (!target || target.roomCode !== room.code) { send(client.ws, { t: "error", message: "对方不在同一房间" }); return; }
  if (!target.inCombat && !target.combatId) {
    send(client.ws, { t: "error", message: "对方当前已不在遭遇战中" });
    return;
  }

  if (msg.stats) {
    const st = validStats(msg.stats);
    if (st) client.stats = st;
  }
  if (Array.isArray(msg.recentPassages)) {
    client.recentPassages = msg.recentPassages.slice(-10).map((x) => text(x, 120)).filter(Boolean);
  }

  const routeInfo = calcShortestAssistTravel(client, target);

  let session = target.combatId ? room.combats.get(target.combatId) : null;
  const cInfo = normalizeCombatInfo(target.combatInfo);
  if (!session) {
    const combatId = crypto.randomUUID();
    session = {
      combatId,
      mode: "coop_pve",
      consensual: false,
      participants: new Set([target.id, client.id]),
      fighters: new Map([
        [target.id, initFighterState(target, true)],
        [client.id, initFighterState(client, true)],
      ]),
      readyTurns: new Map(),
      turnNumber: 1,
      lockedTargetId: "",
      sharedEnemy: {
        name: cInfo.enemyName || "袭击者",
        pronoun: cInfo.enemyPronoun,
        gender: cInfo.enemyGender,
        hp: cInfo.enemyHealth,
        hpMax: cInfo.enemyHealthMax,
        arousal: cInfo.enemyArousal,
        arousalMax: cInfo.enemyArousalMax,
        anger: 0,
        angerMax: 200,
        trust: 0,
        npcSnapshot: cInfo.npcSnapshot || null,
        origPassage: cInfo.origPassage || target.passage || "",
        wasTutorial: !!cInfo.wasTutorial,
      },
      turnTimer: null,
    };
    room.combats.set(combatId, session);
    target.combatId = combatId;
  } else {
    session.mode = "coop_pve";
    session.participants.add(client.id);
    if (!session.fighters.has(client.id)) {
      session.fighters.set(client.id, initFighterState(client, true));
    }
    if (!session.sharedEnemy) {
      session.sharedEnemy = {
        name: cInfo.enemyName || "袭击者",
        pronoun: cInfo.enemyPronoun,
        gender: cInfo.enemyGender,
        hp: cInfo.enemyHealth,
        hpMax: cInfo.enemyHealthMax,
        arousal: cInfo.enemyArousal,
        arousalMax: cInfo.enemyArousalMax,
        anger: 0,
        angerMax: 200,
        trust: 0,
        npcSnapshot: cInfo.npcSnapshot || null,
        origPassage: cInfo.origPassage || target.passage || "",
        wasTutorial: !!cInfo.wasTutorial,
      };
    } else if (!session.sharedEnemy.npcSnapshot && cInfo.npcSnapshot) {
      session.sharedEnemy.npcSnapshot = cInfo.npcSnapshot;
    }
  }

  client.inCombat = true;
  client.combatId = session.combatId;
  if (msg.returnPassage) {
    client.combatReturnPassage = safeReturnPassage(msg.returnPassage, client.combatReturnPassage || "");
  }

  const pArr = [...session.participants];
  session.lockedTargetId = pArr[crypto.randomInt(pArr.length)];
  const lockedClient = findClient(session.lockedTargetId);
  const lockedTargetName = lockedClient ? lockedClient.name : target.name;

  room.prng = genPrngPack();
  const fightersObj = serializeFighters(session);

  for (const pid of pArr) {
    const member = findClient(pid);
    if (!member) continue;
    const peerId = pArr.find((x) => x !== pid) || target.id;
    const peerClient = findClient(peerId) || target;
    send(member.ws, {
      t: "coop_combat_joined",
      combatId: session.combatId,
      mode: "coop_pve",
      helperId: client.id,
      helperName: client.name,
      hostPlayerId: target.id,
      hostPlayerName: target.name,
      timeCostSeconds: routeInfo.seconds,
      timeCostMinutes: routeInfo.minutes,
      walkMinutes: routeInfo.walkMinutes,
      transportMethod: routeInfo.method,
      busFare: routeInfo.busFare,
      routeSummary: routeInfo.routeSummary,
      lockedTargetId: session.lockedTargetId,
      lockedTargetName,
      sharedEnemy: session.sharedEnemy,
      fighters: fightersObj,
      opponent: publicPlayer(peerClient),
      returnPassage: safeReturnPassage(target.combatReturnPassage || member.combatReturnPassage, target.passage || member.passage),
      prng: room.prng,
    });
  }

  broadcastRoster(room);
  sys(room, `${client.name} 经由 ${routeInfo.routeSummary} 耗时 ${routeInfo.minutes} 分钟赶到现场，加入 ${target.name} 的遭遇战`);
}

/* ---------------- 组队同步时遭遇战自动合流为 2v1 ---------------- */

function safeReturnPassage(value, fallback) {
  const bad = new Set(["MP Native Combat", "MP Native Combat Finish", "Start", "Start2", "Orphanage Intro", "Tutorial", ""]);
  const isBad = (p) => !p || bad.has(p) || p.startsWith("MP ") || p.indexOf("MP Player Interact") === 0;
  const p = text(value, 120);
  if (!isBad(p)) return p;
  const f = text(fallback, 120);
  if (!isBad(f)) return f;
  return "Orphanage";
}

function normalizeCombatInfo(info) {
  const i = (info && typeof info === "object") ? info : {};
  return {
    enemyName: text(i.enemyName, 60) || "袭击者",
    enemyPronoun: i.enemyPronoun === "f" ? "f" : "m",
    enemyGender: ["m", "f", "h"].includes(i.enemyGender) ? i.enemyGender : "m",
    enemyHealth: clampNum(i.enemyHealth, 0, 2000, 275),
    enemyHealthMax: clampNum(i.enemyHealthMax, 1, 2000, 275),
    enemyArousal: clampNum(i.enemyArousal, 0, 2000, 100),
    enemyArousalMax: clampNum(i.enemyArousalMax, 100, 2000, 500),
    npcSnapshot: validJsonSnapshot(i.npcSnapshot, 48000) || null,
    origPassage: text(i.origPassage, 120) || "",
    wasTutorial: !!i.wasTutorial,
  };
}

function clearCoopPending(room, client) {
  if (!room || !room.coopPending || !client) return;
  const entry = room.coopPending.get(client.id);
  if (entry) {
    if (entry.timer) clearTimeout(entry.timer);
    if (entry.pullTimer) clearTimeout(entry.pullTimer);
    room.coopPending.delete(client.id);
  }
}

function handleCombatEnter(client, msg) {
  const room = roomOf(client);
  if (!room) return;
  if (client.combatId && room.combats.has(client.combatId)) return;

  const passage = text(msg.passage || client.passage, 120);
  if (!passage) return;
  const info = normalizeCombatInfo(msg.combatInfo);
  if (!info.origPassage) info.origPassage = passage;
  if (passage === "Tutorial") info.wasTutorial = true;

  client.inCombat = true;
  client.combatInfo = info;
  if (passage) client.passage = passage;
  if (msg.returnPassage) {
    client.combatReturnPassage = safeReturnPassage(msg.returnPassage, client.combatReturnPassage || "");
  }
  if (Array.isArray(msg.recentPassages)) {
    client.recentPassages = msg.recentPassages.slice(-10).map((x) => text(x, 120)).filter(Boolean);
  }
  client.updatedAt = now();

  if (!room.syncMode) return;

  const at = now();
  let partner = null;
  for (const [pid, entry] of room.coopPending) {
    if (pid === client.id) continue;
    const m = findClient(pid);
    if (!m || m.roomCode !== room.code) continue;
    if (!m.inCombat) continue;
    if (m.combatId && room.combats.has(m.combatId)) continue;
    if (at - entry.at > COOP_MATCH_WINDOW_MS) continue;
    partner = m;
    break;
  }

  if (partner) {
    clearCoopPending(room, partner);
    clearCoopPending(room, client);
    startAutoCoopCombat(partner, client, room);
  } else {
    clearCoopPending(room, client);
    const entry = { at, passage, timer: null, pullTimer: null };
    entry.pullTimer = setTimeout(() => {
      if (!room.syncMode || !room.coopPending || room.coopPending.get(client.id) !== entry) return;
      if (!client.inCombat || (client.combatId && room.combats.has(client.combatId))) return;
      const idleMate = [...room.members].find((m) =>
        m.id !== client.id &&
        m.roomCode === room.code &&
        (!m.combatId || !room.combats.has(m.combatId))
      );
      if (idleMate) {
        if (!idleMate.combatReturnPassage) {
          idleMate.combatReturnPassage = safeReturnPassage(client.combatReturnPassage || idleMate.passage, "Orphanage");
        }
        clearCoopPending(room, idleMate);
        clearCoopPending(room, client);
        startAutoCoopCombat(client, idleMate, room);
      }
    }, COOP_AUTO_PULL_MS);

    entry.timer = setTimeout(() => {
      if (room.coopPending && room.coopPending.get(client.id) === entry) {
        room.coopPending.delete(client.id);
      }
    }, COOP_MATCH_WINDOW_MS + 1000);
    room.coopPending.set(client.id, entry);
  }
}

function handleCombatExit(client) {
  const room = roomOf(client);
  if (!room) return;
  clearCoopPending(room, client);
}

/* ---------------- 突发事件仲裁：任意一人触发随机事件，全队统一到同一个事件 ---------------- */

function handleEventTrigger(client, msg) {
  const room = roomOf(client);
  if (!room || !room.syncMode) return;
  const passage = text(msg.passage || client.passage, 120);
  if (!passage) return;
  client.passage = passage;
  if (msg.phase !== undefined) client.phase = msg.phase;
  client.inCombat = !!msg.inCombat;
  const eventContext = validJsonSnapshot(msg.eventContext, 48000) || client.eventContext || null;
  if (eventContext) client.eventContext = eventContext;

  room.eventPending.set(client.id, {
    clientId: client.id,
    name: client.name,
    passage,
    phase: msg.phase,
    eventContext,
    priority: clampNum(msg.priority, 1, 2, 1),
    inCombat: !!msg.inCombat,
    at: now(),
  });
  if (!room.eventTimer) {
    room.eventTimer = setTimeout(() => resolveEventArbitration(room), EVENT_ARBITRATION_MS);
  }
}

function handleEventPick(client, msg) {
  const room = roomOf(client);
  if (!room || !room.syncMode) return;
  if (now() < (room.eventPickCooldownUntil || 0)) return;
  const name = text(msg.name || "inline_event", 120);
  const content = String(msg.content || "").slice(0, 32000);
  const passage = text(msg.passage || client.passage, 120);
  if (!passage) return;
  const eventContext = validJsonSnapshot(msg.eventContext, 48000) || client.eventContext || null;
  const prng = (msg.prng && typeof msg.prng === "object" && msg.prng.seedStr) ? msg.prng : null;

  room.eventPickPending.set(client.id, {
    clientId: client.id,
    playerName: client.name,
    name,
    content,
    passage,
    prng,
    eventContext,
    at: now(),
  });
  if (!room.eventPickTimer) {
    room.eventPickTimer = setTimeout(() => resolveEventPick(room), EVENT_ARBITRATION_MS);
  }
}

function resolveEventPick(room) {
  if (!room) return;
  if (room.eventPickTimer) {
    clearTimeout(room.eventPickTimer);
    room.eventPickTimer = null;
  }
  const entries = [...room.eventPickPending.values()].filter((e) => {
    const c = findClient(e.clientId);
    return c && c.roomCode === room.code;
  });
  room.eventPickPending.clear();
  if (!room.syncMode || entries.length === 0) return;

  let winner;
  if (entries.length === 1) {
    winner = entries[0];
  } else if (entries.length <= 2) {
    winner = entries.find((e) => e.clientId === room.hostId) || entries[0];
  } else {
    winner = entries[crypto.randomInt(entries.length)];
  }

  room.eventPickCooldownUntil = now() + 1200;
  const syncPrng = winner.prng || genPrngPack();
  room.prng = syncPrng;

  for (const c of room.members) {
    if (c.id === winner.clientId) continue;
    send(c.ws, {
      t: "sync_event",
      name: winner.name,
      content: winner.content || "",
      passage: winner.passage,
      prng: syncPrng,
      eventContext: winner.eventContext || null,
      fromId: winner.clientId,
      fromName: winner.playerName,
      reason: "event_pick",
    });
  }
  sys(room, `已同步至 ${winner.playerName} 触发的事件`);
}

function handleInlineDomEvent(client, msg) {
  const room = roomOf(client);
  if (!room || !room.syncMode) return;
  if (now() < (room.inlineDomCooldownUntil || 0)) return;
  const passage = text(msg.passage || client.passage, 120);
  const html = String(msg.html || "").slice(0, 64000);
  if (!passage || !html) return;
  const eventContext = validJsonSnapshot(msg.eventContext, 48000) || client.eventContext || null;

  if (!room.inlineDomPending) room.inlineDomPending = new Map();
  room.inlineDomPending.set(client.id, {
    clientId: client.id,
    playerName: client.name,
    passage,
    html,
    eventContext,
    at: now(),
  });
  if (!room.inlineDomTimer) {
    room.inlineDomTimer = setTimeout(() => resolveInlineDomEvent(room), EVENT_ARBITRATION_MS);
  }
}

function resolveInlineDomEvent(room) {
  if (!room) return;
  if (room.inlineDomTimer) {
    clearTimeout(room.inlineDomTimer);
    room.inlineDomTimer = null;
  }
  if (!room.inlineDomPending) return;
  const entries = [...room.inlineDomPending.values()].filter((e) => {
    const c = findClient(e.clientId);
    return c && c.roomCode === room.code;
  });
  room.inlineDomPending.clear();
  if (!room.syncMode || entries.length === 0) return;

  let winner;
  if (entries.length === 1) {
    winner = entries[0];
  } else if (entries.length <= 2) {
    winner = entries.find((e) => e.clientId === room.hostId) || entries[0];
  } else {
    winner = entries[crypto.randomInt(entries.length)];
  }

  room.inlineDomCooldownUntil = now() + 1200;
  for (const c of room.members) {
    if (c.id === winner.clientId) continue;
    send(c.ws, {
      t: "sync_inline_dom",
      passage: winner.passage,
      html: winner.html,
      eventContext: winner.eventContext || null,
      fromId: winner.clientId,
      fromName: winner.playerName,
    });
  }
}

function resolveEventArbitration(room) {
  if (!room) return;
  if (room.eventTimer) {
    clearTimeout(room.eventTimer);
    room.eventTimer = null;
  }
  const entries = [...room.eventPending.values()].filter((e) => {
    const c = findClient(e.clientId);
    return c && c.roomCode === room.code;
  });
  room.eventPending.clear();
  if (!room.syncMode || entries.length === 0) return;

  const maxP = Math.max(...entries.map((e) => e.priority || 1));
  const top = entries.filter((e) => (e.priority || 1) === maxP);
  let winner;
  if (top.length === 1) {
    winner = top[0];
  } else if (entries.length <= 2) {
    winner = top.find((e) => e.clientId === room.hostId) || top[0];
  } else {
    winner = top[crypto.randomInt(top.length)];
  }

  if (winner.inCombat) {
    return;
  }

  room.prng = genPrngPack();
  for (const c of room.members) {
    if (c.id === winner.clientId) continue;
    send(c.ws, {
      t: "sync_jump",
      fromId: winner.clientId,
      fromName: winner.name,
      passage: winner.passage,
      phase: winner.phase,
      eventContext: winner.eventContext || null,
      prng: room.prng,
      inCombat: false,
      forceEvent: true,
      reason: "event",
    });
  }
  sys(room, `${winner.name} 触发了事件，已同步`);
}

function startAutoCoopCombat(host, helper, room) {
  if (!host || !helper || !room) return;
  if (host.combatId && room.combats.has(host.combatId)) return;
  if (helper.combatId && room.combats.has(helper.combatId)) return;

  const cInfo = normalizeCombatInfo(host.combatInfo);
  const combatId = crypto.randomUUID();
  const participants = new Set([host.id, helper.id]);
  const session = {
    combatId,
    mode: "coop_pve",
    consensual: false,
    participants,
    fighters: new Map([
      [host.id, initFighterState(host, true)],
      [helper.id, initFighterState(helper, true)],
    ]),
    readyTurns: new Map(),
    turnNumber: 1,
    lockedTargetId: "",
    sharedEnemy: {
      name: cInfo.enemyName || "袭击者",
      pronoun: cInfo.enemyPronoun,
      gender: cInfo.enemyGender,
      hp: cInfo.enemyHealth,
      hpMax: Math.max(cInfo.enemyHealthMax, cInfo.enemyHealth),
      arousal: cInfo.enemyArousal,
      arousalMax: cInfo.enemyArousalMax,
      anger: 0,
      angerMax: 200,
      trust: 0,
      npcSnapshot: cInfo.npcSnapshot || null,
      origPassage: cInfo.origPassage || host.passage || "",
      wasTutorial: !!cInfo.wasTutorial || host.passage === "Tutorial",
    },
    turnTimer: null,
  };
  room.combats.set(combatId, session);
  host.combatId = combatId;
  helper.combatId = combatId;
  host.inCombat = true;
  helper.inCombat = true;

  const pArr = [host.id, helper.id];
  session.lockedTargetId = pArr[crypto.randomInt(pArr.length)];
  const lockedClient = findClient(session.lockedTargetId);
  const lockedTargetName = lockedClient ? lockedClient.name : host.name;

  room.prng = genPrngPack();
  const fightersObj = serializeFighters(session);

  for (const [member, peer] of [[host, helper], [helper, host]]) {
    send(member.ws, {
      t: "coop_combat_joined",
      combatId,
      mode: "coop_pve",
      auto: true,
      helperId: helper.id,
      helperName: helper.name,
      hostPlayerId: host.id,
      hostPlayerName: host.name,
      timeCostSeconds: 0,
      timeCostMinutes: 0,
      walkMinutes: 0,
      transportMethod: "同行切入",
      busFare: 0,
      routeSummary: "同行迎敌",
      lockedTargetId: session.lockedTargetId,
      lockedTargetName,
      sharedEnemy: session.sharedEnemy,
      fighters: fightersObj,
      opponent: publicPlayer(peer),
      returnPassage: safeReturnPassage(host.combatReturnPassage || member.combatReturnPassage, host.passage || member.passage),
      prng: room.prng,
    });
  }

  broadcastRoster(room);
  sys(room, `${host.name} 与 ${helper.name} 共同进入遭遇战`);
}

function handleCombatSyncInit(client, msg) {
  const room = roomOf(client);
  if (!room) return;
  if (msg.stats) {
    const st = validStats(msg.stats);
    if (st) client.stats = st;
  }
  const session = (msg.combatId && room.combats.get(msg.combatId)) || (client.combatId && room.combats.get(client.combatId));
  if (!session) return;

  session.fighters.set(client.id, initFighterState(client, session.mode === "coop_pve"));
  const fightersObj = serializeFighters(session);
  const activeIds = [...session.participants];

  let instantFinish = false;
  const outcomes = {};
  if (activeIds.length >= 2) {
    const [idA, idB] = activeIds;
    const fA = fightersObj[idA];
    const fB = fightersObj[idB];
    if (fA && fA.hp <= 0) {
      instantFinish = true;
      outcomes[idA] = "me_pain_full";
      outcomes[idB] = "peer_down";
    } else if (fB && fB.hp <= 0) {
      instantFinish = true;
      outcomes[idB] = "me_pain_full";
      outcomes[idA] = "peer_down";
    }
  }

  for (const pid of activeIds) {
    const m = findClient(pid);
    if (m) {
      send(m.ws, {
        t: "combat_init_updated",
        combatId: session.combatId,
        fighters: fightersObj,
        instantFinish,
        outcome: outcomes[pid] || "",
      });
    }
  }
}

function handleCombatTurn(client, msg) {
  const room = roomOf(client);
  if (!room) return;

  const snap = validJsonSnapshot(msg.combatSnapshot, 32000);
  if (snap) client.combatSnapshot = snap;
  if (msg.stats) {
    const st = validStats(msg.stats);
    if (st) client.stats = st;
  }

  let session = (msg.combatId && room.combats.get(msg.combatId)) || (client.combatId && room.combats.get(client.combatId));

  if (!session && msg.to) {
    const target = findClient(msg.to);
    if (target && target.combatId && room.combats.has(target.combatId)) {
      session = room.combats.get(target.combatId);
      session.participants.add(client.id);
      if (!session.fighters.has(client.id)) session.fighters.set(client.id, initFighterState(client, session.mode === "coop_pve"));
      client.combatId = session.combatId;
    }
  }

  const organStates = validJsonSnapshot(msg.organStates, 4000) || null;

  if (!session) {
    room.prng = genPrngPack();
    const payload = {
      t: "combat_peer_turn",
      fromId: client.id,
      fromName: client.name,
      passage: client.passage,
      actions: msg.actions || {},
      organStates,
      summary: text(msg.summary, 240),
      enemyhealth: msg.enemyhealth,
      enemyarousal: msg.enemyarousal,
      enemyanger: msg.enemyanger,
      enemytrust: msg.enemytrust,
      alarm: msg.alarm,
      position: text(msg.position, 20),
      combatSnapshot: client.combatSnapshot,
      prng: room.prng,
    };
    if (msg.to) {
      const target = findClient(msg.to);
      if (target && target.roomCode === room.code) send(target.ws, payload);
    }
    return;
  }

  session.readyTurns.set(client.id, {
    fromId: client.id,
    fromName: client.name,
    actions: msg.actions || {},
    organStates,
    summary: text(msg.summary, 240) || `${client.name} 执行了行动`,
    combatSnapshot: client.combatSnapshot,
  });

  const activeIds = [...session.participants].filter((pid) => {
    const c = findClient(pid);
    return c && c.roomCode === room.code;
  });

  const readyIds = activeIds.filter((pid) => session.readyTurns.has(pid));
  const readyNames = readyIds.map((pid) => findClient(pid)?.name || "玩家");

  for (const pid of activeIds) {
    const m = findClient(pid);
    if (m) {
      send(m.ws, {
        t: "combat_turn_status",
        combatId: session.combatId,
        turnNumber: session.turnNumber,
        readyIds,
        readyNames,
        totalNeeded: activeIds.length,
      });
    }
  }

  if (!session.turnTimer) {
    session.turnTimer = setTimeout(() => {
      checkAndCommitCombatTurn(room, session, true);
    }, COMBAT_TURN_TIMEOUT_MS);
  }

  checkAndCommitCombatTurn(room, session, !!msg.force);
}

function checkAndCommitCombatTurn(room, session, forceCommit) {
  if (!room || !session) return;
  const activeIds = [...session.participants].filter((pid) => {
    const c = findClient(pid);
    return c && c.roomCode === room.code;
  });
  if (activeIds.length === 0) {
    if (session.turnTimer) clearTimeout(session.turnTimer);
    room.combats.delete(session.combatId);
    return;
  }

  const allReady = activeIds.every((pid) => session.readyTurns.has(pid));
  if (!allReady && !forceCommit) return;

  if (session.turnTimer) {
    clearTimeout(session.turnTimer);
    session.turnTimer = null;
  }

  for (const [, f] of session.fighters) {
    f.damageTaken = 0;
    f.arousalTaken = 0;
  }

  let nextPosition = "";
  const summaries = [];
  const escapeNotifications = {};
  let escapedByPid = "";

  if (session.mode === "coop_pve" && session.sharedEnemy) {
    const enemy = session.sharedEnemy;
    for (const pid of activeIds) {
      const c = findClient(pid);
      const f = session.fighters.get(pid) || initFighterState(c || { id: pid, name: "玩家" }, true);
      const turn = session.readyTurns.get(pid) || { actions: {}, organStates: null, summary: `${f.name} 保持戒备` };
      const delta = evaluateCombatActionDelta(turn.actions, c && c.stats, turn.organStates);

      enemy.hp = Math.max(0, enemy.hp - delta.dmg);
      enemy.arousal = Math.min(enemy.arousalMax, enemy.arousal + delta.arousalToTarget);
      enemy.anger = Math.max(0, Math.min(enemy.angerMax, enemy.anger + delta.angerDelta));
      enemy.trust = Math.max(-100, Math.min(200, enemy.trust + delta.trustDelta));

      f.arousal = Math.min(f.arousalMax, f.arousal + delta.arousalToSelf);
      f.arousalTaken += delta.arousalToSelf;
      f.lastSummary = turn.summary;
      f.lastActions = turn.actions;
      f.lastOrganStates = turn.organStates;
      if (delta.positionChange) nextPosition = delta.positionChange;
      summaries.push(turn.summary);
    }

    const curLocked = session.fighters.get(session.lockedTargetId);
    if (curLocked && enemy.hp > 0 && enemy.arousal < enemy.arousalMax) {
      const enemyDmg = 18;
      const enemyAr = 35;
      curLocked.hp = Math.max(0, curLocked.hp - enemyDmg);
      curLocked.damageTaken += enemyDmg;
      curLocked.arousal = Math.min(curLocked.arousalMax, curLocked.arousal + enemyAr);
      curLocked.arousalTaken += enemyAr;
    }

    session.lockedTargetId = activeIds[crypto.randomInt(activeIds.length)];
  } else {
    for (const pid of activeIds) {
      const c = findClient(pid);
      const f = session.fighters.get(pid) || initFighterState(c || { id: pid, name: "玩家" });
      const oppId = activeIds.find((x) => x !== pid) || pid;
      const oppClient = findClient(oppId);
      const opp = session.fighters.get(oppId) || initFighterState(oppClient || { id: oppId, name: "对方" });

      const turn = session.readyTurns.get(pid) || { actions: {}, organStates: null, summary: `${f.name} 保持防守` };
      const oppTurn = session.readyTurns.get(oppId) || { actions: {}, organStates: null };
      const delta = evaluateCombatActionDelta(turn.actions, c && c.stats, turn.organStates);
      const oppDelta = evaluateCombatActionDelta(oppTurn.actions, oppClient && oppClient.stats, oppTurn.organStates);

      if (delta.escapeAttempt && !escapedByPid) {
        const mySt = (c && c.stats) || {};
        const oppSt = (oppClient && oppClient.stats) || {};
        const myPhys = Number(mySt.physique) || 10000;
        const myWill = Number(mySt.willpower) || 500;
        const oppPhys = Number(oppSt.physique) || 10000;
        const oppWill = Number(oppSt.willpower) || 500;

        const myScore = (myPhys / 200) + (myWill / 15) - ((f.hpMax - f.hp) * 0.25) - (f.arousal * 0.05);
        const oppPinBonus = oppDelta.activeSexKind ? 18 : (oppDelta.dmg > 0 ? 10 : -12);
        const oppScore = (oppPhys / 200) + (oppWill / 18) + oppPinBonus;
        const chance = Math.max(12, Math.min(88, Math.round(50 + (myScore - oppScore))));
        const roll = crypto.randomInt(1, 101);
        if (roll <= chance) {
          escapedByPid = pid;
          escapeNotifications[pid] = `你凭借体能与意志力挣脱了 ${opp.name} 的钳制，转身逃离了现场。`;
          escapeNotifications[oppId] = `${f.name} 猛地发力通过了体能判定，挣脱你的钳制逃离了现场。`;
        } else {
          escapeNotifications[pid] = `你试图挣脱逃跑，但在体能与意志对抗中落入下风，被 ${opp.name} 死死按住。`;
          escapeNotifications[oppId] = `${f.name} 试图挣脱逃跑，但被你凭借体能优势死死压制住了。`;
        }
      }

      if (oppId !== pid && !escapedByPid) {
        opp.hp = Math.max(0, opp.hp - delta.dmg);
        opp.damageTaken += delta.dmg;
        opp.arousal = Math.min(opp.arousalMax, opp.arousal + delta.arousalToTarget);
        opp.arousalTaken += delta.arousalToTarget;
      }

      f.arousal = Math.min(f.arousalMax, f.arousal + delta.arousalToSelf);
      f.arousalTaken += delta.arousalToSelf;
      f.anger = Math.max(0, Math.min(f.angerMax, f.anger + delta.angerDelta));
      f.trust = Math.max(-100, Math.min(200, f.trust + delta.trustDelta));
      f.lastSummary = turn.summary;
      f.lastActions = turn.actions;
      f.lastOrganStates = turn.organStates;
      f.lastActiveSexKind = delta.activeSexKind || "";
      if (delta.positionChange) nextPosition = delta.positionChange;
      summaries.push(turn.summary);
    }
  }

  let finished = false;
  const outcomes = {};
  if (escapedByPid) {
    finished = true;
    for (const pid of activeIds) {
      outcomes[pid] = (pid === escapedByPid) ? "escaped" : "peer_escaped";
    }
  } else if (session.mode === "coop_pve" && session.sharedEnemy) {
    if (session.sharedEnemy.hp <= 0) {
      finished = true;
      for (const pid of activeIds) outcomes[pid] = "peer_down";
    } else if (session.sharedEnemy.arousal >= session.sharedEnemy.arousalMax) {
      finished = true;
      for (const pid of activeIds) outcomes[pid] = "peer_arousal";
    }
  } else if (activeIds.length >= 2) {
    const [idA, idB] = activeIds;
    const fA = session.fighters.get(idA);
    const fB = session.fighters.get(idB);
    if (fB && fB.hp <= 0) {
      finished = true;
      outcomes[idA] = "peer_down";
      outcomes[idB] = "me_down";
    } else if (fA && fA.hp <= 0) {
      finished = true;
      outcomes[idA] = "me_down";
      outcomes[idB] = "peer_down";
    } else if (fB && fB.arousal >= fB.arousalMax) {
      finished = true;
      outcomes[idA] = "peer_arousal";
      outcomes[idB] = "me_arousal";
    } else if (fA && fA.arousal >= fA.arousalMax) {
      finished = true;
      outcomes[idA] = "me_arousal";
      outcomes[idB] = "peer_arousal";
    }
  }

  const turnPlayed = session.turnNumber;
  session.turnNumber += 1;
  session.readyTurns.clear();
  room.prng = genPrngPack();

  const lockedClient = session.lockedTargetId ? findClient(session.lockedTargetId) : null;
  const lockedTargetName = lockedClient ? lockedClient.name : "";
  const fightersObj = serializeFighters(session);

  for (const pid of activeIds) {
    const member = findClient(pid);
    if (!member) continue;
    const peerId = activeIds.find((x) => x !== pid) || pid;
    const peerClient = findClient(peerId);
    const peerFighter = fightersObj[peerId] || fightersObj[pid];

    if (peerId !== pid && peerFighter) {
      send(member.ws, {
        t: "combat_peer_turn",
        combatId: session.combatId,
        fromId: peerId,
        fromName: peerFighter.name,
        actions: peerFighter.lastActions || {},
        organStates: peerFighter.lastOrganStates || null,
        activeSexKind: peerFighter.lastActiveSexKind || "",
        summary: peerFighter.lastSummary || "",
        combatSnapshot: peerClient ? peerClient.combatSnapshot : null,
        prng: room.prng,
      });
    }

    send(member.ws, {
      t: "combat_turn_commit",
      combatId: session.combatId,
      mode: session.mode,
      turnNumber: turnPlayed,
      fighters: fightersObj,
      sharedEnemy: session.sharedEnemy,
      lockedTargetId: session.lockedTargetId,
      lockedTargetName,
      position: nextPosition,
      combinedSummary: summaries.join(" ｜ "),
      escapeNote: escapeNotifications[pid] || "",
      peerActiveSexKind: peerFighter ? (peerFighter.lastActiveSexKind || "") : "",
       peerActions: peerFighter ? (peerFighter.lastActions || {}) : {},
      peerOrganStates: peerFighter ? (peerFighter.lastOrganStates || null) : null,
      finished,
      outcome: outcomes[pid] || "",
      peerSnapshot: peerClient ? peerClient.combatSnapshot : null,
      prng: room.prng,
    });
  }

  if (finished) {
    for (const pid of activeIds) {
      const m = findClient(pid);
      if (m) {
        m.inCombat = false;
        m.combatId = "";
      }
    }
    room.combats.delete(session.combatId);
    broadcastRoster(room);
  }
}

function skulGradeName(val) {
  const v = Number(val) || 0;
  if (v >= 1000) return "S";
  if (v >= 900) return "A+";
  if (v >= 800) return "A";
  if (v >= 700) return "B+";
  if (v >= 600) return "B";
  if (v >= 500) return "C+";
  if (v >= 400) return "C";
  if (v >= 300) return "D+";
  if (v >= 200) return "D";
  if (v >= 100) return "F+";
  return "F";
}

function handleStealRequest(client, msg) {
  const room = roomOf(client);
  if (!room) { send(client.ws, { t: "error", message: "先加入房间" }); return; }
  const target = findClient(msg.to);
  if (!target || target.roomCode !== room.code) { send(client.ws, { t: "error", message: "对方不在同一房间" }); return; }

  const mySkul = (client.stats && typeof client.stats.skulduggery === "number") ? client.stats.skulduggery : 0;
  const grade = skulGradeName(mySkul);

  if (mySkul < 600) {
    send(client.ws, {
      t: "steal_result",
      role: "thief",
      success: false,
      reason: "low_skill",
      skulduggery: mySkul,
      grade,
      requiredGrade: "B",
      requiredValue: 600,
      targetId: target.id,
      targetName: target.name,
      amount: 0,
    });
    return;
  }

  const targetMoney = (target.stats && typeof target.stats.money === "number") ? Math.floor(target.stats.money) : 0;
  if (targetMoney <= 0) {
    send(client.ws, {
      t: "steal_result",
      role: "thief",
      success: false,
      reason: "no_money",
      skulduggery: mySkul,
      grade,
      targetId: target.id,
      targetName: target.name,
      amount: 0,
    });
    return;
  }

  const targetWill = (target.stats && typeof target.stats.willpower === "number") ? target.stats.willpower : 500;
  const chance = Math.max(25, Math.min(95, 55 + Math.round((mySkul - 600) * 0.12) - Math.round((targetWill - 500) * 0.03)));
  const roll = crypto.randomInt(1, 101);
  const success = roll <= chance;

  if (success) {
    const ratio = Math.min(0.35, 0.15 + Math.max(0, (mySkul - 600) / 2500));
    const stolen = Math.max(1, Math.min(targetMoney, Math.min(5000, Math.round(targetMoney * ratio))));
    if (target.stats) target.stats.money = Math.max(0, targetMoney - stolen);
    if (client.stats) client.stats.money = (client.stats.money || 0) + stolen;

    send(client.ws, {
      t: "steal_result",
      role: "thief",
      success: true,
      reason: "ok",
      skulduggery: mySkul,
      grade,
      targetId: target.id,
      targetName: target.name,
      amount: stolen,
    });
    send(target.ws, {
      t: "steal_result",
      role: "victim",
      success: true,
      reason: "ok",
      thiefId: client.id,
      thiefName: client.name,
      amount: stolen,
    });
  } else {
    send(client.ws, {
      t: "steal_result",
      role: "thief",
      success: false,
      reason: "caught",
      skulduggery: mySkul,
      grade,
      targetId: target.id,
      targetName: target.name,
      amount: 0,
    });
    send(target.ws, {
      t: "steal_result",
      role: "victim",
      success: false,
      reason: "caught",
      thiefId: client.id,
      thiefName: client.name,
      amount: 0,
    });
    handleAttackRequest(target, { to: client.id, consensual: false });
  }
}

/* ---------------- 断线清理 ---------------- */

function cancelPendingJoins(client) {
  for (const room of rooms.values()) {
    for (const [reqId, req] of room.pending) {
      if (req.client !== client) continue;
      if (req.timer) clearTimeout(req.timer);
      room.pending.delete(reqId);
      const host = findClient(room.hostId);
      if (host) send(host.ws, { t: "join_cancelled", reqId, name: req.name });
    }
  }
}

function expireTradesFor(clientId, reason) {
  for (const [id, tr] of trades) {
    if (tr.from !== clientId && tr.to !== clientId) continue;
    if (tr.timer) clearTimeout(tr.timer);
    trades.delete(id);
    const otherId = tr.from === clientId ? tr.to : tr.from;
    const other = findClient(otherId);
    if (other) send(other.ws, { t: "trade_result", tradeId: id, status: "expired", reason: reason || "offline" });
  }
}

function expireActsFor(clientId, reason) {
  for (const [id, ar] of acts) {
    if (ar.from !== clientId && ar.to !== clientId) continue;
    if (ar.timer) clearTimeout(ar.timer);
    acts.delete(id);
    const otherId = ar.from === clientId ? ar.to : ar.from;
    const other = findClient(otherId);
    if (other) send(other.ws, { t: "act_result", actId: id, status: "expired", reason: reason || "offline" });
  }
}

/* ---------------- 交易 ---------------- */

function tradeOffer(client, msg) {
  const room = roomOf(client);
  if (!room) { send(client.ws, { t: "error", message: "先加入房间" }); return; }
  const target = findClient(msg.to);
  if (!target || target.roomCode !== room.code) { send(client.ws, { t: "error", message: "对方不在同一房间" }); return; }
  if (msg.requireSameLoc && !sameLocation(client, target)) {
    send(client.ws, { t: "error", message: "双方需要在同一个地点才能交易" });
    return;
  }
  if (!validItem(msg.give) || !validItem(msg.want)) { send(client.ws, { t: "error", message: "交易物品格式不正确" }); return; }

  const id = crypto.randomUUID();
  const tr = { id, from: client.id, to: target.id, give: msg.give, want: msg.want, status: "pending", createdAt: now(), room: room.code, timer: null };
  trades.set(id, tr);
  send(target.ws, { t: "trade_request", tradeId: id, from: { id: client.id, name: client.name }, give: msg.give, want: msg.want });
  send(client.ws, { t: "trade_sent", tradeId: id, give: msg.give, want: msg.want });
  tr.timer = setTimeout(() => {
    const cur = trades.get(id);
    if (!cur || cur.status !== "pending") return;
    trades.delete(id);
    const f = findClient(cur.from), t = findClient(cur.to);
    if (f) send(f.ws, { t: "trade_result", tradeId: id, status: "expired" });
    if (t) send(t.ws, { t: "trade_result", tradeId: id, status: "expired" });
  }, REQUEST_TTL_MS);
}

function tradeAnswer(client, msg, accepted) {
  const tr = trades.get(String(msg.tradeId || ""));
  if (!tr || tr.to !== client.id || tr.status !== "pending") { send(client.ws, { t: "error", message: "交易已失效" }); return; }
  const f = findClient(tr.from), t = findClient(tr.to);
  if (!f || !t || f.roomCode !== t.roomCode) {
    if (tr.timer) clearTimeout(tr.timer);
    trades.delete(tr.id);
    if (f) send(f.ws, { t: "trade_result", tradeId: tr.id, status: "expired", reason: "location" });
    if (t) send(t.ws, { t: "trade_result", tradeId: tr.id, status: "expired", reason: "location" });
    return;
  }
  tr.status = accepted ? "accepted" : "declined";
  if (tr.timer) clearTimeout(tr.timer);
  const result = { t: "trade_result", tradeId: tr.id, status: tr.status, from: tr.from, to: tr.to, give: tr.give, want: tr.want };
  send(f.ws, result);
  send(t.ws, result);
  trades.delete(tr.id);
}

/* ---------------- 互动 ---------------- */

function actRequest(client, msg) {
  const room = roomOf(client);
  if (!room) { send(client.ws, { t: "error", message: "先加入房间" }); return; }
  const target = findClient(msg.to);
  if (!target || target.roomCode !== room.code) { send(client.ws, { t: "error", message: "对方不在同一房间" }); return; }
  if (!sameLocation(client, target)) {
    send(client.ws, { t: "error", message: "双方需要在同一场景才能互动" });
    return;
  }
  if (!ACTS[msg.act]) { send(client.ws, { t: "error", message: "未知的互动" }); return; }

  const id = crypto.randomUUID();
  const ar = { id, from: client.id, to: target.id, act: msg.act, status: "pending", createdAt: now(), room: room.code, timer: null };
  acts.set(id, ar);
  send(target.ws, { t: "act_request", actId: id, from: { id: client.id, name: client.name }, act: msg.act });
  send(client.ws, { t: "act_sent", actId: id, act: msg.act });
  ar.timer = setTimeout(() => {
    const cur = acts.get(id);
    if (!cur || cur.status !== "pending") return;
    acts.delete(id);
    const f = findClient(cur.from), t = findClient(cur.to);
    if (f) send(f.ws, { t: "act_result", actId: id, status: "expired" });
    if (t) send(t.ws, { t: "act_result", actId: id, status: "expired" });
  }, REQUEST_TTL_MS);
}

function actAnswer(client, msg, accepted) {
  const ar = acts.get(String(msg.actId || ""));
  if (!ar || ar.to !== client.id || ar.status !== "pending") { send(client.ws, { t: "error", message: "互动请求已失效" }); return; }
  const f = findClient(ar.from), t = findClient(ar.to);
  if (!f || !t || !sameLocation(f, t)) {
    if (ar.timer) clearTimeout(ar.timer);
    acts.delete(ar.id);
    if (f) send(f.ws, { t: "act_result", actId: ar.id, status: "expired", reason: "location" });
    if (t) send(t.ws, { t: "act_result", actId: ar.id, status: "expired", reason: "location" });
    return;
  }
  ar.status = accepted ? "accepted" : "declined";
  if (ar.timer) clearTimeout(ar.timer);
  const result = { t: "act_result", actId: ar.id, status: ar.status, from: ar.from, to: ar.to, act: ar.act };
  send(f.ws, result);
  send(t.ws, result);
  acts.delete(ar.id);
}

/* ---------------- 连接与主消息循环 ---------------- */

wss.on("connection", (ws, req) => {
  const ip = (req.socket.remoteAddress || "").replace("::ffff:", "");
  const client = {
    ws,
    id: crypto.randomUUID(),
    name: "玩家",
    roomCode: "",
    passage: "",
    phase: undefined,
    recentPassages: [],
    combatReturnPassage: "",
    eventContext: null,
    location: "",
    mapLocation: "",
    timeStamp: 25260,
    speechAttitude: "neutral",
    appearance: null,
    combatSnapshot: null,
    stats: null,
    syncMode: false,
    inCombat: false,
    isHost: false,
    lastChat: 0,
    connectedAt: now(),
    joinedAt: 0,
    updatedAt: now(),
    ip,
    alive: true,
  };
  clients.set(ws, client);
  send(ws, { t: "welcome", id: client.id, protocol: 6 });

  ws.on("pong", () => { client.alive = true; });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString("utf8")); } catch { return; }
    if (!msg || typeof msg.t !== "string") return;

    try {
      switch (msg.t) {
        case "hello": {
          if (msg.name) client.name = text(msg.name, 24) || client.name;
          send(ws, { t: "hello_ok", id: client.id, name: client.name, protocol: 6 });
          break;
        }
        case "create_room": createRoom(client, msg); break;
        case "join_room": joinRoom(client, msg); break;
        case "leave_room": leaveRoom(client, "leave"); send(ws, { t: "room_left" }); break;
        case "join_approve": approveJoin(client, msg); break;
        case "join_reject": rejectJoin(client, msg); break;
        case "set_approval": setApproval(client, msg); break;

        case "state": {
          const room = roomOf(client);
          if (!room) break;
          const prevPassage = client.passage;
          const prevPhase = client.phase;
          client.passage = text(msg.passage, 120);
          if (msg.phase !== undefined) client.phase = msg.phase;
          if (Array.isArray(msg.recentPassages)) {
            client.recentPassages = msg.recentPassages.slice(-10).map((x) => text(x, 120)).filter(Boolean);
          } else if (client.passage && client.recentPassages[client.recentPassages.length - 1] !== client.passage) {
            client.recentPassages.push(client.passage);
            if (client.recentPassages.length > 10) client.recentPassages.shift();
          }
          if (SAFE_PASSAGES.has(client.passage)) {
            client.combatReturnPassage = client.passage;
          }
          const evCtx = validJsonSnapshot(msg.eventContext, 48000);
          if (evCtx) client.eventContext = evCtx;

          client.location = text(msg.location, 120);
          client.mapLocation = text(msg.mapLocation, 60);
          if (Number.isFinite(msg.timeStamp)) {
            client.timeStamp = Number(msg.timeStamp);
            if (client.isHost) room.clock.timeStamp = client.timeStamp;
          }
          if (msg.speechAttitude) {
            client.speechAttitude = text(msg.speechAttitude, 20) || "neutral";
          }

          const wasInCombat = client.inCombat;
          client.inCombat = !!msg.inCombat;
          if (msg.combatInfo && typeof msg.combatInfo === "object") {
            client.combatInfo = normalizeCombatInfo(msg.combatInfo);
          }
          if (wasInCombat && !client.inCombat && client.combatId) {
            removeClientFromCombatSessions(room, client);
          }
          if (!client.inCombat) clearCoopPending(room, client);
          client.updatedAt = now();

          const appearance = validAppearance(msg.appearance);
          if (appearance) client.appearance = appearance;

          const cSnap = validJsonSnapshot(msg.combatSnapshot, 32000);
          if (cSnap) client.combatSnapshot = cSnap;

          const stats = validStats(msg.stats);
          if (stats) client.stats = stats;

          const passageChanged = !!(prevPassage && prevPassage !== client.passage);
          const samePassagePhaseChanged = !!(
            prevPassage &&
            prevPassage === client.passage &&
            prevPhase !== undefined &&
            client.phase !== undefined &&
            prevPhase !== client.phase
          );

          if (passageChanged || samePassagePhaseChanged) {
            clearVotesForClient(room, client);
            if (client.isHost && room.syncMode) {
              for (const [, bucket] of room.linkVotes) {
                if (bucket.timer) clearTimeout(bucket.timer);
              }
              room.linkVotes.clear();
              const badJump = new Set(["Start", "Start2", "Orphanage Intro", ""]);
              if ((SAFE_PASSAGES.has(client.passage) || samePassagePhaseChanged) && !badJump.has(client.passage) && !client.passage.startsWith("MP ") && !client.inCombat) {
                room.prng = genPrngPack();
                sendToRoom(room, {
                  t: "sync_jump",
                  fromId: client.id,
                  fromName: client.name,
                  passage: client.passage,
                  phase: client.phase,
                  eventContext: client.eventContext || null,
                  prng: room.prng,
                  inCombat: false,
                  reason: samePassagePhaseChanged ? "phase_change" : "host_move",
                }, client.id);
              }
            }
          }
          broadcastRoster(room);
          break;
        }

        case "sync_timeline": {
          // 发起同步的人选择房间内任意目标玩家，将自己的时间线同步至目标玩家的时间线
          const room = roomOf(client);
          if (!room) break;
          let target = msg.targetId ? findClient(msg.targetId) : null;
          if (!target || target.roomCode !== room.code) {
            target = [...room.members].find((m) => m.id !== client.id) || null;
          }
          if (!target) {
            send(client.ws, { t: "error", message: "当前房间没有可同步时间线的队友" });
            break;
          }
          const targetTs = Number.isFinite(target.timeStamp) ? target.timeStamp : room.clock.timeStamp;
          client.timeStamp = targetTs;
          send(client.ws, {
            t: "sync_timeline_apply",
            targetId: target.id,
            targetName: target.name,
            timeStamp: targetTs,
          });
          broadcastRoster(room);
          break;
        }

        case "clock_control": {
          const room = roomOf(client);
          if (!room) break;
          if (room.hostId !== client.id && room.syncMode) {
            send(client.ws, { t: "error", message: "组队模式下由房主控制实时时钟流速" });
            break;
          }
          if (msg.running !== undefined) room.clock.running = !!msg.running;
          if (msg.speed !== undefined) room.clock.speed = [1, 2, 5].includes(Number(msg.speed)) ? Number(msg.speed) : 1;
          if (Number.isFinite(msg.timeStamp)) room.clock.timeStamp = Number(msg.timeStamp);
          room.prng = genPrngPack();
          if (room.syncMode) {
            sendToRoom(room, {
              t: "clock_tick",
              timeStamp: room.clock.timeStamp,
              stepSeconds: 0,
              speed: room.clock.speed,
              running: room.clock.running,
              prng: room.prng,
              force: false,
            });
          } else {
            send(client.ws, {
              t: "clock_tick",
              timeStamp: client.timeStamp || room.clock.timeStamp,
              stepSeconds: 0,
              speed: room.clock.speed,
              running: room.clock.running,
              prng: room.prng,
              force: false,
            });
          }
          break;
        }

        case "sync_mode": {
          const room = roomOf(client);
          if (!room) break;
          setRoomSync(room, !!msg.syncMode, client.name);
          send(client.ws, { t: "sync_mode_ok", syncMode: !!room.syncMode });
          break;
        }

        case "sync_request": {
          const room = roomOf(client);
          if (!room) break;
          if (room.syncMode) {
            send(client.ws, { t: "sys", text: "当前已经是组队同步状态" });
            break;
          }
          const others = [...room.members].filter((m) => m.id !== client.id);
          if (others.length === 0) {
            setRoomSync(room, true, client.name);
            send(client.ws, { t: "sync_accepted", byName: client.name });
            break;
          }
          if (!room.syncRequests) room.syncRequests = new Map();
          const reqId = crypto.randomUUID();
          const entry = { reqId, fromId: client.id, fromName: client.name, createdAt: now(), timer: null };
          room.syncRequests.set(reqId, entry);
          for (const m of others) {
            send(m.ws, { t: "sync_invite", reqId, fromId: client.id, fromName: client.name });
          }
          send(client.ws, { t: "sys", text: "已向队友发出组队同步邀请，等待对方同意…" });
          entry.timer = setTimeout(() => {
            if (room.syncRequests && room.syncRequests.get(reqId) === entry) {
              room.syncRequests.delete(reqId);
              send(client.ws, { t: "sync_declined", byName: "队友", reason: "timeout" });
            }
          }, SYNC_TTL_MS);
          break;
        }

        case "sync_accept": {
          const room = roomOf(client);
          if (!room) break;
          const reqId = String(msg.reqId || "");
          const entry = room.syncRequests && room.syncRequests.get(reqId);
          if (!entry) {
            send(client.ws, { t: "error", message: "组队同步邀请已失效" });
            break;
          }
          if (entry.timer) clearTimeout(entry.timer);
          room.syncRequests.delete(reqId);
          const from = findClient(entry.fromId);
          if (!from || from.roomCode !== room.code) {
            send(client.ws, { t: "error", message: "发起同步的玩家已离线" });
            break;
          }
          room.prng = genPrngPack();
          setRoomSync(room, true, client.name);
          send(from.ws, { t: "sync_accepted", byId: client.id, byName: client.name, prng: room.prng });
          send(client.ws, { t: "sync_accepted", byId: from.id, byName: from.name, prng: room.prng });
          sys(room, `${from.name} 与 ${client.name} 开启了组队同步`);
          break;
        }

        case "sync_decline": {
          const room = roomOf(client);
          if (!room) break;
          const reqId = String(msg.reqId || "");
          const entry = room.syncRequests && room.syncRequests.get(reqId);
          if (entry) {
            if (entry.timer) clearTimeout(entry.timer);
            room.syncRequests.delete(reqId);
            const from = findClient(entry.fromId);
            if (from) send(from.ws, { t: "sync_declined", byId: client.id, byName: client.name, reason: "declined" });
          }
          break;
        }

        case "meet_here": {
          const room = roomOf(client);
          if (!room) break;
          room.prng = genPrngPack();
          const invitePassage = text(msg.passage || client.passage, 120) || "Orphanage";
          sendToRoom(room, {
            t: "meet_invite",
            fromId: client.id,
            fromName: client.name,
            passage: invitePassage,
            prng: room.prng,
          }, client.id);
          sys(room, `${client.name} 召集队友前往 ${invitePassage} 会合`);
          break;
        }

        case "meet_accept": {
          const room = roomOf(client);
          if (!room) break;
          const hostClient = findClient(msg.fromId);
          const targetPassage = text(msg.passage || (hostClient && hostClient.passage) || "Orphanage", 120);
          const routeInfo = hostClient ? calcShortestAssistTravel(client, hostClient) : { minutes: 1, seconds: 60, method: "同行", routeSummary: targetPassage, busFare: 0 };
          room.prng = genPrngPack();
          send(client.ws, {
            t: "meet_jump",
            fromId: msg.fromId,
            fromName: (hostClient && hostClient.name) || "队友",
            passage: targetPassage,
            eventContext: (hostClient && hostClient.eventContext) || null,
            timeCostSeconds: routeInfo.seconds,
            timeCostMinutes: routeInfo.minutes,
            transportMethod: routeInfo.method,
            busFare: routeInfo.busFare,
            routeSummary: routeInfo.routeSummary,
            prng: room.prng,
          });
          if (hostClient) {
            send(hostClient.ws, {
              t: "meet_accepted_notify",
              byId: client.id,
              byName: client.name,
              passage: targetPassage,
              timeCostMinutes: routeInfo.minutes,
              transportMethod: routeInfo.method,
              routeSummary: routeInfo.routeSummary,
              prng: room.prng,
            });
          }
          setRoomSync(room, true, client.name);
          sys(room, `${client.name} 经由 ${routeInfo.routeSummary} 耗时 ${routeInfo.minutes} 分钟抵达 ${targetPassage} 会合`);
          break;
        }

        case "combat_leave": {
          const room = roomOf(client);
          if (room) {
            removeClientFromCombatSessions(room, client);
            clearVotesForClient(room, client);
            broadcastRoster(room);
          }
          break;
        }

        case "interact_effect": {
          const room = roomOf(client);
          if (!room) break;
          const target = findClient(msg.to);
          if (target && target.roomCode === room.code) {
            send(target.ws, {
              t: "interact_effect",
              fromId: client.id,
              fromName: client.name,
              kind: text(msg.kind, 40),
              minutes: clampNum(msg.minutes, 0, 120, 15),
              stressDelta: clampNum(msg.stressDelta, -50, 50, -4),
              traumaDelta: clampNum(msg.traumaDelta, -50, 50, -2),
              tirednessDelta: clampNum(msg.tirednessDelta, -50, 50, 0),
              arousalDelta: clampNum(msg.arousalDelta, 0, 5000, 0),
              relDelta: validJsonSnapshot(msg.relDelta, 2000) || null,
              milestoneStage: text(msg.milestoneStage, 30) || "",
              virginityTaken: text(msg.virginityTaken, 30) || "",
              text: text(msg.text, 300),
            });
          }
          break;
        }

        case "link_vote": handleLinkVote(client, msg); break;
        case "attack_request": handleAttackRequest(client, msg); break;
        case "consensual_accept": handleConsensualAnswer(client, msg, true); break;
        case "consensual_decline": handleConsensualAnswer(client, msg, false); break;
        case "assist_combat": handleAssistCombat(client, msg); break;
        case "combat_enter": handleCombatEnter(client, msg); break;
        case "combat_exit": handleCombatExit(client); break;
        case "event_trigger": handleEventTrigger(client, msg); break;
        case "event_pick": handleEventPick(client, msg); break;
        case "inline_dom_event": handleInlineDomEvent(client, msg); break;
        case "combat_sync_init": handleCombatSyncInit(client, msg); break;
        case "combat_turn": handleCombatTurn(client, msg); break;
        case "steal_request": handleStealRequest(client, msg); break;

        case "chat": {
          const room = roomOf(client);
          if (!room) { send(ws, { t: "error", message: "先加入房间再聊天" }); break; }
          const body = text(msg.text, 200);
          if (!body) break;
          if (now() - client.lastChat < CHAT_INTERVAL_MS) break;
          client.lastChat = now();
          sendToRoom(room, {
            t: "chat",
            from: client.id,
            name: client.name,
            text: body,
            passage: client.passage,
            location: client.location,
            ts: now(),
          });
          break;
        }

        case "trade_offer": tradeOffer(client, msg); break;
        case "trade_accept": tradeAnswer(client, msg, true); break;
        case "trade_decline": tradeAnswer(client, msg, false); break;
        case "act_request": actRequest(client, msg); break;
        case "act_accept": actAnswer(client, msg, true); break;
        case "act_decline": actAnswer(client, msg, false); break;
        case "ping": send(ws, { t: "pong", ts: now() }); break;
        default: break;
      }
    } catch (err) {
      console.error("[DoL-MP] handler error", err);
      send(ws, { t: "error", message: "服务器处理消息失败" });
    }
  });

  ws.on("close", () => {
    cancelPendingJoins(client);
    expireTradesFor(client.id, "offline");
    expireActsFor(client.id, "offline");
    leaveRoom(client, "disconnect");
    clients.delete(ws);
    broadcastAllRooms();
  });
  ws.on("error", () => {});
});

function broadcastAllRooms() {
  for (const room of rooms.values()) broadcastRoster(room);
}

setInterval(() => {
  for (const [ws, c] of clients) {
    if (!c.alive) { ws.terminate(); continue; }
    c.alive = false;
    try { ws.ping(); } catch { /* ignore */ }
  }
}, 30000);

console.log(`[DoL-MP v0.6.0] WebSocket server listening on ws://0.0.0.0:${PORT}`);
console.log(`[DoL-MP v0.6.0] 同机双开：ws://127.0.0.1:${PORT}`);
console.log(`[DoL-MP v0.6.0] 局域网：ws://<本机局域网IP>:${PORT}`);

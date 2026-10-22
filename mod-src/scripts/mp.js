/* DoL-MP client mod v0.6.0 — 原版沉浸文风 + 独立/同步时间线与选择同步 + 遭遇战原版NPC完整保留 + PvP真名/破处/逃跑判定 + 离线伴侣NPC与大世界暗线系统
 * 核心特性：
 * 1. 彻底移除所有剧透提示、【...】标签与（...）括号备注，100% 遵循 DoL 原版沉浸式文风与图标系统
 * 2. 时间线机制：分头行动时各自时间独立流动；组队时各自行动扣减自己的时间线，并提供「同步时间线」按钮，可选择同步任意队友的时间线
 * 3. 遭遇战拟真：
 *    - 支援队友时完整保留对方遭遇战的原版 $NPCList 快照，NPC 绝不发生改变
 *    - 教程遭遇战（Tutorial）打完后完整衔接原版陌生人解围与防狼喷雾（$spraymax++ / <<spray 5>>）奖励
 *    - 玩家间遭遇战（PvP / 温存）显示对方玩家的真实联机昵称 ID，破处（takeVirginity）记录对方玩家的真实联机昵称 ID
 *    - 默认动作绝不自动把私处贴过去（通过 $npcSub 与器官状态锁控制），仅在主动互动贴近/插入时对称触发被干/插入状态
 *    - 新增 PvP 挣脱逃跑的体能与意志属性判定
 * 4. 原版级情感数值成长：每次互动仅 +1（极少数深度剧情 +2），初始为 0，并设有每日次数限制（$daily.mpInteractCounts）
 * 5. 离线伴侣可恋爱 NPC 系统：队友离线时自动作为常驻孤儿院与小镇的可恋爱 NPC，拥有完整日程、性格差分（温顺/乖张/沉稳/病娇占有/堕落共犯）与长支线
 */
(function () {
  "use strict";

  var HUB = "联机会客厅";
  var BEDROOM = "多人卧室";
  var MP_COMBAT_PASSAGE = "MP Native Combat";
  var LS_SERVER = "dolmp.server";
  var LS_NAME = "dolmp.name";
  var LS_ROOM = "dolmp.room";
  var LS_HOST = "dolmp.host";
  var LS_REL = "dolmp.relations.v6";
  var LS_COMPANION = "dolmp.companion.v6";
  var DEFAULT_SERVER = "ws://127.0.0.1:8787";

  var SAFE_PASSAGES = [
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
  ];

  var ACTS = {
    handhold: { label: "牵手", arousal: 30, stress: -1, seconds: 120, lines: ["你和 {name} 十指紧扣地牵着手待了一会儿，掌心的温度令人安心。"] },
    whisper: { label: "耳语", arousal: 50, stress: -1, seconds: 120, lines: ["你凑在 {name} 耳边低声说了会儿悄悄话，温热的吐息拂过耳廓。"] },
    caress: { label: "抚摸", arousal: 100, stress: -1, seconds: 300, lines: ["你和 {name} 依偎在一起，手指轻柔地抚摸着彼此的发丝与脸颊。"] },
    hug: { label: "拥抱", arousal: 150, stress: -1, seconds: 300, lines: ["你和 {name} 紧紧拥抱了一会儿，听着彼此沉稳的心跳声。"] },
    kiss: { label: "亲吻", arousal: 400, stress: -2, seconds: 600, lines: ["你和 {name} 交换了一个绵长而温热的吻，唇齿间满是眷恋。"] },
    rest: { label: "一起休息", arousal: 20, stress: -2, seconds: 1800, lines: ["你和 {name} 肩并肩靠在一起休息了一会儿，驱散了奔波的疲惫。"] },
    mutual: {
      label: "互相抚慰", arousal: 800, stress: -3, seconds: 900, handskill: 1,
      lines: ["你和 {name} 借着衣物遮掩互相抚慰着彼此的敏感处，度过了一段脸红心跳的私密时光。"]
    },
    intimate: {
      label: "亲密互动", arousal: 1500, stress: -5, seconds: 1800,
      lines: ["你和 {name} 抵死缠绵，在喘息与热吻中度过了一段蚀骨销魂的亲密时光。"]
    }
  };

  var ACTION_CN = {
    rest: "休息",
    caress: "爱抚",
    leftchest: "爱抚胸部",
    rightchest: "爱抚胸部",
    hit: "击打",
    lefthit: "左手击打",
    righthit: "右手击打",
    behind: "别在身后",
    cover: "遮住自己的脸",
    leftcoverface: "遮住自己的脸",
    rightcoverface: "遮住自己的脸",
    kick: "猛踢",
    feetkick: "猛踢",
    scream: "大声尖叫呼救",
    plead: "苦苦恳求",
    kiss: "亲吻皮肤",
    kissskin: "亲吻皮肤",
    kisslips: "亲吻嘴唇",
    oral: "口交侍奉",
    bite: "狠咬",
    ask: "要求休息",
    handjob: "用手侍奉",
    leftgrab: "抓住生殖器",
    rightgrab: "抓住生殖器",
    leftstroke: "爱抚生殖器",
    rightstroke: "爱抚生殖器",
    leftwork: "套弄",
    rightwork: "套弄",
    leftplay: "抚弄小穴",
    rightplay: "抚弄小穴",
    leftclit: "揉弄阴蒂",
    rightclit: "揉弄阴蒂",
    grab: "用脚夹住",
    vaginagrab: "用脚抵住",
    grabrub: "用脚摩擦",
    vaginagrabrub: "用脚摩擦",
    fondle: "抚弄",
    rub: "磨蹭",
    cooperate: "顺从配合",
    struggle: "挣扎反抗",
    leftstruggle: "左手挣扎",
    rightstruggle: "右手挣扎",
    spray: "喷射防狼喷雾",
    steal: "趁机偷窃",
    leftUndressOther: "试图脱对方衣服",
    rightUndressOther: "试图脱对方衣服",
    vaginatopenis: "跨坐迎合",
    vaginatovagina: "跨坐磨蹭",
    anustopenis: "后庭迎合",
    penistovagina: "挺身插入",
    penistoanus: "挺身插入",
    penis: "迎合",
    vagina: "迎合",
    anus: "迎合",
    doggy: "翻身跪趴",
    missionary: "翻身仰卧",
    mp_escape: "发力挣脱逃跑"
  };

  var PASSAGE_CN = {
    "Orphanage": "孤儿院",
    "Bedroom": "孤儿院卧室",
    "Bathroom": "孤儿院浴室",
    "Garden": "孤儿院花园",
    "Bailey's Office": "贝利办公室",
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
    "Shopping Centre": "购物中心",
    "School Front Courtyard": "学校前院",
    "Hallways": "学校走廊",
    "School Library": "学校图书馆",
    "Canteen": "学校食堂",
    "Swimming Pool": "学校泳池",
    "Temple": "神殿",
    "Brothel": "妓院",
    "Pub": "酒吧",
    "Hospital Courtyard": "医院",
    "Police Station": "警察局",
    "Ocean Breeze": "海风咖啡馆",
    "Adult Shop": "成人店",
    "Arcade": "游戏厅",
    "Docks": "码头",
    "Farmland": "农场",
    "Kylar Manor": "凯拉尔庄园",
    "Sewers": "下水道",
    "Tutorial": "街巷遭遇",
    "MP Native Combat": "遭遇战中"
  };

  /* ---------------- DoL 全镇地图拓扑与客户端 Dijkstra 最短路引擎 ---------------- */

  var WALK_EDGES = [
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

  var BUS_STOPS = [
    "Domus Street", "Barb Street", "Danube Street", "Connudatus Street",
    "Cliff Street", "Wolf Street", "High Street", "Starfish Street",
    "Nightingale Street", "Oxford Street", "Mer Street", "Elk Street",
    "Harvest Street"
  ];

  function matchPassageToGraphNode(rawPas) {
    var p = String(rawPas || "").trim();
    if (!p) return "";
    if (PASSAGE_CN[p] && p !== "Tutorial" && p !== "MP Native Combat") {
      if (p === "Canteen") return "Hallways";
      return p;
    }
    if (p === HUB || p === BEDROOM || p.indexOf("Orphanage") >= 0 || p.indexOf("Robin") === 0 || p.indexOf("Bailey") === 0) return "Orphanage";
    if (p.indexOf("Bedroom") === 0) return "Bedroom";
    if (p.indexOf("Bathroom") === 0) return "Bathroom";
    if (p.indexOf("Domus") === 0 || p === "Tutorial") return "Domus Street";
    if (p.indexOf("Barb") === 0) return "Barb Street";
    if (p.indexOf("Danube") === 0) return "Danube Street";
    if (p.indexOf("Connudatus") === 0) return "Connudatus Street";
    if (p.indexOf("Cliff") === 0) return "Cliff Street";
    if (p.indexOf("Wolf Cave") === 0 || p.indexOf("Wolf Pack") === 0) return "Wolf Cave";
    if (p.indexOf("Wolf") === 0) return "Wolf Street";
    if (p.indexOf("High") === 0 || p.indexOf("Street Photo High") === 0) return "High Street";
    if (p.indexOf("Starfish") === 0) return "Starfish Street";
    if (p.indexOf("Nightingale") === 0) return "Nightingale Street";
    if (p.indexOf("Oxford") === 0) return "Oxford Street";
    if (p.indexOf("Mer") === 0) return "Mer Street";
    if (p.indexOf("Elk") === 0) return "Elk Street";
    if (p.indexOf("Harvest") === 0) return "Harvest Street";
    if (p.indexOf("Kylar Park") >= 0 || p.indexOf("Park") === 0) return "Park";
    if (p.indexOf("Manor Kylar") >= 0 || p.indexOf("Kylar Manor") === 0) return "Kylar Manor";
    if (p.indexOf("Sydney Temple") >= 0 || p.indexOf("Temple") === 0) return "Temple";
    if (p.indexOf("Sydney") >= 0 || p.indexOf("Library") >= 0) return "School Library";
    if (p.indexOf("School") >= 0 || p.indexOf("Classroom") >= 0 || p.indexOf("Canteen") >= 0 || p.indexOf("Hallways") >= 0 || p.indexOf("Whitney") === 0) return "Hallways";
    if (p.indexOf("Pool") >= 0 || p.indexOf("Swimming") >= 0) return "Swimming Pool";
    if (p.indexOf("Beach Cave") >= 0) return "Beach Cave";
    if (p.indexOf("Rocks") >= 0) return "Sea Rocks";
    if (p.indexOf("Beach") >= 0) return "Beach";
    if (p.indexOf("Eden") >= 0 || p.indexOf("Cottage") >= 0) return "Cottage";
    if (p.indexOf("Deep Forest") >= 0) return "Deep Forest";
    if (p.indexOf("Forest") >= 0) return "Forest";
    if (p.indexOf("Shopping") >= 0 || p.indexOf("Clothing Shop") >= 0 || p.indexOf("Hairdresser") >= 0 || p.indexOf("Cosmetics") >= 0) return "Shopping Centre";
    if (p.indexOf("Brothel") >= 0) return "Brothel";
    if (p.indexOf("Pub") >= 0) return "Pub";
    if (p.indexOf("Hospital") >= 0) return "Hospital Courtyard";
    if (p.indexOf("Police") >= 0) return "Police Station";
    if (p.indexOf("Cafe") >= 0 || p.indexOf("Ocean Breeze") >= 0) return "Ocean Breeze";
    if (p.indexOf("Adult Shop") >= 0) return "Adult Shop";
    if (p.indexOf("Arcade") >= 0) return "Arcade";
    if (p.indexOf("Docks") >= 0) return "Docks";
    if (p.indexOf("Farm") >= 0 || p.indexOf("Alex") >= 0) return "Farmland";
    if (p.indexOf("Sewer") >= 0 || p.indexOf("Drain") >= 0) return "Sewers";
    if (p.indexOf("Residential Alley") >= 0) return "Residential Alleyways";
    if (p.indexOf("Commercial Alley") >= 0) return "Commercial Alleyways";
    if (p.indexOf("Industrial Alley") >= 0) return "Industrial Alleyways";
    return "";
  }

  function resolvePlayerGraphNodeClient(pObj, isSelf) {
    if (isSelf) {
      var curPas = (window.State && State.passage) || "";
      var n0 = matchPassageToGraphNode(curPas);
      if (n0) return n0;
      var hist = S._passageHistory || [];
      for (var i = hist.length - 1; i >= 0; i--) {
        var nh = matchPassageToGraphNode(hist[i]);
        if (nh) return nh;
      }
      var v = V();
      var ml = String((v && v.bus) || (v && v.map && v.map.location) || (v && v.location) || "").toLowerCase();
      return matchMapLocToNode(ml);
    }
    if (!pObj) return "Orphanage";
    var n1 = matchPassageToGraphNode(pObj.passage);
    if (n1) return n1;
    if (pObj.combatReturnPassage) {
      var n2 = matchPassageToGraphNode(pObj.combatReturnPassage);
      if (n2) return n2;
    }
    if (Array.isArray(pObj.recentPassages)) {
      for (var j = pObj.recentPassages.length - 1; j >= 0; j--) {
        var nr = matchPassageToGraphNode(pObj.recentPassages[j]);
        if (nr) return nr;
      }
    }
    return matchMapLocToNode(String(pObj.mapLocation || pObj.location || "").toLowerCase());
  }

  function matchMapLocToNode(ml) {
    var dict = {
      domus: "Domus Street", barb: "Barb Street", danube: "Danube Street",
      connudatus: "Connudatus Street", cliff: "Cliff Street", wolf: "Wolf Street",
      high: "High Street", starfish: "Starfish Street", nightingale: "Nightingale Street",
      oxford: "Oxford Street", mer: "Mer Street", elk: "Elk Street", harvest: "Harvest Street",
      park: "Park", beach: "Beach", forest: "Forest", school: "Hallways",
      home: "Orphanage", orphanage: "Orphanage", temple: "Temple",
      brothel: "Brothel", pub: "Pub", hospital: "Hospital Courtyard",
      alley: "Commercial Alleyways", sewers: "Sewers", farm: "Farmland", cabin: "Cottage"
    };
    return dict[ml] || "Orphanage";
  }

  function runDijkstraClient(startNode, endNode, edges, mult) {
    var m = mult || 1.0;
    if (startNode === endNode) return { minutes: 1, path: [startNode] };
    var adj = {};
    for (var i = 0; i < edges.length; i++) {
      var u = edges[i][0], v = edges[i][1], w = Math.max(1, Math.round(edges[i][2] * m));
      if (!adj[u]) adj[u] = [];
      if (!adj[v]) adj[v] = [];
      adj[u].push({ to: v, w: w });
      adj[v].push({ to: u, w: w });
    }
    var dist = {}, prev = {}, visited = {};
    dist[startNode] = 0;

    while (true) {
      var bestNode = null, bestD = Infinity;
      for (var k in dist) {
        if (!visited[k] && dist[k] < bestD) {
          bestD = dist[k];
          bestNode = k;
        }
      }
      if (!bestNode || bestNode === endNode) break;
      visited[bestNode] = true;
      var nbrs = adj[bestNode] || [];
      for (var j = 0; j < nbrs.length; j++) {
        var nb = nbrs[j];
        if (visited[nb.to]) continue;
        var alt = bestD + nb.w;
        if (dist[nb.to] === undefined || alt < dist[nb.to]) {
          dist[nb.to] = alt;
          prev[nb.to] = bestNode;
        }
      }
    }
    if (dist[endNode] === undefined) return { minutes: 10, path: [startNode, endNode] };
    var path = [], cur = endNode;
    while (cur) {
      path.unshift(cur);
      if (cur === startNode) break;
      cur = prev[cur];
    }
    return { minutes: Math.max(1, dist[endNode]), path: path };
  }

  function calcShortestAssistTravelClient(targetPlayer) {
    var fromNode = resolvePlayerGraphNodeClient(null, true);
    var toNode = resolvePlayerGraphNodeClient(targetPlayer, false);
    var v = V();

    if (fromNode === toNode) {
      var cn0 = PASSAGE_CN[fromNode] || fromNode;
      return {
        minutes: 1,
        seconds: 60,
        walkMinutes: 1,
        method: "同区域切入",
        shortTag: "0:01",
        pathCn: [cn0],
        routeSummary: cn0
      };
    }

    var walkRes = runDijkstraClient(fromNode, toNode, WALK_EDGES, 1.0);
    var best = { minutes: walkRes.minutes, path: walkRes.path, method: "徒步", shortMethod: "徒步" };

    var canBus = (Number(v.money) || 0) >= 100 && (Number(v.exposed) || 0) <= 0;
    if (canBus) {
      var busEdges = WALK_EDGES.slice();
      for (var i = 0; i < BUS_STOPS.length; i++) {
        for (var j = i + 1; j < BUS_STOPS.length; j++) {
          busEdges.push([BUS_STOPS[i], BUS_STOPS[j], 4]);
        }
      }
      var busRes = runDijkstraClient(fromNode, toNode, busEdges, 1.0);
      if (busRes.minutes < best.minutes) {
        best = { minutes: busRes.minutes, path: busRes.path, method: "乘坐巴士", shortMethod: "巴士" };
      }
    }

    var hasWings = (Number(v.harpy) >= 6) || (Number(v.angel) >= 6) || (Number(v.demon) >= 6) || (Number(v.fallenangel) >= 2);
    if (hasWings) {
      var flyRes = runDijkstraClient(fromNode, toNode, WALK_EDGES, 0.5);
      if (flyRes.minutes < best.minutes) {
        best = { minutes: flyRes.minutes, path: flyRes.path, method: "展翼滑翔", shortMethod: "滑翔" };
      }
    }

    var hasSprint = (Number(v.wolfgirl) >= 6) || (Number(v.cat) >= 6) || (Number(v.fox) >= 6) || (Number(v.cow) >= 6) || (Number(v.physique) >= 16000);
    if (hasSprint) {
      var spRes = runDijkstraClient(fromNode, toNode, WALK_EDGES, 0.7);
      if (spRes.minutes < best.minutes) {
        best = { minutes: spRes.minutes, path: spRes.path, method: "全速疾奔", shortMethod: "疾奔" };
      }
    }

    var pathCn = best.path.map(function (n) { return PASSAGE_CN[n] || n; });
    var mm = String(best.minutes).padStart(2, "0");
    return {
      minutes: best.minutes,
      seconds: best.minutes * 60,
      walkMinutes: walkRes.minutes,
      method: best.method,
      shortTag: "0:" + mm,
      pathCn: pathCn,
      routeSummary: pathCn.join(" → ")
    };
  }

  var S = {
    ws: null,
    id: null,
    connected: false,
    manualClose: false,
    players: new Map(),
    trades: new Map(),
    acts: new Map(),
    chat: [],
    retryTimer: null,
    name: localStorage.getItem(LS_NAME) || ("玩家" + Math.floor(Math.random() * 900 + 100)),
    server: localStorage.getItem(LS_SERVER) || DEFAULT_SERVER,
    room: null,
    roomCode: localStorage.getItem(LS_ROOM) || "",
    wasHost: localStorage.getItem(LS_HOST) === "1",
    isHost: false,
    needApproval: true,
    joinRequests: new Map(),
    pendingJoin: null,
    uiReady: false,

    clock: { timeStamp: 25260, speed: 1, running: false },
    prng: null,
    syncMode: false,
    showTimelinePicker: false,
    myVotedIndex: -1,
    currentVotes: [],
    bypassLinkIntercept: false,
    pendingMeetInvite: null,
    pendingConsentInvite: null,
    pendingSyncInvite: null,
    interactTarget: null,
    relations: loadRelationsFromStorage(),
    companion: loadCompanionFromStorage(),

    combatId: "",
    combatMode: "pvp",
    combatOpponent: null,
    combatIsPvp: false,
    combatFighters: {},
    combatSharedEnemy: null,
    combatLockedTargetId: "",
    combatLockedTargetName: "",
    combatTurnReady: false,
    combatReadyIds: [],
    combatTotalNeeded: 2,
    bypassCombatNextIntercept: false,
    lastCombatCommit: null,
    _preTurnBackup: null,
    combatSwapPose: false,
    combatSwapOrder: false,
    pendingPeerCombatTurns: [],
    lastChannelTip: "双方都点击 Next 后将同步结算本回合动作",

    _lastState: "",
    _multiCanvasHooked: false,
    _personHookInstalled: false,
    _lastInCombat: false,
    _combatPendingAt: 0,
    _passageHistory: [],
    _lastEventReport: "",
    _lastInlineDomReport: "",
    _syncJumpPassage: "",
    _mpFinishedAt: 0,
    _mpRedirecting: false,
    _navByUs: false,
    _suppressEventPick: false,
    _eventHookInstalled: false,
    _pronounRetryGuard: false,
    lastEventPick: null,
    lastEventContext: null
  };

  function V() { return (window.State && State.variables) || {}; }
  function T() { return (window.State && State.temporary) || {}; }

  /* ---------------- 关系与恋爱阶级数据持久化（原版 DoL 1点1点递增 + 每日次数限制） ---------------- */

  var DAILY_INTERACT_LIMITS = {
    chat: 2,
    flirt: 2,
    rest: 2,
    snack: 2,
    care: 2,
    kiss: 2,
    sing: 2,
    nuzzle: 2,
    wing_tease: 1,
    jealous_ask: 1,
    jealous_calm: 1,
    bath: 1,
    bath_climax: 1,
    whisper_lewd: 1,
    expose_tease: 1,
    sex_toys: 1,
    sex_toys_climax: 1,
    sub: 1,
    sub_climax: 1,
    lactate: 1,
    combat_afterglow: 2,
    companion_talk: 2,
    companion_study: 2,
    companion_cuddle: 2,
    companion_walk: 1,
    companion_kiss: 2,
    companion_lewd: 1
  };

  function loadRelationsFromStorage() {
    try {
      var raw = localStorage.getItem(LS_REL);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveRelationsToStorage() {
    try {
      localStorage.setItem(LS_REL, JSON.stringify(S.relations || {}));
    } catch (e) {}
  }

  function getPeerRelKey(p) {
    if (!p) return "default";
    return String(p.name || p.id || "default").trim();
  }

  function getRel(peerOrName) {
    var key = typeof peerOrName === "string" ? peerOrName : getPeerRelKey(peerOrName);
    if (!key) key = "default";
    var v = V();
    if (v && v.mpRelations && v.mpRelations[key]) {
      S.relations[key] = Object.assign({}, S.relations[key] || {}, v.mpRelations[key]);
    }
    if (!S.relations[key]) {
      S.relations[key] = {
        love: 0,
        trust: 0,
        lust: 0,
        jealousy: 0,
        corruption: 0,
        stage: "stranger"
      };
    }
    var r = S.relations[key];
    if (r.stage !== "lover" && r.stage !== "soulmate") {
      if (r.love >= 15 || r.lust >= 18) r.stage = "crush";
      else if (r.love >= 5) r.stage = "friend";
      else r.stage = "stranger";
    }
    if (v) {
      if (!v.mpRelations) v.mpRelations = {};
      v.mpRelations[key] = clone(r);
    }
    return r;
  }

  function normalizeVanillaStep(val, isMilestone) {
    var n = Number(val) || 0;
    if (n === 0) return 0;
    if (isMilestone) {
      return n > 0 ? Math.min(3, Math.max(1, Math.round(n / 8))) : Math.max(-3, Math.min(-1, Math.round(n / 8)));
    }
    if (n > 0) {
      return n >= 15 ? 2 : 1;
    }
    return n <= -12 ? -2 : -1;
  }

  function checkAndRecordDailyInteract(kind) {
    if (!kind) return true;
    var v = V();
    if (!v) return true;
    if (!v.daily || typeof v.daily !== "object") v.daily = {};
    if (!v.daily.mpInteractCounts || typeof v.daily.mpInteractCounts !== "object") {
      v.daily.mpInteractCounts = {};
    }
    var limit = DAILY_INTERACT_LIMITS[kind] || 1;
    var used = Number(v.daily.mpInteractCounts[kind]) || 0;
    if (used >= limit) {
      return false;
    }
    v.daily.mpInteractCounts[kind] = used + 1;
    return true;
  }

  function canDoDailyInteract(kind) {
    if (!kind) return true;
    var v = V();
    if (!v || !v.daily || !v.daily.mpInteractCounts) return true;
    var limit = DAILY_INTERACT_LIMITS[kind] || 1;
    var used = Number(v.daily.mpInteractCounts[kind]) || 0;
    return used < limit;
  }

  function updateRel(peerOrName, delta, milestoneStage, interactKind, skipDailyCheck) {
    var r = getRel(peerOrName);
    var isMilestone = (milestoneStage === "lover" || milestoneStage === "soulmate");
    var allowGain = isMilestone || skipDailyCheck || checkAndRecordDailyInteract(interactKind);

    if (allowGain && delta && typeof delta === "object") {
      if (delta.love) r.love = Math.max(0, Math.min(100, (r.love || 0) + normalizeVanillaStep(delta.love, isMilestone)));
      if (delta.trust) r.trust = Math.max(0, Math.min(100, (r.trust || 0) + normalizeVanillaStep(delta.trust, isMilestone)));
      if (delta.lust) r.lust = Math.max(0, Math.min(100, (r.lust || 0) + normalizeVanillaStep(delta.lust, isMilestone)));
      if (delta.jealousy) r.jealousy = Math.max(0, Math.min(100, (r.jealousy || 0) + normalizeVanillaStep(delta.jealousy, isMilestone)));
      if (delta.corruption) r.corruption = Math.max(0, Math.min(100, (r.corruption || 0) + normalizeVanillaStep(delta.corruption, isMilestone)));
    }
    if (milestoneStage === "lover" || milestoneStage === "soulmate") {
      r.stage = milestoneStage;
    } else if (r.stage !== "lover" && r.stage !== "soulmate") {
      if (r.love >= 15 || r.lust >= 18) r.stage = "crush";
      else if (r.love >= 5) r.stage = "friend";
    }
    var key = typeof peerOrName === "string" ? peerOrName : getPeerRelKey(peerOrName);
    var v = V();
    if (v) {
      if (!v.mpRelations) v.mpRelations = {};
      v.mpRelations[key] = clone(r);
    }
    saveRelationsToStorage();
    syncCompanionToVariables();
    return r;
  }

  function stageLabelCn(stage) {
    switch (stage) {
      case "soulmate": return "誓约伴侣";
      case "lover": return "恋人";
      case "crush": return "暧昧";
      case "friend": return "密友";
      default: return "初识";
    }
  }

  function renderRelationshipBannerHtml() {
    var v = V();
    var targetName = (S.interactTarget && S.interactTarget.name) || (v && v.mpInteractTargetName) || (S.companion && S.companion.name) || "同伴";
    var r = getRel(targetName);
    return [
      '<div class="mp-rel-title">' + escapeHtml(targetName) + ' · ' + stageLabelCn(r.stage) + '</div>',
      '<div class="mp-rel-stats">',
      '<span class="mp-rel-pill" style="color:#65f08e;">爱意 ' + r.love + '/100</span>',
      '<span class="mp-rel-pill" style="color:#64d8cb;">信任 ' + r.trust + '/100</span>',
      '<span class="mp-rel-pill" style="color:#ff85c0;">性欲 ' + r.lust + '/100</span>',
      '<span class="mp-rel-pill" style="color:#c78cff;">占有 ' + r.jealousy + '/100</span>',
      '<span class="mp-rel-pill" style="color:#ff9f5a;">共鸣 ' + r.corruption + '/100</span>',
      '</div>'
    ].join("");
  }

  /* ---------------- 离线伴侣 NPC 持久化与日程/性格差分系统 ---------------- */

  function loadCompanionFromStorage() {
    try {
      var raw = localStorage.getItem(LS_COMPANION);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      name: "艾琳",
      pronoun: "f",
      gender: "f",
      attitude: "meek",
      hairColour: "silver",
      eyeColour: "purple",
      skinColour: "light",
      questStage: 0,
      hasMet: 1
    };
  }

  function saveCompanionToStorage() {
    try {
      localStorage.setItem(LS_COMPANION, JSON.stringify(S.companion || {}));
    } catch (e) {}
  }

  function updateCompanionFromOnlinePlayer(p) {
    if (!p || !p.name) return;
    var snap = p.combatSnapshot || {};
    var pl = snap.player || {};
    var app = p.appearance || {};
    var pronoun = (pl.sex === "m" || pl.gender_appearance === "m" || app.sex === "m") ? "m" : "f";
    var gender = ["m", "f", "h"].indexOf(pl.sex || app.sex) >= 0 ? (pl.sex || app.sex) : pronoun;
    var att = p.speechAttitude || "neutral";
    if (!att || ["meek", "bratty", "neutral"].indexOf(att) < 0) {
      var st = p.stats || {};
      if ((st.skulduggery || 0) >= 400 || (st.physique || 0) >= 15000) att = "bratty";
      else if ((st.willpower || 0) <= 450) att = "meek";
      else att = "neutral";
    }
    S.companion = Object.assign({}, S.companion || {}, {
      id: p.id,
      name: p.name,
      pronoun: pronoun,
      gender: gender,
      attitude: att,
      hairColour: app.hairColour || snap.haircolour || "silver",
      eyeColour: app.eyeColour || snap.leftEyeColour || "purple",
      skinColour: app.skinColour || snap.skinColour || "light",
      combatSnapshot: snap,
      stats: p.stats || {},
      hasMet: 1,
      updatedAt: Date.now()
    });
    saveCompanionToStorage();
    syncCompanionToVariables();
  }

  function getCompanionScheduledLocations() {
    var hour = 12;
    var weekDay = 1;
    try {
      if (window.Time) {
        hour = Number.isFinite(Time.hour) ? Time.hour : 12;
        weekDay = Number.isFinite(Time.weekDay) ? Time.weekDay : 1;
      }
    } catch (e) {}
    var isSchoolDay = (weekDay >= 2 && weekDay <= 6);
    if (hour >= 6 && hour < 9) {
      return ["Orphanage", "Bedroom", "Domus Street"];
    }
    if (hour >= 9 && hour < 16) {
      if (isSchoolDay) {
        return ["Hallways", "School Library", "Canteen", "School Front Courtyard", "Oxford Street"];
      }
      return ["Orphanage", "Garden", "Park", "High Street", "Beach", "Starfish Street"];
    }
    if (hour >= 16 && hour < 22) {
      return ["Orphanage", "Bedroom", "Garden", "Bathroom", "Park"];
    }
    return ["Orphanage", "Bedroom"];
  }

  function syncCompanionToVariables() {
    var v = V();
    if (!v) return;
    if (v.mpCompanion && v.mpCompanion.name && (!S.companion || !S.companion.updatedAt)) {
      S.companion = Object.assign({}, S.companion, v.mpCompanion);
    }
    var comp = S.companion || loadCompanionFromStorage();
    var rel = getRel(comp.name || "艾琳");
    var personaVariant = comp.attitude || "neutral";
    if (rel.jealousy >= 20) personaVariant = "possessive";
    else if (rel.corruption >= 20 || (Number(v.promiscuity) || 0) >= 55) personaVariant = "corrupt";

    v.mpCompanion = Object.assign({}, v.mpCompanion || {}, {
      name: comp.name || "艾琳",
      pronoun: comp.pronoun === "m" ? "m" : "f",
      gender: ["m", "f", "h"].indexOf(comp.gender) >= 0 ? comp.gender : (comp.pronoun === "m" ? "m" : "f"),
      attitude: comp.attitude || "meek",
      persona: personaVariant,
      hairColour: comp.hairColour || "silver",
      eyeColour: comp.eyeColour || "purple",
      love: rel.love || 0,
      trust: rel.trust || 0,
      lust: rel.lust || 0,
      jealousy: rel.jealousy || 0,
      corruption: rel.corruption || 0,
      stage: rel.stage || "stranger",
      activeLocations: getCompanionScheduledLocations(),
      isPartnerOnline: S.players.size > 0
    });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  /* ---------------- 基础 DOM 与原版图标工具 ---------------- */

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === "class") n.className = props[k];
      else if (k === "text") n.textContent = props[k];
      else if (k === "html") n.innerHTML = props[k];
      else if (k === "onclick") n.addEventListener("click", props[k]);
      else if (k === "onchange") n.addEventListener("change", props[k]);
      else if (k in n) n[k] = props[k];
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function dolIconImg(relPath) {
    var img = el("img", {
      class: "icon",
      src: relPath,
      style: "width:16px;height:16px;vertical-align:middle;margin-right:3px;"
    });
    img.addEventListener("error", function () { img.style.display = "none"; });
    return img;
  }

  function toast(text, kind) {
    var box = document.getElementById("mp-toasts");
    if (!box) { box = el("div", { id: "mp-toasts", class: "mp-toasts" }); document.body.appendChild(box); }
    var t = el("div", { class: "mp-toast " + (kind || ""), text: text });
    box.appendChild(t);
    setTimeout(function () { t.classList.add("mp-fade"); }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3900);
  }

  function logLine(text, cls) {
    S.chat.push({ text: text, cls: cls || "" });
    if (S.chat.length > 200) S.chat.shift();
    renderChat();
  }

  function send(obj) { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(obj)); }
  function setStatus(text, cls) {
    var s = document.getElementById("mp-status");
    if (s) { s.textContent = text; s.className = "mp-status " + (cls || ""); }
  }
  function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }

  /* ---------------- 玩家真名与破处（takeVirginity）底层拦截钩子 ---------------- */

  function takeVirginityByPlayer(playerName, part) {
    var v = V();
    if (!v || !v.player || !v.player.virginity || !playerName || !part) return;
    if (v.player.virginity[part] !== true) return;
    var safeName = String(playerName).replace(/["\\<>]/g, "").trim();
    if (!safeName) return;
    try {
      if (window.Wikifier && typeof Wikifier.wikifyEval === "function") {
        Wikifier.wikifyEval('<<takeVirginity "' + safeName + '" "' + part + '">>');
      }
    } catch (e) {}
    if (v.player.virginity[part] === true || v.player.virginity[part] === false) {
      v.player.virginity[part] = safeName;
    }
    if (v.player.virginityDetails && v.player.virginityDetails[part]) {
      v.player.virginityDetails[part].taker = safeName;
    }
  }

  function applyPvpPlayerNameToNpc(npc, oppName) {
    if (!npc || !oppName) return;
    var v = V();
    npc.mpPlayerName = oppName;
    npc.name = oppName;
    npc.name_known = 1;
    npc.description = oppName;
    npc.description_CN = oppName;
    npc.fullDescription = oppName;
    npc.fullDescription_CN = oppName;
    npc.role = "normal";
    npc.role_CN = "";
    if (v) {
      v.npc_named = 1;
      v.description = oppName;
      v.description_CN = oppName;
      v.role = "normal";
    }
  }

  function installPersonNameHook() {
    if (S._personHookInstalled) return;
    var M = window.Macro || (window.SugarCube && window.SugarCube.Macro);
    if (!M || typeof M.get !== "function" || typeof M.add !== "function" || typeof M.delete !== "function") return;

    function wrapMacro(macroName, afterFn, overrideOutputFn) {
      try {
        var def = M.get(macroName);
        if (!def || typeof def.handler !== "function" || def._mpWrapped) return;
        var orig = def.handler;
        M.delete(macroName);
        var nextDef = Object.assign({}, def, {
          _mpWrapped: true,
          handler: function () {
            var v = V();
            var idx = (v && Number.isFinite(v.index)) ? v.index : 0;
            var npc = (v && Array.isArray(v.NPCList)) ? v.NPCList[idx] : null;
            var pName = (npc && npc.mpPlayerName) || ((v && v.mpCombatMode === "pvp" && idx === 0 && v.mpOpponentName) ? v.mpOpponentName : "");
            if (pName && overrideOutputFn) {
              var outTxt = overrideOutputFn(pName, this.args);
              if (outTxt !== null) {
                jQuery(this.output).wiki(outTxt);
                return;
              }
            }
            var res = orig.apply(this, arguments);
            if (afterFn) afterFn.call(this, v, pName);
            return res;
          }
        });
        M.add(macroName, nextDef);
      } catch (e) {}
    }

    wrapMacro("personselect", function (v) {
      if (!v || !Array.isArray(v.NPCList)) return;
      var idx = Number.isFinite(v.index) ? v.index : 0;
      var npc = v.NPCList[idx];
      var pName = (npc && npc.mpPlayerName) || ((v.mpCombatMode === "pvp" && idx === 0 && v.mpOpponentName) ? v.mpOpponentName : "");
      if (pName && npc) {
        applyPvpPlayerNameToNpc(npc, pName);
      }
    }, null);

    wrapMacro("person", null, function (pName) { return pName; });
    wrapMacro("persons", null, function (pName) { return pName + "的"; });
    wrapMacro("personsimple", null, function (pName) { return pName; });
    wrapMacro("personssimple", null, function (pName) { return pName + "的"; });
    wrapMacro("combatperson", null, function (pName) { return pName; });
    wrapMacro("combatpersons", null, function (pName) { return pName + "的"; });

    wrapMacro("takeVirginity", function (v) {
      if (!v || !v.player || !v.player.virginity) return;
      var pName = (v.NPCList && v.NPCList[0] && v.NPCList[0].mpPlayerName) || (v.mpCombatMode === "pvp" ? v.mpOpponentName : "");
      if (!pName) return;
      var part = this.args && this.args[1];
      if (part && typeof v.player.virginity[part] === "string" && v.player.virginity[part] !== pName) {
        v.player.virginity[part] = pName;
        if (v.player.virginityDetails && v.player.virginityDetails[part]) {
          v.player.virginityDetails[part].taker = pName;
        }
      }
    }, null);

    S._personHookInstalled = true;
  }

  /* ---------------- 事件上下文与原版遭遇战 $NPCList 完整快照 ---------------- */

  function extractEventContext() {
    var v = V();
    if (!v) return null;
    var activeNpcs = [];
    if (Array.isArray(v.NPCList)) {
      for (var i = 0; i < Math.min(6, v.NPCList.length); i++) {
        var npc = v.NPCList[i];
        if (npc && typeof npc === "object" && npc.pronoun && npc.pronoun !== "none") {
          activeNpcs.push(clone(npc));
        } else {
          activeNpcs.push(null);
        }
      }
    }
    return {
      phase: v.phase,
      phase2: v.phase2,
      rng: v.rng,
      index: v.index,
      pronoun: v.pronoun,
      description: v.description,
      description_CN: v.description_CN,
      role: v.role,
      npc_named: v.npc_named,
      npc: Array.isArray(v.npc) ? clone(v.npc) : [],
      npcrow: Array.isArray(v.npcrow) ? clone(v.npcrow) : [],
      npcnum: Array.isArray(v.npcnum) ? clone(v.npcnum) : [],
      enemyno: v.enemyno,
      enemynomax: v.enemynomax,
      enemytype: v.enemytype,
      activeNpcs: activeNpcs
    };
  }

  function applyEventContext(ctx) {
    if (!ctx || typeof ctx !== "object") return;
    S.lastEventContext = ctx;
    var v = V();
    if (!v) return;
    try {
      if (ctx.phase !== undefined) v.phase = ctx.phase;
      if (ctx.phase2 !== undefined) v.phase2 = ctx.phase2;
      if (Number.isFinite(ctx.rng)) v.rng = ctx.rng;
      if (Array.isArray(ctx.npc) && ctx.npc.length > 0) v.npc = clone(ctx.npc);
      if (Array.isArray(ctx.npcrow)) v.npcrow = clone(ctx.npcrow);
      if (Array.isArray(ctx.npcnum)) v.npcnum = clone(ctx.npcnum);
      if (ctx.description !== undefined) v.description = ctx.description;
      if (ctx.description_CN !== undefined) v.description_CN = ctx.description_CN;
      if (ctx.role !== undefined) v.role = ctx.role;
      if (ctx.npc_named !== undefined) v.npc_named = ctx.npc_named;
      if (Array.isArray(ctx.activeNpcs) && Array.isArray(v.NPCList)) {
        var hasValid = false;
        for (var i = 0; i < ctx.activeNpcs.length; i++) {
          if (ctx.activeNpcs[i] && ctx.activeNpcs[i].pronoun) {
            v.NPCList[i] = Object.assign(v.NPCList[i] || {}, clone(ctx.activeNpcs[i]));
            hasValid = true;
          }
        }
        if (hasValid) {
          if (ctx.index !== undefined) v.index = ctx.index;
          if (ctx.pronoun) v.pronoun = ctx.pronoun;
          if (ctx.enemyno !== undefined) v.enemyno = ctx.enemyno;
          if (ctx.enemynomax !== undefined) v.enemynomax = ctx.enemynomax;
          if (ctx.enemytype) v.enemytype = ctx.enemytype;
          if (!v.pronoun && window.Wikifier && typeof Wikifier.wikifyEval === "function") {
            Wikifier.wikifyEval("<<person1>>");
          }
        }
      }
    } catch (e) {}
  }

  function cleanupNativeCombatState() {
    var v = V();
    if (!v) return;
    try {
      if (v.combat === 1 && window.Wikifier && typeof Wikifier.wikifyEval === "function") {
        Wikifier.wikifyEval("<<clotheson>><<endcombat>><<endevent>>");
      }
    } catch (e) {}
    v.combat = 0;
    v.molestationstart = 0;
    v.sexstart = 0;
    v.fightstart = 0;
    v.eventskip = 1;
    delete v.mpForceCombatEnd;
    delete v.mpCombatOutcome;
    delete v.mpPeerActiveSexKind;
  }

  function enginePlay(name) {
    var e = window.Engine || (window.SugarCube && window.SugarCube.Engine);
    if (e && typeof e.play === "function") {
      S.bypassLinkIntercept = true;
      S._navByUs = true;
      try { e.play(name); } finally {
        S.bypassLinkIntercept = false;
        setTimeout(function () { S._navByUs = false; }, 0);
      }
      return true;
    }
    return false;
  }

  function shortLoc(p) {
    if (!p) return "未知位置";
    return PASSAGE_CN[p] || p;
  }

  function findSafeReturnPassage(strict) {
    var hist = S._passageHistory || [];
    for (var i = hist.length - 1; i >= 0; i--) {
      if (SAFE_PASSAGES.indexOf(hist[i]) >= 0) return hist[i];
    }
    if (strict) return "Orphanage";
    for (var j = hist.length - 1; j >= 0; j--) {
      var p = hist[j] || "";
      if (!p) continue;
      if (p === MP_COMBAT_PASSAGE || p === "MP Native Combat Finish" || p === "Tutorial") continue;
      if (p === "Start" || p === "Start2" || p === "Orphanage Intro") continue;
      if (p.indexOf("MP ") === 0) continue;
      return p;
    }
    return "Orphanage";
  }

  /* ---------------- 同一页面上的随机事件同步（<<runeventpool>> + 大世界隐藏随机事件注入） ---------------- */

  var COOP_INLINE_EVENTS = [
    { name: "mp_coop_alley_ambush", weight: 0.35, content: "<<include \"MP Event Alley Ambush\">>" },
    { name: "mp_coop_sudden_downpour", weight: 0.35, content: "<<include \"MP Event Sudden Downpour\">>" },
    { name: "mp_coop_street_busking", weight: 0.35, content: "<<include \"MP Event Street Busking\">>" },
    { name: "mp_coop_wardrobe_malfunction", weight: 0.35, content: "<<include \"MP Event Wardrobe Malfunction\">>" },
    { name: "mp_coop_cafe_parttime", weight: 0.35, content: "<<include \"MP Event Cafe PartTime\">>" },
    { name: "mp_coop_night_comfort", weight: 0.35, content: "<<include \"MP Event Night Nightmare Comfort\">>" },
    { name: "mp_coop_temple_blessing", weight: 0.35, content: "<<include \"MP Event Temple Blessing\">>" }
  ];

  // 按场景与属性无提示触发的大世界随机事件池（单人与联机均可在满足隐藏条件时自然抽中）
  var WORLD_PASSIVE_EVENTS = [
    { name: "mp_world_loose_cobble", weight: 0.35, locs: ["Domus Street", "Barb Street", "Danube Street", "Residential Alleyways"], content: "<<include \"MP World Event Loose Cobble\">>" },
    { name: "mp_world_curio_peddler", weight: 0.35, locs: ["High Street", "Connudatus Street", "Starfish Street", "Commercial Alleyways"], content: "<<include \"MP World Event Curio Peddler\">>" },
    { name: "mp_world_smuggler_drop", weight: 0.35, locs: ["Mer Street", "Elk Street", "Harvest Street", "Docks", "Industrial Alleyways"], minSkul: 150, content: "<<include \"MP World Event Smuggler Drop\">>" },
    { name: "mp_world_driftwood_chest", weight: 0.35, locs: ["Beach", "Sea Rocks", "Beach Cave"], content: "<<include \"MP World Event Driftwood Chest\">>" },
    { name: "mp_world_forest_shrine", weight: 0.35, locs: ["Forest", "Deep Forest"], content: "<<include \"MP World Event Forest Shrine\">>" },
    { name: "mp_world_park_sketchbook", weight: 0.35, locs: ["Park", "Nightingale Street", "Oxford Street"], content: "<<include \"MP World Event Park Sketchbook\">>" },
    { name: "mp_world_temple_censer", weight: 0.35, locs: ["Wolf Street", "Temple"], content: "<<include \"MP World Event Temple Censer\">>" },
    { name: "mp_world_sewer_cache", weight: 0.4, locs: ["Sewers", "Commercial Alleyways", "Industrial Alleyways"], minSkul: 200, content: "<<include \"MP World Event Sewer Cache\">>" }
  ];

  function makeDeterministicPrngPack() {
    var s = [];
    for (var i = 0; i < 16; i++) s.push(Math.floor(Math.random() * 256));
    return {
      rng: Math.floor(Math.random() * 100) + 1,
      seedStr: s.join(",")
    };
  }

  function onEventPicked(name, content, eventPrng) {
    if (!name && !content) return;
    S.lastEventPick = {
      name: name || "inline_event",
      content: content || "",
      passage: (window.State && State.passage) || "",
      at: Date.now()
    };
    if (S.syncMode && S.connected && S.room && !S._suppressEventPick) {
      send({
        t: "event_pick",
        name: S.lastEventPick.name,
        content: S.lastEventPick.content,
        passage: S.lastEventPick.passage,
        prng: eventPrng || S.prng,
        eventContext: extractEventContext()
      });
    }
  }

  function installEventPoolHook() {
    if (S._eventHookInstalled) return;
    var M = window.Macro || (window.SugarCube && window.SugarCube.Macro);
    if (!M || typeof M.get !== "function" || typeof M.add !== "function" || typeof M.delete !== "function") return;
    var def = null;
    try { def = M.get("runeventpool"); } catch (e) { def = null; }
    if (!def || typeof def.handler !== "function") return;
    var orig = def.handler;
    try {
      M.delete("runeventpool");
      M.add("runeventpool", {
        skipArgs: true,
        handler: function () {
          var vv = V(), tt = T();
          if (vv && vv.mpForceEventOnce) {
            delete vv.mpForceEventOnce;
            vv.eventforced = 0;
          }
          var curPasNow = (window.State && State.passage) || "";
          if (tt && Array.isArray(tt.eventpool) && vv) {
            // 注入符合当前街道与隐藏属性条件的大世界奇遇事件
            var mySkul = Number(vv.skulduggery) || 0;
            WORLD_PASSIVE_EVENTS.forEach(function (wev) {
              if (wev.locs.indexOf(curPasNow) >= 0 && (!wev.minSkul || mySkul >= wev.minSkul)) {
                if (!tt.eventpool.some(function (x) { return x.name === wev.name; })) {
                  tt.eventpool.push({ name: wev.name, weight: wev.weight, content: wev.content });
                }
              }
            });
            // 组队同行时注入双人随机事件
            if (S.syncMode && getSameSceneGroupedPeers().length > 0) {
              COOP_INLINE_EVENTS.forEach(function (evObj) {
                if (!tt.eventpool.some(function (x) { return x.name === evObj.name; })) {
                  tt.eventpool.push({ name: evObj.name, weight: evObj.weight, content: evObj.content });
                }
              });
            }
          }
          if (!S.syncMode && (!vv || (vv.eventPoolOverride === undefined && !vv.eventPoolOverrideContent))) {
            if (SAFE_PASSAGES.indexOf(curPasNow) >= 0 && vv) vv.mpReturnPassage = curPasNow;
            return orig.call(this);
          }
          var pick = null;
          var usedPrng = null;
          try {
            if (!tt || !Array.isArray(tt.eventpool)) return orig.call(this);
            if (vv.eventPoolOverridePrng) {
              usedPrng = vv.eventPoolOverridePrng;
              applySharedPrng(usedPrng);
              delete vv.eventPoolOverridePrng;
            }
            if (vv.eventPoolOverride !== undefined) {
              pick = tt.eventpool.find(function (e) { return e.name === vv.eventPoolOverride; });
              if (!pick && vv.eventPoolOverrideContent) {
                pick = { name: vv.eventPoolOverride || "mp_synced_event", content: vv.eventPoolOverrideContent };
              }
              delete vv.eventPoolOverride;
              delete vv.eventPoolOverrideContent;
            }
            if (!pick) {
              pick = window.rollWeightedRandomFromArray(tt.eventpool);
              if (pick && S.syncMode && !S._suppressEventPick) {
                usedPrng = S.prng || makeDeterministicPrngPack();
                applySharedPrng(usedPrng);
              }
            }
            if (!pick) return orig.call(this);
          } catch (e) {
            return orig.call(this);
          }
          try {
            if (SAFE_PASSAGES.indexOf(curPasNow) >= 0) vv.mpReturnPassage = curPasNow;
            jQuery(this.output).wiki(pick.content);
          } catch (e) {
            return orig.call(this);
          }
          try { onEventPicked(pick.name || "inline_event", pick.content || "", usedPrng); } catch (e) {}
        }
      });
      S._eventHookInstalled = true;
    } catch (e) {
      try { M.add("runeventpool", def); } catch (e2) {}
    }
  }

  function relativeTimeStr(ts) {
    if (!ts) return "刚刚";
    var diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    if (diffMin <= 0) return "刚刚";
    return diffMin + "分钟前";
  }

  function formatTimestampClock(ts) {
    var sec = Number.isFinite(ts) ? Number(ts) : 25260;
    var totalMin = Math.floor(sec / 60);
    var h = ((Math.floor(totalMin / 60) % 24) + 24) % 24;
    var m = ((totalMin % 60) + 60) % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  var MAP_POINTS = {
    "domus street": { x: 16, y: 63 }, "domus": { x: 16, y: 63 }, "orphanage": { x: 16, y: 63 },
    "barb street": { x: 53, y: 26 }, "barb": { x: 53, y: 26 },
    "danube street": { x: 53, y: 100 }, "danube": { x: 53, y: 100 },
    "connudatus street": { x: 78, y: 63 }, "connudatus": { x: 78, y: 63 },
    "cliff street": { x: 103, y: 26 }, "cliff": { x: 103, y: 26 },
    "wolf street": { x: 103, y: 100 }, "wolf": { x: 103, y: 100 },
    "high street": { x: 129, y: 63 }, "high": { x: 129, y: 63 },
    "starfish street": { x: 161, y: 26 }, "starfish": { x: 161, y: 26 }, "beach": { x: 161, y: 14 },
    "nightingale street": { x: 161, y: 100 }, "nightingale": { x: 161, y: 100 },
    "oxford street": { x: 191, y: 63 }, "oxford": { x: 191, y: 63 }, "school": { x: 191, y: 63 },
    "mer street": { x: 219, y: 26 }, "mer": { x: 219, y: 26 },
    "elk street": { x: 219, y: 100 }, "elk": { x: 219, y: 100 },
    "harvest street": { x: 245, y: 63 }, "harvest": { x: 245, y: 63 },
    "residential alley": { x: 53, y: 63 }, "residential alleyways": { x: 53, y: 63 },
    "commercial alley": { x: 103, y: 63 }, "commercial alleyways": { x: 103, y: 63 },
    "park": { x: 161, y: 63 },
    "industrial alley": { x: 219, y: 63 }, "industrial alleyways": { x: 219, y: 63 }
  };

  function normalizeLoc(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  /* ---------------- 提取本地玩家的 DoL 原生战斗外观快照 ---------------- */

  function extractCombatSnapshot() {
    var v = V();
    var p = (v && v.player) || {};
    var wornSnap = {};
    var slots = ["over_upper", "over_lower", "upper", "lower", "under_upper", "under_lower", "over_head", "head", "face", "neck", "hands", "handheld", "legs", "feet", "genitals"];
    slots.forEach(function (sl) {
      if (v.worn && v.worn[sl]) {
        wornSnap[sl] = clone(v.worn[sl]);
      }
    });
    return {
      player: {
        sex: p.sex || "f",
        gender: p.gender || "f",
        gender_appearance: p.gender_appearance || "f",
        bodyshape: p.bodyshape || "classic",
        perceived_breastsize: p.perceived_breastsize || 3,
        breastsize: p.breastsize || 3,
        freckles: !!p.freckles,
        penisExist: !!p.penisExist,
        penissize: p.penissize || 2,
        vaginaExist: p.vaginaExist !== false,
        ballsExist: !!p.ballsExist,
        skin: clone(p.skin || { color: "light", layers: [] }),
        condom: clone(p.condom || { type: "", colour: "" })
      },
      worn: wornSnap,
      transformationParts: clone(v.transformationParts || {}),
      hairtype: v.hairtype || "default",
      fringetype: v.fringetype || "default",
      hairlengthstage: v.hairlengthstage || "short",
      fringelengthstage: v.fringelengthstage || "short",
      haircolour: v.haircolour || "brown",
      hairfringecolour: v.hairfringecolour || v.haircolour || "brown",
      hairColourStyle: v.hairColourStyle || "simple",
      hairFringeColourStyle: v.hairFringeColourStyle || "simple",
      hairColourGradient: clone(v.hairColourGradient || { style: "split", colours: ["red", "black"] }),
      hairFringeColourGradient: clone(v.hairFringeColourGradient || { style: "split", colours: ["red", "black"] }),
      naturalhaircolour: v.naturalhaircolour || "brown",
      leftEyeColour: v.leftEyeColour || v.eyeselect || "purple",
      rightEyeColour: v.rightEyeColour || v.eyeselect || "purple",
      skinColour: v.skinColour || "light",
      makeup: clone(v.makeup || { eyeshadow: 0, mascara: 0, lipstick: 0, blusher: 0, eyelenses: { left: 0, right: 0 } }),
      arousal: v.arousal || 100,
      pain: v.pain || 0,
      trauma: v.trauma || 0,
      tiredness: v.tiredness || 0
    };
  }

  /* ---------------- 双玩家立绘模型同屏交叠 ---------------- */

  function getActiveCombatPeer() {
    if (S.combatOpponent && S.combatOpponent.combatSnapshot) return S.combatOpponent;
    var sp = (window.State && State.passage) || "";
    var found = null;
    S.players.forEach(function (p) {
      if (!found && p.passage === sp && p.combatSnapshot) found = p;
    });
    return found;
  }

  function hookMultiCanvasModel() {
    if (S._multiCanvasHooked || !window.MultiCanvasModel || !MultiCanvasModel.prototype) return;
    S._multiCanvasHooked = true;

    var origCompile = MultiCanvasModel.prototype.compile;
    MultiCanvasModel.prototype.compile = function () {
      var v = V();
      var peer = (v && v.combat === 1) ? getActiveCombatPeer() : null;
      if (!peer || !peer.combatSnapshot || !window.CanvasModel || !window.PlayerCombatMapper) {
        return origCompile.apply(this, arguments);
      }

      try {
        this.layers = [];
        var models = this.models || {};
        var isPvp = (window.State && State.passage === MP_COMBAT_PASSAGE && v.mpCombatMode === "pvp") || S.combatIsPvp;

        var basePos = (v.position === "doggy" || v.position === "missionary") ? v.position : "missionary";
        var myPos = S.combatSwapPose ? (basePos === "missionary" ? "doggy" : "missionary") : basePos;
        var peerPos = (myPos === "missionary") ? "doggy" : "missionary";

        var pc0 = models.combatMainPc0;
        var myLayers = [];
        if (pc0) {
          var savedPos0 = v.position;
          try {
            v.position = myPos;
            pc0.options = pc0.defaultOptions();
            myLayers = pc0.compile(Object.assign(pc0.options, pc0.metadata || {}));
          } finally {
            v.position = savedPos0;
          }
        }

        var pc1 = CanvasModel.create("combatMainPc", "combatMainPc1");
        var peerLayers = [];
        var snap = peer.combatSnapshot;
        var backup = {};
        var keysToSwap = [
          "player", "worn", "transformationParts",
          "hairtype", "fringetype", "hairlengthstage", "fringelengthstage",
          "haircolour", "hairfringecolour", "hairColourStyle", "hairFringeColourStyle",
          "hairColourGradient", "hairFringeColourGradient", "naturalhaircolour",
          "leftEyeColour", "rightEyeColour", "skinColour", "makeup",
          "arousal", "pain", "trauma", "tiredness", "position"
        ];
        keysToSwap.forEach(function (k) { backup[k] = v[k]; });

        try {
          keysToSwap.forEach(function (k) {
            if (k === "position") {
              v.position = peerPos;
            } else if (k === "player" && snap.player) {
              v.player = Object.assign(clone(backup.player || {}), clone(snap.player));
              if (backup.player && backup.player.skin) {
                v.player.skin = Object.assign(clone(backup.player.skin), clone(snap.player.skin || {}));
              }
              if (backup.player && backup.player.condom) {
                v.player.condom = Object.assign(clone(backup.player.condom), clone(snap.player.condom || {}));
              }
            } else if (k === "worn" && snap.worn) {
              var mergedWorn = clone(backup.worn || {});
              Object.keys(snap.worn).forEach(function (slot) {
                if (snap.worn[slot] && snap.worn[slot].name && mergedWorn[slot]) {
                  mergedWorn[slot] = Object.assign(clone(mergedWorn[slot]), clone(snap.worn[slot]));
                }
              });
              v.worn = mergedWorn;
            } else if (k === "transformationParts") {
              if (snap.transformationParts && snap.transformationParts.traits) {
                v.transformationParts = clone(snap.transformationParts);
              }
            } else if (k === "makeup") {
              if (snap.makeup && snap.makeup.eyelenses) {
                v.makeup = clone(snap.makeup);
              }
            } else if (snap[k] !== undefined) {
              v[k] = clone(snap[k]);
            }
          });
          if (window.Skin && typeof Skin.recache === "function") Skin.recache();
          pc1.reset();
          pc1.options = pc1.defaultOptions();
          peerLayers = pc1.compile(pc1.options);
          var zShift = S.combatSwapOrder ? -15 : 15;
          peerLayers.forEach(function (ly) {
            if (typeof ly.z === "number") ly.z += zShift;
          });
        } catch (errPeer) {
          console.warn("DoL-MP peer combat compile warn:", errPeer);
        } finally {
          keysToSwap.forEach(function (k) { v[k] = backup[k]; });
          if (window.Skin && typeof Skin.recache === "function") Skin.recache();
        }

        this.layers.push.apply(this.layers, myLayers);
        this.layers.push.apply(this.layers, peerLayers);

        if (!isPvp) {
          for (var slot in models) {
            if (!Object.prototype.hasOwnProperty.call(models, slot) || slot === "combatMainPc0") continue;
            var m = models[slot];
            var extra = m.compile(Object.assign(m.options, m.metadata || {}));
            this.layers.push.apply(this.layers, extra);
          }
        }

        return this.layers;
      } catch (e) {
        console.error("DoL-MP MultiCanvasModel hook fallback:", e);
        return origCompile.apply(this, arguments);
      }
    };
  }

  function refreshCombatCanvas() {
    try {
      var t = T();
      if (t && t.multiCombatModels && t.multiCombatModels.combatMain) {
        t.multiCombatModels.combatMain.refresh();
        t.multiCombatModels.combatMain.refreshAnimation();
      }
    } catch (e) { console.warn(e); }
  }

  function getIndependentCombatStats(v) {
    var myF = (S.id && S.combatFighters && S.combatFighters[S.id]) || null;
    var oppId = S.combatOpponent && S.combatOpponent.id;
    var oppF = (oppId && S.combatFighters && S.combatFighters[oppId]) || null;

    var curPain = Math.min(100, Math.max(0, Number(v.pain) || 0));
    var myHpMax = (myF && myF.hpMax) || 275;
    var painMappedHp = curPain >= 100 ? 0 : Math.max(1, Math.round(myHpMax * (1 - curPain / 100)));
    var myHp = myF ? Math.max(0, Math.round(myF.hp)) : painMappedHp;

    var arMaxVar = Math.max(1000, Number(v.arousalmax) || 10000);
    var curAr = Math.min(arMaxVar, Math.max(0, Number(v.arousal) || 0));
    var myArMax = (myF && myF.arousalMax) || 500;
    var arMapped = Math.min(myArMax, Math.max(0, Math.round((curAr / arMaxVar) * myArMax)));
    var myAr = myF ? Math.max(0, Math.round(myF.arousal)) : arMapped;

    var oppHp = Math.max(0, Math.round(oppF ? oppF.hp : (v.enemyhealth != null ? v.enemyhealth : 275)));
    var oppHpMax = Math.max(1, Math.round((oppF && oppF.hpMax) || v.enemyhealthmax || 275));
    var oppAr = Math.max(0, Math.round(oppF ? oppF.arousal : (v.enemyarousal != null ? v.enemyarousal : 0)));
    var oppArMax = Math.max(1, Math.round((oppF && oppF.arousalMax) || v.enemyarousalmax || 500));

    return {
      myHp: myHp, myHpMax: myHpMax, myAr: myAr, myArMax: myArMax,
      oppHp: oppHp, oppHpMax: oppHpMax, oppAr: oppAr, oppArMax: oppArMax,
      myF: myF, oppF: oppF
    };
  }

  function renderCombatSyncHint() {
    var nextSpan = document.getElementById("next");
    if (!nextSpan) return;
    var hint = document.getElementById("mp-combat-sync-hint");
    if (!hint) {
      hint = el("div", {
        id: "mp-combat-sync-hint",
        style: "margin-top:6px;padding:5px 10px;border-radius:4px;font-size:0.92em;background:rgba(30,28,24,0.88);border:1px solid #6b5a3e;color:#ffd479;"
      });
      nextSpan.insertAdjacentElement("afterend", hint);
    }
    var oppName = (S.combatOpponent && S.combatOpponent.name) || "对方";
    var readyIds = S.combatReadyIds || [];
    var oppReady = S.combatOpponent && readyIds.indexOf(S.combatOpponent.id) >= 0;

    if (S.combatTurnReady) {
      hint.style.borderColor = "#e0a82e";
      hint.style.color = "#ffd479";
      hint.textContent = "已锁定本回合动作，正在等待 " + oppName + " 点击 Next 同步结算…";
    } else if (oppReady) {
      hint.style.borderColor = "#4fd07a";
      hint.style.color = "#8ff0a4";
      hint.textContent = oppName + " 已选好动作，请选择你的动作并点击 Next 同步结算。";
    } else {
      hint.style.borderColor = "#555";
      hint.style.color = "#c8bfa8";
      hint.textContent = "你与 " + oppName + " 都点击 Next 后将同时结算本回合动作。";
    }
  }

  function enhanceNativeCombatDOM() {
    var v = V();
    if (!v || v.combat !== 1) return;

    var mainBox = document.querySelector(".combat-main");
    if (mainBox && !document.getElementById("mp-combat-swap-box")) {
      var swapBox = el("div", { id: "mp-combat-swap-box", class: "mp-combat-swap-box" });
      swapBox.appendChild(el("button", {
        class: "mp-combat-swap-btn",
        title: "切换双人上下体位",
        text: "🔁",
        onclick: function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          S.combatSwapPose = !S.combatSwapPose;
          refreshCombatCanvas();
        }
      }));
      swapBox.appendChild(el("button", {
        class: "mp-combat-swap-btn",
        title: "切换双人前后图层顺序",
        text: "🔁",
        onclick: function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          S.combatSwapOrder = !S.combatSwapOrder;
          refreshCombatCanvas();
        }
      }));
      mainBox.appendChild(swapBox);
    }

    var repAct = document.getElementById("replaceAction");
    if (repAct && !document.getElementById("mp-combat-hud") && (S.combatOpponent || S.combatId)) {
      var st = getIndependentCombatStats(v);
      var hud = el("div", {
        id: "mp-combat-hud",
        style: "margin:6px 0 8px 0;padding:6px 10px;border:1px dashed #6b5a3e;border-radius:4px;background:rgba(24,22,20,0.82);font-size:0.92em;line-height:1.5;"
      });
      var oppLabel = (S.combatMode === "coop_pve" && S.combatSharedEnemy)
        ? (S.combatSharedEnemy.name || "袭击者")
        : ((S.combatOpponent && S.combatOpponent.name) || "对方");

      hud.appendChild(el("div", {
        style: "color:#e8dcc4;",
        text: "我方：体力 " + st.myHp + "/" + st.myHpMax + " · 兴奋 " + st.myAr + "/" + st.myArMax +
              " ｜ " + oppLabel + "：体力 " + st.oppHp + "/" + st.oppHpMax + " · 兴奋 " + st.oppAr + "/" + st.oppArMax
      }));

      if (S.combatMode === "coop_pve" && S.combatOpponent && S.combatFighters[S.combatOpponent.id]) {
        var mateF = S.combatFighters[S.combatOpponent.id];
        hud.appendChild(el("div", {
          style: "color:#a8d8ff;",
          text: (S.combatOpponent.name || "同伴") + "：体力 " + mateF.hp + "/" + mateF.hpMax + " · 兴奋 " + mateF.arousal + "/" + mateF.arousalMax
        }));
      }

      if (S.combatMode === "coop_pve" && S.combatLockedTargetName) {
        var lockedMe = (S.combatLockedTargetId === S.id);
        hud.appendChild(el("div", {
          style: lockedMe ? "color:#ff7b7b;" : "color:#7be098;",
          text: lockedMe
            ? ("敌方本回合正盯着你进攻，" + ((S.combatOpponent && S.combatOpponent.name) || "同伴") + " 正在旁侧协同反击。")
            : ("敌方本回合正扑向 " + S.combatLockedTargetName + "，你可从旁全力输出。")
        }));
      }

      if (v.consensual !== 1) {
        var poseBar = el("div", { style: "margin-top:4px;color:#d6c8b0;" });
        var targetPose = v.position === "doggy" ? "missionary" : "doggy";
        poseBar.appendChild(el("span", { text: "身体动作： " }));

        var rollLabel = el("label", { style: "cursor:pointer;margin-right:10px;" });
        var rollRadio = el("input", { type: "radio", name: "mp-bodyaction", value: targetPose });
        rollRadio.addEventListener("change", function () {
          if (rollRadio.checked) {
            v.bodyaction = targetPose;
            S.combatSwapPose = (targetPose === "doggy");
            refreshCombatCanvas();
          }
        });
        rollLabel.appendChild(document.createTextNode("翻身 "));
        rollLabel.appendChild(rollRadio);
        poseBar.appendChild(rollLabel);

        if (S.combatMode === "pvp") {
          var escLabel = el("label", { style: "cursor:pointer;margin-right:10px;color:#82cfff;" });
          var escRadio = el("input", { type: "radio", name: "mp-bodyaction", value: "mp_escape" });
          escRadio.addEventListener("change", function () {
            if (escRadio.checked) {
              v.bodyaction = "mp_escape";
            }
          });
          escLabel.appendChild(document.createTextNode("发力挣脱逃跑 "));
          escLabel.appendChild(escRadio);
          poseBar.appendChild(escLabel);
        }

        var restLabel = el("label", { style: "cursor:pointer;" });
        var restRadio = el("input", { type: "radio", name: "mp-bodyaction", value: "rest", checked: true });
        restRadio.addEventListener("change", function () {
          if (restRadio.checked) v.bodyaction = "rest";
        });
        restLabel.appendChild(document.createTextNode("保持当前姿态 "));
        restLabel.appendChild(restRadio);
        poseBar.appendChild(restLabel);
        hud.appendChild(poseBar);
      }

      repAct.insertAdjacentElement("beforebegin", hud);
    }

    var nextLink = document.querySelector("#next a");
    if (nextLink && !nextLink._mpCombatBound) {
      nextLink._mpCombatBound = true;
      nextLink.addEventListener("click", function (ev) {
        if (S.bypassCombatNextIntercept) return;
        if (!S.connected || !S.room || (!S.combatOpponent && !S.combatId)) return;

        var hrefPas = nextLink.getAttribute("data-passage") || "";
        if (hrefPas.indexOf("Finish") >= 0) {
          return;
        }

        if (S.combatTurnReady) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          return;
        }

        ev.preventDefault();
        ev.stopImmediatePropagation();

        S.combatTurnReady = true;
        sendMyCombatTurnActions(false);
        renderCombatSyncHint();
      }, true);
    }

    if (S.combatOpponent || S.combatId) {
      renderCombatSyncHint();
    }
  }

  /* ---------------- 原生遭遇战初始化与每回合动作/插入/破处同步 ---------------- */

  function hasCoopNpcSnapshot() {
    var v = V();
    if (S.combatMode === "coop_pve") {
      if (S.combatSharedEnemy && S.combatSharedEnemy.npcSnapshot && Array.isArray(S.combatSharedEnemy.npcSnapshot.activeNpcs) && S.combatSharedEnemy.npcSnapshot.activeNpcs[0]) {
        return true;
      }
      if (v && v.mpCombatIsHost === 1 && v.NPCList && v.NPCList[0] && v.NPCList[0].pronoun && v.NPCList[0].pronoun !== "none") {
        return true;
      }
    }
    return false;
  }

  function restoreCoopNpcSnapshot() {
    var v = V();
    if (!v) return false;
    if (S.combatMode === "coop_pve" && S.combatSharedEnemy && S.combatSharedEnemy.npcSnapshot) {
      applyEventContext(S.combatSharedEnemy.npcSnapshot);
      if (v.NPCList && v.NPCList[0] && v.NPCList[0].pronoun) {
        try {
          if (window.Wikifier && typeof Wikifier.wikifyEval === "function") {
            Wikifier.wikifyEval("<<person1>>");
          }
        } catch (e) {}
        return true;
      }
    }
    if (S.combatMode === "coop_pve" && v.NPCList && v.NPCList[0] && v.NPCList[0].pronoun && v.NPCList[0].pronoun !== "none") {
      return true;
    }
    return false;
  }

  function prepareNativeCombatVars() {
    var v = V();
    if (!v) return;
    try {
      if ((!v.worn || !v.worn.upper || !v.NPC_names_m || !v.NPC_names_m.length) && window.Wikifier && typeof Wikifier.wikifyEval === "function") {
        Wikifier.wikifyEval("<<variablesStart2>>");
      }
    } catch (e) {}

    var pronoun = "m";
    var gender = "m";
    if (S.combatMode === "coop_pve" && S.combatSharedEnemy) {
      pronoun = S.combatSharedEnemy.pronoun === "f" ? "f" : "m";
      gender = ["m", "f", "h"].indexOf(S.combatSharedEnemy.gender) >= 0 ? S.combatSharedEnemy.gender : pronoun;
    } else {
      var opp = S.combatOpponent;
      var snap = (opp && opp.combatSnapshot) || {};
      var oppPlayer = snap.player || {};
      pronoun = (oppPlayer.sex === "m" || oppPlayer.gender_appearance === "m") ? "m" : "f";
      gender = ["m", "f", "h"].indexOf(oppPlayer.sex) >= 0 ? oppPlayer.sex : pronoun;
    }
    var t = T();
    if (t) {
      t.mpOppPronoun = pronoun;
      t.mpOppGender = gender;
      t.mpHasCoopSnapshot = hasCoopNpcSnapshot() ? 1 : 0;
    }
  }

  function setupNativeCombatNpc() {
    var v = V();
    if (!v || !v.NPCList || !v.NPCList[0]) return;
    var npc = v.NPCList[0];
    var st = getIndependentCombatStats(v);

    if (S.combatMode === "coop_pve" && S.combatSharedEnemy) {
      // 支援战斗：完整保留对方遭遇战的原版 NPC，不篡改其名称、描述或外貌
      delete npc.mpPlayerName;
      v.enemyhealthmax = S.combatSharedEnemy.hpMax || npc.healthmax || 275;
      v.enemyhealth = S.combatSharedEnemy.hp != null ? S.combatSharedEnemy.hp : (npc.health || 275);
      npc.healthmax = v.enemyhealthmax;
      npc.health = v.enemyhealth;
      v.enemyarousalmax = S.combatSharedEnemy.arousalMax || 500;
      v.enemyarousal = S.combatSharedEnemy.arousal != null ? S.combatSharedEnemy.arousal : 100;
      v.npcSub = 0;
    } else {
      // 玩家双方主动挑起的遭遇战（PvP / 温存）：
      // 1. 名字与描述 100% 设为对方联机玩家的真实昵称 ID，绝不显示“xx的男人/女人”
      var oppName = (S.combatOpponent && S.combatOpponent.name) || v.mpOpponentName || "玩家";
      v.mpOpponentName = oppName;
      applyPvpPlayerNameToNpc(npc, oppName);

      // 2. 同步对方玩家的真实身体部位（有无阴茎/小穴/尺寸），且默认动作绝不自动把私处贴过去
      var oppSnap = (S.combatOpponent && S.combatOpponent.combatSnapshot) || {};
      var oppPl = oppSnap.player || {};
      if (oppPl.penisExist) {
        npc.penis = 0;
        npc.penissize = oppPl.penissize || 2;
        npc.penisdesc = "阴茎";
      } else if (oppPl.vaginaExist !== false) {
        npc.penis = "none";
      }
      if (oppPl.vaginaExist !== false) {
        npc.vagina = 0;
      } else {
        npc.vagina = "none";
      }
      npc.breastsize = oppPl.breastsize != null ? oppPl.breastsize : 3;
      npc.lefthand = "idle";
      npc.righthand = "idle";
      npc.mouth = 0;
      if (npc.location) npc.location.genitals = 0;

      // 3. 设置 $npcSub = 1，彻底禁止原版 AI 在默认回合自动脱衣或自动把生殖器往玩家私处顶靠
      v.npcSub = 1;
      v.vaginause = 0;
      v.vaginastate = 0;
      v.penisuse = 0;
      v.penisstate = 0;
      v.anususe = 0;
      v.anusstate = 0;

      v.enemyhealthmax = st.oppHpMax || 275;
      v.enemyhealth = st.oppHp != null ? st.oppHp : 275;
      npc.healthmax = v.enemyhealthmax;
      npc.health = v.enemyhealth;
      v.enemyarousalmax = st.oppArMax || 500;
      v.enemyarousal = st.oppAr != null ? st.oppAr : 100;
    }
    v.enemyangermax = 200;
    v.enemyanger = 0;
    v.enemytrust = 0;
    v.consensual = (v.mpCombatConsensual === 1) ? 1 : 0;
    v.position = S.combatSwapPose ? "doggy" : "missionary";
  }

  function hasMyGenitalAction(v) {
    if (!v) return false;
    var gActs = ["vaginatopenis", "vaginatovagina", "anustopenis", "penistovagina", "penistoanus", "vaginapenisfuck", "penisvaginafuck", "penisanusfuck", "penis", "vagina", "anus", "cooperate", "rub"];
    if (gActs.indexOf(String(v.penisaction || "")) >= 0) return true;
    if (gActs.indexOf(String(v.vaginaaction || "")) >= 0) return true;
    if (gActs.indexOf(String(v.anusaction || "")) >= 0) return true;
    if (v.vaginastate === "penetrated" || v.penisstate === "penetrated" || v.anusstate === "penetrated" || v.penisstate === "otheranus") return true;
    return false;
  }

  function summarizeMyCombatActions(v) {
    var parts = [];
    if (v.bodyaction && v.bodyaction !== "rest" && ACTION_CN[v.bodyaction]) {
      parts.push(ACTION_CN[v.bodyaction]);
    }
    var map = [
      ["leftaction", "左手"],
      ["rightaction", "右手"],
      ["feetaction", "双脚"],
      ["mouthaction", "嘴"],
      ["penisaction", "阴茎"],
      ["vaginaaction", "小穴"],
      ["anusaction", "后庭"]
    ];
    map.forEach(function (pair) {
      var act = v[pair[0]];
      if (act && act !== "rest" && act !== 0 && act !== "none") {
        var cn = ACTION_CN[act] || String(act);
        parts.push(pair[1] + cn);
      }
    });
    return parts.length ? parts.join("、") : "保持戒备";
  }

  function extractMyOrganStates(v) {
    if (!v) return null;
    return {
      vaginastate: v.vaginastate || 0,
      vaginause: v.vaginause || 0,
      penisstate: v.penisstate || 0,
      penisuse: v.penisuse || 0,
      anusstate: v.anusstate || 0,
      anususe: v.anususe || 0,
      mouthstate: v.mouthstate || 0,
      mouthuse: v.mouthuse || 0
    };
  }

  function sendMyCombatTurnActions(forceCommit) {
    var v = V();
    if (!v || !S.connected || !S.room) return;
    var actions = {
      leftaction: v.leftaction,
      rightaction: v.rightaction,
      feetaction: v.feetaction,
      mouthaction: v.mouthaction,
      penisaction: v.penisaction,
      vaginaaction: v.vaginaaction,
      anusaction: v.anusaction,
      chestaction: v.chestaction,
      thighaction: v.thighaction,
      bodyaction: v.bodyaction
    };
    var summary = S.name + " " + summarizeMyCombatActions(v);
    send({
      t: "combat_turn",
      combatId: S.combatId || "",
      to: S.combatOpponent ? S.combatOpponent.id : "",
      passage: (window.State && State.passage) || "",
      actions: actions,
      organStates: extractMyOrganStates(v),
      stats: collectMyStats(v),
      summary: summary,
      force: !!forceCommit,
      enemyhealth: v.enemyhealth,
      enemyarousal: v.enemyarousal,
      enemyanger: v.enemyanger,
      enemytrust: v.enemytrust,
      alarm: v.alarm,
      position: v.position,
      combatSnapshot: extractCombatSnapshot()
    });
  }

  function beforeNativeCombatEffects() {
    var v = V();
    if (!v) return;

    if (S.combatMode === "pvp" && v.NPCList && v.NPCList[0]) {
      var oppName = (S.combatOpponent && S.combatOpponent.name) || v.mpOpponentName || "玩家";
      applyPvpPlayerNameToNpc(v.NPCList[0], oppName);
      // 默认不把私处贴过去：保持 npcSub = 1，除非本回合对方主动发起了插入/磨蹭动作
      v.npcSub = 1;
      if (!hasMyGenitalAction(v)) {
        if (v.NPCList[0].penis !== "none") v.NPCList[0].penis = 0;
        if (v.NPCList[0].vagina !== "none") v.NPCList[0].vagina = 0;
        if (v.NPCList[0].location) v.NPCList[0].location.genitals = 0;
      } else {
        // 如果我自己主动选择了贴近/插入动作（如 penistovagina / vaginatopenis），自动确保下身已暴露且自己破处记录为对方玩家名字
        var myPAct = String(v.penisaction || "");
        var myVAct = String(v.vaginaaction || "");
        var myAAct = String(v.anusaction || "");
        var myMAct = String(v.mouthaction || "");
        if (myPAct === "penistovagina" || myPAct === "penisvaginafuck" || v.penisstate === "penetrated") {
          takeVirginityByPlayer(oppName, "penile");
        } else if (myPAct === "penistoanus" || myPAct === "penisanusfuck" || v.penisstate === "otheranus") {
          takeVirginityByPlayer(oppName, "penile");
        }
        if (myVAct === "vaginatopenis" || myVAct === "vaginapenisfuck" || v.vaginastate === "penetrated") {
          takeVirginityByPlayer(oppName, "vaginal");
        }
        if (myAAct === "anustopenis" || v.anusstate === "penetrated") {
          takeVirginityByPlayer(oppName, "anal");
        }
        if (myMAct === "oral" || myMAct === "suck") {
          takeVirginityByPlayer(oppName, "oral");
        } else if (myMAct === "kisslips" || myMAct === "kiss") {
          takeVirginityByPlayer(oppName, "kiss");
        }
      }
    }

    if (S.combatMode === "coop_pve" && S.combatLockedTargetId && S.combatLockedTargetId !== S.id) {
      S._preTurnBackup = {
        pain: v.pain,
        arousal: v.arousal,
        stress: v.stress,
        trauma: v.trauma,
        worn: clone(v.worn)
      };
      v.leftarm = 0;
      v.rightarm = 0;
      v.mouthuse = 0;
      v.vaginause = 0;
      v.penisuse = 0;
      v.anususe = 0;
    } else {
      S._preTurnBackup = null;
    }

    while (S.pendingPeerCombatTurns.length > 0) {
      var turn = S.pendingPeerCombatTurns.shift();
      applyPeerCombatTurnToVariables(turn, v);
    }
  }

  function applyPeerSexStateToMe(sexKind, oppName, v) {
    if (!v || !v.NPCList || !v.NPCList[0]) return;
    var npc = v.NPCList[0];
    applyPvpPlayerNameToNpc(npc, oppName);

    if (!sexKind) {
      // 对方没有主动把私处贴过来，且我也没有主动贴过去时，清除非主动的私处接触
      if (!hasMyGenitalAction(v)) {
        if (npc.penis !== "none") npc.penis = 0;
        if (npc.vagina !== "none") npc.vagina = 0;
        if (npc.location) npc.location.genitals = 0;
        v.vaginause = 0;
        v.vaginastate = 0;
        v.penisuse = 0;
        v.penisstate = 0;
        v.anususe = 0;
        v.anusstate = 0;
      }
      return;
    }

    // 对方主动发起了性接触/插入：同步我方被干/被插入的状态，并记录对方玩家真名破处！
    try {
      if (window.npcMakeNaked) window.npcMakeNaked(npc, "lower");
      if (v.worn && v.worn.lower) { v.worn.lower.vagina_exposed = 1; v.worn.lower.anus_exposed = 1; v.worn.lower.exposed = 2; }
      if (v.worn && v.worn.under_lower) { v.worn.under_lower.vagina_exposed = 1; v.worn.under_lower.anus_exposed = 1; v.worn.under_lower.exposed = 2; }
    } catch (e) {}

    if (sexKind === "penis_to_vagina") {
      v.npcSub = 0;
      if (npc.penis === "none") { npc.penis = 0; npc.penissize = 2; npc.penisdesc = "穿戴式假阳具"; }
      if (v.player && v.player.vaginaExist !== false) {
        npc.penis = "vagina";
        if (npc.location) npc.location.genitals = "genitals";
        v.vaginause = "penis";
        v.vaginastate = "penetrated";
        v.vaginatarget = 0;
        takeVirginityByPlayer(oppName, "vaginal");
        v.mpPeerSexDescLine = oppName + " 挺动腰肢将滚烫的肉棒深深顶入你的小穴，在你体内剧烈抽插着。";
      } else {
        npc.penis = "anus";
        if (npc.location) npc.location.genitals = "genitals";
        v.anususe = "penis";
        v.anusstate = "penetrated";
        v.anustarget = 0;
        takeVirginityByPlayer(oppName, "anal");
        v.mpPeerSexDescLine = oppName + " 扶住你的腰臀挺身而入，在你紧致的后穴中深重地抽送着。";
      }
    } else if (sexKind === "penis_to_anus") {
      v.npcSub = 0;
      if (npc.penis === "none") { npc.penis = 0; npc.penissize = 2; npc.penisdesc = "穿戴式假阳具"; }
      npc.penis = "anus";
      if (npc.location) npc.location.genitals = "genitals";
      v.anususe = "penis";
      v.anusstate = "penetrated";
      v.anustarget = 0;
      takeVirginityByPlayer(oppName, "anal");
      v.mpPeerSexDescLine = oppName + " 扣紧你的髋部将肉棒完全没入你的后庭，每一次顶弄都带来强烈的撞击感。";
    } else if (sexKind === "vagina_to_penis") {
      v.npcSub = 0;
      if (v.player && v.player.penisExist) {
        npc.vagina = "penis";
        if (npc.location) npc.location.genitals = "genitals";
        v.penisuse = "vagina";
        v.penisstate = "penetrated";
        v.penistarget = 0;
        takeVirginityByPlayer(oppName, "penile");
        v.mpPeerSexDescLine = oppName + " 跨坐在你的腰间沉下身躯，用湿热紧致的小穴将你的阴茎尽数吞没，起伏摆动着腰肢。";
      } else {
        npc.vagina = "vagina";
        v.vaginause = "othervagina";
        v.vaginastate = "othervagina";
        v.mpPeerSexDescLine = oppName + " 贴紧你的大腿根部，用湿润的私处与你紧密厮磨交合。";
      }
    } else if (sexKind === "anus_to_penis") {
      v.npcSub = 0;
      if (v.player && v.player.penisExist) {
        npc.penis = "otheranus";
        npc.vagina = "otheranus";
        if (npc.location) npc.location.genitals = "genitals";
        v.penisuse = "anus";
        v.penisstate = "otheranus";
        v.penistarget = 0;
        takeVirginityByPlayer(oppName, "penile");
        v.mpPeerSexDescLine = oppName + " 用紧实的后庭包裹住你的阴茎，随着急促的喘息不断吞吐收缩。";
      }
    } else if (sexKind === "trib") {
      v.npcSub = 0;
      npc.vagina = "vagina";
      v.vaginause = "othervagina";
      v.vaginastate = "othervagina";
      v.vaginatarget = 0;
      v.mpPeerSexDescLine = oppName + " 将滚烫湿滑的花唇紧紧贴合在你的私处上，交错摆动着腰臀激烈磨蹭。";
    } else if (sexKind === "oral_to_peer") {
      if (v.player && v.player.penisExist) {
        npc.mouth = "penis";
        v.penisuse = "othermouth";
        v.penisstate = "othermouth";
        takeVirginityByPlayer(oppName, "penile");
        v.mpPeerSexDescLine = oppName + " 俯身在你的双腿之间，用温热湿滑的唇舌含住你的阴茎深入吮吸。";
      } else {
        npc.mouth = "vagina";
        v.vaginause = "othermouth";
        v.vaginastate = "othermouth";
        v.mpPeerSexDescLine = oppName + " 将脸埋在你的腿间，灵活的舌尖不断舔舐吸吮着你最敏感的部位。";
      }
    } else if (sexKind === "kiss") {
      npc.mouth = "kiss";
      v.mouthuse = "kiss";
      v.mouthstate = "kiss";
      takeVirginityByPlayer(oppName, "kiss");
      v.mpPeerSexDescLine = oppName + " 捧着你的脸庞覆上你的双唇，舌尖探入你的唇齿间深吻缠绵。";
    } else if (sexKind === "handhold") {
      takeVirginityByPlayer(oppName, "handholding");
      v.mpPeerSexDescLine = oppName + " 与你十指紧扣地握住了彼此的手。";
    } else if (sexKind === "caress") {
      v.mpPeerSexDescLine = oppName + " 的手指顺着你的身体曲线游走揉弄，惹得你肌肤阵阵战栗。";
    }
  }

  function applyPeerCombatTurnToVariables(turn, v) {
    if (!turn || !v) return;
    var acts = turn.actions || {};
    var oppName = turn.fromName || (S.combatOpponent && S.combatOpponent.name) || v.mpOpponentName || "玩家";

    if (turn.combatSnapshot) {
      if (S.combatOpponent && S.combatOpponent.id === turn.fromId) {
        S.combatOpponent.combatSnapshot = turn.combatSnapshot;
      }
      var peer = S.players.get(turn.fromId);
      if (peer) peer.combatSnapshot = turn.combatSnapshot;
    }

    if (acts.bodyaction === "doggy" || acts.bodyaction === "missionary") {
      v.position = acts.bodyaction;
    }

    if (S.combatMode === "pvp") {
      applyPeerSexStateToMe(turn.activeSexKind || "", oppName, v);
    }

    if (turn.summary) {
      S.lastChannelTip = turn.summary;
      v.mpLastPeerCombatLine = turn.summary;
    }
  }

  function afterNativeCombatMan() {
    var v = V();
    if (!v) return;

    if (S._preTurnBackup && S.combatMode === "coop_pve" && S.combatLockedTargetId && S.combatLockedTargetId !== S.id) {
      v.pain = S._preTurnBackup.pain;
      v.worn = S._preTurnBackup.worn;
      v.leftarm = 0;
      v.rightarm = 0;
      v.mouthuse = 0;
      v.vaginause = 0;
      v.penisuse = 0;
      v.anususe = 0;
      S._preTurnBackup = null;
    }

    var commit = S.lastCombatCommit;
    if (commit) {
      if (commit.position === "doggy" || commit.position === "missionary") {
        v.position = commit.position;
      }
      var myF = S.id && commit.fighters && commit.fighters[S.id];
      var oppId = S.combatOpponent && S.combatOpponent.id;
      var oppF = oppId && commit.fighters && commit.fighters[oppId];
      var oppName = (S.combatOpponent && S.combatOpponent.name) || v.mpOpponentName || "玩家";

      if (S.combatMode === "pvp") {
        applyPeerSexStateToMe(commit.peerActiveSexKind || "", oppName, v);
      }

      if (S.combatMode === "coop_pve" && commit.sharedEnemy) {
        v.enemyhealthmax = commit.sharedEnemy.hpMax || 275;
        v.enemyhealth = commit.sharedEnemy.hp;
        v.enemyarousalmax = commit.sharedEnemy.arousalMax || 500;
        v.enemyarousal = commit.sharedEnemy.arousal;
        v.enemyanger = commit.sharedEnemy.anger || 0;
        v.enemytrust = commit.sharedEnemy.trust || 0;
      } else if (oppF) {
        v.enemyhealthmax = oppF.hpMax || 275;
        v.enemyhealth = oppF.hp;
        v.enemyarousalmax = oppF.arousalMax || 500;
        v.enemyarousal = oppF.arousal;
        v.enemyanger = oppF.anger || 0;
        v.enemytrust = oppF.trust || 0;
      }

      if (myF) {
        var targetPain = Math.min(100, Math.round(((myF.hpMax - myF.hp) / Math.max(1, myF.hpMax)) * 100));
        v.pain = Math.max(v.pain || 0, targetPain);
        var arMaxVar = v.arousalmax || 10000;
        v.arousal = Math.min(arMaxVar, Math.round((myF.arousal / Math.max(1, myF.arousalMax)) * arMaxVar));
      }

      if (commit.finished) {
        v.mpCombatOutcome = commit.outcome || "peer_down";
        v.mpForceCombatEnd = 1;
        if (v.mpCombatOutcome === "peer_down") v.enemyhealth = 0;
        else if (v.mpCombatOutcome === "peer_arousal") v.enemyarousal = v.enemyarousalmax;
      }
    }

    try {
      var host = document.getElementById("passages");
      if (host) {
        if (v.mpPeerSexDescLine) {
          host.appendChild(el("div", {
            class: "pink",
            style: "margin:6px 0;",
            text: v.mpPeerSexDescLine
          }));
        }
        if (commit && commit.escapeNote) {
          host.appendChild(el("div", {
            class: commit.outcome === "escaped" ? "green" : "purple",
            style: "margin:6px 0;",
            text: commit.escapeNote
          }));
        }
      }
    } catch (e) {}
    delete v.mpLastPeerCombatLine;
    delete v.mpPeerSexDescLine;
    S.lastCombatCommit = null;
    setTimeout(enhanceNativeCombatDOM, 10);
  }

  function onNativeCombatFinished() {
    S._mpFinishedAt = Date.now();
    S.combatId = "";
    S.combatOpponent = null;
    S.combatIsPvp = false;
    S.combatTurnReady = false;
    S.combatReadyIds = [];
    S.lastCombatCommit = null;
    S._preTurnBackup = null;
    S.myVotedIndex = -1;
    S.currentVotes = [];
    var v = V();
    if (v) {
      v.eventskip = 1;
      v.npcSub = 0;
    }
    send({ t: "combat_leave" });
    sendState(true);
  }

  function startCoopEventCombat() {
    var v = V();
    if (!v) return;
    send({
      t: "combat_enter",
      passage: (window.State && State.passage) || "MP Event Alley Ambush Fight",
      returnPassage: v.mpReturnPassage || findSafeReturnPassage(),
      recentPassages: (S._passageHistory || []).slice(-8),
      combatInfo: buildCombatInfo(v) || {
        enemyName: "混混",
        enemyPronoun: "m",
        enemyGender: "m",
        enemyHealth: 275,
        enemyHealthMax: 275,
        enemyArousal: 80,
        enemyArousalMax: 500
      }
    });
  }

  function openNativeInteract(p) {
    if (!p) return;
    S.interactTarget = p;
    var v = V();
    var curPas = (window.State && State.passage) || "Orphanage";
    if (curPas === MP_COMBAT_PASSAGE || curPas === "Start" || curPas === "Start2" || curPas === "Orphanage Intro" || curPas.indexOf("MP ") === 0) {
      curPas = v.mpReturnPassage || findSafeReturnPassage(true);
    }
    v.mpReturnPassage = curPas;
    v.mpInteractTargetId = p.id;
    v.mpInteractTargetName = p.name || "同伴";
    enginePlay("MP Player Interact");
  }

  function prepareInteractVars() {
    var v = V();
    if (!v) return;
    try {
      if ((!v.worn || !v.worn.upper || !v.NPC_names_m || !v.NPC_names_m.length) && window.Wikifier && typeof Wikifier.wikifyEval === "function") {
        Wikifier.wikifyEval("<<variablesStart2>>");
      }
    } catch (e) {}
    var target = S.interactTarget || (v.mpInteractTargetId && S.players.get(v.mpInteractTargetId)) || null;
    if (!target && S.players.size > 0) {
      target = S.players.values().next().value;
      if (target && !v.mpInteractTargetName) v.mpInteractTargetName = target.name || "同伴";
    }
    var snap = (target && target.combatSnapshot) || (S.companion && S.companion.combatSnapshot) || {};
    var tp = snap.player || {};
    var pronoun = (tp.sex === "m" || tp.gender_appearance === "m" || (S.companion && !target && S.companion.pronoun === "m")) ? "m" : "f";
    var gender = ["m", "f", "h"].indexOf(tp.sex) >= 0 ? tp.sex : pronoun;
    var tName = (target && target.name) || v.mpInteractTargetName || (S.companion && S.companion.name) || "同伴";
    v.mpInteractTargetName = tName;
    var rel = getRel(tName);
    var t = T();
    if (t) {
      t.mpOppPronoun = pronoun;
      t.mpOppGender = gender;
      t.mpRelStage = rel.stage;
      t.mpRelLove = rel.love;
      t.mpRelTrust = rel.trust;
      t.mpRelLust = rel.lust;
      t.mpRelJealousy = rel.jealousy;
      t.mpRelCorruption = rel.corruption;
    }
    if (v.NPCList && v.NPCList[0]) {
      applyPvpPlayerNameToNpc(v.NPCList[0], tName);
    }
  }

  function notifyInteractEffect(kind, minutes, stressDelta, traumaDelta, tirednessDelta, arousalDelta, descText, relDelta, milestoneStage) {
    var v = V();
    var targetId = (S.interactTarget && S.interactTarget.id) || (v && v.mpInteractTargetId) || "";
    var targetName = (S.interactTarget && S.interactTarget.name) || (v && v.mpInteractTargetName) || (S.companion && S.companion.name) || "同伴";
    if (!targetId && S.players.size > 0) {
      var firstP = S.players.values().next().value;
      if (firstP) {
        targetId = firstP.id;
        targetName = firstP.name || targetName;
      }
    }

    // 真实记录破处对象为联机玩家的 ID / 昵称
    var virginityTaken = "";
    if (kind === "kiss" || kind === "romance_lover" || kind === "romance_soulmate") {
      takeVirginityByPlayer(targetName, "kiss");
      virginityTaken = "kiss";
    } else if (kind === "sub" || kind === "sub_climax") {
      takeVirginityByPlayer(targetName, "oral");
      virginityTaken = "oral";
    }

    if (relDelta || milestoneStage) {
      updateRel(targetName, relDelta, milestoneStage, kind, false);
    }
    if (targetId) {
      send({
        t: "interact_effect",
        to: targetId,
        kind: kind,
        minutes: minutes,
        stressDelta: stressDelta,
        traumaDelta: traumaDelta,
        tirednessDelta: tirednessDelta,
        arousalDelta: arousalDelta,
        relDelta: relDelta || null,
        milestoneStage: milestoneStage || "",
        virginityTaken: virginityTaken,
        text: descText
      });
    }
    refreshSidebar();
  }

  function notifyRomanceMilestone(stage, descText, relDelta) {
    notifyInteractEffect("romance_" + stage, 20, -12, -8, 0, 800, descText, relDelta, stage);
  }

  function notifyRomanceDelta(love, trust, stress, jealousy, corruption, descText) {
    notifyInteractEffect("combat_afterglow", 5, stress || -4, -2, 0, 0, descText, {
      love: love || 0,
      trust: trust || 0,
      jealousy: jealousy || 0,
      corruption: corruption || 0
    });
  }

  function startConsensualEncounterFromInteract() {
    var v = V();
    var targetId = (S.interactTarget && S.interactTarget.id) || (v && v.mpInteractTargetId) || "";
    if (!targetId && S.players.size > 0) {
      targetId = S.players.values().next().value.id;
    }
    if (!targetId) {
      // 若同伴当前离线，则直接进入与离线伴侣 NPC 的自愿欢好战斗
      startOfflineCompanionCombat(true);
      return;
    }
    sendState(true);
    send({ t: "attack_request", to: targetId, consensual: true });
  }

  function startOfflineCompanionCombat(consensual) {
    var v = V();
    if (!v) return;
    syncCompanionToVariables();
    var comp = v.mpCompanion || S.companion || {};
    var cName = comp.name || "艾琳";
    S.combatMode = "pvp";
    S.combatIsPvp = true;
    S.combatOpponent = {
      id: "offline_companion",
      name: cName,
      combatSnapshot: S.companion && S.companion.combatSnapshot ? S.companion.combatSnapshot : null
    };
    v.mpCombatStart = 1;
    v.mpCombatConsensual = consensual ? 1 : 0;
    v.mpCombatMode = "pvp";
    v.mpOpponentName = cName;
    v.mpReturnPassage = findSafeReturnPassage(true);
    prepareNativeCombatVars();
    enginePlay(MP_COMBAT_PASSAGE);
  }

  function sendMeetFromInteract() {
    var v = V();
    var retPas = (v && v.mpReturnPassage) || "Orphanage";
    send({ t: "meet_here", passage: retPas, timeStamp: (v && v.timeStamp) || S.clock.timeStamp });
    toast("已向房间队友发出同行会合邀请", "mp-ok");
  }

  function requestTimelineSync(targetId) {
    if (!S.connected || !S.room) {
      toast("先加入联机房间再同步时间线", "mp-wait");
      return;
    }
    if (S.players.size === 0) {
      toast("当前房间没有其他在线队友", "mp-wait");
      return;
    }
    send({ t: "sync_timeline", targetId: targetId || "" });
  }

  function toggleSyncMode() {
    if (!S.connected || !S.room) {
      toast("先加入房间再切换同步模式", "mp-wait");
      return;
    }
    if (S.syncMode) {
      S.syncMode = false;
      S.pendingSyncInvite = null;
      send({ t: "sync_mode", syncMode: false });
      toast("已切回分头行动，各自时间线独立流动", "mp-ok");
    } else {
      var others = 0;
      S.players.forEach(function () { others++; });
      if (others === 0) {
        S.syncMode = true;
        send({ t: "sync_mode", syncMode: true });
        toast("已开启组队同步", "mp-ok");
      } else {
        send({ t: "sync_request" });
        toast("已发出组队同步邀请，等待队友同意", "mp-ok");
      }
    }
    renderRoom();
    injectInlinePassageSections();
    renderChannelBar();
  }

  /* ---------------- 同步随机种子与世界时钟 ---------------- */

  function applySharedPrng(prngPack) {
    if (!prngPack) return;
    S.prng = prngPack;
    try {
      var v = V();
      if (v && Number.isFinite(prngPack.rng)) {
        v.rng = prngPack.rng;
      }
      if (prngPack.seedStr && window.State && State.prng) {
        var seedStr = String(prngPack.seedStr);
        State.prng.seed = seedStr;
        State.prng.seedInt = (typeof State.prng.str2int === "function")
          ? State.prng.str2int(seedStr)
          : State.prng.seed;
        State.prng.pull = 0;
      }
    } catch (e) {}
  }

  function applyClockTick(msg) {
    if (!msg) return;
    var wasRunning = S.clock.running;
    S.clock.timeStamp = msg.timeStamp || S.clock.timeStamp;
    S.clock.speed = msg.speed || 1;
    S.clock.running = !!msg.running;
    if (msg.prng) applySharedPrng(msg.prng);

    try {
      var v = V();
      // 仅当玩家主动点击「同步时间线」(msg.explicitSync) 或实时时钟正在推进 (msg.stepSeconds > 0) 时才改动本地时间
      if (v && v.combat !== 1) {
        if (msg.explicitSync && Number.isFinite(msg.timeStamp) && window.Time && typeof Time.set === "function") {
          Time.set(msg.timeStamp);
          v.timeStamp = msg.timeStamp;
          refreshSidebar();
        } else if (msg.stepSeconds && msg.stepSeconds > 0 && S.syncMode && window.Time && typeof Time.pass === "function") {
          Time.pass(msg.stepSeconds);
          refreshSidebar();
        }
      }
    } catch (e) {}

    renderClockPill();
    if (wasRunning !== S.clock.running) {
      renderChannelBar();
    }
  }

  /* ---------------- 组队会合模式下拦截原生事件选项 ---------------- */

  function getSameSceneGroupedPeers() {
    var sp = (window.State && State.passage) || "";
    var out = [];
    if (!sp || !S.syncMode) return out;
    S.players.forEach(function (p) {
      if (p.passage === sp) out.push(p);
    });
    return out;
  }

  function getPassageInternalLinks() {
    var host = document.getElementById("passages");
    if (!host) return [];
    var all = host.querySelectorAll("a.link-internal");
    var valid = [];
    for (var i = 0; i < all.length; i++) {
      var a = all[i];
      if (a.closest("#mp-inline-root") || a.closest("#next")) continue;
      valid.push(a);
    }
    return valid;
  }

  function bindPassageLinkInterceptor() {
    var host = document.getElementById("passages");
    if (!host || host._mpLinkBound) return;
    host._mpLinkBound = true;

    host.addEventListener("click", function (ev) {
      if (S.bypassLinkIntercept || !S.connected || !S.room || !S.syncMode) return;
      var v = V();
      var curPas = (window.State && State.passage) || "";
      if ((v && v.combat === 1) || curPas === MP_COMBAT_PASSAGE || curPas === "MP Native Combat Finish" || curPas.indexOf("MP Player Interact") === 0 || curPas.indexOf("MP Companion") === 0 || curPas === "Start" || curPas === "Start2") return;

      var a = ev.target && ev.target.closest ? ev.target.closest("a.link-internal") : null;
      if (!a || a.closest("#mp-inline-root")) return;

      var peers = getSameSceneGroupedPeers();
      if (peers.length === 0) return;

      var links = getPassageInternalLinks();
      var idx = links.indexOf(a);
      if (idx < 0) return;

      ev.preventDefault();
      ev.stopImmediatePropagation();

      var forceCommit = (S.myVotedIndex === idx);
      S.myVotedIndex = idx;
      var txt = (a.textContent || "").trim();
      var targetPas = a.getAttribute("data-passage") || "";
      var linkKey = targetPas + "\u0001" + txt;

      send({
        t: "link_vote",
        passage: (window.State && State.passage) || "",
        linkIndex: idx,
        linkKey: linkKey,
        linkText: txt,
        targetPassage: targetPas,
        eventContext: extractEventContext(),
        force: forceCommit
      });

      renderLinkVoteBadges();
    }, true);
  }

  function renderLinkVoteBadges() {
    var oldTags = document.querySelectorAll(".mp-vote-tag");
    for (var i = 0; i < oldTags.length; i++) {
      if (oldTags[i].parentNode) oldTags[i].parentNode.removeChild(oldTags[i]);
    }
    var links = getPassageInternalLinks();
    if (!links.length) return;

    var namesByKey = {};
    (S.currentVotes || []).forEach(function (v) {
      var key = v.linkKey || ((v.targetPassage || "") + "\u0001" + (v.linkText || ""));
      if (!namesByKey[key]) namesByKey[key] = [];
      namesByKey[key].push(v.name);
    });

    links.forEach(function (linkEl) {
      var key = (linkEl.getAttribute("data-passage") || "") + "\u0001" + (linkEl.textContent || "").trim();
      var names = namesByKey[key];
      if (!names || !names.length) return;
      var tag = el("span", {
        class: "mp-vote-tag",
        text: "✓ " + names.join("、")
      });
      linkEl.insertAdjacentElement("afterend", tag);
    });
  }

  function executeCommittedLink(msg) {
    if (!msg) return;
    if (msg.prng) applySharedPrng(msg.prng);
    if (msg.eventContext && msg.pickedById !== S.id) {
      applyEventContext(msg.eventContext);
    }
    S.myVotedIndex = -1;
    S.currentVotes = [];

    if (msg.reason === "random") {
      S.lastChannelTip = "选项分歧，已随机选中：" + (msg.linkText || "选项");
    } else if (msg.reason === "unanimous" && (msg.votes || []).length > 1) {
      S.lastChannelTip = "全队一致选择：" + (msg.linkText || "选项");
    }
    renderChannelBar();

    var links = getPassageInternalLinks();
    var targetEl = null;
    if (msg.linkKey) {
      for (var li = 0; li < links.length; li++) {
        var lk = (links[li].getAttribute("data-passage") || "") + "\u0001" + (links[li].textContent || "").trim();
        if (lk === msg.linkKey) { targetEl = links[li]; break; }
      }
    }
    if (!targetEl) targetEl = links[msg.linkIndex];
    if (targetEl && !targetEl._mpMirroredLink) {
      S.bypassLinkIntercept = true;
      S._navByUs = true;
      try {
        targetEl.click();
      } finally {
        S.bypassLinkIntercept = false;
        setTimeout(function () { S._navByUs = false; }, 0);
      }
    } else if (msg.targetPassage) {
      enginePlay(msg.targetPassage);
    }
  }

  /* ---------------- 局内同行沉浸描写 + 离线伴侣 NPC 场内自然出没 + 大世界暗线触发 ---------------- */

  function injectAmbientCoopText() {
    var host = document.getElementById("passages");
    if (!host) return;
    var pas = (window.State && State.passage) || "";
    if (!pas || pas === HUB || pas === BEDROOM || pas === MP_COMBAT_PASSAGE || pas.indexOf("MP ") === 0 || pas === "Start" || pas === "Start2") return;
    var v = V();
    if (!v || v.combat === 1) return;

    var oldBox = document.getElementById("mp-ambient-coop-box");
    if (oldBox && oldBox.parentNode) oldBox.parentNode.removeChild(oldBox);

    var samePeers = [];
    if (S.connected && S.room && S.players.size > 0) {
      S.players.forEach(function (p) {
        if (p.passage === pas) samePeers.push(p);
      });
    }
    if (samePeers.length === 0) return;

    var mate = samePeers[0];
    var mName = mate.name || "同伴";
    var rel = getRel(mName);
    var isRain = false, isNight = false, isCold = false;
    try {
      isRain = !!(window.Weather && Weather.precipitation === "rain");
      isCold = !!(window.Weather && (Weather.isFreezing || Weather.isSnow));
      isNight = !!(window.Time && Time.dayState === "night");
    } catch (e) {}

    var lines = [];

    if (rel.stage === "soulmate") {
      lines.push(mName + "寸步不离地陪伴在你身侧，胸前的银质挂坠与你遥相呼应。");
    } else if (rel.stage === "lover") {
      lines.push(mName + "挽着你的手臂并肩同行，温热的指尖与你十指紧扣。");
    } else if (rel.stage === "crush") {
      lines.push(mName + "挨在你身旁同行，目光不时悄悄瞥向你的侧脸。");
    } else {
      lines.push(mName + "正与你结伴同行，留意着四周的动静。");
    }

    if (isRain) {
      lines.push("淅沥的雨水打湿了路面，" + mName + "往你这边靠拢，用半边肩膀替你挡去斜风雨丝。");
    } else if (isCold) {
      lines.push("寒风凛冽，" + mName + "把你微凉的手揣进衣兜里替你暖着。");
    } else if (isNight) {
      lines.push("夜色深沉，" + mName + "走在靠外侧的位置，将你护在里侧。");
    }

    if (Number(v.exposed) >= 1) {
      lines.push("注意到你衣衫不整，" + mName + "侧过身替你挡住路人的视线。");
    } else if (Number(v.pain) >= 40) {
      lines.push("见你因疼痛而步伐微颤，" + mName + "伸手扶住你的腰，分担了你的重量。");
    } else if (Number(v.stress) >= 5000 || Number(v.trauma) >= 2000) {
      lines.push("察觉到你紧绷的呼吸，" + mName + "轻轻拍了拍你的手背以示安抚。");
    }

    var box = el("div", {
      id: "mp-ambient-coop-box",
      class: "mp-ambient-box",
      text: lines.join(" ")
    });

    var pasEl = host.querySelector(".passage") || host;
    var firstBr = pasEl.querySelector("br");
    if (firstBr && firstBr.parentNode === pasEl) {
      firstBr.insertAdjacentElement("beforebegin", box);
    } else {
      pasEl.insertBefore(box, pasEl.firstChild);
    }
  }

  /* ---------------- 大世界暗线与离线伴侣 NPC 无剧透自然挂载 ---------------- */

  var WORLD_STORYLINE_HOOKS = [
    {
      locs: ["Orphanage"],
      check: function (v) { return (Number(v.mpQuestCellar) || 0) < 7 && (!v.daily || !v.daily.mpQuestCellar); },
      hint: "走廊尽头通往旧储物室的木门虚掩着，门缝底下透出一丝阴凉的穿堂风。",
      icon: "img/misc/icon/investigate.png",
      linkText: "推开旧储物室的木门 (0:10)",
      passage: "MP Quest Orphanage Cellar"
    },
    {
      locs: ["Bedroom"],
      check: function (v) { return (Number(v.mpQuestAttic) || 0) < 6 && (!v.daily || !v.daily.mpQuestAttic); },
      hint: "天花板角落的活板门边垂下一截磨损的麻绳。",
      icon: "img/misc/icon/investigate.png",
      linkText: "拉动阁楼的麻绳 (0:10)",
      passage: "MP Quest Bedroom Attic"
    },
    {
      locs: ["High Street", "Shopping Centre"],
      check: function (v) { return ((Number(v.mpAntiquesUnappraised) || 0) > 0 || (Number(v.mpQuestClocktower) || 0) < 7) && (!v.daily || !v.daily.mpQuestClocktower); },
      hint: "钟表旧货铺的玻璃橱窗后亮着一盏昏黄的煤油灯，柜台后摆放着放大镜与天平。",
      icon: "img/misc/icon/shop.png",
      linkText: "推门走进钟表旧货铺 (0:15)",
      passage: "MP Quest HighStreet Clockshop"
    },
    {
      locs: ["Elk Street", "Docks", "Industrial Alleyways"],
      check: function (v) { return ((Number(v.skulduggery) || 0) >= 100 || (Number(v.blackmoney) || 0) > 0 || (Number(v.mpContrabandSealed) || 0) > 0) && (!v.daily || !v.daily.mpQuestSmuggler); },
      hint: "生锈的货运集装箱后方传出低沉的金属叩击声，似乎有人在暗处清点货箱。",
      icon: "img/misc/icon/sneak.png",
      linkText: "绕到集装箱后方查看 (0:15)",
      passage: "MP Quest Docks Smuggler"
    },
    {
      locs: ["School Library", "Hallways"],
      check: function (v) { return (Number(v.mpQuestLibrary) || 0) < 7 && (!v.daily || !v.daily.mpQuestLibrary); },
      hint: "最里侧的旧档案架下有几册没有编号的皮革卷宗。",
      icon: "img/misc/icon/school.png",
      linkText: "抽出最底层的皮革卷宗 (0:15)",
      passage: "MP Quest School Archives"
    },
    {
      locs: ["Temple", "Wolf Street"],
      check: function (v) { return (Number(v.mpQuestCatacomb) || 0) < 7 && (!v.daily || !v.daily.mpQuestCatacomb); },
      hint: "石廊侧壁的烛台底座留有近期被人转动过的刮痕。",
      icon: "img/misc/icon/temple.png",
      linkText: "走近侧廊的旧烛台 (0:15)",
      passage: "MP Quest Temple Catacomb"
    },
    {
      locs: ["Beach", "Sea Rocks", "Beach Cave"],
      check: function (v) { return (Number(v.mpQuestShipwreck) || 0) < 7 && (!v.daily || !v.daily.mpQuestShipwreck); },
      hint: "退潮后的暗礁缝隙间露出一截覆满藤壶的旧船肋木。",
      icon: "img/misc/icon/beach.png",
      linkText: "沿着暗礁走向沉船残骸 (0:20)",
      passage: "MP Quest Beach Shipwreck"
    },
    {
      locs: ["Forest", "Deep Forest"],
      check: function (v) { return (Number(v.mpQuestManorRuins) || 0) < 7 && (!v.daily || !v.daily.mpQuestManorRuins); },
      hint: "密林深处的荆棘丛后隐约可见半截坍塌的石砌拱门。",
      icon: "img/misc/icon/forest.png",
      linkText: "拨开荆棘走向石拱门 (0:20)",
      passage: "MP Quest Forest Ruins"
    },
    {
      locs: ["Park", "Nightingale Street"],
      check: function (v) { return (Number(v.mpQuestGreenhouse) || 0) < 7 && (!v.daily || !v.daily.mpQuestGreenhouse); },
      hint: "公园偏僻处的旧玻璃花房里飘出一缕奇异的甜香。",
      icon: "img/misc/icon/park.png",
      linkText: "走近玻璃花房侧门 (0:15)",
      passage: "MP Quest Park Greenhouse"
    },
    {
      locs: ["Connudatus Street", "Brothel", "Pub"],
      check: function (v) { return (Number(v.mpQuestVelvet) || 0) < 7 && (!v.daily || !v.daily.mpQuestVelvet); },
      hint: "后巷天鹅绒侧门旁的铜铃下挂着一枚暗红色的木牌。",
      icon: "img/misc/icon/brothel.gif",
      linkText: "走近天鹅绒侧门 (0:15)",
      passage: "MP Quest Connudatus Velvet"
    },
    {
      locs: ["Farmland", "Harvest Street"],
      check: function (v) { return (Number(v.mpQuestMill) || 0) < 7 && (!v.daily || !v.daily.mpQuestMill); },
      hint: "荒废的旧风车磨坊下方传来齿轮缓慢转动的声响。",
      icon: "img/misc/icon/walk.png",
      linkText: "走向旧风车磨坊 (0:20)",
      passage: "MP Quest Farmland Mill"
    },
    {
      locs: ["Sewers", "Commercial Alleyways"],
      check: function (v) { return (Number(v.mpQuestUnderground) || 0) < 7 && (!v.daily || !v.daily.mpQuestUnderground); },
      hint: "排水渠拱顶下的石壁上用粉笔画着一个不起眼的三岔记号。",
      icon: "img/misc/icon/sneak.png",
      linkText: "顺着粉笔记号探索暗渠 (0:20)",
      passage: "MP Quest Sewers Market"
    }
  ];

  function injectWorldAndCompanionNodes(host, pas, v) {
    if (!host || !pas || !v || v.combat === 1) return;
    if (SAFE_PASSAGES.indexOf(pas) < 0 || pas === HUB || pas === BEDROOM) return;

    var oldWorldBox = document.getElementById("mp-world-organic-box");
    if (oldWorldBox && oldWorldBox.parentNode) oldWorldBox.parentNode.removeChild(oldWorldBox);

    var container = el("div", { id: "mp-world-organic-box", style: "margin:8px 0;" });
    var hasAny = false;

    // 1. 若同伴不在线，且当前地点在伴侣 NPC 的日常作息地点中，自然融入孤儿院/学校/小镇场景
    syncCompanionToVariables();
    var comp = v.mpCompanion;
    if (comp && S.players.size === 0 && Array.isArray(comp.activeLocations) && comp.activeLocations.indexOf(pas) >= 0) {
      hasAny = true;
      var cName = comp.name || "艾琳";
      var desc = "";
      if (pas === "Orphanage") {
        desc = cName + "正待在孤儿院走廊靠近房间的位置，听到你的脚步声便抬起头望了过来。";
      } else if (pas === "Bedroom") {
        desc = cName + "的房门就在走廊斜对面，门缝里透出温暖的灯光。";
      } else if (pas === "Hallways" || pas === "School Library" || pas === "Canteen" || pas === "School Front Courtyard") {
        desc = cName + "正抱着课本站在不远处，在人群中一眼注意到了你的身影。";
      } else if (pas === "Park" || pas === "Garden") {
        desc = cName + "正坐在长椅边整理手里的东西，微风吹动着发梢。";
      } else {
        desc = "你在街角看到了" + cName + "熟悉的身影。";
      }
      var compP = el("div", { style: "margin:6px 0;" });
      compP.appendChild(el("span", { text: desc + " " }));
      var compLink = el("a", {
        class: "link-internal",
        onclick: function (ev) {
          ev.preventDefault();
          v.mpReturnPassage = pas;
          enginePlay("MP Companion Hub");
        }
      });
      compLink.appendChild(dolIconImg("img/misc/icon/socialise.png"));
      compLink.appendChild(document.createTextNode("走近" + cName + " (0:05)"));
      compP.appendChild(compLink);
      container.appendChild(compP);
    }

    // 2. 检查当前场景是否有满足隐藏条件的大世界支线暗线（最多只给 1 句环境描写暗示 + 1 个原版交互链接）
    for (var i = 0; i < WORLD_STORYLINE_HOOKS.length; i++) {
      var hk = WORLD_STORYLINE_HOOKS[i];
      if (hk.locs.indexOf(pas) >= 0 && hk.check(v)) {
        hasAny = true;
        var qRow = el("div", { style: "margin:6px 0;" });
        qRow.appendChild(el("span", { text: hk.hint + " " }));
        (function (hookItem) {
          var qLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              enginePlay(hookItem.passage);
            }
          });
          qLink.appendChild(dolIconImg(hookItem.icon));
          qLink.appendChild(document.createTextNode(hookItem.linkText));
          qRow.appendChild(qLink);
        })(hk);
        container.appendChild(qRow);
        break;
      }
    }

    if (hasAny) {
      var pasEl = host.querySelector(".passage") || host;
      var inlineRoot = document.getElementById("mp-inline-root");
      if (inlineRoot && inlineRoot.parentNode === host) {
        host.insertBefore(container, inlineRoot);
      } else {
        pasEl.appendChild(container);
      }
    }
  }

  /* ---------------- 注入页面内原生虚线交互区（含「同步时间线」选择器与离线伴侣卧室入口） ---------------- */

  function injectInlinePassageSections() {
    var host = document.getElementById("passages");
    if (!host) return;
    var pas = (window.State && State.passage) || "";
    if (pas === HUB || pas === BEDROOM) return;

    var old = document.getElementById("mp-inline-root");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var v = V();
    if (v && v.combat === 1) return;

    injectAmbientCoopText();
    injectWorldAndCompanionNodes(host, pas, v);

    var root = el("div", { id: "mp-inline-root" });

    if (pas === "Orphanage" || pas === "Bedroom") {
      var bedSec = el("div", { class: "mp-inline-section" });
      bedSec.appendChild(el("div", { class: "mp-inline-header", text: "孤儿院房间" }));
      var bedLine = el("div", { class: "mp-inline-player-line" });
      bedLine.appendChild(dolIconImg("img/misc/icon/bed.png"));
      bedLine.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "margin-left:2px;",
        text: S.name + "的卧室",
        onclick: function (ev) {
          ev.preventDefault();
          enginePlay("Bedroom");
        }
      }));
      if (S.players.size > 0) {
        S.players.forEach(function (p) {
          bedLine.appendChild(el("a", {
            class: "link-internal mp-inline-link",
            text: (p.name || "同伴") + "的卧室",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              enginePlay(BEDROOM);
            }
          }));
        });
      } else if (v && v.mpCompanion) {
        bedLine.appendChild(el("a", {
          class: "link-internal mp-inline-link",
          text: (v.mpCompanion.name || "艾琳") + "的房间",
          onclick: function (ev) {
            ev.preventDefault();
            v.mpReturnPassage = pas;
            enginePlay("MP Companion Room");
          }
        }));
      }
      bedSec.appendChild(bedLine);
      root.appendChild(bedSec);
    }

    var intSec = el("div", { class: "mp-inline-section" });
    var hdr = el("div", { class: "mp-inline-header" });
    hdr.appendChild(el("span", { text: "联机同行" }));
    if (S.room) {
      hdr.appendChild(el("a", {
        class: "mp-inline-link",
        style: "font-size:0.95em;",
        text: S.syncMode ? "切换为分头行动" : "切换为组队同步",
        onclick: function (ev) {
          ev.preventDefault();
          toggleSyncMode();
        }
      }));
      hdr.appendChild(el("a", {
        class: "mp-inline-link",
        style: "font-size:0.95em;",
        text: "召集队友会合",
        onclick: function (ev) {
          ev.preventDefault();
          send({
            t: "meet_here",
            passage: (window.State && State.passage) || "Orphanage",
            timeStamp: V().timeStamp || S.clock.timeStamp
          });
          toast("已向房间队友发出会合召集", "mp-ok");
        }
      }));
      if (S.players.size > 0) {
        hdr.appendChild(el("a", {
          class: "mp-inline-link",
          style: "font-size:0.95em;color:#82cfff;",
          text: "同步时间线",
          onclick: function (ev) {
            ev.preventDefault();
            if (S.players.size === 1) {
              var onlyPeer = S.players.values().next().value;
              requestTimelineSync(onlyPeer.id);
            } else {
              S.showTimelinePicker = !S.showTimelinePicker;
              injectInlinePassageSections();
            }
          }
        }));
      }
    }
    intSec.appendChild(hdr);

    if (S.showTimelinePicker && S.players.size > 0) {
      var pickBar = el("div", {
        style: "margin:6px 0;padding:6px 10px;border:1px solid #5aa0d8;border-radius:4px;background:rgba(15,35,55,0.85);color:#b8dcff;"
      });
      pickBar.appendChild(el("span", { text: "选择要将你的时间线同步至哪位队友的时间线：" }));
      S.players.forEach(function (p) {
        pickBar.appendChild(el("a", {
          class: "link-internal mp-inline-link",
          style: "color:#65f08e;margin-left:8px;",
          text: (p.name || "队友") + " · " + formatTimestampClock(p.timeStamp),
          onclick: function (ev) {
            ev.preventDefault();
            S.showTimelinePicker = false;
            requestTimelineSync(p.id);
            injectInlinePassageSections();
          }
        }));
      });
      intSec.appendChild(pickBar);
    }

    if (S.pendingMeetInvite) {
      var inv = S.pendingMeetInvite;
      var invHostPlayer = S.players.get(inv.fromId) || { passage: inv.passage };
      var meetRoute = calcShortestAssistTravelClient(invHostPlayer);
      var invBar = el("div", {
        id: "mp-meet-invite-bar",
        style: "margin:6px 0;padding:6px 10px;border:1px solid #e0a82e;border-radius:4px;background:rgba(60,45,15,0.85);color:#ffd479;"
      });
      invBar.appendChild(el("span", {
        text: (inv.fromName || "队友") + " 召集你前往 " + shortLoc(inv.passage) + " 会合，途经 " + meetRoute.routeSummary + "："
      }));
      invBar.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "color:#65f08e;font-weight:bold;margin-left:8px;",
        text: "同意会合 (" + meetRoute.shortTag + ")",
        onclick: function (ev) {
          ev.preventDefault();
          S.pendingMeetInvite = null;
          send({ t: "meet_accept", fromId: inv.fromId, passage: inv.passage });
        }
      }));
      invBar.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "color:#ff8a8a;margin-left:8px;",
        text: "暂不前往",
        onclick: function (ev) {
          ev.preventDefault();
          S.pendingMeetInvite = null;
          injectInlinePassageSections();
        }
      }));
      intSec.appendChild(invBar);
    }

    if (S.pendingConsentInvite) {
      var ci = S.pendingConsentInvite;
      var ciBar = el("div", {
        id: "mp-consent-invite-bar",
        style: "margin:6px 0;padding:6px 10px;border:1px solid #d86a8a;border-radius:4px;background:rgba(60,20,35,0.85);color:#ffb8cc;"
      });
      ciBar.appendChild(el("span", {
        text: (ci.fromName || "队友") + " 向你伸出手，想与你亲密温存："
      }));
      ciBar.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "color:#65f08e;font-weight:bold;margin-left:8px;",
        text: "迎上前去",
        onclick: function (ev) {
          ev.preventDefault();
          var reqId = ci.reqId;
          S.pendingConsentInvite = null;
          send({ t: "consensual_accept", reqId: reqId });
          injectInlinePassageSections();
        }
      }));
      ciBar.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "color:#ff8a8a;margin-left:8px;",
        text: "轻轻摇头",
        onclick: function (ev) {
          ev.preventDefault();
          var reqId = ci.reqId;
          S.pendingConsentInvite = null;
          send({ t: "consensual_decline", reqId: reqId });
          injectInlinePassageSections();
        }
      }));
      intSec.appendChild(ciBar);
    }

    if (S.pendingSyncInvite) {
      var si = S.pendingSyncInvite;
      var siBar = el("div", {
        id: "mp-sync-invite-bar",
        style: "margin:6px 0;padding:6px 10px;border:1px solid #5aa0d8;border-radius:4px;background:rgba(15,40,60,0.85);color:#b8dcff;"
      });
      siBar.appendChild(el("span", {
        text: (si.fromName || "队友") + " 邀请你结伴同步行动："
      }));
      siBar.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "color:#65f08e;font-weight:bold;margin-left:8px;",
        text: "同意同步",
        onclick: function (ev) {
          ev.preventDefault();
          var reqId = si.reqId;
          S.pendingSyncInvite = null;
          send({ t: "sync_accept", reqId: reqId });
          injectInlinePassageSections();
        }
      }));
      siBar.appendChild(el("a", {
        class: "link-internal mp-inline-link",
        style: "color:#ff8a8a;margin-left:8px;",
        text: "保持分头",
        onclick: function (ev) {
          ev.preventDefault();
          var reqId = si.reqId;
          S.pendingSyncInvite = null;
          send({ t: "sync_decline", reqId: reqId });
          injectInlinePassageSections();
        }
      }));
      intSec.appendChild(siBar);
    }

    if (!S.connected || !S.room) {
      var unconn = el("div", { class: "mp-inline-player-line" });
      unconn.appendChild(el("span", { class: "mp-status-dot", style: "background:#777;" }));
      unconn.appendChild(el("span", { text: "当前为单人/离线伴侣模式 " }));
      unconn.appendChild(el("a", {
        class: "mp-inline-link",
        text: "打开联机面板",
        onclick: function (ev) { ev.preventDefault(); togglePanel(); }
      }));
      intSec.appendChild(unconn);
    } else if (S.players.size === 0) {
      var waiting = el("div", { class: "mp-inline-player-line" });
      waiting.appendChild(el("span", { class: "mp-status-dot", style: "background:#e0a82e;" }));
      waiting.appendChild(el("span", { text: S.name + " · 房间码 " + S.room + " · 伴侣离线中，可在孤儿院与镇上寻访 " + ((v && v.mpCompanion && v.mpCompanion.name) || "艾琳") }));
      intSec.appendChild(waiting);
    } else {
      S.players.forEach(function (p) {
        var line = el("div", { class: "mp-inline-player-line" });
        var dot = el("span", { class: "mp-status-dot" });
        dot.style.backgroundColor = p.inCombat ? "#ff5a5a" : ((p.passage === pas) ? "#4fd07a" : "#e0a82e");
        line.appendChild(dot);

        var relInfo = getRel(p.name || p.id);
        var relBadge = relInfo.stage === "soulmate" ? " · 誓约" : relInfo.stage === "lover" ? " · 恋人" : relInfo.stage === "crush" ? " · 暧昧" : "";
        var pTimeStr = p.timeStamp ? (" · " + formatTimestampClock(p.timeStamp)) : "";
        line.appendChild(el("span", {
          text: (p.name || "玩家") + relBadge + " · " + shortLoc(p.passage) + pTimeStr + (p.inCombat ? " · 遭遇战中" : "")
        }));

        if (p.inCombat) {
          var assistRoute = calcShortestAssistTravelClient(p);
          var assistBtn = el("a", {
            class: "link-internal mp-inline-link",
            style: "color:#ff9f5a;font-weight:bold;",
            title: assistRoute.routeSummary,
            onclick: function (ev) {
              ev.preventDefault();
              sendState(true);
              send({
                t: "assist_combat",
                to: p.id,
                returnPassage: findSafeReturnPassage(),
                recentPassages: (S._passageHistory || []).slice(-8)
              });
            }
          });
          assistBtn.appendChild(dolIconImg("img/misc/icon/run.png"));
          assistBtn.appendChild(document.createTextNode("赶去支援 (" + assistRoute.shortTag + ")"));
          line.appendChild(assistBtn);
        }

        var intLink = el("a", {
          class: "link-internal mp-inline-link",
          onclick: function (ev) {
            ev.preventDefault();
            openNativeInteract(p);
          }
        });
        intLink.appendChild(dolIconImg("img/misc/icon/socialise.png"));
        intLink.appendChild(document.createTextNode("互动"));
        line.appendChild(intLink);

        var syncTimeLink = el("a", {
          class: "link-internal mp-inline-link",
          style: "color:#82cfff;",
          onclick: function (ev) {
            ev.preventDefault();
            requestTimelineSync(p.id);
          }
        });
        syncTimeLink.appendChild(document.createTextNode("同步时间线"));
        line.appendChild(syncTimeLink);

        var atkLink = el("a", {
          class: "link-internal mp-inline-link",
          onclick: function (ev) {
            ev.preventDefault();
            sendState(true);
            send({ t: "attack_request", to: p.id, consensual: false });
          }
        });
        atkLink.appendChild(dolIconImg("img/misc/icon/brothel.gif"));
        atkLink.appendChild(document.createTextNode("袭击"));
        line.appendChild(atkLink);

        var stealLink = el("a", {
          class: "link-internal mp-inline-link",
          onclick: function (ev) {
            ev.preventDefault();
            sendState(true);
            send({ t: "steal_request", to: p.id });
          }
        });
        stealLink.appendChild(dolIconImg("img/misc/icon/sneak.png"));
        stealLink.appendChild(document.createTextNode("窃取"));
        line.appendChild(stealLink);

        var tradeLink = el("a", {
          class: "link-internal mp-inline-link",
          onclick: function (ev) {
            ev.preventDefault();
            openTrade(p);
          }
        });
        tradeLink.appendChild(dolIconImg("img/misc/icon/gift.png"));
        tradeLink.appendChild(document.createTextNode("交易"));
        line.appendChild(tradeLink);

        if (p.passage && p.passage !== pas) {
          var goRoute = calcShortestAssistTravelClient(p);
          var goLink = el("a", {
            class: "link-internal mp-inline-link",
            title: goRoute.routeSummary,
            onclick: function (ev) {
              ev.preventDefault();
              try {
                if (window.Time && typeof Time.pass === "function") {
                  Time.pass(goRoute.seconds);
                  refreshSidebar();
                }
              } catch (e) {}
              toast("经由 " + goRoute.routeSummary + " 赶往 " + (p.name || "队友") + " 身边", "mp-ok");
              enginePlay(p.passage);
            }
          });
          goLink.appendChild(dolIconImg("img/misc/icon/walk.png"));
          goLink.appendChild(document.createTextNode("会合 (" + goRoute.shortTag + ")"));
          line.appendChild(goLink);
        }

        intSec.appendChild(line);
      });
    }

    root.appendChild(intSec);
    host.appendChild(root);
  }

  /* ---------------- 右下角实时世界时钟胶囊条 & 底部会合频道浮层 ---------------- */

  function formatGameClock() {
    try {
      if (window.Time && Number.isFinite(Time.hour) && Number.isFinite(Time.minute)) {
        return String(Time.hour).padStart(2, "0") + ":" + String(Time.minute).padStart(2, "0");
      }
    } catch (e) {}
    var ts = (V() && V().timeStamp) || S.clock.timeStamp || 25260;
    return formatTimestampClock(ts);
  }

  function renderClockPill() {
    var pill = document.getElementById("mp-clock-pill");
    if (!pill) return;
    var timeEl = document.getElementById("mp-clk-time");
    var spdEl = document.getElementById("mp-clk-speed");
    var playEl = document.getElementById("mp-clk-play");
    if (timeEl) timeEl.textContent = "🕰️ " + formatGameClock();
    if (spdEl) spdEl.textContent = (S.clock.speed || 1) + "x";
    if (playEl) {
      playEl.textContent = S.clock.running ? "⏸" : "▶";
      playEl.classList.toggle("mp-running", !!S.clock.running);
    }
  }

  function renderChannelBar() {
    var bar = document.getElementById("mp-channel-bar");
    if (!bar) return;
    var v = V();
    var inCombat = !!(v && v.combat === 1);
    if (!S.room && !inCombat) {
      bar.classList.add("mp-hide");
      return;
    }
    bar.classList.remove("mp-hide");
    var sub = document.getElementById("mp-ch-sub");
    if (sub) {
      if (inCombat) {
        sub.textContent = S.lastChannelTip || "双方点击 Next 后同步结算本回合动作";
      } else {
        sub.textContent = S.syncMode
          ? ("组队同行中 · 房间 " + S.room + " · 事件与选项同步，各自行动扣减自己的时间线")
          : ("分头行动中 · 房间 " + S.room + " · 时间线独立流动，可随时点击同步时间线");
      }
    }
  }

  /* ---------------- 日志 (Journal) 地图圆点与下方 P1/P2 玩家位置列表 ---------------- */

  function renderMapMarkers() {
    var div = document.getElementById("divmap");
    var mapImg = document.getElementById("map");
    var layer = document.getElementById("mp-map-layer");
    if (!div || !mapImg) {
      if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
      return;
    }
    var rect = mapImg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    if (!layer) {
      layer = el("div", { id: "mp-map-layer", class: "mp-map-layer" });
      div.appendChild(layer);
    }
    layer.innerHTML = "";

    var divRect = div.getBoundingClientRect();
    var nw = mapImg.naturalWidth || 256;
    var nh = mapImg.naturalHeight || 128;
    var sx = rect.width / nw;
    var sy = rect.height / nh;
    var offX = rect.left - divRect.left;
    var offY = rect.top - divRect.top;

    var colors = ["#e04f4f", "#e0a82e", "#4fd07a", "#5aa9e6", "#b56ae6", "#ff8c42", "#42f5d4", "#f54298"];
    var allList = [{
      id: S.id || "me",
      name: S.name,
      passage: (window.State && State.passage) || "Orphanage",
      location: (V() && V().location) || "",
      mapLocation: (V() && V().map && V().map.location) || "domus"
    }];
    S.players.forEach(function (p) { allList.push(p); });

    allList.forEach(function (p, idx) {
      var pt = MAP_POINTS[normalizeLoc(p.mapLocation || p.location || p.passage)] || MAP_POINTS["domus"];
      var chip = el("button", {
        class: "mp-map-chip",
        title: "P" + (idx + 1) + "·" + p.name + ": " + shortLoc(p.passage)
      });
      chip.style.backgroundColor = colors[idx % colors.length];
      chip.style.left = (offX + pt.x * sx + idx * 10) + "px";
      chip.style.top = (offY + pt.y * sy) + "px";
      layer.appendChild(chip);
    });

    var listBox = document.getElementById("mp-journal-players");
    if (!listBox) {
      listBox = el("div", { id: "mp-journal-players" });
      div.insertAdjacentElement("afterend", listBox);
    }
    listBox.innerHTML = "";
    allList.forEach(function (p, idx) {
      var item = el("div", { class: "mp-journal-item" });
      var c = colors[idx % colors.length];
      var dot = el("span", { class: "mp-status-dot", style: "background:" + c + ";" });
      var label = el("span", {
        style: "color:" + c + ";",
        text: "P" + (idx + 1) + "·" + (p.name || "玩家") + ": "
      });
      var locSpan = el("span", {
        style: "color:#c8bfa8;",
        text: shortLoc(p.passage)
      });
      item.appendChild(dot);
      item.appendChild(label);
      item.appendChild(locSpan);
      listBox.appendChild(item);
    });
  }

  /* ---------------- 物品与交易系统 ---------------- */

  var CATALOG = null;
  function catalogs() {
    if (CATALOG) return CATALOG;
    var food = [], sex = [], cloth = [];
    var fs = (window.setup && setup.foodstuff) || {};
    Object.keys(fs).forEach(function (k) {
      var d = fs[k] || {};
      food.push({ v: k, label: (d.singular || k) });
    });
    ((window.setup && setup.sextoys) || []).forEach(function (s) { sex.push({ v: s.name, label: s.namecap || s.name }); });
    var cs = (window.setup && setup.clothes) || {};
    Object.keys(cs).forEach(function (slot) {
      var arr = cs[slot];
      if (!Array.isArray(arr)) {
        if (arr && typeof arr === "object") arr = Object.keys(arr).map(function (k) { return arr[k]; });
        else return;
      }
      arr.forEach(function (c) {
        if (!c || !c.name) return;
        cloth.push({ v: slot + "\u0001" + c.name, label: (c.cn_name_cap || c.name) + " · " + slot });
      });
    });
    CATALOG = { food: food, sex: sex, cloth: cloth };
    return CATALOG;
  }

  function foodLabel(k) { var d = ((window.setup && setup.foodstuff) || {})[k]; return d ? (d.singular || k) : k; }
  function toyLabel(n) { var s = ((window.setup && setup.sextoys) || []).filter(function (x) { return x.name === n; })[0]; return s ? (s.namecap || n) : n; }

  function ownedItems() {
    var v = V(), out = [];
    var ff = v.foodstuff || {};
    Object.keys(ff).forEach(function (k) {
      var n = (ff[k] && ff[k].amount) | 0;
      if (n > 0) out.push({ kind: "food", key: k, amount: n, label: foodLabel(k) + " ×" + n });
    });
    var sx = (v.player && v.player.inventory && v.player.inventory.sextoys) || {};
    Object.keys(sx).forEach(function (cat) {
      (sx[cat] || []).forEach(function (item, idx) {
        if (!item) return;
        out.push({ kind: "sextoy", category: cat, name: item.name || cat, item: clone(item), label: toyLabel(cat) + " #" + (idx + 1) });
      });
    });
    var wd = v.wardrobe || {};
    Object.keys(wd).forEach(function (slot) {
      var arr = wd[slot];
      if (!Array.isArray(arr)) return;
      arr.forEach(function (item) {
        if (!item || !item.name) return;
        out.push({ kind: "clothing", slot: slot, name: item.name, item: clone(item), label: (item.cn_name_cap || item.name) + " · " + slot });
      });
    });
    return out;
  }

  /* ---------------- WebSocket 连接与消息处理 ---------------- */

  function connect() {
    if (S.ws && (S.ws.readyState === 0 || S.ws.readyState === 1)) return;
    S.manualClose = false;
    setStatus("连接中…", "mp-wait");
    var ws;
    try { ws = new WebSocket(S.server); } catch (e) {
      setStatus("地址无效", "mp-bad"); toast("服务器地址无效：" + S.server, "mp-bad"); return;
    }
    S.ws = ws;
    ws.onopen = function () {
      S.connected = true;
      setStatus("已连接", "mp-ok");
      send({ t: "hello", name: S.name });
      sendState(true);
      logLine("已连接到 " + S.server, "mp-sys");
      renderRoom(); renderPlayers(); renderJoinRequests();
      if (S.roomCode) {
        if (S.wasHost) {
          send({ t: "create_room", name: S.name, needApproval: S.needApproval });
        } else {
          send({ t: "join_room", code: S.roomCode, name: S.name });
        }
      }
    };
    ws.onmessage = function (ev) {
      var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      handleMessage(msg);
    };
    ws.onclose = function () {
      S.connected = false; S.id = null; S.players.clear(); S.acts.clear();
      S.room = null; S.isHost = false; S.pendingJoin = null; S.joinRequests.clear();
      syncCompanionToVariables();
      renderPlayers(); renderRequests(); renderHub(); renderBedroom();
      renderRoom(); renderJoinRequests(); renderChannelBar();
      injectInlinePassageSections();
      setStatus("未连接", "mp-bad");
      if (!S.manualClose) { clearTimeout(S.retryTimer); S.retryTimer = setTimeout(connect, 3000); }
    };
    ws.onerror = function () {};
  }

  function disconnect() { S.manualClose = true; clearTimeout(S.retryTimer); if (S.ws) S.ws.close(); }

  function handleMessage(msg) {
    switch (msg.t) {
      case "welcome":
        S.id = msg.id;
        renderPlayers();
        break;

      case "room_joined": {
        S.room = msg.code;
        S.roomCode = msg.code;
        S.isHost = !!msg.host;
        S.needApproval = !!msg.needApproval;
        if (msg.syncMode !== undefined) S.syncMode = !!msg.syncMode;
        S.pendingJoin = null;
        S.joinRequests.clear();
        localStorage.setItem(LS_ROOM, S.room);
        localStorage.setItem(LS_HOST, S.isHost ? "1" : "0");
        S.wasHost = S.isHost;
        S.players.clear();
        (msg.players || []).forEach(function (p) {
          if (p.id !== S.id) {
            S.players.set(p.id, p);
            updateCompanionFromOnlinePlayer(p);
          }
        });
        if (msg.prng) applySharedPrng(msg.prng);
        if (msg.clock) {
          S.clock.speed = msg.clock.speed || 1;
          S.clock.running = !!msg.clock.running;
        }
        syncCompanionToVariables();
        renderRoom(); renderPlayers(); renderJoinRequests();
        renderClockPill(); renderChannelBar(); injectInlinePassageSections();
        toast("已进入房间 " + S.room, "mp-ok");
        sendState(true);
        break;
      }

      case "room_left": {
        S.room = null; S.roomCode = ""; S.isHost = false; S.pendingJoin = null;
        S.players.clear(); S.joinRequests.clear();
        localStorage.removeItem(LS_ROOM);
        localStorage.removeItem(LS_HOST);
        S.wasHost = false;
        syncCompanionToVariables();
        renderRoom(); renderPlayers(); renderJoinRequests();
        renderChannelBar(); injectInlinePassageSections();
        toast("已离开房间", "");
        break;
      }

      case "room_host_changed": {
        if (msg.hostId === S.id) {
          S.isHost = true; S.wasHost = true;
          localStorage.setItem(LS_HOST, "1");
          toast("你成为新房主", "mp-ok");
        }
        renderRoom(); renderPlayers();
        break;
      }

      case "room_settings":
        S.needApproval = !!msg.needApproval;
        renderRoom();
        break;

      case "join_request":
        S.joinRequests.set(msg.reqId, msg);
        renderJoinRequests();
        toast(msg.name + " 请求加入房间", "mp-wait");
        break;

      case "join_pending":
        S.pendingJoin = msg;
        setStatus("等待房主批准…", "mp-wait");
        renderRoom();
        break;

      case "join_rejected": {
        S.pendingJoin = null;
        var reasons = { timeout: "加入请求超时", host: "房主拒绝了加入请求", host_left: "房主已离开房间", full: "房间已满", busy: "你已经在别的房间了" };
        toast(reasons[msg.reason] || "加入失败", "mp-bad");
        if (msg.reason === "host_left" || msg.reason === "timeout") {
          S.roomCode = "";
          S.wasHost = false;
          localStorage.removeItem(LS_ROOM);
          localStorage.removeItem(LS_HOST);
        }
        renderRoom();
        break;
      }

      case "join_cancelled":
        S.joinRequests.delete(msg.reqId);
        renderJoinRequests();
        break;

      case "sys":
        logLine(msg.text, "mp-sys");
        break;

      case "roster": {
        S.players.clear();
        (msg.players || []).forEach(function (p) {
          if (p.id !== S.id) {
            S.players.set(p.id, p);
            updateCompanionFromOnlinePlayer(p);
          }
        });
        if (msg.hostId) S.isHost = (msg.hostId === S.id);
        var prevSync = S.syncMode;
        if (msg.syncMode !== undefined) S.syncMode = !!msg.syncMode;
        if (msg.prng) applySharedPrng(msg.prng);
        syncCompanionToVariables();
        renderPlayers(); renderHub(); renderBedroom();
        if (prevSync !== S.syncMode) { renderRoom(); renderChannelBar(); }
        injectInlinePassageSections();
        renderMapMarkers();
        break;
      }

      case "clock_tick":
        applyClockTick(msg);
        break;

      case "sync_timeline_apply": {
        if (Number.isFinite(msg.timeStamp)) {
          applyClockTick({
            timeStamp: msg.timeStamp,
            speed: S.clock.speed,
            running: S.clock.running,
            explicitSync: true
          });
          sendState(true);
          toast("已将你的时间线同步至 " + (msg.targetName || "队友") + " 的时间 " + formatTimestampClock(msg.timeStamp), "mp-ok");
        }
        break;
      }

      case "sync_jump": {
        if (!S.syncMode) break;
        if (msg.prng) applySharedPrng(msg.prng);
        var vj = V();
        if (S.combatId) break;
        var targetPas = msg.passage || "";
        if (!targetPas) break;
        var badPas = ["Start", "Start2", "Orphanage Intro", MP_COMBAT_PASSAGE, "MP Native Combat Finish"];
        if (badPas.indexOf(targetPas) >= 0 || targetPas.indexOf("MP Player Interact") === 0 || targetPas.indexOf("MP Companion") === 0) break;

        var curPas = (window.State && State.passage) || "";
        if (curPas === MP_COMBAT_PASSAGE || curPas === "MP Native Combat Finish" || (vj && vj.combat === 1 && !msg.inCombat)) {
          cleanupNativeCombatState();
        }
        if (msg.eventContext) {
          applyEventContext(msg.eventContext);
        }
        if (msg.reason === "host_move" && SAFE_PASSAGES.indexOf(targetPas) >= 0 && vj) {
          vj.eventskip = 1;
        }
        S.myVotedIndex = -1;
        S.currentVotes = [];
        if (curPas !== targetPas || msg.reason === "phase_change") {
          S._syncJumpPassage = targetPas;
          enginePlay(targetPas);
        }
        break;
      }

      case "sync_event": {
        if (!S.syncMode || (!msg.name && !msg.content)) break;
        if (S.combatId || (V() && V().combat === 1)) break;
        var curEvPas = (window.State && State.passage) || "";
        var targetEvPas = msg.passage || curEvPas;
        var vEv = V();
        if (msg.eventContext) applyEventContext(msg.eventContext);
        if (msg.prng) applySharedPrng(msg.prng);
        vEv.eventforced = 1;
        vEv.mpForceEventOnce = 1;
        vEv.eventskip = 0;
        vEv.eventPoolOverride = msg.name || "inline_event";
        vEv.eventPoolOverrideContent = msg.content || "";
        vEv.eventPoolOverridePrng = msg.prng || S.prng;
        S._suppressEventPick = true;
        S._syncJumpPassage = targetEvPas;
        try {
          enginePlay(targetEvPas);
        } finally {
          S._suppressEventPick = false;
        }
        break;
      }

      case "sync_inline_dom": {
        if (!S.syncMode || !msg.html) break;
        if (S.combatId || (V() && V().combat === 1)) break;
        var curDomPas = (window.State && State.passage) || "";
        if (msg.passage && curDomPas !== msg.passage) {
          S._syncJumpPassage = msg.passage;
          enginePlay(msg.passage);
        }
        if (msg.eventContext) applyEventContext(msg.eventContext);
        applyMirroredInlineDom(msg);
        break;
      }

      case "sync_invite":
        S.pendingSyncInvite = msg;
        S.lastChannelTip = (msg.fromName || "队友") + " 请求组队同步";
        renderChannelBar();
        injectInlinePassageSections();
        toast((msg.fromName || "队友") + " 请求开启组队同步", "mp-wait");
        break;

      case "sync_accepted":
        S.pendingSyncInvite = null;
        S.syncMode = true;
        injectInlinePassageSections();
        renderRoom();
        renderChannelBar();
        toast((msg.byName || "队友") + " 已同意组队同步", "mp-ok");
        break;

      case "sync_declined":
        S.pendingSyncInvite = null;
        S.syncMode = false;
        injectInlinePassageSections();
        renderRoom();
        renderChannelBar();
        toast((msg.byName || "队友") + " 保持分头行动", "mp-bad");
        break;

      case "sync_state":
      case "sync_mode_changed": {
        var wasSyncState = S.syncMode;
        S.pendingSyncInvite = null;
        S.syncMode = !!msg.syncMode;
        injectInlinePassageSections();
        renderRoom();
        renderChannelBar();
        if (wasSyncState !== S.syncMode) {
          if (S.syncMode) {
            toast((msg.byName ? msg.byName : "队友") + " 开启了组队同步", "mp-ok");
          } else {
            toast((msg.byName ? msg.byName : "队友") + " 切回了分头行动", "mp-wait");
          }
        }
        break;
      }

      case "meet_invite":
        S.pendingMeetInvite = msg;
        S.lastChannelTip = (msg.fromName || "队友") + " 召集前往 " + shortLoc(msg.passage) + " 会合";
        renderChannelBar();
        injectInlinePassageSections();
        toast((msg.fromName || "队友") + " 召集前往 " + shortLoc(msg.passage) + " 会合", "mp-wait");
        break;

      case "meet_jump": {
        S.pendingMeetInvite = null;
        S.syncMode = true;
        if (msg.prng) applySharedPrng(msg.prng);
        if (msg.eventContext) applyEventContext(msg.eventContext);
        try {
          var vMeet = V();
          if (msg.busFare && vMeet && (vMeet.money || 0) >= msg.busFare) {
            vMeet.money -= msg.busFare;
            if (window.updateSideBarMoney) window.updateSideBarMoney();
          }
          if (msg.timeCostSeconds && window.Time && typeof Time.pass === "function") {
            Time.pass(msg.timeCostSeconds);
          }
          if (vMeet) vMeet.eventskip = 1;
          refreshSidebar();
        } catch (e) {}
        if (msg.passage && window.State && State.passage !== msg.passage) {
          cleanupNativeCombatState();
          S._syncJumpPassage = msg.passage;
          enginePlay(msg.passage);
        } else {
          injectInlinePassageSections();
        }
        renderChannelBar();
        toast("经由 " + (msg.routeSummary || shortLoc(msg.passage)) + " 与 " + (msg.fromName || "队友") + " 会合", "mp-ok");
        break;
      }

      case "meet_accepted_notify":
        S.syncMode = true;
        if (msg.prng) applySharedPrng(msg.prng);
        injectInlinePassageSections();
        renderChannelBar();
        toast((msg.byName || "队友") + " 已抵达 " + shortLoc(msg.passage) + " 会合", "mp-ok");
        break;

      case "consensual_request":
        S.pendingConsentInvite = msg;
        S.lastChannelTip = (msg.fromName || "队友") + " 想要与你温存";
        renderChannelBar();
        injectInlinePassageSections();
        toast((msg.fromName || "队友") + " 想要与你温存", "mp-wait");
        break;

      case "consensual_pending":
        toast("正在等待 " + (msg.toName || "对方") + " 回应…", "mp-wait");
        break;

      case "consensual_declined":
        S.pendingConsentInvite = null;
        toast("对方婉拒了你的靠近", "mp-bad");
        if (window.State && State.passage === "MP Player Interact Consensual") {
          enginePlay("MP Player Interact");
        }
        break;

      case "interact_effect": {
        try {
          var fromPartner = msg.fromName || "同伴";
          if (msg.virginityTaken) {
            takeVirginityByPlayer(fromPartner, msg.virginityTaken);
          }
          if (msg.relDelta || msg.milestoneStage) {
            updateRel(fromPartner, msg.relDelta, msg.milestoneStage, msg.kind || "peer_interact", true);
          }
          if (window.statChange) {
            if (msg.stressDelta) statChange.stress(msg.stressDelta);
            if (msg.traumaDelta) statChange.trauma(msg.traumaDelta);
            if (msg.tirednessDelta && statChange.tiredness) statChange.tiredness(msg.tirednessDelta);
            if (msg.arousalDelta) statChange.arousal(msg.arousalDelta, "genital");
          }
          var relBanner = document.getElementById("mp-rel-header");
          if (relBanner) relBanner.innerHTML = renderRelationshipBannerHtml();
          refreshSidebar();
        } catch (e) {}
        var effLine = (msg.fromName || "同伴") + (msg.text || "与你进行了互动");
        logLine(effLine, "mp-sys");
        toast(effLine, "mp-ok");
        break;
      }

      case "link_vote_status":
        if (window.State && State.passage === msg.passage) {
          S.currentVotes = msg.votes || [];
          renderLinkVoteBadges();
        }
        break;

      case "link_commit":
        if (window.State && State.passage === msg.passage) {
          executeCommittedLink(msg);
        }
        break;

      case "pvp_combat_start": {
        if (msg.prng) applySharedPrng(msg.prng);
        S.combatId = msg.combatId || "";
        S.combatMode = msg.mode || "pvp";
        S.combatOpponent = msg.opponent;
        S.combatFighters = msg.fighters || {};
        S.combatSharedEnemy = null;
        S.combatLockedTargetId = "";
        S.combatLockedTargetName = "";
        S.combatTurnReady = false;
        S.combatReadyIds = [];
        S.lastCombatCommit = null;
        S.combatIsPvp = true;
        S.pendingPeerCombatTurns = [];
        var v = V();
        v.mpCombatStart = 1;
        v.mpCombatConsensual = msg.consensual ? 1 : 0;
        v.mpCombatMode = "pvp";
        if (msg.instantFinish) {
          v.mpCombatOutcome = msg.outcome || "me_pain_full";
          v.mpForceCombatEnd = 1;
        } else {
          delete v.mpCombatOutcome;
          delete v.mpForceCombatEnd;
        }
        v.mpOpponentName = (msg.opponent && msg.opponent.name) || "玩家";
        var retPas = msg.returnPassage || (window.State && State.passage) || "Orphanage";
        if (retPas === MP_COMBAT_PASSAGE || retPas === "Start" || retPas === "Start2" || retPas === "Orphanage Intro") {
          retPas = "Orphanage";
        }
        v.mpReturnPassage = retPas;
        send({
          t: "combat_sync_init",
          combatId: S.combatId,
          stats: collectMyStats(v)
        });
        prepareNativeCombatVars();
        if (msg.instantFinish || (Number(v.pain) >= 100 && !msg.consensual)) {
          v.mpCombatOutcome = msg.outcome || "me_pain_full";
          enginePlay("MP Native Combat Finish");
        } else {
          enginePlay(MP_COMBAT_PASSAGE);
        }
        S.lastChannelTip = "双方都点击 Next 后将同步结算回合";
        renderChannelBar();
        break;
      }

      case "combat_init_updated": {
        S.combatFighters = msg.fighters || {};
        var viUp = V();
        if (msg.instantFinish && viUp && !viUp.mpCombatConsensual) {
          viUp.mpCombatOutcome = msg.outcome || "me_pain_full";
          viUp.mpForceCombatEnd = 1;
          if (window.State && State.passage === MP_COMBAT_PASSAGE) {
            enginePlay("MP Native Combat Finish");
          }
          break;
        }
        if (viUp && S.combatOpponent && S.combatFighters[S.combatOpponent.id]) {
          var oppFUp = S.combatFighters[S.combatOpponent.id];
          viUp.enemyhealthmax = oppFUp.hpMax || 275;
          viUp.enemyhealth = oppFUp.hp;
          viUp.enemyarousalmax = oppFUp.arousalMax || 500;
          viUp.enemyarousal = oppFUp.arousal;
        }
        var oldHudUp = document.getElementById("mp-combat-hud");
        if (oldHudUp && oldHudUp.parentNode) oldHudUp.parentNode.removeChild(oldHudUp);
        enhanceNativeCombatDOM();
        break;
      }

      case "coop_combat_joined": {
        if (msg.prng) applySharedPrng(msg.prng);
        S.combatId = msg.combatId || "";
        S.combatMode = "coop_pve";
        S.combatOpponent = msg.opponent;
        S.combatFighters = msg.fighters || {};
        S.combatSharedEnemy = msg.sharedEnemy || null;
        S.combatLockedTargetId = msg.lockedTargetId || "";
        S.combatLockedTargetName = msg.lockedTargetName || "";
        S.combatTurnReady = false;
        S.combatReadyIds = [];
        S.lastCombatCommit = null;
        S.combatIsPvp = false;
        S.pendingPeerCombatTurns = [];

        var vc = V();
        vc.mpCombatMode = "coop_pve";
        vc.mpCombatIsHost = (msg.hostPlayerId === S.id) ? 1 : 0;
        if (msg.sharedEnemy && msg.sharedEnemy.wasTutorial) {
          vc.mpWasTutorial = 1;
        }
        delete vc.mpCombatOutcome;
        delete vc.mpForceCombatEnd;
        var retPasCoop = msg.returnPassage || findSafeReturnPassage(true);
        if (retPasCoop === MP_COMBAT_PASSAGE || retPasCoop === "Start" || retPasCoop === "Start2" || retPasCoop === "Orphanage Intro") {
          retPasCoop = "Domus Street";
        }
        vc.mpReturnPassage = retPasCoop;

        // 恢复被支援者原本遭遇战的完整 $NPCList 快照，保证 NPC 绝不发生变化！
        if (msg.sharedEnemy && msg.sharedEnemy.npcSnapshot) {
          applyEventContext(msg.sharedEnemy.npcSnapshot);
        }

        if (msg.helperId === S.id) {
          try {
            var costSec = msg.auto ? 0 : (msg.timeCostSeconds || 60);
            if (!msg.auto && msg.busFare && vc && (vc.money || 0) >= msg.busFare) {
              vc.money -= msg.busFare;
              if (window.updateSideBarMoney) window.updateSideBarMoney();
            }
            if (costSec > 0 && window.Time && typeof Time.pass === "function") {
              Time.pass(costSec);
              refreshSidebar();
            }
          } catch (e) {}
          vc.mpCombatStart = 1;
          vc.mpCombatConsensual = 0;
          prepareNativeCombatVars();
          enginePlay(MP_COMBAT_PASSAGE);
          if (!msg.auto) {
            toast("经由 " + (msg.routeSummary || "") + " 耗时 " + (msg.timeCostMinutes || 1) + " 分钟赶到现场支援 " + msg.hostPlayerName, "mp-ok");
          }
        } else {
          if (!msg.auto) {
            toast(msg.helperName + " 耗时 " + (msg.timeCostMinutes || 1) + " 分钟赶到现场支援你", "mp-ok");
          }
          if (window.State && State.passage !== MP_COMBAT_PASSAGE) {
            vc.mpCombatStart = 1;
            vc.mpCombatConsensual = 0;
            prepareNativeCombatVars();
            enginePlay(MP_COMBAT_PASSAGE);
          } else {
            refreshCombatCanvas();
            var oldHud = document.getElementById("mp-combat-hud");
            if (oldHud && oldHud.parentNode) oldHud.parentNode.removeChild(oldHud);
            enhanceNativeCombatDOM();
          }
        }
        S.lastChannelTip = "两人同时点击 Next 同步推进遭遇战回合";
        renderChannelBar();
        break;
      }

      case "combat_turn_status": {
        S.combatReadyIds = msg.readyIds || [];
        S.combatTotalNeeded = msg.totalNeeded || 2;
        renderCombatSyncHint();
        if (!S.combatTurnReady && S.combatReadyIds.length > 0) {
          S.lastChannelTip = (msg.readyNames || []).join("、") + " 已点击 Next，等待你点击 Next 同步结算";
          renderChannelBar();
        }
        break;
      }

      case "combat_turn_commit": {
        if (msg.prng) applySharedPrng(msg.prng);
        S.lastCombatCommit = msg;
        S.combatFighters = msg.fighters || {};
        if (msg.sharedEnemy) S.combatSharedEnemy = msg.sharedEnemy;
        if (msg.lockedTargetId !== undefined) S.combatLockedTargetId = msg.lockedTargetId;
        if (msg.lockedTargetName !== undefined) S.combatLockedTargetName = msg.lockedTargetName;
        S.combatTurnReady = false;
        S.combatReadyIds = [];

        if (msg.peerSnapshot && S.combatOpponent) {
          S.combatOpponent.combatSnapshot = msg.peerSnapshot;
        }

        var vCommit = V();
        if (msg.finished && vCommit) {
          vCommit.mpCombatOutcome = msg.outcome || "peer_down";
          vCommit.mpForceCombatEnd = 1;
          vCommit.eventskip = 1;
        }

        S.lastChannelTip = msg.combinedSummary || "双方已同步行动";
        renderChannelBar();

        var nextBtn = document.querySelector("#next a");
        if (nextBtn) {
          S.bypassCombatNextIntercept = true;
          try {
            nextBtn.click();
          } finally {
            S.bypassCombatNextIntercept = false;
          }
        } else if (window.State && State.passage === MP_COMBAT_PASSAGE) {
          enginePlay(msg.finished ? "MP Native Combat Finish" : MP_COMBAT_PASSAGE);
        }
        break;
      }

      case "combat_peer_turn": {
        if (msg.prng) applySharedPrng(msg.prng);
        S.pendingPeerCombatTurns.push(msg);
        S.lastChannelTip = msg.summary || (msg.fromName + " 执行了行动");
        renderChannelBar();
        break;
      }

      case "steal_result": {
        var v2 = V();
        if (msg.role === "thief") {
          if (msg.reason === "low_skill") {
            var gName = msg.grade || "F";
            toast("诡术不足：当前诡术为 " + gName + "，需要达到 诡术 B 才能下手", "mp-bad");
          } else if (msg.reason === "no_money") {
            toast(msg.targetName + " 身上分文皆无", "mp-wait");
          } else if (msg.success && msg.amount > 0) {
            v2.money = (Number(v2.money) || 0) + msg.amount;
            try {
              if (window.statChange && statChange.skill) statChange.skill("skulduggery", 5);
              if (window.updateSideBarMoney) window.updateSideBarMoney();
              refreshSidebar();
            } catch (e) {}
            sendState(true);
            toast("你趁 " + msg.targetName + " 不备顺走了 £" + (msg.amount / 100).toFixed(2), "mp-ok");
          } else {
            try { if (window.statChange) statChange.stress(6); refreshSidebar(); } catch (e) {}
            toast("窃取失手，被 " + msg.targetName + " 当场抓住了手腕", "mp-bad");
          }
        } else if (msg.role === "victim") {
          if (msg.success && msg.amount > 0) {
            v2.money = Math.max(0, (Number(v2.money) || 0) - msg.amount);
            try { if (window.updateSideBarMoney) window.updateSideBarMoney(); refreshSidebar(); } catch (e) {}
            sendState(true);
            toast("口袋一轻，" + msg.thiefName + " 顺走了你的 £" + (msg.amount / 100).toFixed(2), "mp-bad");
          } else if (msg.reason === "caught") {
            toast("你当场抓住了试图顺走你钱财的 " + msg.thiefName, "mp-bad");
          }
        }
        break;
      }

      case "chat": {
        var where = "";
        if (msg.passage && window.State && State.passage && msg.passage !== State.passage) {
          where = "[" + shortLoc(msg.passage) + "] ";
        }
        logLine("[" + (msg.from === S.id ? "我" : msg.name) + "]" + where + " " + msg.text, msg.from === S.id ? "mp-me" : "");
        break;
      }

      case "trade_request":
        S.trades.set(msg.tradeId, msg); renderRequests();
        toast(msg.from.name + " 向你发起了交易", "mp-wait");
        break;
      case "trade_sent":
        logLine("交易请求已发送", "mp-sys");
        break;
      case "trade_result":
        S.trades.delete(msg.tradeId);
        if (msg.status === "accepted") {
          var ok = applyTrade(msg);
          toast(ok ? "交易完成" : "交易失败", ok ? "mp-ok" : "mp-bad");
        } else if (msg.status === "declined") {
          toast("对方拒绝了交易", "");
        } else if (msg.status === "expired") {
          toast("交易请求已超时", "");
        }
        renderRequests();
        break;

      case "act_request":
        S.acts.set(msg.actId, msg); renderRequests();
        toast(msg.from.name + " 想和你" + (ACTS[msg.act] ? ACTS[msg.act].label : "互动"), "mp-wait");
        break;
      case "act_sent":
        toast("互动请求已发送", "");
        break;
      case "act_result":
        S.acts.delete(msg.actId);
        if (msg.status === "accepted") applyAct(msg);
        else if (msg.status === "declined") { toast("对方拒绝了互动", ""); }
        else if (msg.status === "expired") toast("互动请求已超时", "");
        renderRequests();
        break;

      case "error":
        toast(msg.message || "服务器错误", "mp-bad");
        if (msg.message && msg.message.indexOf("房间不存在") >= 0) {
          S.pendingJoin = null;
          S.roomCode = "";
          S.wasHost = false;
          localStorage.removeItem(LS_ROOM);
          localStorage.removeItem(LS_HOST);
          renderRoom();
        }
        break;
      default: break;
    }
  }

  function buildCombatInfo(v) {
    if (!v || v.combat !== 1) return null;
    var curPas = (window.State && State.passage) || "";
    return {
      enemyName: (v.NPCList && v.NPCList[0] && (v.NPCList[0].fullDescription_CN || v.NPCList[0].description_CN || v.NPCList[0].fullDescription)) || "袭击者",
      enemyPronoun: (v.NPCList && v.NPCList[0] && v.NPCList[0].pronoun) || "m",
      enemyGender: (v.NPCList && v.NPCList[0] && v.NPCList[0].gender) || "m",
      enemyHealth: v.enemyhealth || 275,
      enemyHealthMax: v.enemyhealthmax || 275,
      enemyArousal: v.enemyarousal || 100,
      enemyArousalMax: v.enemyarousalmax || 500,
      npcSnapshot: extractEventContext(),
      origPassage: curPas,
      wasTutorial: !!(v.mpWasTutorial === 1 || curPas === "Tutorial" || (v.spraymax || 0) <= 0 || v.tutorialExit !== undefined)
    };
  }

  function collectMyStats(v) {
    v = v || V();
    return {
      physique: Number(v.physique) || 10000,
      physiquesize: Number(v.physiquesize) || 20000,
      willpower: Number(v.willpower) || 500,
      willpowermax: Number(v.willpowermax) || 1000,
      skulduggery: Number(v.skulduggery) || 0,
      danceskill: Number(v.danceskill) || 0,
      seductionskill: Number(v.seductionskill) || 0,
      pain: Number(v.pain) || 0,
      arousal: Number(v.arousal) || 0,
      arousalmax: Number(v.arousalmax) || 10000,
      stress: Number(v.stress) || 0,
      trauma: Number(v.trauma) || 0,
      tiredness: Number(v.tiredness) || 0,
      money: Number(v.money) || 0,
      promiscuity: Number(v.promiscuity) || 0,
      exposed: Number(v.exposed) || 0,
      harpy: Number(v.harpy) || 0,
      wolfgirl: Number(v.wolfgirl) || 0,
      cat: Number(v.cat) || 0,
      fox: Number(v.fox) || 0,
      cow: Number(v.cow) || 0,
      demon: Number(v.demon) || 0,
      angel: Number(v.angel) || 0,
      fallenangel: Number(v.fallenangel) || 0
    };
  }

  function sendState(force) {
    if (!S.connected || !S.room) return;
    var v = V(), p = (v && v.player) || {};
    var payload = {
      t: "state",
      passage: (window.State && State.passage) || "",
      phase: v ? v.phase : undefined,
      recentPassages: (S._passageHistory || []).slice(-8),
      eventContext: extractEventContext(),
      location: (v && v.location) || "",
      mapLocation: (v && v.map && v.map.location) || "",
      inCombat: !!(v && v.combat === 1),
      combatInfo: buildCombatInfo(v),
      syncMode: S.syncMode,
      timeStamp: (v && v.timeStamp) || S.clock.timeStamp,
      speechAttitude: (v && v.speech_attitude) || "neutral",
      appearance: {
        sex: p.sex == null ? "" : String(p.sex),
        hairColour: (v && (v.haircolour || v.naturalhaircolour)) || "",
        skinColour: (v && v.skinColour) || "",
        eyeColour: (v && (v.leftEyeColour || v.eyeselect)) || ""
      },
      combatSnapshot: extractCombatSnapshot(),
      stats: collectMyStats(v)
    };
    var key = JSON.stringify([payload.passage, payload.phase, payload.location, payload.mapLocation, payload.inCombat, payload.syncMode, payload.timeStamp, payload.appearance, payload.stats]);
    if (!force && key === S._lastState) return;
    S._lastState = key;
    send(payload);
  }

  /* ---------------- 同页面非 runeventpool 条件事件检测与镜像 ---------------- */

  function detectAndReportInlineDomEvent() {
    if (!S.syncMode || !S.connected || !S.room) return;
    var curPas = (window.State && State.passage) || "";
    if (!curPas || SAFE_PASSAGES.indexOf(curPas) < 0 || curPas === HUB || curPas === BEDROOM) return;
    var v = V();
    if (!v || v.combat === 1) return;
    if (S.lastEventPick && S.lastEventPick.passage === curPas && (Date.now() - S.lastEventPick.at < 1500)) {
      return;
    }
    var host = document.getElementById("passages");
    if (!host) return;
    var pasEl = host.querySelector(".passage") || host;
    if (pasEl.getAttribute("data-mp-mirrored") === "1") return;
    var hasMap = !!document.getElementById("divmap");
    var links = getPassageInternalLinks();
    if (!hasMap && links.length >= 1 && links.length <= 4) {
      var sig = curPas + "::" + links.map(function (a) { return (a.getAttribute("data-passage") || "") + ":" + (a.textContent || "").trim(); }).join("|");
      if (S._lastInlineDomReport === sig) return;
      S._lastInlineDomReport = sig;
      var cloneNode = pasEl.cloneNode(true);
      var mpInline = cloneNode.querySelector("#mp-inline-root");
      if (mpInline && mpInline.parentNode) mpInline.parentNode.removeChild(mpInline);
      var mpAmb = cloneNode.querySelector("#mp-ambient-coop-box");
      if (mpAmb && mpAmb.parentNode) mpAmb.parentNode.removeChild(mpAmb);
      var mpWorld = cloneNode.querySelector("#mp-world-organic-box");
      if (mpWorld && mpWorld.parentNode) mpWorld.parentNode.removeChild(mpWorld);
      send({
        t: "inline_dom_event",
        passage: curPas,
        html: cloneNode.innerHTML,
        eventContext: extractEventContext()
      });
    } else {
      S._lastInlineDomReport = "";
    }
  }

  function applyMirroredInlineDom(msg) {
    var host = document.getElementById("passages");
    if (!host || !msg || !msg.html) return;
    var pasEl = host.querySelector(".passage") || host;
    pasEl.setAttribute("data-mp-mirrored", "1");
    pasEl.innerHTML = msg.html;
    var links = pasEl.querySelectorAll("a.link-internal");
    for (var i = 0; i < links.length; i++) {
      links[i]._mpMirroredLink = true;
    }
    injectInlinePassageSections();
  }

  /* ---------------- 面板渲染 ---------------- */

  function playerRow(p) {
    var row = el("div", { class: "mp-player" });
    row.appendChild(el("span", { class: "mp-pname", text: p.name || "玩家" }));
    if (p.isHost) row.appendChild(el("span", { class: "mp-badge mp-host", text: "房主" }));
    row.appendChild(el("span", {
      class: "mp-ploc",
      text: shortLoc(p.passage) + " · " + formatTimestampClock(p.timeStamp)
    }));
    if (p.inCombat) {
      var rInfo = calcShortestAssistTravelClient(p);
      row.appendChild(el("button", {
        class: "mp-mini mp-ok",
        title: rInfo.routeSummary,
        text: "支援(" + rInfo.shortTag + ")",
        onclick: function () {
          sendState(true);
          send({ t: "assist_combat", to: p.id, returnPassage: findSafeReturnPassage(), recentPassages: (S._passageHistory || []).slice(-8) });
        }
      }));
    }
    row.appendChild(el("button", { class: "mp-mini", text: "互动", onclick: function () { openNativeInteract(p); } }));
    row.appendChild(el("button", { class: "mp-mini", text: "同步时间", onclick: function () { requestTimelineSync(p.id); } }));
    row.appendChild(el("button", { class: "mp-mini mp-bad", text: "袭击", onclick: function () { sendState(true); send({ t: "attack_request", to: p.id, consensual: false }); } }));
    row.appendChild(el("button", { class: "mp-mini", text: "窃取", onclick: function () { sendState(true); send({ t: "steal_request", to: p.id }); } }));
    row.appendChild(el("button", { class: "mp-mini mp-ok", text: "交易", onclick: function () { openTrade(p); } }));
    return row;
  }

  function renderPlayers() {
    ["mp-players", "mp-hub-players", "mp-bedroom-players"].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.innerHTML = "";
      if (!S.connected) box.appendChild(el("div", { class: "mp-empty", text: "未连接服务器" }));
      else if (S.players.size === 0) box.appendChild(el("div", { class: "mp-empty", text: "暂无其他玩家在线，伴侣已在孤儿院转为常驻角色" }));
      else S.players.forEach(function (p) { box.appendChild(playerRow(p)); });
    });
  }

  function saveSettings() {
    localStorage.setItem(LS_NAME, S.name);
    localStorage.setItem(LS_SERVER, S.server);
  }

  function copyRoomCode() {
    var code = S.room || "";
    if (!code) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { toast("房间码已复制", "mp-ok"); }, function () { toast("房间码：" + code, ""); });
      } else toast("房间码：" + code, "");
    } catch (e) { toast("房间码：" + code, ""); }
  }

  function createRoom(needApproval) {
    if (!S.connected) { toast("先连接服务器", "mp-bad"); return; }
    var nameEl = document.getElementById("mp-name");
    if (nameEl && nameEl.value.trim()) S.name = nameEl.value.trim().slice(0, 24);
    saveSettings();
    send({ t: "create_room", name: S.name, needApproval: !!needApproval });
  }

  function joinRoom(code) {
    code = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) { toast("请输入房间码", "mp-bad"); return; }
    if (!S.connected) { toast("先连接服务器", "mp-bad"); return; }
    var nameEl = document.getElementById("mp-name");
    if (nameEl && nameEl.value.trim()) S.name = nameEl.value.trim().slice(0, 24);
    saveSettings();
    send({ t: "join_room", code: code, name: S.name });
  }

  function leaveRoom() { if (S.room) send({ t: "leave_room" }); }

  function renderRoom() {
    var box = document.getElementById("mp-room-box");
    if (!box) return;
    box.innerHTML = "";
    if (!S.connected) {
      box.appendChild(el("div", { class: "mp-empty", text: "先连接服务器，再创建或加入房间。" }));
      return;
    }
    if (!S.room) {
      box.appendChild(el("div", { class: "mp-h", text: "房间" }));
      if (S.pendingJoin) {
        box.appendChild(el("div", { class: "mp-empty", text: "正在等待房主批准…" }));
      } else {
        var row = el("div", { class: "mp-row" });
        var input = el("input", { class: "mp-input", id: "mp-room-code", maxlength: "8", placeholder: "输入房间码" });
        row.appendChild(input);
        row.appendChild(el("button", { class: "mp-mini mp-ok", text: "加入", onclick: function () { joinRoom(input.value); } }));
        box.appendChild(row);

        var row2 = el("div", { class: "mp-row" });
        var chk = el("input", { type: "checkbox", id: "mp-need-approval", checked: true });
        var lab = el("label", { class: "mp-check" }, [chk, el("span", { text: "加入需要房主批准" })]);
        row2.appendChild(lab);
        row2.appendChild(el("button", { class: "mp-mini", text: "创建房间", onclick: function () { createRoom(chk.checked); } }));
        box.appendChild(row2);
      }
      return;
    }

    var line = el("div", { class: "mp-room-code-row" });
    line.appendChild(el("span", { text: "房间码" }));
    line.appendChild(el("b", { class: "mp-room-code", text: S.room }));
    line.appendChild(el("button", { class: "mp-mini", text: "复制", onclick: copyRoomCode }));
    line.appendChild(el("span", { class: "mp-badge" + (S.isHost ? " mp-host" : ""), text: S.isHost ? "房主" : "成员" }));
    box.appendChild(line);

    var row3 = el("div", { class: "mp-row" });
    row3.appendChild(el("button", { class: "mp-mini mp-bad", text: "离开房间", onclick: leaveRoom }));
    row3.appendChild(el("button", {
      class: "mp-mini " + (S.syncMode ? "mp-ok" : ""),
      text: S.syncMode ? "模式：组队同步" : "模式：分头行动",
      onclick: function () {
        toggleSyncMode();
      }
    }));
    row3.appendChild(el("button", {
      class: "mp-mini",
      text: "同步时间线",
      onclick: function () {
        requestTimelineSync("");
      }
    }));
    if (S.isHost) {
      var chk2 = el("input", { type: "checkbox", id: "mp-toggle-approval", checked: !!S.needApproval });
      chk2.addEventListener("change", function () { send({ t: "set_approval", needApproval: chk2.checked }); });
      var lab2 = el("label", { class: "mp-check" }, [chk2, el("span", { text: "需要批准" })]);
      row3.appendChild(lab2);
    }
    box.appendChild(row3);
  }

  function renderJoinRequests() {
    var box = document.getElementById("mp-join-box");
    if (!box) return;
    box.innerHTML = "";
    if (!S.isHost || !S.joinRequests.size) return;
    box.appendChild(el("div", { class: "mp-h", text: "加入申请" }));
    S.joinRequests.forEach(function (req) {
      var row = el("div", { class: "mp-trade-row" });
      row.appendChild(el("div", { class: "mp-trade-text", text: (req.name || "玩家") + " 请求加入" }));
      row.appendChild(el("button", { class: "mp-mini mp-ok", text: "允许", onclick: function () {
        send({ t: "join_approve", reqId: req.reqId });
        S.joinRequests.delete(req.reqId);
        renderJoinRequests();
      } }));
      row.appendChild(el("button", { class: "mp-mini mp-bad", text: "拒绝", onclick: function () {
        send({ t: "join_reject", reqId: req.reqId });
        S.joinRequests.delete(req.reqId);
        renderJoinRequests();
      } }));
      box.appendChild(row);
    });
  }

  function renderChat() {
    ["mp-log", "mp-hub-log", "mp-bedroom-log"].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.innerHTML = "";
      S.chat.slice(-80).forEach(function (c) { box.appendChild(el("div", { class: "mp-line " + c.cls, text: c.text })); });
      box.scrollTop = box.scrollHeight;
    });
  }

  function renderHub() { if (window.State && State.passage === HUB) { renderPlayers(); renderChat(); } }
  function renderBedroom() { if (window.State && State.passage === BEDROOM) { renderPlayers(); renderChat(); } }

  /* ---------------- 交易表单与结算 ---------------- */

  function describeItem(it) {
    if (!it) return "无";
    if (it.kind === "money") return "£" + (it.amount / 100).toFixed(2);
    if (it.kind === "food") return foodLabel(it.key) + " ×" + it.amount;
    if (it.kind === "sextoy") return toyLabel(it.name || it.category);
    if (it.kind === "clothing") return it.name;
    return "物品";
  }

  function fillSelect(sel, items, emptyText) {
    sel.innerHTML = "";
    if (!items.length) { sel.appendChild(el("option", { value: "", text: emptyText })); return; }
    items.forEach(function (it, i) { sel.appendChild(el("option", { value: String(i), text: it.label })); });
  }

  function buildGiveForm(box) {
    box.innerHTML = "";
    var kindSel = el("select", { class: "mp-input" });
    [["money", "金钱"], ["food", "食物 / 农产品"], ["sextoy", "性玩具"], ["clothing", "衣物"]].forEach(function (x) {
      kindSel.appendChild(el("option", { value: x[0], text: x[1] }));
    });
    var content = el("div", { class: "mp-sub-content" });
    box.appendChild(el("div", { class: "mp-sub", text: "你给出：" }));
    box.appendChild(kindSel);
    box.appendChild(content);

    function rebuild() {
      content.innerHTML = "";
      content._read = null;
      var k = kindSel.value;
      if (k === "money") {
        var inp = el("input", { class: "mp-input", type: "number", min: "1", step: "1", value: "100" });
        content.appendChild(inp);
        content._read = function () { var n = Math.floor(Number(inp.value)); return n > 0 ? { kind: "money", amount: n } : null; };
      } else if (k === "food") {
        var owned = ownedItems().filter(function (x) { return x.kind === "food"; });
        var sel = el("select", { class: "mp-input" });
        fillSelect(sel, owned, "没有食物");
        content.appendChild(sel);
        content._read = function () { var it = owned[Number(sel.value)]; return it ? { kind: "food", key: it.key, amount: it.amount } : null; };
      } else if (k === "sextoy") {
        var toys = ownedItems().filter(function (x) { return x.kind === "sextoy"; });
        var sel2 = el("select", { class: "mp-input" });
        fillSelect(sel2, toys, "没有性玩具");
        content.appendChild(sel2);
        content._read = function () {
          var it = toys[Number(sel2.value)];
          return it ? { kind: "sextoy", category: it.category, name: it.name, item: it.item } : null;
        };
      } else {
        var clothes = ownedItems().filter(function (x) { return x.kind === "clothing"; });
        var sel3 = el("select", { class: "mp-input" });
        fillSelect(sel3, clothes, "没有衣物");
        content.appendChild(sel3);
        content._read = function () {
          var it = clothes[Number(sel3.value)];
          return it ? { kind: "clothing", slot: it.slot, name: it.name, item: it.item } : null;
        };
      }
    }
    kindSel.addEventListener("change", rebuild);
    rebuild();
    box._read = function () { return content._read ? content._read() : null; };
  }

  function buildWantForm(box) {
    box.innerHTML = "";
    var kindSel = el("select", { class: "mp-input" });
    [["money", "金钱"], ["food", "食物 / 农产品"], ["sextoy", "性玩具"], ["clothing", "衣物"]].forEach(function (x) {
      kindSel.appendChild(el("option", { value: x[0], text: x[1] }));
    });
    var content = el("div", { class: "mp-sub-content" });
    box.appendChild(el("div", { class: "mp-sub", text: "你希望得到：" }));
    box.appendChild(kindSel);
    box.appendChild(content);

    function rebuild() {
      content.innerHTML = "";
      content._read = null;
      var k = kindSel.value;
      var cat = catalogs();
      if (k === "money") {
        var inp = el("input", { class: "mp-input", type: "number", min: "1", step: "1", value: "100" });
        content.appendChild(inp);
        content._read = function () { var n = Math.floor(Number(inp.value)); return n > 0 ? { kind: "money", amount: n } : null; };
      } else if (k === "food") {
        var sel = el("select", { class: "mp-input" });
        fillSelect(sel, cat.food, "无");
        var num = el("input", { class: "mp-input", type: "number", min: "1", step: "1", value: "1" });
        content.appendChild(sel); content.appendChild(num);
        content._read = function () {
          var it = cat.food[Number(sel.value)]; var n = Math.floor(Number(num.value));
          return it && n > 0 ? { kind: "food", key: it.v, amount: n } : null;
        };
      } else if (k === "sextoy") {
        var sel2 = el("select", { class: "mp-input" });
        fillSelect(sel2, cat.sex, "无");
        content.appendChild(sel2);
        content._read = function () {
          var it = cat.sex[Number(sel2.value)];
          return it ? { kind: "sextoy", category: it.v, name: it.v } : null;
        };
      } else {
        var sel3 = el("select", { class: "mp-input" });
        fillSelect(sel3, cat.cloth, "无");
        content.appendChild(sel3);
        content._read = function () {
          var it = cat.cloth[Number(sel3.value)];
          if (!it) return null;
          var p = it.v.split("\u0001");
          return { kind: "clothing", slot: p[0], name: p[1] };
        };
      }
    }
    kindSel.addEventListener("change", rebuild);
    rebuild();
    box._read = function () { return content._read ? content._read() : null; };
  }

  var tradeTarget = null;
  function openTrade(p) {
    tradeTarget = p;
    var mask = document.getElementById("mp-trade-mask");
    if (!mask) return;
    document.getElementById("mp-trade-title").textContent = p.name || "玩家";
    buildGiveForm(document.getElementById("mp-give-form"));
    buildWantForm(document.getElementById("mp-want-form"));
    mask.classList.remove("mp-hide");
  }
  function closeTrade() {
    var m = document.getElementById("mp-trade-mask"); if (m) m.classList.add("mp-hide");
    tradeTarget = null;
  }
  function sendTrade() {
    if (!tradeTarget) return;
    var give = document.getElementById("mp-give-form")._read();
    var want = document.getElementById("mp-want-form")._read();
    if (!give || !want) { toast("请选择完整的两边物品", "mp-bad"); return; }
    send({ t: "trade_offer", to: tradeTarget.id, give: give, want: want });
    closeTrade();
  }

  function removeItem(it) {
    var v = V();
    if (it.kind === "money") {
      if ((v.money || 0) < it.amount) return false;
      v.money -= it.amount;
      if (window.updateSideBarMoney) window.updateSideBarMoney();
      return true;
    }
    if (it.kind === "food") {
      var f = v.foodstuff && v.foodstuff[it.key];
      if (!f || (f.amount | 0) < it.amount) return false;
      f.amount -= it.amount;
      return true;
    }
    if (it.kind === "sextoy") {
      var arr = (((v.player || {}).inventory || {}).sextoys || {})[it.category] || [];
      for (var i = 0; i < arr.length; i++) if ((arr[i] && arr[i].name) === it.name) { arr.splice(i, 1); return true; }
      return false;
    }
    if (it.kind === "clothing") {
      var w = (v.wardrobe || {})[it.slot];
      if (!Array.isArray(w)) return false;
      for (var j = 0; j < w.length; j++) if (w[j] && w[j].name === it.name) { w.splice(j, 1); return true; }
      return false;
    }
    return false;
  }

  function addItem(it) {
    var v = V();
    if (it.kind === "money") {
      v.money = (v.money || 0) + it.amount;
      if (window.updateSideBarMoney) window.updateSideBarMoney();
      return true;
    }
    if (it.kind === "food") {
      if (!v.foodstuff) v.foodstuff = {};
      if (!v.foodstuff[it.key]) v.foodstuff[it.key] = { amount: 0 };
      v.foodstuff[it.key].amount = (v.foodstuff[it.key].amount | 0) + it.amount;
      return true;
    }
    if (it.kind === "sextoy") {
      if (!v.player) v.player = {};
      if (!v.player.inventory) v.player.inventory = {};
      if (!v.player.inventory.sextoys) v.player.inventory.sextoys = {};
      if (!v.player.inventory.sextoys[it.category]) v.player.inventory.sextoys[it.category] = [];
      v.player.inventory.sextoys[it.category].push(clone(it.item || { name: it.name }));
      return true;
    }
    if (it.kind === "clothing") {
      if (!v.wardrobe) v.wardrobe = {};
      if (!Array.isArray(v.wardrobe[it.slot])) v.wardrobe[it.slot] = [];
      v.wardrobe[it.slot].push(clone(it.item || { name: it.name, slot: it.slot }));
      return true;
    }
    return false;
  }

  function applyTrade(msg) {
    var me = S.id, ok1 = false, ok2 = false;
    var v = V();
    var before = {
      money: v.money,
      foodstuff: clone(v.foodstuff),
      wardrobe: clone(v.wardrobe),
      inventory: clone(v.player && v.player.inventory)
    };
    try {
      if (me === msg.from) { ok1 = removeItem(msg.give); ok2 = addItem(msg.want); }
      else if (me === msg.to) { ok1 = removeItem(msg.want); ok2 = addItem(msg.give); }
      else return false;
    } catch (e) {
      ok1 = false;
    }
    if (!ok1 || !ok2) {
      v.money = before.money;
      v.foodstuff = before.foodstuff;
      v.wardrobe = before.wardrobe;
      if (v.player) v.player.inventory = before.inventory;
      try { if (window.updateSideBarMoney) window.updateSideBarMoney(); } catch (e2) {}
      refreshSidebar();
      return false;
    }
    refreshSidebar();
    return true;
  }

  var actTarget = null;
  function openAct(p) {
    actTarget = p;
    var mask = document.getElementById("mp-act-mask");
    if (!mask) return;
    document.getElementById("mp-act-title").textContent = p.name || "玩家";
    var box = document.getElementById("mp-act-options");
    box.innerHTML = "";
    Object.keys(ACTS).forEach(function (key) {
      var a = ACTS[key];
      box.appendChild(el("button", {
        class: "mp-mini", text: a.label,
        onclick: function () {
          send({ t: "act_request", to: p.id, act: key });
          mask.classList.add("mp-hide");
          actTarget = null;
        }
      }));
    });
    mask.classList.remove("mp-hide");
  }

  function applyAct(msg) {
    var def = ACTS[msg.act];
    if (!def) return;
    var otherId = msg.from === S.id ? msg.to : msg.from;
    var p = S.players.get(otherId);
    var name = p ? p.name : "对方";
    if (msg.act === "handhold") takeVirginityByPlayer(name, "handholding");
    else if (msg.act === "kiss") takeVirginityByPlayer(name, "kiss");
    try { if (window.statChange) { statChange.arousal(def.arousal, "genital"); statChange.stress(def.stress); } } catch (e) {}
    try { if (window.Time && Time.pass) Time.pass(def.seconds); } catch (e) {}
    refreshSidebar();
    var lines = def.lines || [""];
    var line = lines[0].replace("{name}", name);
    logLine(line, "mp-sys");
    toast(line, "mp-ok");
  }

  function refreshSidebar() {
    try {
      var cap = window.SugarCube && SugarCube.Story.get("StoryCaption");
      if (cap && window.jQuery) window.jQuery("#story-caption").empty().wiki(cap.processText());
    } catch (e) {}
    renderClockPill();
  }

  function actRow(ar) {
    var row = el("div", { class: "mp-trade-row" });
    var label = ACTS[ar.act] ? ACTS[ar.act].label : "互动";
    row.appendChild(el("div", { class: "mp-trade-text", text: ar.from.name + " 想和你" + label + "，同意吗？" }));
    row.appendChild(el("button", { class: "mp-mini mp-ok", text: "同意", onclick: function () { send({ t: "act_accept", actId: ar.actId }); } }));
    row.appendChild(el("button", { class: "mp-mini mp-bad", text: "拒绝", onclick: function () { send({ t: "act_decline", actId: ar.actId }); } }));
    return row;
  }

  function tradeRow(tr) {
    var row = el("div", { class: "mp-trade-row" });
    row.appendChild(el("div", { class: "mp-trade-text", text: tr.from.name + " 想用 " + describeItem(tr.give) + " 换你的 " + describeItem(tr.want) }));
    row.appendChild(el("button", { class: "mp-mini mp-ok", text: "接受", onclick: function () { send({ t: "trade_accept", tradeId: tr.tradeId }); } }));
    row.appendChild(el("button", { class: "mp-mini mp-bad", text: "拒绝", onclick: function () { send({ t: "trade_decline", tradeId: tr.tradeId }); } }));
    return row;
  }

  function renderRequests() {
    ["mp-requests", "mp-bedroom-requests"].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.innerHTML = "";
      if (!S.trades.size && !S.acts.size) {
        box.appendChild(el("div", { class: "mp-empty", text: "暂无待处理的请求" }));
        return;
      }
      S.acts.forEach(function (ar) { box.appendChild(actRow(ar)); });
      S.trades.forEach(function (tr) { box.appendChild(tradeRow(tr)); });
    });
  }

  /* ---------------- UI 构建 ---------------- */

  function ensureUI() {
    if (S.uiReady || !document.body) return;
    S.uiReady = true;

    var chBar = el("div", { id: "mp-channel-bar", class: "mp-hide" });
    chBar.innerHTML = [
      '<div class="mp-ch-title"><span>会合频道</span></div>',
      '<div id="mp-ch-sub" class="mp-ch-sub">双方点击 Next 后同步结算本回合动作</div>'
    ].join("");
    document.body.appendChild(chBar);

    var clockPill = el("div", { id: "mp-clock-pill" });
    clockPill.appendChild(el("span", { id: "mp-clk-time", text: "🕰️ 07:01" }));
    clockPill.appendChild(el("button", {
      id: "mp-clk-speed",
      class: "mp-clk-btn",
      title: "切换时间流逝倍率",
      text: "1x",
      onclick: function () {
        if (S.room && S.syncMode && !S.isHost) { toast("组队同步模式下由房主调整自动流速", "mp-wait"); return; }
        var nextSpd = S.clock.speed === 1 ? 2 : S.clock.speed === 2 ? 5 : 1;
        S.clock.speed = nextSpd;
        send({ t: "clock_control", speed: nextSpd, timeStamp: V().timeStamp || S.clock.timeStamp });
        renderClockPill();
      }
    }));
    clockPill.appendChild(el("button", {
      id: "mp-clk-play",
      class: "mp-clk-btn mp-clk-play",
      title: "开启或暂停自动时间流逝",
      text: "▶",
      onclick: function () {
        if (S.room && S.syncMode && !S.isHost) { toast("组队同步模式下由房主控制自动流逝", "mp-wait"); return; }
        S.clock.running = !S.clock.running;
        send({ t: "clock_control", running: S.clock.running, timeStamp: V().timeStamp || S.clock.timeStamp });
        renderClockPill();
      }
    }));
    clockPill.appendChild(el("button", {
      id: "mp-fab",
      class: "mp-clk-hub",
      title: "打开或关闭联机面板",
      text: "📮",
      onclick: togglePanel
    }));
    document.body.appendChild(clockPill);

    var panel = el("div", { id: "mp-panel", class: "mp-panel mp-hide" });
    panel.innerHTML = [
      '<div class="mp-head"><b>联机设置 · v0.6.0</b><span id="mp-status" class="mp-status">未连接</span>',
      '<button id="mp-close" class="mp-x">×</button></div>',
      '<div class="mp-row"><label>昵称<input id="mp-name" class="mp-input" maxlength="24"></label></div>',
      '<div class="mp-row"><label>服务器<input id="mp-server" class="mp-input" placeholder="ws://127.0.0.1:8787"></label></div>',
      '<div class="mp-row"><button id="mp-connect" class="mp-mini mp-ok">连接</button>',
      '<button id="mp-disconnect" class="mp-mini">断开</button></div>',
      '<div id="mp-room-box" class="mp-room-box"></div>',
      '<div id="mp-join-box" class="mp-list"></div>',
      '<div class="mp-h">房间玩家</div><div id="mp-players" class="mp-list"></div>',
      '<div class="mp-h">待处理请求</div><div id="mp-requests" class="mp-list"></div>',
      '<div class="mp-h">会合频道聊天</div><div id="mp-log" class="mp-log"></div>',
      '<div class="mp-row"><input id="mp-say" class="mp-input" maxlength="200" placeholder="说点什么…">',
      '<button id="mp-send" class="mp-mini">发送</button></div>',
      '<div class="mp-foot">支持时间线同步、原版遭遇战NPC同步与离线伴侣互动</div>'
    ].join("");
    document.body.appendChild(panel);

    var tradeMask = el("div", { id: "mp-trade-mask", class: "mp-mask mp-hide" });
    tradeMask.innerHTML = [
      '<div class="mp-modal">',
      '<div class="mp-head"><b>与 <span id="mp-trade-title"></span> 交易</b><button id="mp-trade-close" class="mp-x">×</button></div>',
      '<div class="mp-trade-grid"><div id="mp-give-form"></div><div id="mp-want-form"></div></div>',
      '<div class="mp-row"><button id="mp-trade-send" class="mp-mini mp-ok">发出交易请求</button></div>',
      '</div>'
    ].join("");
    document.body.appendChild(tradeMask);

    var actMask = el("div", { id: "mp-act-mask", class: "mp-mask mp-hide" });
    actMask.innerHTML = [
      '<div class="mp-modal" style="width:440px;">',
      '<div class="mp-head"><b>与 <span id="mp-act-title"></span> 互动</b><button id="mp-act-close" class="mp-x">×</button></div>',
      '<div id="mp-act-options" class="mp-row"></div>',
      '</div>'
    ].join("");
    document.body.appendChild(actMask);

    document.getElementById("mp-name").value = S.name;
    document.getElementById("mp-server").value = S.server;
    document.getElementById("mp-close").onclick = function () { panel.classList.add("mp-hide"); };
    document.getElementById("mp-connect").onclick = function () {
      S.name = document.getElementById("mp-name").value.trim().slice(0, 24) || S.name;
      S.server = document.getElementById("mp-server").value.trim() || DEFAULT_SERVER;
      saveSettings();
      disconnect(); setTimeout(connect, 120);
    };
    document.getElementById("mp-disconnect").onclick = disconnect;
    document.getElementById("mp-send").onclick = function () {
      var inp = document.getElementById("mp-say"); var text = inp.value.trim();
      if (text) { send({ t: "chat", text: text }); inp.value = ""; }
    };
    document.getElementById("mp-say").addEventListener("keydown", function (e) { if (e.key === "Enter") document.getElementById("mp-send").click(); });
    document.getElementById("mp-trade-close").onclick = closeTrade;
    document.getElementById("mp-trade-send").onclick = sendTrade;
    document.getElementById("mp-act-close").onclick = function () { actMask.classList.add("mp-hide"); actTarget = null; };

    if (window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if (document.getElementById("divmap") && !document.getElementById("mp-journal-players")) {
          renderMapMarkers();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    renderRequests(); renderPlayers(); renderChat();
    renderRoom(); renderJoinRequests(); renderClockPill(); renderChannelBar();
  }

  function togglePanel() {
    var p = document.getElementById("mp-panel");
    if (!p) return;
    p.classList.toggle("mp-hide");
    if (!p.classList.contains("mp-hide")) {
      document.getElementById("mp-name").value = S.name;
      document.getElementById("mp-server").value = S.server;
    }
  }

  function onPassageDisplay() {
    ensureUI();
    hookMultiCanvasModel();
    installEventPoolHook();
    installPersonNameHook();
    syncCompanionToVariables();
    S.myVotedIndex = -1;
    S.currentVotes = [];

    var curPasNow = (window.State && State.passage) || "";
    var vNow = V();

    // 记录新手教程遭遇战状态，保证打完必进陌生人赠送防狼喷雾环节
    if (vNow && (curPasNow === "Tutorial" || vNow.tutorial === 1 || vNow.tutorialExit !== undefined)) {
      vNow.mpWasTutorial = 1;
      if (!vNow.tutorialExit) vNow.tutorialExit = "Domus Street";
    }

    try {
      var hostEl = document.getElementById("passages");
      var rawTxt = (hostEl && hostEl.textContent) || "";
      if (!S._pronounRetryGuard && (rawTxt.indexOf("未能定义代词") >= 0 || rawTxt.indexOf("undefined pronoun") >= 0)) {
        S._pronounRetryGuard = true;
        if (S.lastEventContext) applyEventContext(S.lastEventContext);
        if (vNow && (!vNow.NPCList || !vNow.NPCList[0] || !vNow.NPCList[0].pronoun) && window.Wikifier && typeof Wikifier.wikifyEval === "function") {
          Wikifier.wikifyEval("<<generate1>><<person1>>");
        } else if (window.Wikifier && typeof Wikifier.wikifyEval === "function") {
          Wikifier.wikifyEval("<<person1>>");
        }
        setTimeout(function () { S._pronounRetryGuard = false; }, 300);
      }
    } catch (e) {}

    if (curPasNow !== MP_COMBAT_PASSAGE && (!vNow || vNow.combat !== 1)) {
      if (S.combatId || S.combatIsPvp) {
        S.combatId = "";
        S.combatOpponent = null;
        S.combatIsPvp = false;
        S.combatTurnReady = false;
        S.combatReadyIds = [];
        S.lastCombatCommit = null;
        send({ t: "combat_leave" });
      }
    }

    if (curPasNow && S._passageHistory[S._passageHistory.length - 1] !== curPasNow) {
      S._passageHistory.push(curPasNow);
      if (S._passageHistory.length > 40) S._passageHistory.shift();
    }

    var nowInCombat = !!(vNow && vNow.combat === 1);
    var isRandomEvent = !S._navByUs;
    S._navByUs = false;

    var replayedAfterMp = !!(nowInCombat && !S.combatId && S._mpFinishedAt && (Date.now() - S._mpFinishedAt < 8000));
    if (replayedAfterMp && !S._mpRedirecting) {
      cleanupNativeCombatState();
      var safeRet = findSafeReturnPassage(true);
      if (safeRet && safeRet !== curPasNow) {
        S._mpRedirecting = true;
        setTimeout(function () {
          S._mpRedirecting = false;
          enginePlay(safeRet);
        }, 40);
      }
    }

    var isSafePas = SAFE_PASSAGES.indexOf(curPasNow) >= 0;
    var isEventPas = !!curPasNow && !isSafePas &&
      curPasNow !== MP_COMBAT_PASSAGE && curPasNow !== "MP Native Combat Finish" &&
      curPasNow !== "Start" && curPasNow !== "Start2" && curPasNow !== "Orphanage Intro" &&
      curPasNow.indexOf("MP ") !== 0;
    var reportKey = curPasNow + "#" + (vNow && vNow.phase !== undefined ? vNow.phase : "");
    if (isEventPas && !replayedAfterMp && S.connected && S.room && S.syncMode && S._syncJumpPassage !== curPasNow) {
      if (S._lastEventReport !== reportKey) {
        S._lastEventReport = reportKey;
        send({
          t: "event_trigger",
          passage: curPasNow,
          phase: vNow ? vNow.phase : undefined,
          eventContext: extractEventContext(),
          priority: (nowInCombat || isRandomEvent) ? 2 : 1,
          inCombat: nowInCombat
        });
      }
    } else if (isSafePas) {
      S._lastEventReport = "";
      setTimeout(detectAndReportInlineDomEvent, 20);
    }
    if (S._syncJumpPassage === curPasNow) S._syncJumpPassage = "";

    if (nowInCombat && !replayedAfterMp && !S._lastInCombat && S.connected && S.room && !S.combatId && curPasNow !== MP_COMBAT_PASSAGE) {
      S._combatPendingAt = Date.now();
      send({
        t: "combat_enter",
        passage: curPasNow,
        returnPassage: findSafeReturnPassage(),
        recentPassages: (S._passageHistory || []).slice(-8),
        combatInfo: buildCombatInfo(vNow)
      });
    } else if (!nowInCombat && S._lastInCombat && S._combatPendingAt) {
      S._combatPendingAt = 0;
      send({ t: "combat_exit" });
    }
    S._lastInCombat = nowInCombat;

    sendState(true);
    bindPassageLinkInterceptor();
    injectInlinePassageSections();
    enhanceNativeCombatDOM();
    renderRequests();
    renderHub();
    renderBedroom();
    renderClockPill();
    renderChannelBar();
    setTimeout(renderMapMarkers, 30);
  }

  function boot() {
    ensureUI();
    hookMultiCanvasModel();
    installEventPoolHook();
    installPersonNameHook();
    syncCompanionToVariables();
    connect();
    onPassageDisplay();
    setInterval(function () {
      if (!S.syncMode && S.clock.running && window.Time && typeof Time.pass === "function") {
        var v = V();
        if (v && v.combat !== 1) {
          Time.pass(60 * (S.clock.speed || 1));
          refreshSidebar();
        }
      }
      sendState(false);
      renderClockPill();
    }, 2500);
  }

  if (window.jQuery) {
    window.jQuery(document).one(":passageinit", boot);
    window.jQuery(document).on(":passagedisplay", onPassageDisplay);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  setTimeout(function () { if (!S.uiReady) boot(); }, 2500);

  S.prepareNativeCombatVars = prepareNativeCombatVars;
  S.hasCoopNpcSnapshot = hasCoopNpcSnapshot;
  S.restoreCoopNpcSnapshot = restoreCoopNpcSnapshot;
  S.setupNativeCombatNpc = setupNativeCombatNpc;
  S.beforeNativeCombatEffects = beforeNativeCombatEffects;
  S.enhanceNativeCombatDOM = enhanceNativeCombatDOM;
  S.afterNativeCombatMan = afterNativeCombatMan;
  S.onNativeCombatFinished = onNativeCombatFinished;
  S.startCoopEventCombat = startCoopEventCombat;
  S.openNativeInteract = openNativeInteract;
  S.prepareInteractVars = prepareInteractVars;
  S.notifyInteractEffect = notifyInteractEffect;
  S.notifyRomanceMilestone = notifyRomanceMilestone;
  S.notifyRomanceDelta = notifyRomanceDelta;
  S.renderRelationshipBannerHtml = renderRelationshipBannerHtml;
  S.calcShortestAssistTravelClient = calcShortestAssistTravelClient;
  S.startConsensualEncounterFromInteract = startConsensualEncounterFromInteract;
  S.startOfflineCompanionCombat = startOfflineCompanionCombat;
  S.sendMeetFromInteract = sendMeetFromInteract;
  S.requestTimelineSync = requestTimelineSync;
  S.canDoDailyInteract = canDoDailyInteract;
  S.takeVirginityByPlayer = takeVirginityByPlayer;
  S.syncCompanionToVariables = syncCompanionToVariables;
  S.onEventPicked = onEventPicked;
  S.installEventPoolHook = installEventPoolHook;
  window.dolmp = S;
  setTimeout(function () { try { installEventPoolHook(); installPersonNameHook(); } catch (e) {} }, 0);
})();

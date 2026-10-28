/* DoL-MP client mod v0.9.0 — 原版沉浸文风 + 独立/同步时间线与选择同步 + 遭遇战原版NPC完整保留 + PvP真名/破处/逃跑判定 + 离线伴侣NPC与大世界暗线系统
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
  var LS_UID = "dolmp.player_uid.v9";
  var DEFAULT_SERVER = "ws://127.0.0.1:8787";

  function getOrCreatePlayerUid() {
    try {
      var u = localStorage.getItem(LS_UID);
      if (u && u.length >= 8) return u;
      u = "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(LS_UID, u);
      return u;
    } catch (e) {
      return "u_local_default";
    }
  }

  var SAFE_PASSAGES = [
    "Orphanage", "Bedroom", "Bathroom", "Garden", "Domus Street", "Barb Street",
    "Danube Street", "Connudatus Street", "Cliff Street", "Wolf Street", "High Street",
    "Starfish Street", "Nightingale Street", "Oxford Street", "Mer Street", "Elk Street",
    "Harvest Street", "Park", "Beach", "Sea Beach", "Sea Rocks", "Rocks", "Rocks Pool",
    "Rocks Dive", "Beach Cave", "Beach Cave Entrance", "Forest",
    "Hallways", "School", "School Hallways", "School Front", "School Front Courtyard",
    "School Library", "School Toilets", "Canteen", "Classroom", "Science Classroom",
    "Maths Classroom", "English Classroom", "History Classroom", "Swimming Pool",
    "Shopping Centre", "Shopping Centre Top", "Temple", "Temple Garden", "Temple Quarters",
    "Brothel", "Pub", "Spa", "Hospital Courtyard", "Police Station", "Ocean Breeze", "Adult Shop",
    "Arcade", "Docks", "Farmland", "Cottage", "Sewers", "Sewers Lake",
    "Residential Alleyways", "Commercial Alleyways", "Industrial Alleyways", "Park Toilets",
    "MP Region Foghorn Island", "MP Region Foghorn Pier", "MP Region Foghorn Keeper", "MP Region Foghorn Wreck", "MP Region Foghorn Echo",
    "MP Region Clockwork Undercity", "MP Region Clockwork Corridor", "MP Region Clockwork Steam", "MP Region Clockwork Astro", "MP Region Clockwork Vault",
    "MP Region Sunken Abbey", "MP Region Abbey Steps", "MP Region Abbey Confess", "MP Region Abbey Scriptorium", "MP Region Abbey Ferry",
    "MP Region Glasshouse Manor", "MP Region Glasshouse Orchid", "MP Region Glasshouse Specimen", "MP Region Glasshouse Dome", "MP Region Glasshouse Cellar",
    "MP Region Blackiron Yard", "MP Region Blackiron Siding", "MP Region Blackiron Armored", "MP Region Blackiron Signal", "MP Region Blackiron Platform",
    "MP Region Druid Circle", "MP Region Druid Pillars", "MP Region Druid Moonwell", "MP Region Druid Rootcave", "MP Region Druid Watchtower",
    "MP Region Velvet Mirage", "MP Region Velvet Masque", "MP Region Velvet Salon", "MP Region Velvet Terrace", "MP Region Velvet Auction",
    "MP Region Observatory Wing", "MP Region Observatory Dome", "MP Region Observatory Star", "MP Region Observatory Cabinet", "MP Region Observatory Bridge",
    "联机会客厅", "多人卧室"
  ];

  function isSafePassage(p) {
    if (!p) return false;
    if (SAFE_PASSAGES.indexOf(p) >= 0) return true;
    return /^MP (Livelihood|Job|Jobline|Side|Wild|Town Side|Town Extra|Wild Extra|Extra|Daily|Festival|Town Festivals|Region|Content|Keepsake|RelDay|Mansion)/.test(String(p));
  }

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
    "Spa": "多瑙河温泉浴场",
    "Hospital Courtyard": "医院",
    "Police Station": "警察局",
    "Ocean Breeze": "海风咖啡馆",
    "Adult Shop": "成人店",
    "Arcade": "游戏厅",
    "Docks": "码头",
    "Farmland": "农场",
    "Kylar Manor": "凯拉尔庄园",
    "Sewers": "下水道",
    "MP Region Foghorn Island": "雾角灯塔岛",
    "MP Region Foghorn Pier": "雾角栈桥",
    "MP Region Foghorn Keeper": "守塔人旧居",
    "MP Region Foghorn Wreck": "断桅沉船滩",
    "MP Region Foghorn Echo": "海蚀回音廊",
    "MP Region Clockwork Undercity": "旧钟塔地下机括城",
    "MP Region Clockwork Corridor": "青铜齿轮回廊",
    "MP Region Clockwork Steam": "蒸汽压力室",
    "MP Region Clockwork Astro": "停摆天文台",
    "MP Region Clockwork Vault": "档案馆密库",
    "MP Region Sunken Abbey": "圣堂地下古修道院",
    "MP Region Abbey Steps": "静默石阶",
    "MP Region Abbey Confess": "告解回音壁",
    "MP Region Abbey Scriptorium": "灰烬藏经阁",
    "MP Region Abbey Ferry": "地下暗河渡口",
    "MP Region Glasshouse Manor": "多瑙河秘密温室庄园",
    "MP Region Glasshouse Orchid": "雾化兰花厅",
    "MP Region Glasshouse Specimen": "夜光标本廊",
    "MP Region Glasshouse Dome": "玻璃穹顶露台",
    "MP Region Glasshouse Cellar": "地下酿造室",
    "MP Region Blackiron Yard": "麋鹿街黑铁货运站",
    "MP Region Blackiron Siding": "废弃调车场",
    "MP Region Blackiron Armored": "三号装甲货车",
    "MP Region Blackiron Signal": "信号塔值班室",
    "MP Region Blackiron Platform": "地下走私月台",
    "MP Region Druid Circle": "深林古德鲁伊石环",
    "MP Region Druid Pillars": "迷雾石柱群",
    "MP Region Druid Moonwell": "月泉祭坛",
    "MP Region Druid Rootcave": "古根地穴",
    "MP Region Druid Watchtower": "守林人瞭望台",
    "MP Region Velvet Mirage": "峭壁天鹅绒暗层",
    "MP Region Velvet Masque": "丝绒假面回廊",
    "MP Region Velvet Salon": "镜面试衣沙龙",
    "MP Region Velvet Terrace": "露台观海雅座",
    "MP Region Velvet Auction": "私人拍卖暗厅",
    "MP Region Observatory Wing": "牛津街旧学园天文翼楼",
    "MP Region Observatory Dome": "折光穹顶室",
    "MP Region Observatory Star": "星图档案室",
    "MP Region Observatory Cabinet": "标本陈列暗阁",
    "MP Region Observatory Bridge": "钟楼连廊",
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
    ["Forest", 10],
    ["Forest", "Cottage", 10],
    ["Deep Forest", "Cottage", 5],
    ["Deep Forest", "Wolf Cave", 6],
    ["Sea Rocks", "MP Region Foghorn Island", 8],
    ["Docks", "MP Region Foghorn Island", 10],
    ["High Street", "MP Region Clockwork Undercity", 6],
    ["Sewers", "MP Region Clockwork Undercity", 8],
    ["Temple", "MP Region Sunken Abbey", 6],
    ["Forest", "MP Region Sunken Abbey", 9],
    ["Danube Street", "MP Region Glasshouse Manor", 5],
    ["Park", "MP Region Glasshouse Manor", 6],
    ["Elk Street", "MP Region Blackiron Yard", 5],
    ["Industrial Alleyways", "MP Region Blackiron Yard", 4],
    ["Deep Forest", "MP Region Druid Circle", 7],
    ["Farmland", "MP Region Druid Circle", 9],
    ["Connudatus Street", "MP Region Velvet Mirage", 4],
    ["Cliff Street", "MP Region Velvet Mirage", 5],
    ["School Library", "MP Region Observatory Wing", 4],
    ["Hallways", "MP Region Observatory Wing", 5]
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
    playerUid: getOrCreatePlayerUid(),
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

  // $NPCNameList 只是本体的全局名单（开局就含 32 个名字），不能当「是否认识」用。
  // 认识与否以 C.npc.<Name>.init 为准；未认识的 NPC 不应出现在选项和称呼里。
  function npcMetName(name) {
    try {
      var C = window.C;
      if (!C || !C.npc || !name) return false;
      var n = C.npc[name];
      return !!(n && Number(n.init) === 1);
    } catch (e) { return false; }
  }
  try { window.mpNpcMet = npcMetName; } catch (e) {}

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

  function canClaimUniqueReward(rewardKey) {
    if (!rewardKey) return false;
    var v = V();
    if (!v) return false;
    if (!v.mpUniqueRewards || typeof v.mpUniqueRewards !== "object") {
      v.mpUniqueRewards = {};
    }
    if (rewardKey === "tutorial_first_spray") {
      var lsClaimed = false;
      try { lsClaimed = localStorage.getItem("dolmp.tutorial_spray_done") === "1"; } catch (e) {}
      if (lsClaimed || v.tutorial === 1 || v.mpTutorialSprayClaimed === 1 || (Number(v.spraymax) || 0) >= 1 || (Number(v.spray) || 0) >= 1) {
        v.mpUniqueRewards[rewardKey] = 1;
        v.mpTutorialSprayClaimed = 1;
        return false;
      }
      return false;
    }
    return v.mpUniqueRewards[rewardKey] !== 1;
  }

  function claimUniqueReward(rewardKey) {
    if (!canClaimUniqueReward(rewardKey)) return false;
    var v = V();
    if (!v.mpUniqueRewards || typeof v.mpUniqueRewards !== "object") {
      v.mpUniqueRewards = {};
    }
    v.mpUniqueRewards[rewardKey] = 1;
    if (rewardKey === "tutorial_first_spray") {
      v.mpTutorialSprayClaimed = 1;
      try { localStorage.setItem("dolmp.tutorial_spray_done", "1"); } catch (e) {}
    }
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
    return "";
  }

  /* ---------------- 离线伴侣 NPC 持久化与日程/性格差分系统 ---------------- */

  function loadCompanionFromStorage() {
    try {
      var raw = localStorage.getItem(LS_COMPANION);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      playerUid: "",
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

  function isSamePlayerAsCompanion(p, comp) {
    if (!p || !comp) return false;
    if (p.playerUid && comp.playerUid && String(p.playerUid) === String(comp.playerUid)) {
      return true;
    }
    var pName = String(p.name || "").trim().toLowerCase();
    var cName = String(comp.name || "").trim().toLowerCase();
    if (pName && cName && pName === cName) {
      return true;
    }
    return false;
  }

  function findOnlineCompanionPeer() {
    var comp = S.companion || (V() && V().mpCompanion) || null;
    if (!comp || S.players.size === 0) return null;
    var matched = null;
    S.players.forEach(function (p) {
      if (!matched && isSamePlayerAsCompanion(p, comp)) {
        matched = p;
      }
    });
    if (!matched && S.players.size === 1) {
      matched = S.players.values().next().value;
    }
    return matched;
  }

  function updateCompanionFromOnlinePlayer(p) {
    if (!p || !p.name) return;
    var prevComp = S.companion || {};
    var oldName = prevComp.name || "";
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
    // 若同一个玩家（相同 playerUid）修改了昵称，自动迁移关系数据与日志羁绊
    if (oldName && oldName !== p.name && (!prevComp.playerUid || prevComp.playerUid === p.playerUid)) {
      if (S.relations && S.relations[oldName] && !S.relations[p.name]) {
        S.relations[p.name] = clone(S.relations[oldName]);
      }
      var v = V();
      if (v && v.mpRelations && v.mpRelations[oldName] && !v.mpRelations[p.name]) {
        v.mpRelations[p.name] = clone(v.mpRelations[oldName]);
      }
    }
    S.companion = Object.assign({}, prevComp, {
      id: p.id,
      playerUid: p.playerUid || prevComp.playerUid || "",
      name: p.name,
      pronoun: pronoun,
      gender: gender,
      attitude: att,
      hairColour: app.hairColour || snap.haircolour || prevComp.hairColour || "silver",
      eyeColour: app.eyeColour || snap.leftEyeColour || prevComp.eyeColour || "purple",
      skinColour: app.skinColour || snap.skinColour || prevComp.skinColour || "light",
      lastPassage: p.passage || prevComp.lastPassage || "Orphanage",
      combatSnapshot: snap.player ? snap : (prevComp.combatSnapshot || {}),
      stats: p.stats || prevComp.stats || {},
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

    var onlinePeer = findOnlineCompanionPeer();
    v.mpCompanion = Object.assign({}, v.mpCompanion || {}, {
      playerUid: comp.playerUid || "",
      onlinePeerId: onlinePeer ? onlinePeer.id : "",
      name: (onlinePeer && onlinePeer.name) ? onlinePeer.name : (comp.name || "艾琳"),
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
      lastPassage: (onlinePeer && onlinePeer.passage) ? onlinePeer.passage : (comp.lastPassage || "Orphanage"),
      activeLocations: getCompanionScheduledLocations(),
      isPartnerOnline: !!onlinePeer
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

  var CUSTOM_GIFS = {"tv": "data:image/gif;base64,R0lGODlhEAAQAIMAABgUJQAAAFppiECk9DpEZnPv6P9aeP/Uef///wAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJJAAAACwAAAAAEAAQAAAIbgADCAwAoKDBggMTAhDAsCFDAAkJOpwoAKLAhRUPGnx4seKAjyA/LrQ48iOCAihFVuwIIGTIkSw/HvhoQCVJjy5tdsyoEePNhgQMHCDg0CLBnhojAiDAtClToxedSiUAdSkCA04PFKCqFClCgQEBACH5BAkkAAAALAAAAAAQABAAgxgUJQAAAFppiHPv6DpEZkCk9P9aeP/Uef///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAhsAAMIDACgoMGCAxMCEMCwIUMACQk6nCgAosCFFQ8afHix4oCPID8utDjyI4ICKEVW7AggZMiRLD8a+HhAJUmPLm12zKgR482GBA4YIODQIsGeGiMCIMC0KVOjF51KJQB1qVCnCAZQVYoUocCAADs=", "fist": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAAPS0jBgUJcR4WOZFRf///wAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJHgAAACwAAAAAEAAQAAAIVwABCAQgoKDBggMTCggQYGFDhgISEoRI8WHEgQ4ZatR4UaCAASBDiuyYMUCBjRw9olzZEKPIlwM6qmQp0yNMkDU9EtjJM6dOnjt9EjxoUKLRo0iTKj0aEAAh+QQJHgAAACwBAAAADgANAIIAAAD0tIwYFCXEeFjmRUX/3G7///8AAAAIUQALAAAgoKDBggMFFhAQIABDhw0FCCQYsSJEAQMfGmjIMWLGASBDisT4sOHGjhFLouxIUqTLARgzrvQ4kOBLkDFrCiDAs2dOnT191tR50GDNgAA7", "shelter": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJdhqqPXQbpQ8cFqv/////wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJIgAAACwAAAAAEAAQAAAIVgABACggUGCAAAUHJkwYQIAAhAsZNnT4EOLCiQYoOrRoUKPHhwUnCiBAsiRFiAdTqlwZ0eAAiwQLxnTJsSVNmxdfCpx58aBOnAACDBhas2VKoEiTRgwIACH5BAkiAAAALAEAAAAOAA4AggAAABgUJdhqqPXQbpQ8cFqv/////wAAAAhPAAEIHBggwMCDBQgKEGBQYEKCARYuLHgQQEQBBiROVKixo8GLAgiIHCmxoMmTKBseDDBAZUWCLQc+fCiQpcuXFmPitFhQJ02YA3TuNPkyIAA7", "bloodmoon": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJdwoQf+CoL7r/4ISJv///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJKAAAACwAAAAAEAAQAAAIcQABCAQQoKDBggMHFhTAsCFDhAIDMBxAsSLFhxEFUDxY8GIAghoHBCBAsmQAjxJFkjTA0gDJkwIWqjQgMaZLmDJHEmjpkgDOlCpLvvQIciNHoiAFFFjKdCnGiAGaNoWYkKPBhFgFJNSKtSvDrmDDCgwIACH5BAkoAAAALAAAAAAQAA8AggAAABgUJdwoQb7r/4ISJv////+CoAAAAAhvAAEIBBCgoMGCAwcWJMCwIUOEAgMQEECxokUCASJSPHhwI8GNA0KKDBlgY8kAAwoUMMDSgMoBJ0+mNBBAZQCXMAUU1JlyZcuXMUGOFFlS50edHHcaJTjRolOMCiU6bAgxYdKqCQUMpLg1YdavCQMCADs=", "bailey": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJf/QRsiMHqCswP///wAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJJgAAACwAAAAAEAAQAAAIXwADBABAsKBBggIDEBgIIGFChAsbLgwgoKJFgRERUhRQwGJFgQY3CggwYIBHhgg/lix5MeRFli0LihQA86PLiitN2pQ58yRKhQJzlsQ4EKhGhxAfHlwKcqnTp1CjOg0IACH5BAkmAAAALAAAAAAQAA0AggAAABgUJdw3N19qfv/QRv///wAAAAAAAAhZAAMEAECwoEGCAgMMGAggYUKECxsuDCCgokWBERFSFFDAYkWBBjcKCECAgEeGCD+WLHkx5EWWLQuKFADzo8uKK03alDnzJEqFGAcIFYpxIFCNDiE+PMhUYEAAOw==", "badend": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJddVw/XIWv///30jcwAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJJgAAACwAAAAAEAAQAAAIXgABCBQYoKDBgQgJDljIMEBChQMMBljoMOHEigoxEpTIseDAAAJCihwZsiJIAQRIjjS50uBKgiIDEJhJ4KQAliVryrSJM2fNlwACFBha4CZIogUwduz4sKnTp1ChBgQAIfkECSYAAAAsAQAAAA4ADQCCAAAAGBQlfSNz11XD9chaAAAAAAAAAAAACFYAAQgEEKCgwYEIAxBYyDAAQoILDSok4HCgwooCL1qUyLEgQQEgQ4oEWRDkgJMoT5IMYHKARJUCSgpwyZDigJUmL168GZPlTJo2ecrMGYAnSYIdOQIICAA7", "trial": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJcjc9f/SWv///26b3AAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJIAAAACwAAAAAEAAQAAAIXwABBAgAoKDBgwMFEhBA8KDBAAIIDBQQsSHChQwFUpR4kaJFiBULBsBoUeTGgSQdmoyYUuVKjy5FDhgwcGbJhzZl0nQYoECBkj1/PvR5UyBRgTldBsiZMKbAok6jxgwIACH5BAkgAAAALAAAAAAQAA4AggAAABgUJf///8jc9f/SWm6b3AAAAAAAAAheAAEECACgoMGDAwUKEEDwoMEACwcuZOhQYUSBAwZQfCggY0OMGhtC9OgwQEaGIwd8RDhx4sqSLV8iJEBgIE2ZAm8WDKATYYECKwP8/CgUaMWiBHnWrLhTZ0KmOwkGBAA7", "p2p": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJVDrkf/cZFrI+v///wAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJIwAAACwAAAAAEAAQAAAITgABCBwYoGCAgQgRBiDAkMDBhBAVJjT4UCJBARgFVBzAccDFAhgfehw4MkBGjREVGpy4MqVAkxk3IvRoEiRKkh1fnqyYkqLLn0CDCgUaEAAh+QQJIwAAACwAAAAADwAMAIIAAAAYFCVayPpQ65H/3GT///8AAAAAAAAISgABCBwYoGCAgQgJElhI4GDChwQRGnQokaCAiwIoDtg4QGAAAQUuOuw4sONHjBQhTky4EqJHjBkFkpQJ4GPImDI5vkTp0qNBAAEBADs=", "heart": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAAP9zrxgUJeY3c////wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJJAAAACwAAAAAEAAQAAAIVQABABBAUCBBAQITGgzAkCDDAAgVCmBI4KHFgwstXhzAEeFEjQ05ivQIEuIAAiMzbhQ5IOJAjQJYulRpsqPChB9rzrz5MebOmwMxAh1KtKjRo0hvBgQAIfkECSQAAAAsAAABABAACwCCAAAA/3OvGBQl5jdz////AAAAAAAAAAAACEsAAQAQQFAgQQECExoMwJAgwwAHEQ5kSODhQwEDMiIUYNEixowaOXZsOIAAyI0jIYLUuLDjR5YJRV48qbAlyQESa04kmVPnwIg1AwIAOw==", "keepsake": "data:image/gif;base64,R0lGODlhEAAQAPcAAAAAAAAAMwAAZgAAmQAAzAAA/wArAAArMwArZgArmQArzAAr/wBVAABVMwBVZgBVmQBVzABV/wCAAACAMwCAZgCAmQCAzACA/wCqAACqMwCqZgCqmQCqzACq/wDVAADVMwDVZgDVmQDVzADV/wD/AAD/MwD/ZgD/mQD/zAD//zMAADMAMzMAZjMAmTMAzDMA/zMrADMrMzMrZjMrmTMrzDMr/zNVADNVMzNVZjNVmTNVzDNV/zOAADOAMzOAZjOAmTOAzDOA/zOqADOqMzOqZjOqmTOqzDOq/zPVADPVMzPVZjPVmTPVzDPV/zP/ADP/MzP/ZjP/mTP/zDP//2YAAGYAM2YAZmYAmWYAzGYA/2YrAGYrM2YrZmYrmWYrzGYr/2ZVAGZVM2ZVZmZVmWZVzGZV/2aAAGaAM2aAZmaAmWaAzGaA/2aqAGaqM2aqZmaqmWaqzGaq/2bVAGbVM2bVZmbVmWbVzGbV/2b/AGb/M2b/Zmb/mWb/zGb//5kAAJkAM5kAZpkAmZkAzJkA/5krAJkrM5krZpkrmZkrzJkr/5lVAJlVM5lVZplVmZlVzJlV/5mAAJmAM5mAZpmAmZmAzJmA/5mqAJmqM5mqZpmqmZmqzJmq/5nVAJnVM5nVZpnVmZnVzJnV/5n/AJn/M5n/Zpn/mZn/zJn//8wAAMwAM8wAZswAmcwAzMwA/8wrAMwrM8wrZswrmcwrzMwr/8xVAMxVM8xVZsxVmcxVzMxV/8yAAMyAM8yAZsyAmcyAzMyA/8yqAMyqM8yqZsyqmcyqzMyq/8zVAMzVM8zVZszVmczVzMzV/8z/AMz/M8z/Zsz/mcz/zMz///8AAP8AM/8AZv8Amf8AzP8A//8rAP8rM/8rZv8rmf8rzP8r//9VAP9VM/9VZv9Vmf9VzP9V//+AAP+AM/+AZv+Amf+AzP+A//+qAP+qM/+qZv+qmf+qzP+q///VAP/VM//VZv/Vmf/VzP/V////AP//M///Zv//mf//zP///wAAAAAAAAAAAAAAACH5BAEAAPwALAAAAAAQABAAAAiDAAEIHEiwoMGDCAHEgLGFIYyEABZJXBRmUcJgGIMdW4cRoZYYWmAs/Hgwxq5IEyc+LAhjl6RFYBadWUTo1Ss/BE2iTJlKX6FXBLVE2kVRUUVChVAVIgiDVyR49sLsXElwS6Ra8OBJjHnDYFOUWisu0uK14UgYN0Qe/KjlRsMtZCEmDAgAOw==", "lantern": "data:image/gif;base64,R0lGODlhEAAQAIIAAAAAABgUJbSCPP/hbv///+uRMgAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJIgAAACwAAAAAEAAQAAAIUQABCBwYoGCAgQgRBhDAUMDBhAQNSoQIYKGAARgHMHyo8CKBjwQ0ciTosUCBkA4hLhwAEuVIgRYzakypUqJBihYbNnwJ02ZBikCDCh1KtKjRgAAh+QQJIgAAACwDAAAACgALAIIAAAAYFCW0gjz/4W7rkTL///8AAAAAAAAIPQABCAxAMIDAgwEEKBRgcGDBhwASChhAcYBCghMJaCRgEeMAAgUKcGSY8OPGjhIrWmQY8WHBiAtjsnT5MiAAOw==", "lockpick": "data:image/gif;base64,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", "read": "data:image/gif;base64,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", "translate": "data:image/gif;base64,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", "calculate": "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAP8A/y0kOOCySKhsPnB8jv/ojP/0qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJDAAAACwAAAAAHgAeAAAIuAABCBxIsKDBgwgTKlzIsKHDhxAjSnQooKLFixgtMhRAoKPHjyAJCNgosmIBiydNVhRJEqVLlRxHLowpwIBNmAJSspxZ0qYBnDplKqTps+bNnCuFJqSJ1OjPpjuHlmxatGjUpVNTUr15FSFTrSmLXpT6smnTAWgrYi2rVQDat2m9Zi3rFm5apQO/lrULF69AvTj5HjAwwC8AjiE/1uVb+GDGx4v7Gm4Y+e1kiovVTiSIcbPnz6ATBgQAIfkECQwAAAAsBQAGABcAFQCHAAAA/wD/LSQ44LJIqGw+cHyO/+iM//SoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJ4ABQgcSLDgQAAIEQogwLChw4cEBCRUGFFggYEXLQqMOBHAQowgNX7s+FGkgIwnN0qcWNKAS5MZObKs6NIATJUkab6sKVJmwpIpBfAM6pNiSJ48i3qsGDTo0INGbwq1KWCAVYFRm6KsarXrAIlAUW712nUgU7EDyXpVKZWr2q8LITp0q9agXYFeD1xd2bEv3QEGvvYdrNAtVsKECyYMCAAh+QQJDAAAACwFAAYAFwAVAIcAAAD/AP8tJDjgskiobD5wfI7/6Iz/9KgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAInAAFCBxIsOBAAAgRCiDAsKHDhwQEJFQYUWCBgRctCow4EcBCjCA1fuz4UaSAjAZSjpxY8mTIlAZWJiwJU2RNjiwr1nQpEudMnSp3ZvRJ8aVKnkQ9VuQp1ODPkDx5DpgqsKjJjAKnaqWqFCpWAVu1DlyKFWvYrRu9DjwrdiFEh2DZDjBIN+uAA2gldtzrcaoBtHwD252rNzDfggkDAgAh+QQJDAAAACwFAAYAFwAVAIcAAAD/AP8tJDjgskiobD5wfI7/6Iz/9KgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAImQAFCBxIsOBAAAgRCiDAsKHDhwQEJFQYUWCBgRctCow4EcBCjCA1fuz4UaSAjCc3SpxYMqVIAzBHsqzo0iVMAzITlrz5MibHmQJ51sz4U2dFnkKJrjQaMqlBpj1xuhxAVSDFkDUFUN1a1SNNlCi1cq2q0iTKsVzLDh04wMABtBshOhSLdoDBuwLrWu3I16PevoDzkgVMuGDCgAAh+QQJDAAAACwFAAYAFwAVAIcAAAD/AP8tJDjgskiobD5wfI7/6Iz/9KgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIoAAFCBxIsOBAAAgRCiDAsKHDhwQEJFQYUWCBgRctCow4EcBCjCA1fuz4UaSBkyI5TiwpIONJAyklrqzYUuBLATdVJmSZsSZOlDop2kTpM6fMnRVv+vQZ1GNSoj17HhQqcmnGAVgFUrVKcIABrGAl8gwpEOsBsAMG0ow6EK3bjWR7ukW7EaJDAXPDGtyLd67WjoA95j0amGTftIQLG54KICAAIfkECQwAAAAsBQAGABcAFQCHAAAA/wD/LSQ44LJIqGw+cHyO/+iM//SoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJwABQgcSLDgQAAIEQogwLChw4cEBCRUGFFggYEXLQqMOBHAQowgNX7s+FGkgIwnN0qcWDKlAAMwRXJkWdElTAMyVyZsmfHmy5gzd9ZE2ROoTooCfdo0SrKiUqIGhSaN6dLlgKsCkZpEKeCqVwMDJPIMKdDrgANYVW4daLat2qoo25rdCNFhV7lpDerFm7WjX498/woum1aw4YIJAwIAOw==", "herb": "data:image/gif;base64,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", "cook": "data:image/gif;base64,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", "sew": "data:image/gif;base64,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", "fish": "data:image/gif;base64,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", "farm": "data:image/gif;base64,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", "climb": "data:image/gif;base64,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", "swim": "data:image/gif;base64,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", "sneak": "data:image/gif;base64,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", "eavesdrop": "data:image/gif;base64,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", "bargain": "data:image/gif;base64,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", "drink": "data:image/gif;base64,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", "smoke": "data:image/gif;base64,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", "map": "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAP8A//rw1i0kOOBMUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJDAAAACwAAAAAHgAeAAAIhgABCBxIsKDBgwgTKlzIsKHDhxAjSnQ4oKLFixgxKhwgoKPHjyA9DtgYsiTIkQk5mvRIgKUAlAhVruzYsuVLkjNddoR5UGZOATZ5GvT5s6XQgkR/3kyp9CTOpjufQj1KMOlPqgOt5sQqUKVFpVwBeK0IVmrTsFpnos3INuPEt3Djyp1LF0BAACH5BAkMAAAALAUABgAUABMAhwAAAP8A//rw1i0kOOBMUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhRAAcIHEiwoEEBCBMqXJhQIMOHCx1CTEiAogCJExFWrHhxQEaFHDt+BIkQ40gBFU2eFLmyoceWJV/CNDnwI02VDCUS2HlSJ8+ROIHKbGmwqNGAACH5BAkMAAAALAUABgAUABMAhwAAAP8A//rw1i0kOOBMUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhWAAcIHEiwoEEBCBMqXJhQIMOHCx1CTEiAogCJExFWrHhxQEaFHDt+BIkQ40gBFU2eFLmyoceILyGq7BiToUkCOD/ezJlRIs6QPV/+PDlzZFGdBpMmDQgAIfkECQwAAAAsBQAGABQAEwCHAAAA/wD/+vDWLSQ44ExSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACFgABwgcSLCgQQEIEypcmFAgw4cLHUJMSICiAIkTEVaseHFARoUcO34EiRDjSAEVTZ4U+XBgS48LCRBwyVAlSpkTTcoMCVEnzowSd54M+vOjzZFHjRpcujQgACH5BAkMAAAALAUABgAUABMAhwAAAP8A//rw1i0kOOBMUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhaAAcIHEiwoEEBCBMqXJhQIMOHCx1CTEiAogCJExFWrHhxQEaFHDt+BIkQ40OTFU0yHBjR40MCME+6BAkz5sqZFG3KpBkSIkqdPl3WHClSwNCRKokmRWqwadOAACH5BAkMAAAALAUABgAUABMAhwAAAP8A//rw1i0kOOBMUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAheAAcIHEiwoEEBCBMqXJhQIMOHCx1CTEiAogCJExFWrHhxQEaFHDt+7DiAI8aHBAgMFFDxJMOUIRG6pJjy4UyYNRnezGnTI82YPUHyhCgR5kiRLIdOnDmS6UeDUKMGBAA7", "astro": "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAP8A/142ii0kOOCySP/ojP/0qJzg/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJDAAAACwAAAAAHgAeAAAIuQABCBxIsKDBgwgTKlzIsKHDhxAjJhxAseIAiQMrCti4saJEihsJiBTZ8eLDASEJcEzZ0SFKkitXkjSpEKTKmDFVUlz4cmWBnz9lCqB50CbHoBuRCtBJtGDPpAViKtU5celRnAKiGtg6tOpNAQc4Gri6dWxTgk+zYtXK9WxGq1ClRg3ZFaHRuHit7vTqE+hcum7RpsWqNzDapV9xznTJUuZNw0VRIh5Z8iPIlR4xArCYWbPnz6BDYwwIACH5BAkMAAAALAUABQAVABUAhwAAAP8A/142ii0kOOCySP/ojP/0qJzg/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAidAAEIHAhggMGDAwgqHHhQgEOHBxcyHOCQgEWLEBMupCgA48OOBCAqpOjx40OMGguSNMkypEGBKx8WmDnzo0uVHR8eKCCTZ0UBDUM6rPmRaE6DOYeyFODzaEymDw3IPAn0adOiVJEKZXqVa1atPcP+fPmUK00BBtLexLmVZVqpL2GCXIo2LdCRFdvOvbuR40WPcSU2/BhRIkGEhRUGBAAh+QQJDAAAACwFAAUAFQAVAIcAAAD/AP9eNootJDjgskj/6Iz/9Kic4P8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAInQABCBwIYIDBgwMIKhx4UIBDhwcXMhzgkIBFixATLqQoAOPDjgQgKqTo8eNDjBoLkjTJMqRBgSsfFihwYOZHlyo7yiyw86SAhiEd2vw4VKdBnUJZCuBZ8WfMpQ8NyPR5NChUlkyNPi0qNKvLqj27Uk34dOlMrjhzWlWqlSHIqAakVkzr9m1cqR5TEjza8W7QlxJVcnwYMfBEhHoHBgQAIfkECQwAAAAsBQAFABUAFQCHAAAA/wD/XjaKLSQ44LJI/+iM//SonOD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJ0AAQgcCGCAwYMDCCoceFCAQ4cHFzIc4JCARYsQEy6kKADjw44EICqk6PHjQ4waC5I0yTKkQYErHxaYOfOjS5UdZRaQeeCkgIYhHdb8ODSnwZxCWQrYWfFnzKUPDcj0eTQoVJZMjT4tKjSry6o6wzZ9SdKA2aU0sxqFSdGsVKVaGQpwCxflyIpW8YrcyPGix5cSVXJ8GDHwRIQpCQYEACH5BAkMAAAALAUABQAVABUAhwAAAP8A/142ii0kOOCySP/ojP/0qJzg/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAieAAEIHAhggMGDAwgqHHhQgEOHBxcyHOCQgEWLEBMupCgA48OOBCAqpOjx40OMGguSNMkypEGBKx8WmDnzo0uVHWUW0HlSQMOQDmt+FJrToAADSAXsZLm0KEWkBpQ+jOrwQE+jUKUyvRpTadOgTV0aBeqVZ0WfCbt6pWnTJ0y1LJ0yBBm34k2CHEvaFbkx70WgLyWq5PgwouCJCFMSDAgAIfkECQwAAAAsBQAFABUAFQCHAAAA/wD/XjaKLSQ44LJI/+iM//SonOD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJ0AAQgcCGCAwYMDCCoceFCAQ4cHFzIc4JCARYsQEy6kKADjw44EICqkaKDkx48YNRYkafLkw5AGBVIkUNKAgAI4caIUkNBgx4c6HQb92TCk0AInh8KcCdTlzZc8mQp9aHNqxag/rSaF6tPoTaQflUaV+hXoAa49sx7NuVNjV6dtVc706jLlyIp0QYrcyPGix5gSV3J8GDHwRIQqCQYEACH5BAkMAAAALAUABQAVABUAhwAAAP8A/142ii0kOOCySP/ojP/0qJzg/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAidAAEIHAhggMGDAwgqHHhQgEOHBxcyHOCQgIGLBCAmXEhRAIGMFw14zChgI8ORD0M+/FhyoseHMGFmNCiQIkmHBXLmlNnS4EucBR7urFjS582hQoMSNSo0Js6VRX8KUCpA5NOlNps6pTozK9CYSLt6nUo1bNGCUskeQPpyI1OnPGnWRAkXpcm5dFeSvOty5Me9fAk2hBlRomCEchUGBAAh+QQJDAAAACwFAAUAFQAVAIcAAAD/AP9eNootJDjgskj/6Iz/9Kic4P8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIngABCBwIYIDBgwMIKhx4UIBDhwcXMhzgkIBFixATLqQoAOPDjgQgKqTo8aNDAygFaCxI0uRHlAZUamz5sIBNmwJghkxosGPNAj8f7uwZ0iHOj0d9Eq3pUgDQijJ9Gn0YcyrUpVZNPlVK0+lWo1uHdj2wNenQglLB3vy4UyDWpldXkizaFONKtxXp5hW5keNFjwYluu35MaLgiQjvDgwIADs=", "ritual": "data:image/gif;base64,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", "firstaid": "data:image/gif;base64,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", "carry": "data:image/gif;base64,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", "row": "data:image/gif;base64,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", "watch": "data:image/gif;base64,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", "stall": "data:image/gif;base64,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", "tailor": "data:image/gif;base64,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", "clockwork": "data:image/gif;base64,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", "smith": "data:image/gif;base64,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", "animal": "data:image/gif;base64,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", "repair": "data:image/gif;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIQQABABBAkKDAgwgJDlhoEKFAhQsZCnA4cCGBiwwpCrB40YDHggY3DrhIoIBJjygLRpRosuVEiANCgjwIciJFAAEBADs=", "clean": "data:image/gif;base64,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", "bird": "data:image/gif;base64,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", "cloud": "data:image/gif;base64,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", "dog": "data:image/gif;base64,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", "spring": "data:image/gif;base64,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", "hive": "data:image/gif;base64,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", "crane": "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAC0kOJxoOKSyxODEiPTQXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJGAAAACwAAAAAHgAeAAAIsAABCBxIsKDBgwgTKlzIsKHDhxAjCgxAsaLFixYVBhDAsaPHjx4DJNwIsuRHkQhJmlyJ8qBKARZhXiRQUWNIki0n0mT4ciNFgwF2LnwJM6VQmx1/ujw6MuQApQSD5kzZcQCBAVinSuVZ1WrWgluHcsTq9evAsEgFkL2qlSnVsVjZgnXr0inUs3SB3jQ6tW7SlGT7gg3p8undtxwFAwgwoIDiqIRTPgZbU6Lly5gzKwwIACH5BAkYAAAALAQABQAVABYAhwAAAC0kOJxoOKSyxODEiPTQXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiSAAEEGEiwoMGCAgUoXMiwIcOBDiM6hCixogCKCgteNEiAYMKFFAMAGDkyQEeSAR5uJInyZMmGIlm2jPkxI02ZJmmmBDlgoEyBLmsOIDCg6E2gOhcWJdoTZ9CdRYdGvZkTpdKlTVlWfakwKtGjW2te7Al2KlebPwOQTQryZ8kBBdhmdFuS6kO6bnfOxZvWI1+ZAQEAIfkECRgAAAAsBAAFABUAFgCHAAAALSQ4nGg4pLLE4MSI9NBcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJAAAQQYSLCgwYICBShcyLAhw4EOIzqEKLGiAIoKC140SIBgwoUUAwAYOTJAR5IBHm4kifJkyYYiWbaM+TEjTZkmaaYEOWCgTIEuaw4gMKDoTaA6FxYl2hNn0J1Fh0a9mROl0qVNUU59qTAqUZ09fXLNGBbngAJJQR5FSfXhz7djL8J9uzPj3J915d7F6XEvy4AAOw==", "knife": "data:image/gif;base64,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", "dive": "data:image/gif;base64,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", "boat": "data:image/gif;base64,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", "rope": "data:image/gif;base64,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", "bell": "data:image/gif;base64,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", "letter": "data:image/gif;base64,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", "scale": "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAC0kOOKyRJpsJvzkhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJGAAAACwAAAAAHgAeAAAIqgABCBxIsKDBgwgTKlzIsKHDhxAjSpxIMIBFigYDCNgYQKLFjwI1cowocqOAjyZBPgwwAKXJlyc/dlTIcqbLmCVHJmTZcmBJmxZ70hwgFMDPikUP1ix6NCTRmQiXQm1q9OnQoDZT+myZtCKBr2A7UpUaFWxYo1qrYt0pM+vIAGa/Qm14FG7cuQybtsXL1mJKlRB5Eh1MmO9CwYQLk0zM2PDhvTIxSp5MOWFAACH5BAkYAAAALAQABgAXABUAhwAAAC0kOOKyRJpsJvzkhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiTAAEIHEgwgEGCCBMWFMAwgMKHAwMwFOAQIgCDGDFOzJgx4sSPIENSjDiAo8SGHEsWVOmx4cqKAgMMYHlxI0maF2fCPDkypk6SMnfa9BmUKE2eO0uyDFq0psucBlUGIEC1qkOkF6tanaqVwFWbXLVe5RhzqEmLWC0W1IjyINqZcOP+hChTrlyYCuvahYs3r8mOCAMCACH5BAkYAAAALAQABgAXABUAhwAAAC0kOOKyRJpsJvzkhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiVAAEIHEgwgEGCCBMWFMAwgMKHAwMwFOAQgMGLEC9O1DiRYsSLEjt2vDigokWRHCketFiyYMmVIT0KDDCgZUSbMzfexMkSZ0yTNIPuBKpzZkmbQX0WDSqUZdOTDS0SmErVIVOkOgNQrap1KwGrS0Fa9foVqsyHYiv+hJgQ5EaMbGnWnEuXZ9u6eE0qlIt3rt69aUEmDAgAOw==", "door": "data:image/gif;base64,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", "cellar": "data:image/gif;base64,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", "lamp": "data:image/gif;base64,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", "mushroom": "data:image/gif;base64,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", "gear": "data:image/gif;base64,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", "paint": "data:image/gif;base64,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", "tide": "data:image/gif;base64,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", "map2": "data:image/gif;base64,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", "handshake": "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAC0kOPDGotakfFKIxJxmOgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJGAAAACwAAAAAHgAeAAAIhQABCBxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzJgzAkSPDjh4NBiBAkiRIkAMDFFi5MoDIkiQFyJwpEyTLli9h0hQwoKfPATcLuCw4UudOmT+DDiVYtOTOnz6V5nQ6E2rUm0tTwiTw1KpUkSC7Qj3Z8KTVAVklngypsa3bt3Djyp27MCAAIfkECRgAAAAsAwALABgACwCHAAAALSQ48Mai1qR8UojEnGY6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACF8AAQQYOBCAwYMIDRIsGICAQ4cLFx4MUKBixYEPHQrYyHHjQosXG2bsKGCAyZMDQBbAOLIjypMqWT4kyRFlTJEzXb5MCVKmxpo7eVoMIHAhyaAREypciFSp04kRiSYMCAAh+QQJGAAAACwDAAsAGAALAIcAAAAtJDjwxqLWpHxSiMScZjoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIXgABBBg4EIDBgwgNEiwYgIBDhwsJIgxQoGLFgQ8JCNjIcWNEixcbPuzIcYDJkwNAYhxJUgDKkypFOmzp8mVKiytntrR5M2RGmjxVCiQI1ObChEMj8gyAtOnBiAURBgQAOw==", "fist2": "data:image/gif;base64,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", "veil": "data:image/gif;base64,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"};

  function resolveCustomGif(keyOrPath) {
    var s = String(keyOrPath || "");
    if (CUSTOM_GIFS[s]) return CUSTOM_GIFS[s];
    if (s.indexOf("custom:") === 0) {
      var k = s.slice(7);
      if (CUSTOM_GIFS[k]) return CUSTOM_GIFS[k];
    }
    var mIcon = s.match(/icon_([a-z0-9_]+)\.gif$/i);
    if (mIcon && CUSTOM_GIFS[mIcon[1]]) return CUSTOM_GIFS[mIcon[1]];
    if (s.indexOf("tv") >= 0) return CUSTOM_GIFS.tv;
    if (s.indexOf("fist") >= 0) return CUSTOM_GIFS.fist;
    if (s.indexOf("shelter") >= 0) return CUSTOM_GIFS.shelter;
    if (s.indexOf("bloodmoon") >= 0) return CUSTOM_GIFS.bloodmoon;
    if (s.indexOf("bailey") >= 0) return CUSTOM_GIFS.bailey;
    if (s.indexOf("badend") >= 0) return CUSTOM_GIFS.badend;
    if (s.indexOf("trial") >= 0) return CUSTOM_GIFS.trial;
    if (s.indexOf("p2p") >= 0) return CUSTOM_GIFS.p2p;
    if (s.indexOf("heart") >= 0) return CUSTOM_GIFS.heart;
    if (s.indexOf("keepsake") >= 0) return CUSTOM_GIFS.keepsake;
    if (s.indexOf("lantern") >= 0) return CUSTOM_GIFS.lantern;
    return "";
  }

  function dolIconImg(relPath) {
    var customUri = resolveCustomGif(relPath);
    var img = el("img", {
      class: "icon",
      src: customUri || relPath,
      style: "width:30px;height:30px;vertical-align:middle;margin-right:4px;image-rendering:pixelated;"
    });
    img.addEventListener("error", function () {
      img.src = CUSTOM_GIFS.lantern;
    });
    return img;
  }

  function installCustomIconMacros() {
    var M = window.Macro || (window.SugarCube && window.SugarCube.Macro);
    if (!M || typeof M.add !== "function" || typeof M.get !== "function") return;

    var iconMap = {
      tvicon: "tv",
      gameicon: "tv",
      fisticon: "fist",
      sheltericon: "shelter",
      bloodmoonicon: "bloodmoon",
      wraithicon: "bloodmoon",
      baileyicon: "bailey",
      badendicon: "badend",
      trialicon: "trial",
      p2picon: "p2p",
      mphearticon: "heart",
      tendingicon: "heart",
      keepsakeicon: "keepsake",
      lanternicon: "lantern",
      mpicon: "lantern"
    ,
      mplockpickicon: "lockpick",
      mpreadicon: "read",
      mptranslateicon: "translate",
      mpcalculateicon: "calculate",
      mpherbicon: "herb",
      mpcookicon: "cook",
      mpsewicon: "sew",
      mpfishicon: "fish",
      mpfarmicon: "farm",
      mpclimbicon: "climb",
      mpswimicon: "swim",
      mpsneakicon: "sneak",
      mpeavesdropicon: "eavesdrop",
      mpbargainicon: "bargain",
      mpdrinkicon: "drink",
      mpsmokeicon: "smoke",
      mpmapicon: "map",
      mpastroicon: "astro",
      mpritualicon: "ritual",
      mpfirstaidicon: "firstaid",
      mpcarryicon: "carry",
      mprowicon: "row",
      mpwatchicon: "watch",
      mpstallicon: "stall",
      mptailoricon: "tailor",
      mpclockworkicon: "clockwork",
      mpsmithicon: "smith",
      mpanimalicon: "animal",
      mprepairicon: "repair",
      mpcleanicon: "clean",
      mpbirdicon: "bird",
      mpcloudicon: "cloud",
      mpdogicon: "dog",
      mpspringicon: "spring",
      mphiveicon: "hive",
      mpcraneicon: "crane",
      mpknifeicon: "knife",
      mpdiveicon: "dive",
      mpboaticon: "boat",
      mpropeicon: "rope",
      mpbellicon: "bell",
      mplettericon: "letter",
      mpscaleicon: "scale",
      mpdooricon: "door",
      mpcellaricon: "cellar",
      mplampicon: "lamp",
      mpmushroomicon: "mushroom",
      mpgearicon: "gear",
      mppainticon: "paint",
      mptideicon: "tide",
      mpmap2icon: "map2",
      mphandshakeicon: "handshake",
      mpfist2icon: "fist2",
      mpveilicon: "veil"
    };

    Object.keys(iconMap).forEach(function (macroName) {
      try {
        if (M.get(macroName)) return;
        M.add(macroName, {
          handler: function () {
            var argKey = (this.args && this.args[0]) ? String(this.args[0]) : iconMap[macroName];
            var uri = CUSTOM_GIFS[argKey] || CUSTOM_GIFS[iconMap[macroName]] || CUSTOM_GIFS.lantern;
            var img = document.createElement("img");
            img.className = "icon";
            img.src = uri;
            img.style.cssText = "width:30px;height:30px;vertical-align:middle;margin-right:4px;image-rendering:pixelated;";
            img.addEventListener("error", function () {
              if (img.src !== CUSTOM_GIFS.lantern) img.src = CUSTOM_GIFS.lantern;
            });
            this.output.appendChild(img);
          }
        });
      } catch (e) {}
    });

    try {
      if (!M.get("mpnpcincr")) {
        M.add("mpnpcincr", {
          handler: function () {
            try {
              var name = String((this.args && this.args[0]) || "");
              var stat = String((this.args && this.args[1]) || "love");
              var val = Number(this.args && this.args[2]) || 0;
              if (!name) return;
              var v = V();
              if (!v) return;
              if (!v.mpNpcs || typeof v.mpNpcs !== "object") v.mpNpcs = {};
              var key = name.toLowerCase();
              if (!v.mpNpcs[key] || typeof v.mpNpcs[key] !== "object") v.mpNpcs[key] = {};
              var cur = Number(v.mpNpcs[key][stat]) || 0;
              v.mpNpcs[key][stat] = cur + val;
            } catch (e) {}
          }
        });
      }
    } catch (e) {}
  }

  /* ---------------- 组队天气、温度、血月与淋雨湿透（Wetness）同步系统 ---------------- */

  function hasPlayerUmbrella(v) {
    if (!v || !v.worn || !v.worn.handheld) return false;
    var hh = String(v.worn.handheld.name || "").toLowerCase();
    var hhType = v.worn.handheld.type || [];
    return hh.indexOf("umbrella") >= 0 || hh.indexOf("parasol") >= 0 || (Array.isArray(hhType) && hhType.indexOf("rainproof") >= 0);
  }

  function extractWeatherPack() {
    var v = V();
    var wName = "clear";
    var temp = 15;
    var isBlood = false;
    try {
      if (window.Weather) {
        wName = Weather.name || "clear";
        temp = Number.isFinite(Weather.temperature) ? Weather.temperature : 15;
        isBlood = !!Weather.bloodMoon;
      } else if (v && v.weather) {
        wName = v.weather;
      }
    } catch (e) {}
    return {
      name: wName,
      weatherVar: (v && v.weather) || wName,
      temperature: temp,
      snow: (v && v.weatherObj && v.weatherObj.snow) || 0,
      bloodMoon: isBlood,
      hasUmbrella: hasPlayerUmbrella(v),
      upperwet: (v && Number(v.upperwet)) || 0,
      lowerwet: (v && Number(v.lowerwet)) || 0,
      underupperwet: (v && Number(v.underupperwet)) || 0,
      underlowerwet: (v && Number(v.underlowerwet)) || 0,
      hairwet: (v && Number(v.hairwet)) || 0
    };
  }

  function applyWeatherPack(wPack, syncWetnessWithPeer) {
    if (!wPack || typeof wPack !== "object") return;
    var v = V();
    if (!v) return;
    try {
      if (wPack.name && window.Weather && typeof Weather.set === "function") {
        if (Weather.name !== wPack.name) {
          Weather.set(wPack.name, true);
        }
      }
      if (Number.isFinite(wPack.temperature) && window.Weather && typeof Weather.setTemperature === "function") {
        Weather.setTemperature(wPack.temperature);
      }
      if (v.weatherObj && Number.isFinite(wPack.snow)) {
        v.weatherObj.snow = wPack.snow;
      }
      if (wPack.weatherVar) {
        v.weather = wPack.weatherVar;
      }
      // 当两人组队同行且在同一场景时，同步淋雨湿透度与共撑雨伞保护，彻底消除因一人淋湿一人未淋湿导致的选项不一致！
      if (syncWetnessWithPeer) {
        var iHaveUmbrella = hasPlayerUmbrella(v);
        var peerHasUmbrella = !!wPack.hasUmbrella;
        if (iHaveUmbrella || peerHasUmbrella) {
          // 只要两人中有一人打伞，同行时共撑一把伞，双方衣物均不会被雨水淋透
          v.upperwet = Math.min(v.upperwet || 0, wPack.upperwet || 0);
          v.lowerwet = Math.min(v.lowerwet || 0, wPack.lowerwet || 0);
          v.underupperwet = Math.min(v.underupperwet || 0, wPack.underupperwet || 0);
          v.underlowerwet = Math.min(v.underlowerwet || 0, wPack.underlowerwet || 0);
          v.hairwet = Math.min(v.hairwet || 0, wPack.hairwet || 0);
        } else {
          // 两人均未打伞时，对齐双方的淋雨湿透度，确保页面上的湿衣/避雨选项 100% 同步显示
          if (Number.isFinite(wPack.upperwet)) v.upperwet = wPack.upperwet;
          if (Number.isFinite(wPack.lowerwet)) v.lowerwet = wPack.lowerwet;
          if (Number.isFinite(wPack.underupperwet)) v.underupperwet = wPack.underupperwet;
          if (Number.isFinite(wPack.underlowerwet)) v.underlowerwet = wPack.underlowerwet;
          if (Number.isFinite(wPack.hairwet)) v.hairwet = wPack.hairwet;
        }
      }
    } catch (e) {}
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

  /* ---------------- 端到端 P2P 免云服务器直连引擎（WebRTC DataChannel + 免服房间码信令 + 同机通道） ---------------- */

  var P2P = {
    mode: localStorage.getItem("dolmp.net_mode") || "p2p", // "p2p" | "ws"
    active: false,
    isHost: false,
    roomCode: "",
    bc: null,
    mqttWs: null,
    peers: new Map(), // peerId -> { pc, dc, name, playerUid }
    hostRoom: null,   // embedded host room state when isHost === true
    lastOfferCode: ""
  };

  var PUBLIC_SIGNAL_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://test.mosquitto.org:8081"
  ];

  var ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.qq.com:3478" },
    { urls: "stun:stun.miwifi.com:3478" }
  ];

  function startP2PRoom(asHost, codeInput) {
    disconnect();
    P2P.active = true;
    P2P.isHost = !!asHost;
    var cleanCode = String(codeInput || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanCode) {
      var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      cleanCode = "";
      for (var i = 0; i < 4; i++) cleanCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    P2P.roomCode = cleanCode;
    S.id = S.playerUid || getOrCreatePlayerUid();
    S.connected = true;
    S.room = cleanCode;
    S.roomCode = cleanCode;
    S.isHost = !!asHost;
    S.wasHost = !!asHost;
    localStorage.setItem(LS_ROOM, cleanCode);
    localStorage.setItem(LS_HOST, asHost ? "1" : "0");

    // 1. 建立同设备/局域浏览器 BroadcastChannel 零延迟直连通道
    try {
      if (P2P.bc) P2P.bc.close();
      if (window.BroadcastChannel) {
        P2P.bc = new BroadcastChannel("dolmp_p2p_room_" + cleanCode);
        P2P.bc.onmessage = function (ev) {
          onP2PTransportFrame(ev.data);
        };
      }
    } catch (e) {}

    // 2. 启动跨网 WebRTC 免服信令发现（利用公共 WebSocket 回声/信令通道或手动直连码交换 SDP）
    connectPublicRoomSignal(cleanCode);

    setStatus("P2P免服直连 · " + cleanCode, "mp-ok");
    toast((asHost ? "已创建端到端 P2P 免服房间 " : "已加入端到端 P2P 免服房间 ") + cleanCode, "mp-ok");
    logLine("已启用端到端 P2P 免云服务器直连 · 房间码 " + cleanCode, "mp-sys");

    if (!asHost) {
      broadcastP2PFrame({
        _p2p: "join_hello",
        fromId: S.id,
        playerUid: S.playerUid,
        name: S.name
      });
    }
    sendState(true);
    renderRoom();
    renderPlayers();
    renderChannelBar();
    injectInlinePassageSections();
  }

  function connectPublicRoomSignal(roomCode) {
    // 尝试连接免配置公共 WebRTC 信令中继（若处于纯离线环境则自动静默降级为离线直连码 + BroadcastChannel）
    try {
      if (P2P.mqttWs) { try { P2P.mqttWs.close(); } catch (e) {} P2P.mqttWs = null; }
      var relayUrl = "wss://free.blr2.piesocket.com/v3/dolmp_" + roomCode.toLowerCase() + "?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self=0";
      var rws = new WebSocket(relayUrl);
      P2P.mqttWs = rws;
      rws.onopen = function () {
        if (!P2P.isHost) {
          broadcastP2PFrame({
            _p2p: "join_hello",
            fromId: S.id,
            playerUid: S.playerUid,
            name: S.name
          });
        }
        sendState(true);
      };
      rws.onmessage = function (ev) {
        try {
          var data = JSON.parse(ev.data);
          onP2PTransportFrame(data);
        } catch (e) {}
      };
      rws.onerror = function () {};
    } catch (e) {}
  }

  function broadcastP2PFrame(frameObj) {
    if (!P2P.active) return;
    frameObj._room = P2P.roomCode;
    frameObj._sender = S.id;
    var raw = JSON.stringify(frameObj);
    try {
      if (P2P.bc) P2P.bc.postMessage(frameObj);
    } catch (e) {}
    try {
      if (P2P.mqttWs && P2P.mqttWs.readyState === 1) {
        P2P.mqttWs.send(raw);
      }
    } catch (e) {}
    P2P.peers.forEach(function (peerEntry) {
      try {
        if (peerEntry.dc && peerEntry.dc.readyState === "open") {
          peerEntry.dc.send(raw);
        }
      } catch (e) {}
    });
  }

  // 生成纯端到端 WebRTC 离线邀请码（无需任何公网中继，复制粘贴即可建立 RTCDataChannel）
  function createManualWebRTCOffer(cb) {
    if (!window.RTCPeerConnection) {
      toast("当前浏览器环境不支持 WebRTC", "mp-bad");
      return;
    }
    var pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    var dc = pc.createDataChannel("dolmp_p2p");
    var peerTempId = "webrtc_" + Date.now();
    P2P.peers.set(peerTempId, { pc: pc, dc: dc });

    dc.onopen = function () {
      toast("端到端 WebRTC 数据通道已直连成功！", "mp-ok");
      sendState(true);
    };
    dc.onmessage = function (ev) {
      try { onP2PTransportFrame(JSON.parse(ev.data)); } catch (e) {}
    };

    pc.onicecandidate = function (ev) {
      if (!ev.candidate && pc.localDescription) {
        var pack = {
          r: P2P.roomCode || "P2P1",
          t: "offer",
          sdp: pc.localDescription
        };
        var code = "DOLP2P1:" + btoa(unescape(encodeURIComponent(JSON.stringify(pack))));
        P2P.lastOfferCode = code;
        if (cb) cb(code);
      }
    };
    pc.createOffer().then(function (offer) {
      return pc.setLocalDescription(offer);
    }).catch(function () {});
  }

  function acceptManualWebRTCCode(rawCode, cb) {
    var clean = String(rawCode || "").trim();
    if (clean.indexOf("DOLP2P1:") !== 0) {
      toast("端到端直连码格式不正确", "mp-bad");
      return;
    }
    try {
      var jsonStr = decodeURIComponent(escape(atob(clean.slice(8))));
      var pack = JSON.parse(jsonStr);
      if (pack.t === "offer") {
        if (!P2P.active) startP2PRoom(false, pack.r || "P2P1");
        var pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pc.ondatachannel = function (ev) {
          var dc = ev.channel;
          P2P.peers.set("host_peer", { pc: pc, dc: dc });
          dc.onopen = function () {
            toast("端到端 WebRTC 直连已建立！", "mp-ok");
            broadcastP2PFrame({ _p2p: "join_hello", fromId: S.id, playerUid: S.playerUid, name: S.name });
            sendState(true);
          };
          dc.onmessage = function (mEv) {
            try { onP2PTransportFrame(JSON.parse(mEv.data)); } catch (e) {}
          };
        };
        pc.onicecandidate = function (ev) {
          if (!ev.candidate && pc.localDescription) {
            var ansPack = { r: P2P.roomCode, t: "answer", sdp: pc.localDescription };
            var ansCode = "DOLP2P1:" + btoa(unescape(encodeURIComponent(JSON.stringify(ansPack))));
            if (cb) cb(ansCode);
          }
        };
        pc.setRemoteDescription(new RTCSessionDescription(pack.sdp)).then(function () {
          return pc.createAnswer();
        }).then(function (ans) {
          return pc.setLocalDescription(ans);
        });
      } else if (pack.t === "answer") {
        P2P.peers.forEach(function (pe) {
          if (pe.pc && pe.pc.signalingState === "have-local-offer") {
            pe.pc.setRemoteDescription(new RTCSessionDescription(pack.sdp));
          }
        });
        toast("已接收对方应答码，端到端 P2P 正在握手连接！", "mp-ok");
      }
    } catch (e) {
      toast("解析直连码失败", "mp-bad");
    }
  }

  function onP2PTransportFrame(frame) {
    if (!frame || typeof frame !== "object") return;
    if (frame._room && P2P.roomCode && frame._room !== P2P.roomCode) return;
    if (frame._sender === S.id) return;
    if (frame._target && frame._target !== S.id) return;

    if (frame._p2p === "join_hello") {
      S.players.set(frame.fromId, {
        id: frame.fromId,
        playerUid: frame.playerUid || frame.fromId,
        name: frame.name || "同伴",
        passage: "Orphanage",
        timeStamp: S.clock.timeStamp
      });
      sendState(true);
      renderPlayers();
      injectInlinePassageSections();
      return;
    }

    if (frame._p2p === "direct_msg" && frame.msg) {
      handleMessage(frame.msg);
      return;
    }

    if (frame._p2p === "client_send" && frame.payload) {
      handleP2PPeerPayload(frame._sender, frame.payload);
    }
  }

  function handleP2PPeerPayload(fromId, msg) {
    if (!msg || !msg.t) return;
    if (msg.t === "state") {
      var pObj = {
        id: fromId,
        playerUid: msg.playerUid || fromId,
        name: msg.name || (S.players.get(fromId) && S.players.get(fromId).name) || "同伴",
        passage: msg.passage || "Orphanage",
        phase: msg.phase,
        recentPassages: msg.recentPassages || [],
        location: msg.location || "",
        mapLocation: msg.mapLocation || "",
        inCombat: !!msg.inCombat,
        combatInfo: msg.combatInfo || null,
        syncMode: !!msg.syncMode,
        timeStamp: msg.timeStamp || 25260,
        weatherPack: msg.weatherPack || null,
        speechAttitude: msg.speechAttitude || "neutral",
        appearance: msg.appearance || {},
        combatSnapshot: msg.combatSnapshot || {},
        stats: msg.stats || {}
      };
      var prevP = S.players.get(fromId);
      S.players.set(fromId, pObj);
      updateCompanionFromOnlinePlayer(pObj);

      if (S.syncMode && pObj.weatherPack) {
        var isSamePas = (pObj.passage === ((window.State && State.passage) || ""));
        applyWeatherPack(pObj.weatherPack, isSamePas);
      }

      if (S.syncMode && (!prevP || prevP.passage !== pObj.passage) && isSafePassage(pObj.passage) && !pObj.inCombat) {
        handleMessage({
          t: "sync_jump",
          fromId: fromId,
          fromName: pObj.name,
          passage: pObj.passage,
          phase: pObj.phase,
          weatherPack: pObj.weatherPack,
          eventContext: msg.eventContext || null,
          inCombat: false,
          reason: "host_move"
        });
      }
      renderPlayers();
      injectInlinePassageSections();
      renderMapMarkers();
    } else if (msg.t === "chat") {
      handleMessage({
        t: "chat",
        from: fromId,
        name: msg.name || "同伴",
        text: msg.text,
        passage: msg.passage
      });
    } else if (msg.t === "sync_timeline") {
      broadcastP2PFrame({
        _p2p: "direct_msg",
        _target: fromId,
        msg: {
          t: "sync_timeline_apply",
          targetId: S.id,
          targetName: S.name,
          timeStamp: (V() && V().timeStamp) || S.clock.timeStamp
        }
      });
    } else if (msg.t === "sync_request") {
      handleMessage({ t: "sync_invite", reqId: "p2p_sync_" + Date.now(), fromId: fromId, fromName: msg.name || "同伴" });
    } else if (msg.t === "sync_accept") {
      S.syncMode = true;
      handleMessage({ t: "sync_accepted", byId: fromId, byName: msg.name || "同伴" });
    } else if (msg.t === "sync_mode") {
      handleMessage({ t: "sync_state", syncMode: !!msg.syncMode, byName: msg.name || "同伴" });
    } else if (msg.t === "meet_here") {
      handleMessage({ t: "meet_invite", fromId: fromId, fromName: msg.name || "同伴", passage: msg.passage });
    } else if (msg.t === "meet_accept") {
      S.syncMode = true;
      var peerM = S.players.get(fromId);
      var rInfo = calcShortestAssistTravelClient(peerM || { passage: msg.passage });
      broadcastP2PFrame({
        _p2p: "direct_msg",
        _target: fromId,
        msg: {
          t: "meet_jump",
          fromId: S.id,
          fromName: S.name,
          passage: (window.State && State.passage) || "Orphanage",
          timeCostSeconds: rInfo.seconds,
          timeCostMinutes: rInfo.minutes,
          routeSummary: rInfo.routeSummary
        }
      });
      handleMessage({ t: "meet_accepted_notify", byId: fromId, byName: (peerM && peerM.name) || "同伴", passage: (window.State && State.passage) || "Orphanage" });
    } else if (msg.t === "interact_effect") {
      handleMessage(Object.assign({}, msg, { t: "interact_effect", fromId: fromId, fromName: msg.name || "同伴" }));
    } else if (msg.t === "event_pick") {
      handleMessage(Object.assign({}, msg, { t: "sync_event", fromId: fromId, fromName: msg.name || "同伴" }));
    } else if (msg.t === "inline_dom_event") {
      handleMessage(Object.assign({}, msg, { t: "sync_inline_dom", fromId: fromId, fromName: msg.name || "同伴" }));
    } else if (msg.t === "link_vote") {
      handleMessage({
        t: "link_commit",
        passage: msg.passage,
        linkIndex: msg.linkIndex,
        linkKey: msg.linkKey,
        linkText: msg.linkText,
        targetPassage: msg.targetPassage,
        reason: "unanimous",
        pickedBy: msg.name || "同伴",
        pickedById: fromId,
        eventContext: msg.eventContext
      });
    } else if (msg.t === "attack_request") {
      if (msg.consensual) {
        handleMessage({ t: "consensual_request", reqId: "p2p_con_" + fromId, fromId: fromId, fromName: msg.name || "同伴" });
      } else {
        var oppP = S.players.get(fromId) || { id: fromId, name: msg.name || "同伴" };
        var cid = "p2p_c_" + Date.now();
        var startMsg = {
          t: "pvp_combat_start",
          combatId: cid,
          mode: "pvp",
          consensual: false,
          opponent: oppP,
          returnPassage: (window.State && State.passage) || "Orphanage"
        };
        handleMessage(startMsg);
        broadcastP2PFrame({
          _p2p: "direct_msg",
          _target: fromId,
          msg: Object.assign({}, startMsg, {
            opponent: { id: S.id, name: S.name, combatSnapshot: extractCombatSnapshot(), stats: collectMyStats(V()) }
          })
        });
      }
    } else if (msg.t === "consensual_accept") {
      var oppC = S.players.get(fromId) || { id: fromId, name: msg.name || "同伴" };
      var cidC = "p2p_c_" + Date.now();
      var startC = {
        t: "pvp_combat_start",
        combatId: cidC,
        mode: "pvp",
        consensual: true,
        opponent: oppC,
        returnPassage: (window.State && State.passage) || "Orphanage"
      };
      handleMessage(startC);
      broadcastP2PFrame({
        _p2p: "direct_msg",
        _target: fromId,
        msg: Object.assign({}, startC, {
          opponent: { id: S.id, name: S.name, combatSnapshot: extractCombatSnapshot(), stats: collectMyStats(V()) }
        })
      });
    } else if (msg.t === "assist_combat") {
      var peerHelper = S.players.get(fromId) || { id: fromId, name: msg.name || "同伴" };
      var cInfoP2p = buildCombatInfo(V()) || { enemyName: "袭击者", enemyPronoun: "m", enemyGender: "m", enemyHealth: 275, enemyHealthMax: 275, enemyArousal: 100, enemyArousalMax: 500 };
      var cidCoop = S.combatId || ("p2p_coop_" + Date.now());
      var sharedEn = S.combatSharedEnemy || {
        name: cInfoP2p.enemyName || "袭击者",
        pronoun: cInfoP2p.enemyPronoun || "m",
        gender: cInfoP2p.enemyGender || "m",
        hp: Math.round((cInfoP2p.enemyHealth || 275) * 1.65),
        hpMax: Math.round((cInfoP2p.enemyHealthMax || 275) * 1.65),
        arousal: cInfoP2p.enemyArousal || 80,
        arousalMax: Math.round((cInfoP2p.enemyArousalMax || 500) * 1.55),
        anger: 65,
        angerMax: 200,
        trust: 0,
        npcSnapshot: cInfoP2p.npcSnapshot || null
      };
      var rAssist = calcShortestAssistTravelClient(peerHelper);
      var coopPayload = {
        t: "coop_combat_joined",
        combatId: cidCoop,
        mode: "coop_pve",
        helperId: fromId,
        helperName: peerHelper.name || "同伴",
        hostPlayerId: S.id,
        hostPlayerName: S.name,
        timeCostSeconds: rAssist.seconds,
        timeCostMinutes: rAssist.minutes,
        routeSummary: rAssist.routeSummary,
        lockedTargetId: S.id,
        lockedTargetName: S.name,
        sharedEnemy: sharedEn,
        fighters: {},
        opponent: peerHelper,
        returnPassage: findSafeReturnPassage(true)
      };
      handleMessage(coopPayload);
      broadcastP2PFrame({
        _p2p: "direct_msg",
        _target: fromId,
        msg: Object.assign({}, coopPayload, {
          opponent: { id: S.id, name: S.name, combatSnapshot: extractCombatSnapshot(), stats: collectMyStats(V()) }
        })
      });
    } else if (msg.t === "steal_request") {
      var vVictim = V();
      var thiefPeer = S.players.get(fromId) || { id: fromId, name: msg.name || "同伴", stats: {} };
      var thiefSkul = (thiefPeer.stats && Number(thiefPeer.stats.skulduggery)) || 0;
      if (thiefSkul < 600) {
        broadcastP2PFrame({
          _p2p: "direct_msg",
          _target: fromId,
          msg: { t: "steal_result", role: "thief", success: false, reason: "low_skill", grade: "C", targetId: S.id, targetName: S.name, amount: 0 }
        });
      } else {
        var myMoney = (vVictim && Number(vVictim.money)) || 0;
        if (myMoney <= 0) {
          broadcastP2PFrame({
            _p2p: "direct_msg",
            _target: fromId,
            msg: { t: "steal_result", role: "thief", success: false, reason: "no_money", targetId: S.id, targetName: S.name, amount: 0 }
          });
        } else {
          var stolenAmt = Math.max(100, Math.min(myMoney, Math.min(5000, Math.round(myMoney * 0.2))));
          handleMessage({ t: "steal_result", role: "victim", success: true, reason: "ok", thiefId: fromId, thiefName: thiefPeer.name, amount: stolenAmt });
          broadcastP2PFrame({
            _p2p: "direct_msg",
            _target: fromId,
            msg: { t: "steal_result", role: "thief", success: true, reason: "ok", targetId: S.id, targetName: S.name, amount: stolenAmt }
          });
        }
      }
    } else if (msg.t === "combat_turn") {
      P2P.peerTurn = {
        fromId: fromId,
        fromName: msg.name || "同伴",
        actions: msg.actions || {},
        organStates: msg.organStates || null,
        summary: msg.summary || ((msg.name || "同伴") + " 执行了行动"),
        enemyhealth: msg.enemyhealth,
        enemyarousal: msg.enemyarousal,
        combatSnapshot: msg.combatSnapshot
      };
      if (S.combatReadyIds.indexOf(fromId) < 0) S.combatReadyIds.push(fromId);
      renderCombatSyncHint();
      if (S.combatTurnReady && P2P.myTurn) {
        resolveP2PCombatTurn();
      }
    }
  }

  function resolveP2PCombatTurn() {
    var peerT = P2P.peerTurn;
    var myT = P2P.myTurn;
    if (!peerT || !myT) return;
    P2P.peerTurn = null;
    P2P.myTurn = null;
    S.combatReadyIds = [];

    var v = V();
    var pActs = peerT.actions || {};
    var pSexKind = "";
    if (pActs.penisaction === "penistovagina" || pActs.penisaction === "penisvaginafuck" || pActs.penisaction === "cooperate") pSexKind = "penis_to_vagina";
    else if (pActs.penisaction === "penistoanus" || pActs.penisaction === "penisanusfuck") pSexKind = "penis_to_anus";
    else if (pActs.vaginaaction === "vaginatopenis" || pActs.vaginaaction === "vaginapenisfuck" || pActs.vaginaaction === "cooperate") pSexKind = "vagina_to_penis";
    else if (pActs.anusaction === "anustopenis") pSexKind = "anus_to_penis";
    else if (pActs.vaginaaction === "vaginatovagina" || pActs.vaginaaction === "trib") pSexKind = "trib";
    else if (pActs.mouthaction === "oral" || pActs.mouthaction === "suck") pSexKind = "oral_to_peer";
    else if (pActs.mouthaction === "kisslips" || pActs.mouthaction === "kiss") pSexKind = "kiss";

    handleMessage({
      t: "combat_peer_turn",
      fromId: peerT.fromId,
      fromName: peerT.fromName,
      actions: pActs,
      organStates: peerT.organStates,
      activeSexKind: pSexKind,
      summary: peerT.summary,
      combatSnapshot: peerT.combatSnapshot
    });

    var finished = false;
    var outcome = "";
    if (S.combatMode === "coop_pve" && S.combatSharedEnemy) {
      S.combatSharedEnemy.hp = Math.max(0, (S.combatSharedEnemy.hp || 275) - 55);
      S.combatSharedEnemy.arousal = Math.min(S.combatSharedEnemy.arousalMax || 500, (S.combatSharedEnemy.arousal || 100) + 65);
      if (S.combatSharedEnemy.hp <= 0) { finished = true; outcome = "peer_down"; }
      else if (S.combatSharedEnemy.arousal >= (S.combatSharedEnemy.arousalMax || 500)) { finished = true; outcome = "peer_arousal"; }
    } else if (v) {
      if ((v.enemyhealth != null && v.enemyhealth <= 35) || (peerT.enemyhealth != null && peerT.enemyhealth <= 0)) {
        finished = true; outcome = "peer_down";
      } else if ((v.enemyarousal != null && v.enemyarousal >= (v.enemyarousalmax || 500) - 45)) {
        finished = true; outcome = "peer_arousal";
      }
    }

    handleMessage({
      t: "combat_turn_commit",
      combatId: S.combatId,
      mode: S.combatMode,
      sharedEnemy: S.combatSharedEnemy,
      peerActiveSexKind: pSexKind,
      combinedSummary: (myT.summary || "") + " ｜ " + (peerT.summary || ""),
      peerSnapshot: peerT.combatSnapshot,
      finished: finished,
      outcome: outcome
    });
  }

  function send(obj) {
    if (P2P.active) {
      obj.name = S.name;
      obj.playerUid = S.playerUid;
      if (obj.t === "combat_turn") {
        P2P.myTurn = obj;
        broadcastP2PFrame({ _p2p: "client_send", payload: obj });
        if (P2P.peerTurn || S.players.size === 0) {
          if (!P2P.peerTurn && S.players.size === 0) {
            P2P.peerTurn = { fromId: "offline", fromName: (S.combatOpponent && S.combatOpponent.name) || "对方", actions: {}, summary: ((S.combatOpponent && S.combatOpponent.name) || "对方") + " 采取了行动" };
          }
          resolveP2PCombatTurn();
        }
        return;
      }
      broadcastP2PFrame({ _p2p: "client_send", payload: obj });
      if (obj.t === "chat") {
        logLine("[我] " + obj.text, "mp-me");
      }
      return;
    }
    if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(obj));
  }
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

  var MP_PREFIX_CN = [
    ["MP NPC Sera", "高街钟表铺"],
    ["MP NPC Vesper", "旧港防波堤"],
    ["MP NPC Noel", "学园标本室"],
    ["MP NPC Lin", "宅邸街巡夜点"],
    ["MP NPC Monet", "康努达图斯街画室"],
    ["MP NPC Ash", "森林守灯人石径"],
    ["MP Companion Room", "孤儿院同伴房间"],
    ["MP Companion", "孤儿院"],
    ["MP Player Interact", "同行互动中"],
    ["MP Bailey Biweekly", "孤儿院走廊"],
    ["MP Quest Bailey", "孤儿院走廊"],
    ["MP BadEnd Velvet", "天鹅绒暗层"],
    ["MP BadEnd Abbey", "地下古修道院"],
    ["MP BadEnd Smuggler", "夜航走私船底舱"],
    ["MP BadEnd Glasshouse", "多瑙河温室庄园"],
    ["MP BadEnd Bailey", "孤儿院地下训诫室"],
    ["MP Elite Encounter Ivory Wraith", "血月迷雾圣殿"],
    ["MP Elite Encounter Abyssal Tentacles", "深渊潮汐洞穴"],
    ["MP Elite Encounter Blackiron Bosun", "旧港防波堤禁区"],
    ["MP Elite Encounter Velvet Enforcers", "峭壁天鹅绒暗层"],
    ["MP Elite Encounter Bailey Enforcers", "孤儿院走廊"],
    ["MP Region Foghorn", "雾角灯塔岛"],
    ["MP Region Clockwork", "地下机括城"],
    ["MP Region Sunken Abbey", "地下古修道院"],
    ["MP Region Abbey", "地下古修道院"],
    ["MP Region Glasshouse", "秘密温室庄园"],
    ["MP Mansion", "多瑙河街宅邸"],
    ["MP Region Blackiron", "黑铁货运站"],
    ["MP Region Druid", "古德鲁伊石环"],
    ["MP Region Velvet", "峭壁天鹅绒暗层"],
    ["MP Region Observatory", "旧学园天文翼楼"],
    ["MP Main Story", "小镇暗线调查中"],
    ["MP Collection", "信物残片搜集中"],
    ["MP Grand Quest", "城镇秘闻调查中"],
    ["MP Quest", "城镇暗线调查中"],
    ["MP Livelihood", "街角零工告示板"],
    ["MP Job Punishment", "零工失误"],
    ["MP Jobline", "零工伙伴"],
    ["MP Job", "长期零工路线"],
    ["MP Extra Jobs", "额外零工"],
    ["MP Daily Extra", "额外日常"],
    ["MP Town Festivals 2", "后半年的节日"],
    ["MP Region Extra", "区域额外事件"],
    ["MP Festival", "城镇节日"],
    ["MP Daily", "日常关系"],
    ["MP Town Side", "城镇小事"],
    ["MP Side", "街头小事"],
    ["MP Wild Side", "荒野小事"],
    ["MP Wild Extra", "荒野额外遭遇"],
    ["MP Extra", "城镇额外小事"],
    ["MP Wild", "荒野小事"],
    ["MP World Event", "街巷奇遇中"],
    ["MP Event", "同行奇遇中"]
  ];

  function shortLoc(p) {
    if (!p) return "孤儿院";
    var s = String(p).trim();
    if (PASSAGE_CN[s]) return PASSAGE_CN[s];
    for (var i = 0; i < MP_PREFIX_CN.length; i++) {
      if (s.indexOf(MP_PREFIX_CN[i][0]) === 0) return MP_PREFIX_CN[i][1];
    }
    if (s.indexOf("MP ") === 0) {
      var v = V();
      var ret = v && v.mpReturnPassage;
      if (ret && PASSAGE_CN[ret]) return PASSAGE_CN[ret];
      return "镇上";
    }
    return PASSAGE_CN[s] || s;
  }

  function findSafeReturnPassage(strict) {
    var hist = S._passageHistory || [];
    for (var i = hist.length - 1; i >= 0; i--) {
      if (isSafePassage(hist[i])) return hist[i];
    }
    if (strict) return "Orphanage";
    for (var j = hist.length - 1; j >= 0; j--) {
      var p = hist[j] || "";
      if (!p) continue;
      if (p === MP_COMBAT_PASSAGE || (p === "MP Native Combat Finish" || p === "MP Native Combat Aftermath") || p === "Tutorial") continue;
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
    { name: "mp_world_forest_shrine", weight: 0.35, locs: ["Forest"], content: "<<include \"MP World Event Forest Shrine\">>" },
    { name: "mp_world_park_sketchbook", weight: 0.35, locs: ["Park", "Nightingale Street", "Oxford Street"], content: "<<include \"MP World Event Park Sketchbook\">>" },
    { name: "mp_world_temple_censer", weight: 0.35, locs: ["Wolf Street", "Temple"], content: "<<include \"MP World Event Temple Censer\">>" },
    { name: "mp_world_sewer_cache", weight: 0.4, locs: ["Sewers", "Commercial Alleyways", "Industrial Alleyways"], minSkul: 200, content: "<<include \"MP World Event Sewer Cache\">>" },
    { name: "mp_world_barb_patrol", weight: 0.35, locs: ["Barb Street", "Police Station", "Cliff Street"], content: "<<include \"MP World Event Barb Patrol\">>" },
    { name: "mp_world_danube_carriage", weight: 0.35, locs: ["Danube Street", "Kylar Manor", "Wolf Street"], content: "<<include \"MP World Event Danube Carriage\">>" },
    { name: "mp_world_school_corridor", weight: 0.35, locs: ["Hallways", "School Library", "School Front Courtyard", "Canteen"], content: "<<include \"MP World Event School Corridor\">>" },
    { name: "mp_world_pool_steam", weight: 0.35, locs: ["Swimming Pool", "Bathroom"], content: "<<include \"MP World Event Pool Steam\">>" },
    { name: "mp_world_arcade_neon", weight: 0.35, locs: ["Arcade", "Starfish Street", "Ocean Breeze"], content: "<<include \"MP World Event Arcade Neon\">>" },
    { name: "mp_world_shopping_mirror", weight: 0.35, locs: ["Shopping Centre", "Shopping Centre Top", "High Street"], content: "<<include \"MP World Event Shopping Mirror\">>" },
    { name: "mp_world_hospital_night", weight: 0.35, locs: ["Hospital Courtyard", "Nightingale Street"], content: "<<include \"MP World Event Hospital Night\">>" },
    { name: "mp_world_brothel_backdoor", weight: 0.35, locs: ["Brothel", "Harvest Street", "Pub", "Adult Shop"], content: "<<include \"MP World Event Brothel Backdoor\">>" },
    { name: "mp_world_farmland_hedgerow", weight: 0.35, locs: ["Farmland", "Cottage", "Deep Forest"], content: "<<include \"MP World Event Farmland Hedgerow\">>" },
    { name: "mp_world_npc_sera_encounter", weight: 0.32, hours: [8, 21], locs: ["High Street", "Shopping Centre", "Wolf Street"], content: "<<include \"MP NPC Sera Street Encounter\">>" },
    { name: "mp_world_npc_vesper_encounter", weight: 0.32, hours: [17, 6], locs: ["Docks", "Mer Street", "Elk Street"], content: "<<include \"MP NPC Vesper Street Encounter\">>" },
    { name: "mp_world_npc_noel_encounter", weight: 0.32, hours: [7, 20], locs: ["Oxford Street", "Park", "School Library", "Hallways"], content: "<<include \"MP NPC Noel Street Encounter\">>" },
    { name: "mp_world_npc_lin_encounter", weight: 0.32, hours: [16, 7], locs: ["Domus Street", "Barb Street", "Residential Alleyways", "Orphanage"], content: "<<include \"MP NPC Lin Street Encounter\">>" },
    { name: "mp_world_npc_monet_encounter", weight: 0.32, hours: [10, 23], locs: ["Connudatus Street", "Cliff Street", "Ocean Breeze"], content: "<<include \"MP NPC Monet Street Encounter\">>" },
    { name: "mp_world_npc_ash_encounter", weight: 0.32, hours: [6, 23], locs: ["Forest", "Temple", "Sewers"], content: "<<include \"MP NPC Ash Street Encounter\">>" },
    { name: "mp_world_deep_router", weight: 0.45, locs: SAFE_PASSAGES, content: "<<include \"MP World Deep Router\">>" }
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
    // 街头小事被原版事件池抽中时：记下当日键与返回来路，事件页据此收尾。
    try {
      if (name && String(name).indexOf("mp_street_") === 0) {
        var sev = null;
        for (var si = 0; si < RANDOM_STREET_EVENTS.length; si++) {
          if ("mp_street_" + RANDOM_STREET_EVENTS[si].key === name) { sev = RANDOM_STREET_EVENTS[si]; break; }
        }
        if (sev) {
          var vsev = V();
          if (vsev) {
            if (!vsev.daily) vsev.daily = {};
            vsev.daily[sev.dailyKey] = 1;
            vsev.mpReturnPassage = (window.State && State.passage) || "";
          }
        }
      }
    } catch (e) {}
    S.lastEventPick = {
      name: name || "inline_event",
      content: content || "",
      passage: (window.State && State.passage) || "",
      at: Date.now()
    };
    if (S.syncMode && S.connected && S.room && !S._suppressEventPick) {
      send({
        t: "event_pick",
        eventKey: currentEventKey(),
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
              if (wev.locs.indexOf(curPasNow) >= 0 && (!wev.minSkul || mySkul >= wev.minSkul) && (!wev.hours || isNpcInScheduleHour(wev))) {
                if (!tt.eventpool.some(function (x) { return x.name === wev.name; })) {
                  tt.eventpool.push({ name: wev.name, weight: wev.weight, content: wev.content });
                }
              }
            });
            // 街头随机小事并入原版事件池：进入街区时随机触发、占满屏幕，不再做成内联提示行。
            RANDOM_STREET_EVENTS.forEach(function (sev) {
              if (sev.locs.indexOf(curPasNow) < 0) return;
              if (sev.hours && !isNpcInScheduleHour(sev)) return;
              if (vv.daily && vv.daily[sev.dailyKey]) return;
              var evName = "mp_street_" + sev.key;
              if (!tt.eventpool.some(function (x) { return x.name === evName; })) {
                tt.eventpool.push({ name: evName, weight: sev.weight || 0.35, content: "<<include \"" + sev.passage + "\">>" });
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
            if (isSafePassage(curPasNow) && vv) vv.mpReturnPassage = curPasNow;
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
            if (isSafePassage(curPasNow)) vv.mpReturnPassage = curPasNow;
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

  function sanitizeCombatNpcAndState(v) {
    if (!v || !Array.isArray(v.NPCList)) return;
    var npc = v.NPCList[0];
    if (!npc || typeof npc !== "object") return;
    // 确保只激活第 1 个 NPC 槽位，彻底消除 Undefined NPC in personselect 1
    v.enemyno = 1;
    v.enemynomax = 1;
    v.index = 0;
    v.enemytype = "man";
    v.npcrow = [0];
    v.npcnum = [0];
    if (!npc.pronoun || npc.pronoun === "none") npc.pronoun = "m";
    if (!npc.gender || npc.gender === "none") npc.gender = npc.pronoun;
    v.pronoun = npc.pronoun;

    // 严禁 lefthand/righthand 为 undefined 或 "idle"（DoL 0.5.12.13 仅接受 0、"none" 或合法部位动作名）
    if (npc.lefthand === undefined || npc.lefthand === null || npc.lefthand === "idle") npc.lefthand = 0;
    if (npc.righthand === undefined || npc.righthand === null || npc.righthand === "idle") npc.righthand = 0;
    if (npc.mouth === undefined || npc.mouth === null || npc.mouth === "idle") npc.mouth = 0;
    if (npc.penis === undefined || npc.penis === null) npc.penis = (npc.gender === "f" ? "none" : 0);
    if (npc.vagina === undefined || npc.vagina === null) npc.vagina = (npc.gender === "m" ? "none" : 0);
    if (!Number.isFinite(Number(npc.breastsize))) npc.breastsize = (npc.pronoun === "f" ? 3 : 0);
    if (npc.chest === undefined || npc.chest === null) npc.chest = 0;
    if (!npc.chastity || typeof npc.chastity !== "object") {
      npc.chastity = { penis: "", vagina: "", anus: "" };
    }
    if (!npc.location || typeof npc.location !== "object") {
      npc.location = { head: 0, genitals: 0 };
    }
    if (!npc.type) npc.type = "human";
    if (!v.targetlist || typeof v.targetlist !== "object") {
      v.targetlist = { "none": "none", "self": "self", "0": (npc.fullDescription || npc.description || "对方") };
    }
    if (!v.lefttarget) v.lefttarget = 0;
    if (!v.righttarget) v.righttarget = 0;
    if (!v.feettarget) v.feettarget = 0;
    if (!v.mouthtarget) v.mouthtarget = 0;
  }

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
    if (!v || !v.NPCList || !v.NPCList[0]) return false;
    var snapNpc = null;
    if (S.combatMode === "coop_pve" && S.combatSharedEnemy && S.combatSharedEnemy.npcSnapshot && Array.isArray(S.combatSharedEnemy.npcSnapshot.activeNpcs)) {
      snapNpc = S.combatSharedEnemy.npcSnapshot.activeNpcs[0];
    } else if (S.SavedHostCombatNpc) {
      snapNpc = S.SavedHostCombatNpc;
    }
    if (snapNpc && typeof snapNpc === "object") {
      var npc = v.NPCList[0];
      var safeKeys = ["pronoun", "gender", "description", "description_CN", "fullDescription", "fullDescription_CN", "name", "name_known", "role", "role_CN", "skincolour", "haircolour", "breastsize", "penissize", "penisdesc", "insecurity"];
      safeKeys.forEach(function (k) {
        if (snapNpc[k] !== undefined && snapNpc[k] !== null) {
          npc[k] = clone(snapNpc[k]);
        }
      });
      sanitizeCombatNpcAndState(v);
      return true;
    }
    sanitizeCombatNpcAndState(v);
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

    if (v.NPCList && v.NPCList[0] && v.NPCList[0].pronoun && v.NPCList[0].pronoun !== "none") {
      S.SavedHostCombatNpc = clone(v.NPCList[0]);
    }

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
      // 支援战斗：在 <<maninit>> 基础上恢复原版 NPC 的名字、外貌与代词，绝不破坏战斗属性
      restoreCoopNpcSnapshot();
      delete npc.mpPlayerName;
      v.enemyhealthmax = S.combatSharedEnemy.hpMax || npc.healthmax || 275;
      v.enemyhealth = S.combatSharedEnemy.hp != null ? S.combatSharedEnemy.hp : (npc.health || 275);
      npc.healthmax = v.enemyhealthmax;
      npc.health = v.enemyhealth;
      v.enemyarousalmax = S.combatSharedEnemy.arousalMax || 500;
      v.enemyarousal = S.combatSharedEnemy.arousal != null ? S.combatSharedEnemy.arousal : 100;
      v.npcSub = 0;
    } else {
      var oppName = (S.combatOpponent && S.combatOpponent.name) || v.mpOpponentName || "玩家";
      v.mpOpponentName = oppName;
      applyPvpPlayerNameToNpc(npc, oppName);

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
      npc.chest = 0;
      npc.lefthand = 0;
      npc.righthand = 0;
      npc.mouth = 0;
      if (npc.location) npc.location.genitals = 0;

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
    sanitizeCombatNpcAndState(v);
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
    sanitizeCombatNpcAndState(v);

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
    clearLinkProposalBox();
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

  function currentEventKey() {
    var v = V();
    var pas = (window.State && State.passage) || "";
    var ph = v && v.phase !== undefined ? v.phase : "";
    var ev = (S.lastEventPick && S.lastEventPick.name) || (v && v.eventPoolOverride) || "";
    return pas + "#" + ph + "#" + ev;
  }

  function bindPassageLinkInterceptor() {
    var host = document.getElementById("passages");
    if (!host || host._mpLinkBound) return;
    host._mpLinkBound = true;

    host.addEventListener("click", function (ev) {
      if (S.bypassLinkIntercept || !S.connected || !S.room || !S.syncMode) return;
      var v = V();
      var curPas = (window.State && State.passage) || "";
      if ((v && v.combat === 1) || curPas === MP_COMBAT_PASSAGE || (curPas === "MP Native Combat Finish" || curPas === "MP Native Combat Aftermath") || curPas.indexOf("MP Player Interact") === 0 || curPas.indexOf("MP Companion") === 0 || curPas === "Start" || curPas === "Start2") return;

      var a = ev.target && ev.target.closest ? ev.target.closest("a.link-internal") : null;
      if (!a || a.closest("#mp-inline-root")) return;

      var peers = getSameSceneGroupedPeers();
      if (peers.length === 0) return;

      var links = getPassageInternalLinks();
      var idx = links.indexOf(a);
      if (idx < 0) return;

      ev.preventDefault();
      ev.stopImmediatePropagation();

      S.myVotedIndex = idx;
      var txt = (a.textContent || "").trim();
      var targetPas = a.getAttribute("data-passage") || "";
      var linkKey = targetPas + "\u0001" + txt;

      send({
        t: "link_vote",
        passage: (window.State && State.passage) || "",
        eventKey: currentEventKey(),
        linkIndex: idx,
        linkKey: linkKey,
        linkText: txt,
        targetPassage: targetPas,
        eventContext: extractEventContext(),
        force: false
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

  function clearLinkProposalBox() {
    var old = document.getElementById("mp-link-proposal");
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function voteForKey(v) {
    if (!v || !v.linkKey) return false;
    var links = getPassageInternalLinks();
    for (var i = 0; i < links.length; i++) {
      var key = (links[i].getAttribute("data-passage") || "") + "\u0001" + (links[i].textContent || "").trim();
      if (key === v.linkKey) {
        S.myVotedIndex = i;
        send({
          t: "link_vote",
          passage: (window.State && State.passage) || "",
          eventKey: currentEventKey(),
          linkIndex: i,
          linkKey: key,
          linkText: (links[i].textContent || "").trim(),
          targetPassage: links[i].getAttribute("data-passage") || "",
          eventContext: extractEventContext(),
          force: false
        });
        renderLinkVoteBadges();
        return true;
      }
    }
    return false;
  }

  function renderLinkProposal() {
    clearLinkProposalBox();
    var votes = S.currentVotes || [];
    if (!votes.length || !S.syncMode) return;
    var host = document.getElementById("passages");
    if (!host) return;
    var mine = null, first = votes[0];
    for (var i = 0; i < votes.length; i++) {
      if (votes[i].id === S.id) { mine = votes[i]; break; }
    }
    var box = el("div", { id: "mp-link-proposal", class: "mp-link-proposal" });
    box.style.cssText = "margin:8px 0 10px;padding:8px 10px;border:1px solid #7a5c2e;background:#2b2419;color:#e8dcc0;font-size:13px;line-height:1.6;";
    box.appendChild(el("span", { text: (first.name || "队友") + " 提议：" }));
    box.appendChild(el("b", { text: first.linkText || first.targetPassage || "某个选项" }));
    if (!mine) {
      var yes = el("button", { text: "同意" });
      yes.style.cssText = "margin-left:10px;padding:2px 10px;cursor:pointer;";
      yes.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        if (!voteForKey(first)) {
          S.lastChannelTip = "同步未命中，正在重新校准事件";
          renderChannelBar();
          send({ t: "event_resync" });
        }
      });
      var no = el("button", { text: "不同意" });
      no.style.cssText = "margin-left:6px;padding:2px 10px;cursor:pointer;";
      no.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        send({ t: "link_disagree", passage: (window.State && State.passage) || "", eventKey: currentEventKey() });
        clearLinkProposalBox();
        S.currentVotes = [];
        S.myVotedIndex = -1;
        renderLinkVoteBadges();
      });
      box.appendChild(yes);
      box.appendChild(no);
    } else {
      box.appendChild(el("span", { text: "（已投，等待队友回应）" }));
    }
    host.insertBefore(box, host.firstChild);
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
    if (!targetEl) {
      S.lastChannelTip = "同步未命中，正在重新校准事件";
      renderChannelBar();
      if (msg.targetPassage) {
        S._syncJumpPassage = msg.targetPassage;
        enginePlay(msg.targetPassage);
      } else {
        send({ t: "event_resync" });
      }
      return;
    }
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

  function getHourNow() {
    try {
      if (window.Time && Number.isFinite(Time.hour)) return Time.hour;
    } catch (e) {}
    return 12;
  }

  function isNightNow() {
    var h = getHourNow();
    return h >= 20 || h < 6;
  }

  function isDuskOrNightNow() {
    var h = getHourNow();
    return h >= 18 || h < 6;
  }

  var WORLD_STORYLINE_HOOKS = [
    {
      locs: ["Orphanage", "Bedroom", "Domus Street"],
      check: function (v) {
        var curDay = (window.Time && Number.isFinite(Time.days)) ? Time.days : 0;
        if (v.mpBaileyBiweeklyNextDay === undefined) v.mpBaileyBiweeklyNextDay = curDay + 14;
        return Number(v.tutorial) === 1 && curDay >= 1 && (Number(v.mpQuestBaileyRebellion) || 0) < 8 && curDay >= v.mpBaileyBiweeklyNextDay;
      },
      hint: "贝利站在走廊台阶上，手里捏着一本黑皮账册。",
      icon: "custom:bailey",
      linkText: "去听贝利念这个月的账 (0:15)",
      passage: "MP Bailey Biweekly Tribunal"
    },
    {
      locs: ["Orphanage", "Domus Street", "Barb Street"],
      check: function (v) {
        var curDay = (window.Time && Number.isFinite(Time.days)) ? Time.days : 0;
        return Number(v.tutorial) === 1 && curDay >= 1 && (Number(v.mpQuestBaileyRebellion) || 0) < 8 && (!v.daily || !v.daily.mpQuestBaileyRebellion);
      },
      hint: "贝利办公室外侧的通风铁栅下卡着半张被碎纸机漏掉的旧账页。",
      icon: "custom:bailey",
      linkText: "查看铁栅下的旧账页 (0:16)",
      passage: "MP Quest Bailey Rebellion"
    },
    {
      locs: ["Orphanage"],
      check: function (v) { return (Number(v.mpQuestCellar) || 0) < 7 && (!v.daily || !v.daily.mpQuestCellar) && ((Number(v.mpQuestCellar) || 0) > 0 || ((Number(v.skulduggery) || 0) >= 150 && (getHourNow() >= 19 || getHourNow() < 7))); },
      hint: "走廊尽头通往旧储物室的木门虚掩着，门缝底下透出一丝阴凉的穿堂风。",
      icon: "img/mp/icon_door.gif",
      linkText: "推开旧储物室的木门 (0:06)",
      passage: "MP Quest Orphanage Cellar",
      discoverKey: "cellar",
      questVar: "mpQuestCellar"
    },
    {
      locs: ["Bedroom"],
      check: function (v) { return (Number(v.mpQuestAttic) || 0) < 7 && (!v.daily || !v.daily.mpQuestAttic) && ((Number(v.mpQuestAttic) || 0) > 0 || ((Number(v.skulduggery) || 0) >= 150 && (getHourNow() >= 20 || getHourNow() < 8))); },
      hint: "天花板角落的活板门边垂下一截磨损的麻绳。",
      icon: "img/mp/icon_rope.gif",
      linkText: "拉动阁楼的麻绳 (0:05)",
      passage: "MP Quest Bedroom Attic",
      discoverKey: "attic",
      questVar: "mpQuestAttic"
    },
    {
      locs: ["High Street", "Shopping Centre"],
      check: function (v) { return (getHourNow() >= 8 && getHourNow() < 21) && (Number(v.mpQuestClocktower) || 0) < 7 && (!v.daily || !v.daily.mpQuestClocktower); },
      hint: "钟表旧货铺的玻璃橱窗后亮着一盏昏黄的煤油灯，柜台后摆放着放大镜与天平。",
      icon: "img/misc/icon/shop.png",
      linkText: "推门走进钟表旧货铺 (0:08)",
      passage: "MP Quest HighStreet Clockshop"
    },
    {
      locs: ["Elk Street", "Docks", "Industrial Alleyways"],
      check: function (v) { return ((Number(v.skulduggery) || 0) >= 120 || (Number(v.blackmoney) || 0) > 0 || (Number(v.mpContrabandSealed) || 0) > 0 || isDuskOrNightNow()) && (Number(v.mpQuestSmuggler) || 0) < 7 && (!v.daily || !v.daily.mpQuestSmuggler); },
      hint: "生锈的货运集装箱后方传出低沉的金属叩击声，似乎有人在暗处清点货箱。",
      icon: "img/misc/icon/sneak.png",
      linkText: "绕到集装箱后方查看 (0:07)",
      passage: "MP Quest Docks Smuggler"
    },
    {
      locs: ["School Library"],
      check: function (v) { return (Number(v.mpQuestLibrary) || 0) < 7 && (!v.daily || !v.daily.mpQuestLibrary); },
      hint: "最里侧的旧档案架下有几册没有编号的皮革卷宗。",
      icon: "img/misc/icon/school.png",
      linkText: "抽出最底层的皮革卷宗 (0:10)",
      passage: "MP Quest School Archives"
    },
    {
      locs: ["Temple"],
      check: function (v) { return (Number(v.mpQuestCatacomb) || 0) < 7 && (!v.daily || !v.daily.mpQuestCatacomb) && ((Number(v.mpQuestCatacomb) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "石廊侧壁的烛台底座留有近期被人转动过的刮痕。",
      icon: "img/mp/icon_door.gif",
      linkText: "走近侧廊的旧烛台 (0:06)",
      passage: "MP Quest Temple Catacomb",
      discoverKey: "catacomb",
      questVar: "mpQuestCatacomb"
    },
    {
      locs: ["Sea Rocks", "Beach Cave"],
      check: function (v) { return (Number(v.mpQuestShipwreck) || 0) < 7 && (!v.daily || !v.daily.mpQuestShipwreck); },
      hint: "退潮后的暗礁缝隙间露出一截覆满藤壶的旧船肋木。",
      icon: "img/misc/icon/beach.png",
      linkText: "沿着暗礁走向沉船残骸 (0:12)",
      passage: "MP Quest Beach Shipwreck"
    },
    {
      locs: ["Forest"],
      check: function (v) { return (Number(v.mpQuestManorRuins) || 0) < 7 && (!v.daily || !v.daily.mpQuestManorRuins); },
      hint: "密林深处的荆棘丛后隐约可见半截坍塌的石砌拱门。",
      icon: "img/misc/icon/forest.png",
      linkText: "拨开荆棘走向石拱门 (0:14)",
      passage: "MP Quest Forest Ruins"
    },
    {
      locs: ["Park"],
      check: function (v) { return (Number(v.mpQuestGreenhouse) || 0) < 7 && (!v.daily || !v.daily.mpQuestGreenhouse); },
      hint: "公园偏僻处的旧玻璃花房里飘出一缕清冷的草木甜香。",
      icon: "img/misc/icon/park.png",
      linkText: "走近玻璃花房侧门 (0:07)",
      passage: "MP Quest Park Greenhouse"
    },
    {
      locs: ["Connudatus Street", "Brothel"],
      check: function (v) { return (Number(v.mpQuestVelvet) || 0) < 7 && (!v.daily || !v.daily.mpQuestVelvet) && (isDuskOrNightNow() || (Number(v.mpQuestVelvet) || 0) > 0); },
      hint: "后巷天鹅绒侧门旁的铜铃下挂着一枚暗红色的木牌。",
      icon: "img/misc/icon/brothel.gif",
      linkText: "走近天鹅绒侧门 (0:06)",
      passage: "MP Quest Connudatus Velvet"
    },
    {
      locs: ["Farmland"],
      check: function (v) { return (Number(v.mpQuestMill) || 0) < 7 && (!v.daily || !v.daily.mpQuestMill); },
      hint: "荒废的旧风车磨坊下方传来齿轮缓慢转动的声响。",
      icon: "img/misc/icon/walk.png",
      linkText: "走向旧风车磨坊 (0:12)",
      passage: "MP Quest Farmland Mill"
    },
    {
      locs: ["Sewers"],
      check: function (v) { return (Number(v.mpQuestUnderground) || 0) < 7 && (!v.daily || !v.daily.mpQuestUnderground) && ((Number(v.mpQuestUnderground) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "排水渠拱顶下的石壁上用粉笔画着一个不起眼的三岔记号。",
      icon: "img/mp/icon_door.gif",
      linkText: "顺着粉笔记号探索暗渠 (0:10)",
      passage: "MP Quest Sewers Market",
      discoverKey: "sewers",
      questVar: "mpQuestUnderground"
    },
    {
      locs: ["Danube Street", "MP Region Glasshouse Manor"],
      check: function (v) { return isDuskOrNightNow(); },
      hint: "多瑙河街名流宅邸的雕花铁门与温室连廊间车马往来，隐约传来名流与宴会宾客的交谈声。",
      icon: "img/misc/icon/socialise.png",
      linkText: "走近多瑙河街宅邸圈层 (0:05)",
      passage: "MP Mansion Pool Router"
    },
    {
      locs: ["Danube Street"],
      check: function (v) { return (Number(v.mpQuestDanubeSalon) || 0) < 7 && (!v.daily || !v.daily.mpQuestDanubeSalon) && (getHourNow() >= 14 || (Number(v.mpQuestDanubeSalon) || 0) > 0); },
      hint: "多瑙河街一栋灰白色庄园的侧门内传来低沉的大提琴弦音。",
      icon: "img/misc/icon/socialise.png",
      linkText: "驻足倾听庄园侧门的弦音 (0:04)",
      passage: "MP Grand Quest Danube Salon"
    },
    {
      locs: ["Barb Street", "Police Station"],
      check: function (v) { return (Number(v.mpQuestBarbEvidence) || 0) < 7 && (!v.daily || !v.daily.mpQuestBarbEvidence) && ((Number(v.skulduggery) || 0) >= 100 || isDuskOrNightNow() || (Number(v.mpQuestBarbEvidence) || 0) > 0); },
      hint: "警局后巷的铁栅窗内堆放着几只贴有旧封条的证物木箱。",
      icon: "img/misc/icon/investigate.png",
      linkText: "凑近铁栅窗打量证物箱 (0:05)",
      passage: "MP Grand Quest Barb Evidence"
    },
    {
      locs: ["Cliff Street", "Ocean Breeze"],
      check: function (v) { return (Number(v.mpQuestCliffLighthouse) || 0) < 7 && (!v.daily || !v.daily.mpQuestCliffLighthouse); },
      hint: "峭壁尽头的废弃雾角塔楼下留着一串未干的湿脚印。",
      icon: "img/misc/icon/walk.png",
      linkText: "沿着石阶走向旧雾角塔 (0:08)",
      passage: "MP Grand Quest Cliff Lighthouse"
    },
    {
      locs: ["Starfish Street", "Arcade"],
      check: function (v) { return (Number(v.mpQuestArcadeBasement) || 0) < 7 && (!v.daily || !v.daily.mpQuestArcadeBasement) && ((Number(v.mpQuestArcadeBasement) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "游戏厅最里侧一台黑屏的旧街机后方透出微弱的紫光。",
      icon: "img/mp/icon_door.gif",
      linkText: "查看黑屏街机后方的暗门 (0:05)",
      passage: "MP Grand Quest Arcade Basement",
      discoverKey: "arcade",
      questVar: "mpQuestArcadeBasement"
    },
    {
      locs: ["Nightingale Street", "Hospital Courtyard"],
      check: function (v) { return (Number(v.mpQuestHospitalWing) || 0) < 7 && (!v.daily || !v.daily.mpQuestHospitalWing); },
      hint: "医院旧翼走廊尽头的磨砂玻璃门后传来轻微的仪器滴答声。",
      icon: "img/misc/icon/investigate.png",
      linkText: "推开旧翼走廊的磨砂门 (0:06)",
      passage: "MP Grand Quest Hospital Wing"
    },
    {
      locs: ["Oxford Street", "School Front Courtyard"],
      check: function (v) { return (Number(v.mpQuestSchoolBell) || 0) < 7 && (!v.daily || !v.daily.mpQuestSchoolBell) && ((Number(v.mpQuestSchoolBell) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "教学楼旧钟塔的螺旋铁梯入口处挂着一把松动的铜锁。",
      icon: "img/mp/icon_bell.gif",
      linkText: "推开旧钟塔铁梯的木门 (0:07)",
      passage: "MP Grand Quest School Bell",
      discoverKey: "schoolbell",
      questVar: "mpQuestSchoolBell"
    },
    {
      locs: ["Swimming Pool"],
      check: function (v) { return (Number(v.mpQuestPoolDrain) || 0) < 7 && (!v.daily || !v.daily.mpQuestPoolDrain); },
      hint: "泳池器材室后方的温水循环阀室里冒出阵阵白雾。",
      icon: "img/misc/icon/swim.png",
      linkText: "走进温水阀室查看 (0:06)",
      passage: "MP Grand Quest Pool Drain"
    },
    {
      locs: ["Mer Street", "Docks"],
      check: function (v) { return (Number(v.mpQuestMerDrydock) || 0) < 7 && (!v.daily || !v.daily.mpQuestMerDrydock) && (isDuskOrNightNow() || (Number(v.mpQuestMerDrydock) || 0) > 0); },
      hint: "三号干船坞的防雨帆布下停泊着一艘没有悬挂船旗的双桅帆船。",
      icon: "img/misc/icon/sneak.png",
      linkText: "掀开干船坞的帆布一角 (0:08)",
      passage: "MP Grand Quest Mer Drydock"
    },
    {
      locs: ["Elk Street", "Adult Shop"],
      check: function (v) { return (Number(v.mpQuestElkWorkshop) || 0) < 7 && (!v.daily || !v.daily.mpQuestElkWorkshop) && ((Number(v.mpQuestElkWorkshop) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "成人店后巷的地下工坊排气扇里飘出皮革与金属抛光膏的气息。",
      icon: "img/mp/icon_door.gif",
      linkText: "敲响地下工坊的铁门 (0:05)",
      passage: "MP Grand Quest Elk Workshop",
      discoverKey: "elk",
      questVar: "mpQuestElkWorkshop"
    },
    {
      locs: ["Harvest Street", "Pub"],
      check: function (v) { return (Number(v.mpQuestHarvestCellar) || 0) < 7 && (!v.daily || !v.daily.mpQuestHarvestCellar) && ((Number(v.mpQuestHarvestCellar) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "酒馆后院橡木酒桶下方的地窖铁环被人拉开了半寸。",
      icon: "img/mp/icon_cellar.gif",
      linkText: "拉起橡木桶旁的地窖铁环 (0:06)",
      passage: "MP Grand Quest Harvest Cellar",
      discoverKey: "harvest",
      questVar: "mpQuestHarvestCellar"
    },
    {
      locs: ["Residential Alleyways"],
      check: function (v) { return (Number(v.mpQuestAlleyShelter) || 0) < 7 && (!v.daily || !v.daily.mpQuestAlleyShelter); },
      hint: "住宅区小巷的砖墙夹缝里搭着一处用旧帆布遮蔽的避风棚。",
      icon: "img/misc/icon/walk.png",
      linkText: "拨开旧帆布查看避风棚 (0:05)",
      passage: "MP Grand Quest Alley Shelter"
    },
    {
      locs: ["Industrial Alleyways"],
      check: function (v) { return (Number(v.mpQuestFoundry) || 0) < 7 && (!v.daily || !v.daily.mpQuestFoundry); },
      hint: "停工的旧铸造厂烟囱下仍残留着未熄灭的暗红炭火。",
      icon: "img/misc/icon/investigate.png",
      linkText: "潜入旧铸造厂侧门 (0:09)",
      passage: "MP Grand Quest Foundry"
    },
    {
      locs: ["Garden"],
      check: function (v) { return (Number(v.mpQuestGardenWell) || 0) < 7 && (!v.daily || !v.daily.mpQuestGardenWell) && ((Number(v.mpQuestGardenWell) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "孤儿院花园角落被常春藤覆盖的枯井壁上嵌着几枚生锈的铁脚蹬。",
      icon: "img/mp/icon_cellar.gif",
      linkText: "拨开常春藤探看枯井 (0:06)",
      passage: "MP Grand Quest Garden Well",
      discoverKey: "gardenwell",
      questVar: "mpQuestGardenWell"
    },
    {
      locs: ["Bathroom"],
      check: function (v) { return (Number(v.mpQuestBathPipe) || 0) < 7 && (!v.daily || !v.daily.mpQuestBathPipe) && ((Number(v.mpQuestBathPipe) || 0) > 0 || (Number(v.skulduggery) || 0) >= 150); },
      hint: "浴室黄铜热水管后方的瓷砖有一块松动脱落。",
      icon: "img/mp/icon_door.gif",
      linkText: "挪开松动的浴室瓷砖 (0:04)",
      passage: "MP Grand Quest Bath Pipe",
      discoverKey: "bathpipe",
      questVar: "mpQuestBathPipe"
    },
    {
      locs: ["Beach Cave"],
      check: function (v) { return (Number(v.mpQuestGrottoPearl) || 0) < 7 && (!v.daily || !v.daily.mpQuestGrottoPearl); },
      hint: "海蚀洞深处的潮汐水潭底闪烁着幽蓝色的磷光。",
      icon: "img/misc/icon/swim.png",
      linkText: "沿着潮汐水潭向内涉水 (0:12)",
      passage: "MP Grand Quest Grotto Pearl"
    },
    {
      locs: ["Deep Forest", "Wolf Cave"],
      check: function (v) { return (Number(v.mpQuestMoonAltar) || 0) < 7 && (!v.daily || !v.daily.mpQuestMoonAltar); },
      hint: "深林古树环绕的空地中央立着一座布满苔藓的月牙石台。",
      icon: "img/misc/icon/forest.png",
      linkText: "走上布满苔藓的月牙石台 (0:10)",
      passage: "MP Grand Quest Moon Altar"
    },
    {
      locs: ["Orphanage", "High Street", "Temple", "Docks"],
      check: function (v) {
        var stg = Number(v.mpMainStoryEclipse) || 0;
        var hasClue = stg > 0 || (Number(v.mpQuestCellar) || 0) >= 1 || (Number(v.mpQuestClocktower) || 0) >= 1 || (Number(v.mpQuestCatacomb) || 0) >= 1;
        return hasClue && stg < 12 && (!v.daily || !v.daily.mpMainStoryEclipse);
      },
      hint: "石墙与铜柱的交界处留着一枚新近刻下的新月水波纹记号。",
      icon: "img/misc/icon/investigate.png",
      linkText: "顺着新月水波纹记号查探 (0:12)",
      passage: "MP Main Story Eclipse Hub"
    },
    {
      locs: ["High Street", "School Library", "Forest", "Beach", "Sewers", "Elk Street"],
      check: function (v) {
        var hasFrag = (Number(v.mpFragCrownGear) || 0) > 0 || (Number(v.mpFragAbyssPage) || 0) > 0 || (Number(v.mpFragSmugglerRing) || 0) > 0 || (Number(v.mpFragBrideFlower) || 0) > 0 || (Number(v.mpFragVelvetCrest) || 0) > 0 || (Number(v.mpFragLedgerKey) || 0) > 0;
        return hasFrag && (Number(v.mpCollectHubUnlocked) || 0) < 6;
      },
      hint: "随身携带的旧残片在靠近街角暗格时发出了轻微的共鸣。",
      icon: "img/misc/icon/sneak.png",
      linkText: "拼合随身携带的残片线索 (0:06)",
      passage: "MP Collection Quests Hub"
    }
  ];

  var NEW_WORLD_REGIONS = [
    {
      locs: ["Sea Rocks", "Docks"],
      key: "foghorn",
      discoverCond: function (v) { return (Number(v.mpQuestShipwreck) || 0) >= 1 || (Number(v.mpQuestCliffLighthouse) || 0) >= 1 || (Number(v.mpMainStoryEclipse) || 0) >= 1; },
      hint: "暗礁外侧的铁环上系着一叶旧木舟，海雾尽头隐约浮现出雾角灯塔岛的轮廓。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["foghorn"]); },
      icon: "img/misc/icon/beach.png",
      linkText: "划向灯塔岛 (0:18)",
      passage: "MP Region Foghorn Island"
    },
    {
      locs: ["High Street", "Sewers"],
      key: "clockwork",
      discoverCond: function (v) { return (Number(v.mpQuestClocktower) || 0) >= 1 || (Number(v.skulduggery) || 0) >= 150; },
      hint: "旧钟塔基座后方的排水铁栅松动着，下方露出带有黄铜齿轮刻痕的石阶。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["clockwork"]); },
      icon: "img/misc/icon/investigate.png",
      linkText: "下潜钟塔 (0:10)",
      passage: "MP Region Clockwork Undercity"
    },
    {
      locs: ["Temple", "Forest"],
      key: "abbey",
      discoverCond: function (v) { return (Number(v.mpQuestCatacomb) || 0) >= 1 || (Number(v.mpQuestManorRuins) || 0) >= 1; },
      hint: "坍塌的石廊拱门后方延伸出一段覆满青苔的古老旋梯。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["abbey"]); },
      icon: "img/misc/icon/temple.png",
      linkText: "走下修道院 (0:12)",
      passage: "MP Region Sunken Abbey"
    },
    {
      locs: ["Danube Street", "Park"],
      key: "glasshouse",
      discoverCond: function (v) { return (Number(v.mpQuestGreenhouse) || 0) >= 1 || (Number(v.mpQuestDanubeSalon) || 0) >= 1; },
      hint: "高耸的冬青树篱后方藏着一扇半掩的铸铁雕花小门，门内水雾氤氲。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["glasshouse"]); },
      icon: "img/misc/icon/park.png",
      linkText: "进入温室 (0:08)",
      passage: "MP Region Glasshouse Manor"
    },
    {
      locs: ["Elk Street", "Industrial Alleyways"],
      key: "blackiron",
      discoverCond: function (v) { return (Number(v.skulduggery) || 0) >= 100 || (Number(v.mpContrabandSealed) || 0) > 0; },
      hint: "生锈的货运铁轨穿过坍塌的砖墙，通向废弃的黑铁调车场。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["blackiron"]); },
      icon: "img/misc/icon/sneak.png",
      linkText: "潜入货站 (0:09)",
      passage: "MP Region Blackiron Yard"
    },
    {
      locs: ["Deep Forest", "Farmland"],
      key: "druid",
      discoverCond: function (v) { return (Number(v.mpQuestMoonAltar) || 0) >= 1 || (Number(v.mpQuestMill) || 0) >= 1; },
      hint: "古木交错的迷雾深处立着一圈高大的风化石柱，林间回荡着低沉的风鸣。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["druid"]); },
      icon: "img/misc/icon/forest.png",
      linkText: "走向石环 (0:14)",
      passage: "MP Region Druid Circle"
    },
    {
      locs: ["Connudatus Street", "Cliff Street"],
      key: "velvet",
      discoverCond: function (v) { return (Number(v.mpQuestVelvet) || 0) >= 1 || (Number(v.promiscuity) || 0) >= 35; },
      hint: "悬崖廊柱下的天鹅绒侧门半掩着，门内飘出低柔的大提琴与暖香。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["velvet"]); },
      icon: "img/misc/icon/brothel.gif",
      linkText: "进入暗层 (0:07)",
      passage: "MP Region Velvet Mirage"
    },
    {
      locs: ["School Library", "Hallways"],
      key: "observatory",
      discoverCond: function (v) { return (Number(v.mpQuestLibrary) || 0) >= 1 || (Number(v.mpQuestSchoolBell) || 0) >= 1; },
      hint: "古籍架侧面的木制暗门虚掩着，后方连廊直通旧学园天文翼楼。",
      check: function (v) { return !!(v.mpDiscovered && v.mpDiscovered["observatory"]); },
      icon: "img/misc/icon/school.png",
      linkText: "登上天文翼 (0:08)",
      passage: "MP Region Observatory Wing"
    }
  ];

  var NEW_WORLD_NPCS = [
    {
      key: "sera",
      name: "塞拉",
      title: "高街钟表与古物修缮师",
      locs: ["High Street", "Shopping Centre"],
      hours: [8, 21],
      hint: function (v, met) { return met ? "钟表旧货铺的玻璃柜台后，塞拉正戴着单眼放大镜擦拭一枚精密的黄铜发条。" : "钟表旧货铺的玻璃柜台后，一个戴单眼放大镜的人正擦拭一枚精密的黄铜发条。"; },
      icon: "img/misc/icon/shop.png",
      linkText: function (v, met) { return met ? "与塞拉交谈 (0:04)" : "与修表师搭话 (0:04)"; },
      passage: "MP NPC Sera Hub"
    },
    {
      key: "vesper",
      name: "维斯",
      title: "旧港区夜航船长",
      locs: ["Docks", "Elk Street", "Mer Street"],
      hours: [17, 6],
      hint: function (v, met) { return met ? "防波堤栈桥边的阴影里，维斯正靠在锚链旁擦拭手里的铜质怀表。" : "防波堤栈桥边的阴影里，一个拎着铜怀表的人正靠在锚链旁。"; },
      icon: "img/misc/icon/sneak.png",
      linkText: function (v, met) { return met ? "走近维斯 (0:04)" : "走近栈桥边的人 (0:04)"; },
      passage: "MP NPC Vesper Hub"
    },
    {
      key: "noel",
      name: "诺艾尔",
      title: "学园植物标本学徒",
      locs: ["School Library", "Hallways", "Park"],
      hours: [7, 20],
      hint: function (v, met) { return met ? "诺艾尔正站在安静的角落里翻阅一册夹满干花标本的笔记。" : "安静的角落里，一个抱着干花标本册的学生正低头翻页。"; },
      icon: "img/misc/icon/school.png",
      linkText: function (v, met) { return met ? "与诺艾尔搭话 (0:03)" : "与翻标本册的学生搭话 (0:03)"; },
      passage: "MP NPC Noel Hub"
    },
    {
      key: "lin",
      name: "林恩",
      title: "宅邸街守夜人",
      locs: ["Domus Street", "Orphanage", "Barb Street", "Pub"],
      hours: [16, 7],
      hint: function (v, met) { return met ? "缠着旧绷带的林恩正靠在街角路灯下活动着手腕关节。" : "街角路灯下，一个缠着旧绷带的人正活动着手腕关节。"; },
      icon: "img/misc/icon/socialise.png",
      linkText: function (v, met) { return met ? "走近林恩 (0:04)" : "走近路灯下的人 (0:04)"; },
      passage: "MP NPC Lin Hub"
    },
    {
      key: "monet",
      name: "莫奈",
      title: "天鹅绒画师与裁缝",
      locs: ["Connudatus Street", "Cliff Street", "Ocean Breeze"],
      hours: [10, 23],
      hint: function (v, met) { return met ? "手持素描本的莫奈正站在廊檐下，目光穿过人群落向你这边。" : "廊檐下，一个手持素描本的人正望着人群。"; },
      icon: "img/misc/icon/socialise.png",
      linkText: function (v, met) { return met ? "走向莫奈 (0:04)" : "走向廊檐下的画师 (0:04)"; },
      passage: "MP NPC Monet Hub"
    },
    {
      key: "ash",
      name: "阿什",
      title: "林间与古墓守灯人",
      locs: ["Forest", "Temple", "Sewers"],
      hours: [6, 23],
      hint: function (v, met) { return met ? "提着防风油灯的阿什正站在石径旁，替脚边的猎犬解开荆棘。" : "石径旁，一个提着防风油灯的人正替脚边的猎犬解开荆棘。"; },
      icon: "img/misc/icon/forest.png",
      linkText: function (v, met) { return met ? "走近阿什 (0:05)" : "走近提灯的人 (0:05)"; },
      passage: "MP NPC Ash Hub"
    }
  ];

  var SIDE_HUB_HOOKS = [
    {
      locs: ["High Street"],
      check: function (v) { return true; },
      hint: "布告栏最下面一排新钉了几张手写纸条，纸角被雨泡得发皱。",
      icon: "img/misc/icon/investigate.png",
      linkText: "看看布告栏上的零碎消息 (0:03)",
      passage: "MP Town Side Stories Hub"
    },
    {
      locs: ["Park"],
      check: function (v) { return true; },
      hint: "公园北角的猎人行会木牌上钉着几张手绘地图，边角用不同绳结系着。",
      icon: "img/misc/icon/forest.png",
      linkText: "看看猎人行会的木牌 (0:03)",
      passage: "MP Wild Side Stories Hub"
    }
  ];

  // 深区入口：不再用一张「深区名录」把三处地方一次性摊开，
  // 只在对应街区走到、并且已经有人提过之后，才在页面上浮出一处入口。
  var DEEP_HUB_HOOKS = [
    {
      key: "docks",
      noDiscover: true,
      locs: ["Docks", "Sea Rocks"],
      check: function (v) {
        return true;
      },
      hint: "防波堤尽头的石砌海图亭亮着灯，门缝里漏出羊皮纸和铜钉的气味。",
      icon: "img/misc/icon/investigate.png",
      linkText: "走进海图亭 (0:05)",
      passage: "MP Deep Locations Directory"
    },
    {
      key: "temple",
      noDiscover: true,
      locs: ["Temple", "Temple Garden"],
      check: function (v) {
        return true;
      },
      hint: "长明灯下的老修士提起地砖底下的暗渠，声音压得比诵经还低。",
      icon: "img/misc/icon/temple.png",
      linkText: "随老修士看铜牌 (0:06)",
      passage: "MP Loc Temple Hub"
    },
    {
      key: "highstreet",
      noDiscover: true,
      locs: ["High Street"],
      check: function (v) {
        return true;
      },
      hint: "行会拱门上的齿轮与麦穗徽记被人擦得发亮，门内传来翻账页的窸窣声。",
      icon: "img/misc/icon/shop.png",
      linkText: "穿过行会拱门 (0:05)",
      passage: "MP Loc HighStreet Hub"
    },
    {
      key: "forest",
      noDiscover: true,
      locs: ["Forest"],
      check: function (v) {
        return true;
      },
      hint: "林缘那块被苔藓啃去半边的老界石上钉着守林人的铜牌，三根褪色布条正随北风轻晃。",
      icon: "img/misc/icon/forest.png",
      linkText: "走近界石看铜牌 (0:05)",
      passage: "MP Loc Forest Hub"
    },
    {
      key: "school",
      noDiscover: true,
      locs: ["School"],
      check: function (v) {
        // 走到校门就能看到旧馆启事：不再要求已注册/已见学生的硬条件，
        // 否则新档或刚入学的玩家在原生 School 页完全看不到入口。
        return true;
      },
      hint: "校门边的布告栏新贴了一张手写启事，几名同学在走廊里低声说着旧馆缺人手的事。",
      icon: "img/misc/icon/school.png",
      linkText: "去旧馆看看 (0:05)",
      passage: "MP Loc School Hub"
    }
  ];

  var LIVELIHOOD_HOOKS = [
    {
      locs: ["Ocean Breeze"],
      hours: [7, 21],
      check: function (v) { return true; },
      hint: "海风咖啡馆后门的排班表还留着空位，门缝里飘出烤面包和咖啡的香气。",
      icon: "img/misc/icon/shop.png",
      linkText: "去咖啡馆上工 (0:05)",
      passage: "MP Job Cafe"
    },
    {
      locs: ["Docks"],
      check: function (v) { return true; },
      hint: "鱼档把一筐碎冰拖到栈桥边，鱼贩正朝礁石方向张望。",
      icon: "img/misc/icon/beach.png",
      linkText: "去鱼档上工 (0:05)",
      passage: "MP Job Fish"
    },
    {
      locs: ["Spa"],
      hours: [8, 22],
      check: function (v) { return true; },
      hint: "温泉桑拿的前台把一块写着「招临时帮工」的木牌摆到了门口。",
      icon: "img/misc/icon/temple.png",
      linkText: "去桑拿上工 (0:05)",
      passage: "MP Job Spa"
    },
    {
      locs: ["Farmland"],
      hours: [6, 20],
      check: function (v) { return true; },
      hint: "农场谷仓门口的活计牌还挂着，远处传来拖拉机的闷响。",
      icon: "img/misc/icon/forest.png",
      linkText: "去农场上工 (0:05)",
      passage: "MP Job Farm"
    },
    {
      locs: ["High Street"],
      hours: [8, 21],
      check: function (v) { return true; },
      hint: "钟表铺的招工牌翻到了正面，橱窗里的座钟正指到整点。",
      icon: "img/misc/icon/shop.png",
      linkText: "去钟表铺上工 (0:05)",
      passage: "MP Job Clock"
    },
    {
      locs: ["Orphanage"],
      hours: [6, 22],
      check: function (v) { return true; },
      hint: "浆洗房的管事站在走廊里点人手，门后传来熨斗压过布面的声响。",
      icon: "img/misc/icon/socialise.png",
      linkText: "去浆洗房上工 (0:05)",
      passage: "MP Job Laundry"
    },
    {
      locs: ["Harvest Street"],
      hours: [6, 19],
      check: function (v) { return true; },
      hint: "街角石炉面包房的木窗飘出焦香麦气，门边挂着早班招工牌。",
      icon: "img/misc/icon/shop.png",
      linkText: "去面包房上工 (0:05)",
      passage: "MP Job Bakery"
    },
    {
      locs: ["High Street"],
      hours: [8, 20],
      check: function (v) { return true; },
      hint: "高街裁缝铺的橱窗旁立着改衣帮工木牌，里头传来踏板缝纫机的轻响。",
      icon: "img/misc/icon/shop.png",
      linkText: "去裁缝铺上工 (0:05)",
      passage: "MP Job Tailor"
    },
    {
      locs: ["Connudatus Street"],
      hours: [7, 21],
      check: function (v) { return true; },
      hint: "街口邮政代办亭挂出了急件派送木牌，老邮差正在分拣牛皮纸信袋。",
      icon: "img/misc/icon/Town_hall.png",
      linkText: "去代办亭跑腿 (0:05)",
      passage: "MP Job Courier"
    },
    {
      locs: ["Pub"],
      hours: [10, 23],
      check: function (v) { return true; },
      hint: "酒馆后厨的摆门后飘出烤肋排与麦酒的香气，厨娘正招手找帮工。",
      icon: "img/misc/icon/pub.png",
      linkText: "去酒馆后厨帮工 (0:05)",
      passage: "MP Job PubKitchen"
    },
    {
      locs: ["Farmland"],
      hours: [6, 20],
      check: function (v) { return true; },
      hint: "河湾马厩的木栏边停着装满谷袋的四轮板车，车夫老伯正在刷马蹄。",
      icon: "img/misc/icon/forest.png",
      linkText: "去马厩帮工 (0:05)",
      passage: "MP Job Stable"
    },
    {
      locs: ["Docks"],
      hours: [6, 21],
      check: function (v) { return true; },
      hint: "三号防波堤下的单桅拖网渔船冒着白烟，老船老大正在甲板边点水手。",
      icon: "img/misc/icon/beach.png",
      linkText: "去拖网渔船上工 (0:05)",
      passage: "MP Job Trawler"
    }
  ];

  var JOB_NPC_HOOKS = [
    {
      locs: ["Docks", "Sea Rocks"],
      check: function (v) { return (Number(v.mpJobFishLevel) || 0) >= 2 && (Number(v.mpJoblineGwylan) || 0) < 4; },
      hint: "格威岚在鱼档后面补一张被割破的网，手边压着一卷新网线。",
      icon: "img/misc/icon/beach.png",
      linkText: "去鱼档看看格威岚 (0:04)",
      passage: "MP Jobline Gwylan 1",
      passageFor: function (v) { var s = Number(v.mpJoblineGwylan) || 0; return s >= 3 ? "MP Jobline Gwylan 3" : s >= 2 ? "MP Jobline Gwylan 2" : "MP Jobline Gwylan 1"; }
    },
    {
      locs: ["High Street"],
      hours: [8, 21],
      check: function (v) { return (Number(v.mpJobClockLevel) || 0) >= 2 && (Number(v.mpJoblineSera) || 0) < 4; },
      hint: "塞拉把一只没有主人的银壳怀表推到柜台边，表盖内侧刻着字。",
      icon: "img/misc/icon/shop.png",
      linkText: "问塞拉那只怀表 (0:04)",
      passage: "MP Jobline Sera 1",
      passageFor: function (v) { var s = Number(v.mpJoblineSera) || 0; return s >= 3 ? "MP Jobline Sera 3" : s >= 2 ? "MP Jobline Sera 2" : "MP Jobline Sera 1"; }
    },
    {
      locs: ["Farmland"],
      check: function (v) { return (Number(v.mpJobFarmLevel) || 0) >= 2 && (Number(v.mpJoblineAlex) || 0) < 4; },
      hint: "Alex 在谷仓梁上翻一叠发黄的佃租收据，铁锹靠在门边。",
      icon: "img/misc/icon/forest.png",
      linkText: "去谷仓找 Alex (0:04)",
      passage: "MP Jobline Alex 1",
      passageFor: function (v) { var s = Number(v.mpJoblineAlex) || 0; return s >= 3 ? "MP Jobline Alex 3" : s >= 2 ? "MP Jobline Alex 2" : "MP Jobline Alex 1"; }
    },
    {
      locs: ["Spa"],
      check: function (v) { return (Number(v.mpJobSpaLevel) || 0) >= 2 && (Number(v.mpJoblineJordan) || 0) < 4; },
      hint: "约旦在池边捡起一张被蒸汽浸软的祷词卡，眉头没有松开。",
      icon: "img/misc/icon/temple.png",
      linkText: "去池边找约旦 (0:04)",
      passage: "MP Jobline Jordan 1",
      passageFor: function (v) { var s = Number(v.mpJoblineJordan) || 0; return s >= 3 ? "MP Jobline Jordan 3" : s >= 2 ? "MP Jobline Jordan 2" : "MP Jobline Jordan 1"; }
    },
    {
      locs: ["Orphanage"],
      check: function (v) { return npcMetName("Robin") && (Number(v.mpJobLaundryLevel) || 0) >= 2 && (Number(v.mpJoblineRobin) || 0) < 4; },
      hint: "罗宾从洗衣篮底下抽出一件绣着陌生字母的白衬衫，朝走廊看了一眼。",
      icon: "img/misc/icon/socialise.png",
      linkText: "去洗衣房找罗宾 (0:04)",
      passage: "MP Jobline Robin 1",
      passageFor: function (v) { var s = Number(v.mpJoblineRobin) || 0; return s >= 3 ? "MP Jobline Robin 3" : s >= 2 ? "MP Jobline Robin 2" : "MP Jobline Robin 1"; }
    }
  ];

  // 街头随机小事：只在这些街区出现，每件事每天最多一次。
  var RANDOM_STREET_EVENTS = [
    {
      key: "cargo",
      dailyKey: "mpStreetCargo",
      locs: ["High Street", "Docks", "Elk Street", "Domus Street"],
      hint: "一名脚夫的手推车卡进石缝，几只木箱歪倒在路中央。",
      icon: "data:image/gif;base64,R0lGODlhHgAeAIcAAAAAAP8A/6hsPi0kOOLQrPrw1v/ojNSaZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJDAAAACwAAAAAHgAeAAAImQABCBxIsKDBgwgTKlzIsKHDhxAjSpxI0eGAARQvatRIoMDGjQwHCDhAkqSBkwYEqFyJcaHIlSpRGihJUkBLhS9hyoSp8mbCnDA78uwZcqgAoUN9IgS6EilPpQeZqnQKE6rBjxw9YrVaUOrRAka5EvRKlWXRoWWJujSa1uZZnm3FDiQLNunboHWfhtzacatcnH8rCh5MuDDCgAAh+QQJDAAAACwGAAcAEgATAIcAAAD/AP+obD4tJDji0Kz68Nb/6IzUmmYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIbAABCBwocMAAggQNKlRIoMDChwIiShTQcKJEgxYjVsyI8YBHjwZCGuA4IKNIAx89CsBo8STJjBQLwGRpcaPFhwsb4lQI0+ZEmhN9XiyZUWhEoBKNriRaU+bLok5vMg0a9efOATp3IhxocKvAgAAh+QQJDAAAACwGAAcAEgATAIcAAAD/AP+obD4tJDji0Kz68Nb/6IzUmmYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIbgABCBwocMAAggQNKlRIoMDChwIiShTQcKJEgxYjVsyIMeNGix0tfpyI8YBJkwZSGuA4IKNKAydNCggp8SXLhwYb4lSYkWKBnjQljrzY0uNPlj2HRgyq8SjIoiKdkoQ6UenMnQN07kQ40CBXgQEBACH5BAkMAAAALAYABwASABMAhwAAAP8A/6hsPi0kOOLQrPrw1v/ojNSaZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhqAAEIHChwwACCBA0qVEigwMKHAiJKFNBwokSDFiNWzIgx40aLHS1+nBhy4siLAzJSLKAS44GXLw3INMDxocGZBmC+VJgRZ02VJyOWlBhUwFCNLH96TAoy5dKWTkUyJWnTYMOqBxEWzKo1IAAh+QQJDAAAACwGAAcAEgATAIcAAAD/AP+obD4tJDji0Kz68Nb/6IzUmmYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIbgABCBwocMAAggQNKlRIoMDChwIiShTQcKJEgxYjVsyIMeNGix0tfpwYcuLIiwMyUiygsqTEkxEfLmwoU6GAAzhxGthpgGNKizwN5MQpwKWAoD5Vwiz6UyTLpB6fgmxqUirJmgNo1kQ40CBXgQEBACH5BAkMAAAALAYABwASABMAhwAAAP8A/6hsPi0kOOLQrPrw1v/ojNSaZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhsAAEIHChwwACCBA0qVEigwMKHAiJKFNBwokSDFiNWzIgx40aLHS1+nBhy4siLAzJSLKCypMSTER8ubChToUqYAlxqZMkx5YGfPw0INdAz41ADQH/mTGnxaFGPPEEyFRmVZM0BNGsiHGhwq8CAADs=",
      linkText: "上前搭把手",
      passage: "MP Street Event Cargo"
    },
    {
      key: "work",
      dailyKey: "mpStreetWork",
      hours: [7, 20],
      locs: ["High Street", "Docks", "Elk Street", "Domus Street"],
      hint: "一个背着旧行囊的陌生人正四处打听哪里能找到活计。",
      icon: "data:image/gif;base64,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",
      linkText: "替他指条路",
      passage: "MP Street Event Dayhire"
    },
    {
      key: "busker",
      dailyKey: "mpStreetBusker",
      hours: [9, 22],
      locs: ["High Street", "Park", "Docks", "Domus Street"],
      hint: "街角的旧琴声断断续续，琴盒里落着几枚零散的铜板。",
      icon: "data:image/gif;base64,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",
      linkText: "听街头卖艺",
      passage: "MP Street Event Busker"
    },
    {
      key: "purse",
      dailyKey: "mpStreetPurse",
      locs: ["High Street", "Docks", "Elk Street", "Domus Street", "Park"],
      hint: "石阶旁的排水口边躺着一只鼓囊囊的旧皮钱袋。",
      icon: "data:image/gif;base64,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",
      linkText: "看看地上钱袋",
      passage: "MP Street Event Purse"
    },
    {
      key: "tea",
      dailyKey: "mpStreetTea",
      hours: [7, 21],
      locs: ["High Street", "Docks", "Park", "Domus Street"],
      hint: "路边的小推车冒着白汽，摊主正往纸杯里舀茶汤。",
      icon: "data:image/gif;base64,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",
      linkText: "看看茶摊",
      passage: "MP Street Event Tea"
    },
    {
      key: "child",
      dailyKey: "mpStreetChild",
      hours: [8, 20],
      locs: ["High Street", "Park", "Domus Street", "Docks"],
      hint: "一个孩子站在人群边上，攥着衣角四处张望。",
      icon: "data:image/gif;base64,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",
      linkText: "问问走丢孩子",
      passage: "MP Street Event Child"
    },
    {
      key: "food",
      dailyKey: "mpStreetFood",
      hours: [7, 22],
      locs: ["High Street", "Docks", "Elk Street", "Domus Street"],
      hint: "街边摊子飘来油脂和香料的气味，勾得人脚步发慢。",
      icon: "data:image/gif;base64,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",
      linkText: "闻闻街边小吃",
      passage: "MP Street Event Food"
    },
    {
      key: "letter",
      dailyKey: "mpStreetLetter",
      locs: ["High Street", "Docks", "Elk Street", "Domus Street"],
      hint: "一名信使的邮袋搭扣松了，几封火漆信从袋边滑落。",
      icon: "data:image/gif;base64,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",
      linkText: "看看掉落信件",
      passage: "MP Street Event Letter"
    }
  ];

  function isNpcInScheduleHour(npcEntry) {
    if (!npcEntry || !Array.isArray(npcEntry.hours)) return true;
    var h = getHourNow();
    var start = npcEntry.hours[0], end = npcEntry.hours[1];
    // 与 NPC Hub 的 _open 条件保持一致：区间是 [start, end)，收盘小时不计入。
    if (start <= end) return h >= start && h < end;
    return h >= start || h < end;
  }

  function isVanillaEventPage(v) {
    try {
      if (v && Number(v.eventskip) === 1) return false;
      if (v && v.eventforced) return true;
      if (typeof window.dangerEvent === "function") return !!window.dangerEvent();
    } catch (e) {}
    return false;
  }

  function injectWorldAndCompanionNodes(host, pas, v) {
    if (!host || !pas || !v || v.combat === 1) return;
    // 第一次出门的教程遭遇战优先，任何 mod 入口都不要抢在它前面。
    if (Number(v.tutorial) === 0 && !v.debug) return;
    if (SAFE_PASSAGES.indexOf(pas) < 0 || pas === HUB || pas === BEDROOM) return;
    // 原版随机事件正在本页展开时，绝不在选项下面再塞入口，否则等于给玩家一条跳过事件的路。
    if (isVanillaEventPage(v)) return;

    var oldWorldBox = document.getElementById("mp-world-organic-box");
    if (oldWorldBox && oldWorldBox.parentNode) oldWorldBox.parentNode.removeChild(oldWorldBox);
    var oldRegionBox = document.getElementById("mp-region-links-box");
    if (oldRegionBox && oldRegionBox.parentNode) oldRegionBox.parentNode.removeChild(oldRegionBox);

    var container = el("div", { id: "mp-world-organic-box", style: "margin:6px 0;" });
    var regionBox = el("div", { id: "mp-region-links-box", style: "margin:6px 0;" });
    var hasAny = false;

    // 1. 房间同伴识别与在线/离线无缝替换：
    // 若该玩家当前在线（通过 playerUid 或同名识别），直接由在线玩家替代离线 NPC，绝不重复出现两个分身！
    syncCompanionToVariables();
    var comp = v.mpCompanion;
    var onlinePeer = findOnlineCompanionPeer();
    if (comp && !onlinePeer && Array.isArray(comp.activeLocations) && comp.activeLocations.indexOf(pas) >= 0) {
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
      var compP = el("div", { style: "margin:4px 0;" });
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
      compLink.appendChild(document.createTextNode("走近" + cName + " (0:03)"));
      compP.appendChild(compLink);
      container.appendChild(compP);
    }

    // 2. 常驻镇民 NPC（按各自作息时间段自然出没，每场景最多出现 1 位）
    if (!v.mpNpcs) {
      v.mpNpcs = {
        sera: { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 },
        vesper: { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 },
        noel: { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 },
        lin: { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 },
        monet: { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 },
        ash: { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 }
      };
    }
    for (var ni = 0; ni < NEW_WORLD_NPCS.length; ni++) {
      var nItem = NEW_WORLD_NPCS[ni];
      if (nItem.locs.indexOf(pas) >= 0 && pas !== nItem.passage && isNpcInScheduleHour(nItem)) {
        hasAny = true;
        var nRow = el("div", { style: "margin:4px 0;" });
        var npcEntryVars = (v.mpNpcs && v.mpNpcs[nItem.key]) || null;
        var npcMet = !!(npcEntryVars && npcEntryVars.hasMet);
        var npcHintText = typeof nItem.hint === "function" ? nItem.hint(v, npcMet) : nItem.hint;
        var npcLinkText = typeof nItem.linkText === "function" ? nItem.linkText(v, npcMet) : nItem.linkText;
        nRow.appendChild(el("span", { text: npcHintText + " " }));
        (function (npcEntry) {
          var nLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              if (v.mpNpcs && v.mpNpcs[npcEntry.key]) {
                v.mpNpcs[npcEntry.key].firstMeet = !v.mpNpcs[npcEntry.key].hasMet;
                v.mpNpcs[npcEntry.key].hasMet = 1;
              }
              enginePlay(npcEntry.passage);
            }
          });
          nLink.appendChild(dolIconImg(npcEntry.icon));
          nLink.appendChild(document.createTextNode(npcLinkText));
          nRow.appendChild(nLink);
        })(nItem);
        container.appendChild(nRow);
        break;
      }
    }

    // 3. 连通的新探索区域入口（仅在满足前置线索或时段条件时自然浮现，每场景最多 1 处）
    if (!v.mpDiscovered) v.mpDiscovered = {};
    var _npcRegion = { sera: "clockwork", vesper: "foghorn", noel: "observatory", lin: "abbey", monet: "velvet", ash: "druid" };
    for (var _nk in _npcRegion) {
      if (v.mpNpcs && v.mpNpcs[_nk] && v.mpNpcs[_nk].hasMet) v.mpDiscovered[_npcRegion[_nk]] = 1;
    }
    if (v.mpKnown) {
      var _knowRegion = { foghorn: "foghorn", clockwork: "clockwork", abbey: "abbey", glasshouse: "glasshouse", blackiron: "blackiron", druid: "druid", velvet: "velvet", observatory: "observatory" };
      for (var _mk in v.mpKnown) {
        for (var _rk in _knowRegion) {
          if (String(_mk).indexOf(_rk) === 0) v.mpDiscovered[_knowRegion[_rk]] = 1;
        }
      }
    }
    for (var ri = 0; ri < NEW_WORLD_REGIONS.length; ri++) {
      var rItem = NEW_WORLD_REGIONS[ri];
      if (rItem.locs.indexOf(pas) < 0) continue;
      if (!v.mpDiscovered[rItem.key] && rItem.discoverCond && rItem.discoverCond(v)) {
        v.mpDiscovered[rItem.key] = 1;
      }
      if (!v.mpDiscovered[rItem.key] && !(v.daily && v.daily.mpRegionAccident) && Math.random() < 0.12) {
        v.mpDiscovered[rItem.key] = 1;
        if (!v.daily) v.daily = {};
        v.daily.mpRegionAccident = 1;
      }
      if (rItem.check && !rItem.check(v)) continue;
      {
        (function (regEntry) {
          var rLink = el("a", {
            class: "link-internal macro-link",
            role: "link",
            tabindex: "0",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              enginePlay(regEntry.passage);
            }
          });
          rLink.appendChild(document.createTextNode(regEntry.linkText));
          regionBox.appendChild(dolIconImg(regEntry.icon));
          regionBox.appendChild(rLink);
          regionBox.appendChild(document.createElement("br"));
        })(rItem);
        break;
      }
    }

    // 4. 满足隐藏条件或已开启线索的暗线（每场景最多浮现 1 条，绝不堆砌刷屏）
    for (var i = 0; i < WORLD_STORYLINE_HOOKS.length; i++) {
      var hk = WORLD_STORYLINE_HOOKS[i];
      if (hk.locs.indexOf(pas) >= 0 && hk.check(v)) {
        hasAny = true;
        var qRow = el("div", { style: "margin:4px 0;" });
        qRow.appendChild(el("span", { text: hk.hint + " " }));
        (function (hookItem) {
          var qLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              // 暗门类入口：第一次先过一页「摸到门」的发现对话，记下或进入之后再点直接进入内容页。
              if (hookItem.discoverKey && !(Number(v[hookItem.questVar]) || 0) && !(v.mpSecretSeen && v.mpSecretSeen[hookItem.discoverKey])) {
                v.mpSecretKey = hookItem.discoverKey;
                v.mpSecretReturn = pas;
                v.mpSecretTarget = hookItem.passage;
                enginePlay("MP Secret Discover");
                return;
              }
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

    // 5. 街角告示板 / 零工入口（与暗线分开，避免被暗线钩子挤掉）
    for (var si = 0; si < SIDE_HUB_HOOKS.length; si++) {
      var shk = SIDE_HUB_HOOKS[si];
      if (shk.locs.indexOf(pas) >= 0 && (!shk.check || shk.check(v))) {
        hasAny = true;
        var shRow = el("div", { style: "margin:4px 0;" });
        shRow.appendChild(el("span", { text: shk.hint + " " }));
        (function (hubItem) {
          var shLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              enginePlay(hubItem.passage);
            }
          });
          shLink.appendChild(dolIconImg(hubItem.icon));
          shLink.appendChild(document.createTextNode(hubItem.linkText));
          shRow.appendChild(shLink);
        })(shk);
        container.appendChild(shRow);
        break;
      }
    }

    // 深区入口：每处街区只在走到时浮出一条，点过一次后记住，不再重复提示。
    for (var di = 0; di < DEEP_HUB_HOOKS.length; di++) {
      var dhk = DEEP_HUB_HOOKS[di];
      if (dhk.locs.indexOf(pas) >= 0 && (!dhk.check || dhk.check(v))) {
        hasAny = true;
        var dhRow = el("div", { style: "margin:4px 0;" });
        dhRow.appendChild(el("span", { text: dhk.hint + " " }));
        (function (deepItem) {
          var dhLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              if (deepItem.noDiscover) {
                try { v.mpDeepSeen = v.mpDeepSeen || {}; v.mpDeepSeen[deepItem.key] = 1; } catch (e) {}
                enginePlay(deepItem.passage);
                return;
              }
              if (v.mpDeepSeen && v.mpDeepSeen[deepItem.key]) {
                enginePlay(deepItem.passage);
                return;
              }
              v.mpDiscoverKey = deepItem.key;
              v.mpDiscoverReturn = pas;
              v.mpDiscoverTarget = deepItem.passage;
              enginePlay("MP Deep Discover");
            }
          });
          dhLink.appendChild(dolIconImg(deepItem.icon));
          dhLink.appendChild(document.createTextNode(deepItem.linkText));
          dhRow.appendChild(dhLink);
        })(dhk);
        container.appendChild(dhRow);
        break;
      }
    }

    for (var li = 0; li < LIVELIHOOD_HOOKS.length; li++) {
      var lhk = LIVELIHOOD_HOOKS[li];
      if (lhk.locs.indexOf(pas) >= 0 && (!lhk.hours || isNpcInScheduleHour(lhk)) && (!lhk.check || lhk.check(v))) {
        hasAny = true;
        var lhRow = el("div", { style: "margin:4px 0;" });
        lhRow.appendChild(el("span", { text: lhk.hint + " " }));
        (function (jobItem) {
          var lhLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              if (jobItem.hours && !isNpcInScheduleHour(jobItem)) {
                v.mpNotNowRet = pas;
                v.mpNotNowLabel = String(jobItem.linkText || "去上工").replace(/\s*\(\d+:\d+\)\s*$/, "");
                v.mpNotNowReq = jobItem.hours[0] + ":00–" + jobItem.hours[1] + ":00";
                if (window.Time && typeof Time.pass === "function") { Time.pass(120); }
                enginePlay("MP NotNow");
                return;
              }
              if (window.Time && typeof Time.pass === "function") { Time.pass(300); }
              enginePlay(jobItem.passage);
            }
          });
          lhLink.appendChild(dolIconImg(jobItem.icon));
          lhLink.appendChild(document.createTextNode(jobItem.linkText));
          lhRow.appendChild(lhLink);
        })(lhk);
        container.appendChild(lhRow);
      }
    }

    for (var ji = 0; ji < JOB_NPC_HOOKS.length; ji++) {
      var jhk = JOB_NPC_HOOKS[ji];
      if (jhk.locs.indexOf(pas) >= 0 && (!jhk.hours || isNpcInScheduleHour(jhk)) && (!jhk.check || jhk.check(v))) {
        hasAny = true;
        var jhRow = el("div", { style: "margin:4px 0;" });
        jhRow.appendChild(el("span", { text: jhk.hint + " " }));
        (function (lineItem) {
          var jhLink = el("a", {
            class: "link-internal",
            onclick: function (ev) {
              ev.preventDefault();
              v.mpReturnPassage = pas;
              enginePlay(lineItem.passageFor ? lineItem.passageFor(v) : lineItem.passage);
            }
          });
          jhLink.appendChild(dolIconImg(lineItem.icon));
          jhLink.appendChild(document.createTextNode(lineItem.linkText));
          jhRow.appendChild(jhLink);
        })(jhk);
        container.appendChild(jhRow);
        break;
      }
    }

    // 街头随机小事已并入原版事件池（见 installEventPoolHook），不再在页面底部注入提示行。

    if (regionBox.childNodes.length) {
      var pasTop = host.querySelector(".passage") || host;
      var _targetNode = null;
      try {
        var _walk = document.createTreeWalker(pasTop, NodeFilter.SHOW_TEXT, null);
        var _tn;
        while ((_tn = _walk.nextNode())) {
          var _tt = (_tn.nodeValue || "").trim();
          if (/^(可访问地点|Places of interest|Places|其他区域)$/.test(_tt)) {
            _targetNode = _tn;
            break;
          }
        }
      } catch (e) {}
      if (_targetNode && _targetNode.parentNode) {
        _targetNode.parentNode.insertBefore(regionBox, _targetNode.nextSibling);
      } else {
        var _anchors = pasTop.querySelectorAll("a.link-internal,button.link-internal");
        var _anchor = _anchors.length ? _anchors[_anchors.length - 1] : null;
        if (_anchor && _anchor.parentNode) _anchor.parentNode.insertBefore(regionBox, _anchor.nextSibling);
        else pasTop.insertBefore(regionBox, pasTop.firstChild);
      }
    }

    if (hasAny) {
      var pasEl = host.querySelector(".passage") || host;
      var inlineRoot = document.getElementById("mp-inline-root");
      // 入口一律跟「可访问地点」放在一起，不沉到页面最底下。
      var rbTop = document.getElementById("mp-region-links-box");
      if (rbTop && rbTop.parentNode) {
        rbTop.parentNode.insertBefore(container, rbTop.nextSibling);
      } else if (inlineRoot && inlineRoot.parentNode === host) {
        host.insertBefore(container, inlineRoot);
      } else {
        var _topAnchor = null;
        try {
          var _walk2 = document.createTreeWalker(pasEl, NodeFilter.SHOW_TEXT, null);
          var _t2;
          while ((_t2 = _walk2.nextNode())) {
            if (/^(可访问地点|Places of interest|Places|其他区域)$/.test((_t2.nodeValue || "").trim())) {
              _topAnchor = _t2; break;
            }
          }
        } catch (e) {}
        if (_topAnchor && _topAnchor.parentNode) {
          _topAnchor.parentNode.insertBefore(container, _topAnchor.nextSibling);
        } else {
          pasEl.insertBefore(container, pasEl.firstChild);
        }
      }
    }
  }

  /* ---------------- 注入页面内原生虚线交互区（含「同步时间线」选择器与离线伴侣卧室入口） ---------------- */

  function injectInlinePassageSections() {
    var host = document.getElementById("passages");
    if (!host) return;
    // 先清掉上一页残留的挂载块。NPC/任务页不在 SAFE_PASSAGES 里，
    // injectWorldAndCompanionNodes 会提前 return；不在这里清就会把旧时段的 NPC 行带到新页面。
    var _staleWorld = document.getElementById("mp-world-organic-box");
    if (_staleWorld && _staleWorld.parentNode) _staleWorld.parentNode.removeChild(_staleWorld);
    var _staleRegion = document.getElementById("mp-region-links-box");
    if (_staleRegion && _staleRegion.parentNode) _staleRegion.parentNode.removeChild(_staleRegion);
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

  /* ---------------- 原版『社交 (Social)』与『日志 (Journal)』无缝注入系统 ---------------- */

  function buildNativeStatBlock(titleText, pct, activeIconSrc, inactiveIconSrc, orientation, isImportant, barColor) {
    var safePct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    var v = V();
    var showImages = !(v && v.options && v.options.images === 0);
    var cleanTitle = String(titleText || "").replace(/[:：]/g, "").trim();

    var block = el("div", {
      class: "relation-stat-block",
      style: "--progress: " + safePct + "%;"
    });

    if (isImportant) {
      block.appendChild(el("label", { text: cleanTitle }));
    }

    if (showImages) {
      var statDiv = el("div", { class: "relation-stat" });
      if (!isImportant) {
        var nameSpan = el("span", { class: "relation-stat-name" });
        nameSpan.appendChild(el("small", { text: cleanTitle }));
        statDiv.appendChild(nameSpan);
      }
      var iconSpan = el("span", {
        class: "relation-stat-icon " + (orientation || "horizontal")
      });
      var activeImg = el("img", {
        class: "active-icon-img",
        src: activeIconSrc
      });
      var inactiveImg = el("img", {
        class: inactiveIconSrc ? "inactive-icon-img" : "inactive-icon-img outlined",
        src: inactiveIconSrc || activeIconSrc
      });
      iconSpan.appendChild(activeImg);
      iconSpan.appendChild(inactiveImg);
      statDiv.appendChild(iconSpan);

      var pctSpan = el("span", { class: "relation-stat-percent black" });
      pctSpan.appendChild(document.createTextNode(String(safePct)));
      pctSpan.appendChild(el("small", { text: "%" }));
      statDiv.appendChild(pctSpan);
      block.appendChild(statDiv);
    } else {
      var pctText = el("span", { class: "relation-stat-percent black" });
      pctText.appendChild(document.createTextNode((isImportant ? " " : cleanTitle + " ") + String(safePct)));
      pctText.appendChild(el("small", { text: "%" }));
      block.appendChild(pctText);
      block.appendChild(el("div", {
        class: "progress-bar " + (barColor || "red") + "bar"
      }));
    }
    return block;
  }

  function buildCompanionStatusDescription(comp, rel, onlinePeer, partnerName) {
    var stage = rel.stage || "stranger";
    var persona = comp.persona || comp.attitude || "neutral";
    var locText = onlinePeer ? ("正在" + shortLoc(onlinePeer.passage) + "与你同行。") : "与你同住在孤儿院。";
    if (stage === "soulmate") {
      if (persona === "possessive") return partnerName + " " + locText + "胸前贴身戴着与你成对的银挂坠，视线几乎不愿离开你半步。";
      if (persona === "corrupt") return partnerName + " " + locText + "与你在暗夜中共享着最隐秘的默契。";
      return partnerName + " " + locText + "与你许下了生死相随的誓约，无论风雨都会站在你身侧。";
    }
    if (stage === "lover") {
      if (persona === "bratty") return partnerName + " " + locText + "嘴上总爱逞强逗你，却会在危险时刻第一时间护住你。";
      if (persona === "meek") return partnerName + " " + locText + "一见到你就会露出安心的微笑，总是温柔地牵着你的衣角。";
      return partnerName + " " + locText + "与你心意相通的恋人，眼神交汇间满是眷恋。";
    }
    if (stage === "crush") {
      return partnerName + " " + locText + "望向你的眼神总是带着掩饰不住的悸动。";
    }
    if (stage === "friend") {
      return partnerName + " " + locText + "在孤儿院与镇上与你彼此照应、值得信赖的密友。";
    }
    return partnerName + " " + locText + "对你的举止颇为留意，仍在慢慢熟悉你的步调。";
  }

  function hideEmptyPrimaryRelNotice(relDisplay, primaryBox) {
    if (!relDisplay || !primaryBox) return;
    // 隐藏原版在没有恋爱对象时生成的 "//你现在没有羁绊角色//" 占位斜体文字
    var sib = primaryBox.nextSibling;
    while (sib) {
      if (sib.nodeType === 1) {
        var tag = sib.tagName.toLowerCase();
        var txt = (sib.textContent || "").trim();
        if ((tag === "i" || tag === "em" || tag === "span") && (txt.indexOf("没有羁绊角色") >= 0 || txt.indexOf("No primary relationships") >= 0)) {
          sib.style.display = "none";
          if (sib.nextElementSibling && sib.nextElementSibling.tagName.toLowerCase() === "br") {
            sib.nextElementSibling.style.display = "none";
          }
          break;
        }
        if (sib.id === "secondary-npcs" || sib.classList.contains("gold")) break;
      }
      sib = sib.nextSibling;
    }
  }

  function renderSocialRelations() {
    var relDisplay = document.getElementById("relation-display");
    if (!relDisplay) return;
    var primaryBox = document.getElementById("npc-relations");
    var secondaryBox = document.getElementById("secondary-npcs");
    if (!primaryBox) return;

    var oldCards = relDisplay.querySelectorAll(".mp-native-relation-box");
    for (var i = 0; i < oldCards.length; i++) {
      if (oldCards[i].parentNode) oldCards[i].parentNode.removeChild(oldCards[i]);
    }

    var v = V();
    var noImagesCls = (v && v.options && v.options.images === 0) ? " no-images" : "";
    syncCompanionToVariables();
    var comp = (v && v.mpCompanion) || S.companion || loadCompanionFromStorage();
    var onlinePeer = findOnlineCompanionPeer();
    var partnerName = (onlinePeer && onlinePeer.name) ? onlinePeer.name : (comp.name || "艾琳");
    var partnerRel = getRel(partnerName);

    // 1. 将联机同伴 / 离线伴侣注入『主要关系 (#npc-relations)』，采用与原版完全一致的 DOM 结构与百分比显示
    var compCard = el("div", {
      class: "relation-box mp-native-relation-box",
      style: "order: 15"
    });
    var topLine = el("div", { class: "relation-top-line" });
    var nameHeader = el("span", { class: "relation-name" });
    nameHeader.appendChild(document.createTextNode(partnerName + " "));
    var titleSmall = el("small", { class: "relation-title black" });
    titleSmall.appendChild(el("i", {
      text: onlinePeer ? ("同伴 · " + shortLoc(onlinePeer.passage)) : ("同伴 · " + stageLabelCn(partnerRel.stage))
    }));
    nameHeader.appendChild(titleSmall);
    topLine.appendChild(nameHeader);
    if (partnerRel.stage === "lover" || partnerRel.stage === "soulmate") {
      topLine.appendChild(el("img", {
        class: "love-interest-icon",
        src: "img/ui/love-interest.png",
        title: partnerRel.stage === "soulmate" ? "誓约伴侣" : "恋人"
      }));
    }
    compCard.appendChild(topLine);

    compCard.appendChild(el("div", {
      class: "relation-description",
      text: buildCompanionStatusDescription(comp, partnerRel, onlinePeer, partnerName)
    }));

    var statList = el("div", { class: "relation-stat-list" + noImagesCls });
    statList.appendChild(buildNativeStatBlock("爱意", partnerRel.love || 0, "img/ui/sym-love.png", "img/ui/sym-love-empty.png", "horizontal", true, "red"));
    statList.appendChild(buildNativeStatBlock("信任", partnerRel.trust || 0, "img/ui/sym-confidence.png", "", "horizontal", true, "teal"));
    statList.appendChild(buildNativeStatBlock("性欲", partnerRel.lust || 0, "img/ui/sym-lust.png", "img/ui/sym-lust-empty.png", "vertical", true, "pink"));
    statList.appendChild(buildNativeStatBlock("占有", partnerRel.jealousy || 0, "img/ui/sym-dominance.png", "", "horizontal", true, "purple"));
    statList.appendChild(buildNativeStatBlock("共鸣", partnerRel.corruption || 0, "img/ui/tf-demon.png", "", "horizontal-inverted", true, "purple"));
    statList.appendChild(buildNativeStatBlock("默契", Math.min(100, Math.round(((partnerRel.love || 0) + (partnerRel.trust || 0)) / 2)), "img/ui/sym-harmony.png", "", "vertical", true, "gold"));
    compCard.appendChild(statList);

    primaryBox.appendChild(compCard);
    hideEmptyPrimaryRelNotice(relDisplay, primaryBox);

    // 若房间内还有第 3、第 4 名在线玩家
    S.players.forEach(function (p) {
      if (onlinePeer && p.id === onlinePeer.id) return;
      var pRel = getRel(p.name || p.id);
      var pCard = el("div", {
        class: "relation-box mp-native-relation-box",
        style: "order: 16"
      });
      var pTop = el("div", { class: "relation-top-line" });
      var pNameSpan = el("span", { class: "relation-name" });
      pNameSpan.appendChild(document.createTextNode((p.name || "同行者") + " "));
      var pSmall = el("small", { class: "relation-title black" });
      pSmall.appendChild(el("i", { text: "同行者 · " + shortLoc(p.passage) }));
      pNameSpan.appendChild(pSmall);
      pTop.appendChild(pNameSpan);
      pCard.appendChild(pTop);
      pCard.appendChild(el("div", {
        class: "relation-description",
        text: (p.name || "同行者") + " 正与你在小镇中结伴行动，目前位于" + shortLoc(p.passage) + "。"
      }));
      var pStats = el("div", { class: "relation-stat-list" + noImagesCls });
      pStats.appendChild(buildNativeStatBlock("爱意", pRel.love || 0, "img/ui/sym-love.png", "img/ui/sym-love-empty.png", "horizontal", true, "red"));
      pStats.appendChild(buildNativeStatBlock("信任", pRel.trust || 0, "img/ui/sym-confidence.png", "", "horizontal", true, "teal"));
      pStats.appendChild(buildNativeStatBlock("性欲", pRel.lust || 0, "img/ui/sym-lust.png", "img/ui/sym-lust-empty.png", "vertical", true, "pink"));
      pCard.appendChild(pStats);
      primaryBox.appendChild(pCard);
    });

    // 2. 将结识过的 6 位新镇民 NPC 注入『普通角色 (#secondary-npcs)』，完整显示百分比数值与图标
    var targetNpcContainer = secondaryBox || primaryBox;
    var npcMeta = [
      {
        key: "sera",
        name: "塞拉",
        title: "钟表修缮师",
        descZero: "塞拉 对你还保持着客气的审视。",
        descMid: "塞拉 信任你的眼光，乐意替你鉴定古物。",
        descHigh: "塞拉 对你极为偏爱，钟表铺的阁楼随时向你敞开。"
      },
      {
        key: "vesper",
        name: "维斯",
        title: "夜航船长",
        descZero: "维斯 觉得你还算守口如瓶。",
        descMid: "维斯 把你视作可靠的暗潮搭档。",
        descHigh: "维斯 将船长室的副匙交给了你，愿为你留着归航的灯。"
      },
      {
        key: "noel",
        name: "诺艾尔",
        title: "标本室学徒",
        descZero: "诺艾尔 与你相处时还有些拘谨。",
        descMid: "诺艾尔 总是提前为你温好舒缓心神的花茶。",
        descHigh: "诺艾尔 对你怀着毫无保留的依恋与倾慕。"
      },
      {
        key: "lin",
        name: "林恩",
        title: "街区守夜人",
        descZero: "林恩 在巡夜时会顺便留意你的安全。",
        descMid: "林恩 认可你的韧劲，常在旧车库指导你格斗步法。",
        descHigh: "林恩 发誓用双拳替你挡下暗巷里的一切风雨。"
      },
      {
        key: "monet",
        name: "莫奈",
        title: "画师与裁缝",
        descZero: "莫奈 对你的身形轮廓颇感兴趣。",
        descMid: "莫奈 喜欢在试衣镜前细致地替你修补衣衫。",
        descHigh: "莫奈 视你为唯一的缪斯，画室只为你一人敞开。"
      },
      {
        key: "ash",
        name: "阿什",
        title: "林间守灯人",
        descZero: "阿什 对你印象尚可，愿意在林间替你引路。",
        descMid: "阿什 会在迷雾中放慢脚步等你，递给你温热的姜汤。",
        descHigh: "阿什 愿在深林篝火旁将你拥入怀中，护你走过每一寸夜路。"
      }
    ];

    var mpNpcs = (v && v.mpNpcs) || {};
    npcMeta.forEach(function (nm, idx) {
      var st = mpNpcs[nm.key] || { love: 0, trust: 0, lust: 0, dom: 0, corruption: 0, stage: 0 };
      var hasInteracted = st.hasMet || (st.love || 0) > 0 || (st.trust || 0) > 0 || (st.lust || 0) > 0 || (st.stage || 0) > 0;
      if (!hasInteracted) return;

      var nCard = el("div", {
        class: "relation-box mp-native-relation-box",
        style: "order: " + (60 + idx)
      });
      var nTop = el("div", { class: "relation-top-line" });
      var nName = el("span", { class: "relation-name" });
      nName.appendChild(document.createTextNode(nm.name + " "));
      var nSmall = el("small", { class: "relation-title black" });
      nSmall.appendChild(el("i", { text: nm.title }));
      nName.appendChild(nSmall);
      nTop.appendChild(nName);
      if ((st.love || 0) >= 20 || (st.stage || 0) >= 8) {
        nTop.appendChild(el("img", { class: "love-interest-icon", src: "img/ui/love-interest.png", title: "深厚羁绊" }));
      }
      nCard.appendChild(nTop);

      var descTxt = (st.love || 0) >= 18 ? nm.descHigh : ((st.love || 0) >= 6 || (st.trust || 0) >= 6) ? nm.descMid : nm.descZero;
      nCard.appendChild(el("div", { class: "relation-description", text: descTxt }));

      var nStats = el("div", { class: "quick-stats relation-stat-list" + noImagesCls });
      nStats.appendChild(buildNativeStatBlock("好感", st.love || 0, "img/ui/sym-love.png", "img/ui/sym-love-empty.png", "horizontal", false, "red"));
      nStats.appendChild(buildNativeStatBlock("信任", st.trust || 0, "img/ui/sym-confidence.png", "", "horizontal", false, "teal"));
      nStats.appendChild(buildNativeStatBlock("欲念", st.lust || 0, "img/ui/sym-lust.png", "img/ui/sym-lust-empty.png", "vertical", false, "pink"));
      nCard.appendChild(nStats);

      targetNpcContainer.appendChild(nCard);
    });
  }

  var MOD_FESTIVALS = [
    { key: "harvest", name: "丰收节", month: 9, day: 15, loc: "农场与高街", hint: "麦捆、集市和临时搭起的秤台会挤满高街。" },
    { key: "fog", name: "雾月节", month: 10, day: 21, loc: "神殿与多瑙河街", hint: "神殿会点起长明灯，多瑙河街的雾里有人戴面具。" },
    { key: "winter", name: "冬幕节", month: 12, day: 18, loc: "孤儿院与高街", hint: "孤儿院会煮热汤，高街的店铺挂起旧布做的冬幕。" },
    { key: "flood", name: "春汛节", month: 3, day: 21, loc: "码头与梅尔街", hint: "春汛把木舟推回码头，鱼市和系船柱边最热闹。" },
    { key: "sealamp", name: "海灯节", month: 6, day: 21, loc: "海滩与海礁", hint: "退潮后的沙滩上会放纸灯，海礁边有人等潮。" },
    { key: "bell", name: "钟塔纪念日", month: 11, day: 5, loc: "高街与旧钟塔", hint: "旧钟塔会敲响纪念钟，工匠名册摊在塔下。" },
    { key: "plough", name: "初春开犁节", month: 4, day: 1, loc: "农场与高街", hint: "河湾农场牵出披红布的挽马，犁开第一道沟。" },
    { key: "solstice", name: "夏季长日节", month: 7, day: 1, loc: "公园与海滩", hint: "白昼最长的一天，公园和海滩都有人彻夜不归。" },
    { key: "tide", name: "旧港潮汐节", month: 8, day: 15, loc: "码头与梅尔街", hint: "退潮后的旧港会露出老钟，鱼市和栈桥最热闹。" },
    { key: "term", name: "学园开学祭", month: 9, day: 1, loc: "学校与高街", hint: "学园走廊换上新的画框，高街的文具铺挤满人。" },
    { key: "lantern", name: "秋末点灯节", month: 10, day: 31, loc: "神殿与孤儿院", hint: "神殿和孤儿院会点起一排防风灯，灯芯要提前换。" },
    { key: "chime", name: "年末钟声夜", month: 12, day: 31, loc: "高街与神殿", hint: "钟塔会敲响年末最后一轮钟，工匠们聚在塔下。" }
  ];

  function nextModFestival(v) {
    if (!window.Time || !Time.date || typeof DateTime !== "function") return null;
    var now = Time.date;
    var today = new DateTime(now.year, now.month, now.day, 0, 0, 0);
    var best = null;
    for (var i = 0; i < MOD_FESTIVALS.length; i++) {
      var f = MOD_FESTIVALS[i];
      var d = new DateTime(now.year, f.month, f.day, 0, 0, 0);
      if (d.timeStamp < today.timeStamp) d = new DateTime(now.year + 1, f.month, f.day, 0, 0, 0);
      var days = Math.round((d.timeStamp - today.timeStamp) / 86400);
      if (!best || days < best.days) {
        best = { key: f.key, name: f.name, loc: f.loc, hint: f.hint, days: days, date: d };
      }
    }
    return best;
  }

  var MOD_JOB_JOURNAL = [
    { name: "海风咖啡馆", lv: "mpJobCafeLevel", strike: "mpJobCafeStrike", susp: "mpJobCafeSuspended", day: "mpJobCafe",
      ranks: ["刚系上围裙", "能看住窗边四桌", "记得熟客的口味", "能独自看午市", "有后门钥匙", "Gwylan 放心的老手"] },
    { name: "码头鱼档", lv: "mpJobFishLevel", strike: "mpJobFishStrike", susp: "mpJobFishSuspended", day: "mpJobFish",
      ranks: ["还在学看潮", "能下近岸的网", "认得外礁的水色", "有最好的摊位", "能借到小船", "鱼档老手"] },
    { name: "温泉桑拿", lv: "mpJobSpaLevel", strike: "mpJobSpaStrike", susp: "mpJobSpaSuspended", day: "mpJobSpa",
      ranks: ["还在记毛巾位置", "能递巾看水", "客人开始点你的手法", "能看私汤", "有值班钥匙", "池边老手"] },
    { name: "河湾农场", lv: "mpJobFarmLevel", strike: "mpJobFarmStrike", susp: "mpJobFarmSuspended", day: "mpJobFarm",
      ranks: ["还在学看墒", "能照料一畦", "能同时看两畦", "有温室钥匙", "会轮作", "Alex 放心的老手"] },
    { name: "钟表铺", lv: "mpJobClockLevel", strike: "mpJobClockStrike", susp: "mpJobClockSuspended", day: "mpJobClock",
      ranks: ["还在认零件", "能换摆轮", "能接简单委托", "接高价维修", "招牌上有你的名字", "Sera 的合伙人"] },
    { name: "孤儿院浆洗房", lv: "mpJobLaundryLevel", strike: "mpJobLaundryStrike", susp: "mpJobLaundrySuspended", day: "mpJobLaundry",
      ranks: ["还在学熨边", "熨烫不留水痕", "有装订台钥匙", "能藏下一本旧书", "接旧书摊委托", "浆洗房老手"] },
    { name: "面包房早班", countVar: "mpJobBakeryCount", thresholds: [3, 6, 10, 15], strike: "mpJobBakeryStrike", susp: "mpJobBakerySuspended", day: "mpJobBakery",
      ranks: ["还在抹烤盘", "能看第一炉", "会调糖霜", "能独看早炉", "师傅放心的老手"] },
    { name: "裁缝铺改衣", countVar: "mpJobTailorCount", thresholds: [3, 6, 10, 15], strike: "mpJobTailorStrike", susp: "mpJobTailorSuspended", day: "mpJobTailor",
      ranks: ["还在穿针", "能改裤脚", "开始接改衣", "能独立量体", "老裁缝的帮手"] },
    { name: "街巷跑腿邮差", countVar: "mpJobCourierCount", thresholds: [3, 6, 10, 15], strike: "mpJobCourierStrike", susp: "mpJobCourierSuspended", day: "mpJobCourier",
      ranks: ["还在认路", "能跑近街", "认得后巷捷径", "能送远线", "街巷老手"] },
    { name: "丰收酒馆后厨", countVar: "mpJobPubKitchenCount", thresholds: [3, 6, 10, 15], strike: "mpJobPubKitchenStrike", susp: "mpJobPubKitchenSuspended", day: "mpJobPubKitchen",
      ranks: ["还在洗菜", "能看汤锅", "会配香料", "能独看后厨", "酒馆老手"] },
    { name: "河湾马厩驮运", countVar: "mpJobStableCount", thresholds: [3, 6, 10, 15], strike: "mpJobStableStrike", susp: "mpJobStableSuspended", day: "mpJobStable",
      ranks: ["还在刷马", "能备鞍", "会驾板车", "能跑夜路", "马厩老手"] },
    { name: "旧港近海渔船", countVar: "mpJobTrawlerCount", thresholds: [3, 6, 10, 15], strike: "mpJobTrawlerStrike", susp: "mpJobTrawlerSuspended", day: "mpJobTrawler",
      ranks: ["还在理网", "能看近海", "会下拖网", "能认潮路", "渔队老手"] }
  ];

  function renderJournalEntries() {
    var divMap = document.getElementById("divmap");
    var overlayContent = document.getElementById("customOverlayContent");
    if (!divMap || !overlayContent) return;

    var oldBox = document.getElementById("mp-native-journal-section");
    if (oldBox && oldBox.parentNode) oldBox.parentNode.removeChild(oldBox);

    var v = V();
    if (!v) return;
    syncCompanionToVariables();

    var wrap = el("div", { id: "mp-native-journal-section" });

    // 1. 同伴与日常动向
    var comp = v.mpCompanion || S.companion || loadCompanionFromStorage();
    var onlinePeer = findOnlineCompanionPeer();
    var partnerName = (onlinePeer && onlinePeer.name) ? onlinePeer.name : (comp.name || "艾琳");
    var partnerRel = getRel(partnerName);

    wrap.appendChild(el("hr"));
    wrap.appendChild(el("h1", { class: "header gold bold", text: "同伴与镇民动向" }));
    var ulComp = el("ul", { class: "journal" });

    if (onlinePeer) {
      ulComp.appendChild(el("li", {
        text: partnerName + " · " + stageLabelCn(partnerRel.stage) + "目前正在镇上行动，最近一次出现在" + shortLoc(onlinePeer.passage) + "。"
      }));
    } else {
      var h = getHourNow();
      var schedHint = "清晨至上午常在孤儿院走廊与餐厅帮忙；平日白天会前往牛津街学校上课，周末则喜欢去公园或高街散步；傍晚后会回到孤儿院卧室休息。";
      if (h >= 9 && h < 16) {
        schedHint = "眼下这个时辰，" + partnerName + "通常在学校图书馆、走廊或公园长椅附近活动。";
      } else if (h >= 16 && h < 22) {
        schedHint = "傍晚时分，" + partnerName + "通常留在孤儿院走廊、花园或自己的房间里。";
      } else if (h >= 22 || h < 6) {
        schedHint = "夜深人静，" + partnerName + "已经回到孤儿院斜对面的卧室休息。";
      }
      ulComp.appendChild(el("li", {
        text: partnerName + " · " + stageLabelCn(partnerRel.stage) + "：" + schedHint
      }));
    }

    var compQuestStg = Number(comp.questStage || v.mpCompanionQuest) || 0;
    if (compQuestStg > 0 && compQuestStg < 8) {
      ulComp.appendChild(el("li", {
        text: "你与" + partnerName + "正在共同追查旧八音盒与早年档案的下落 · 当前进度 " + compQuestStg + "/8。"
      }));
    } else if (compQuestStg >= 8) {
      ulComp.appendChild(el("li", {
        text: "你与" + partnerName + "已经解开了旧八音盒背后的往事，彼此的羁绊愈发牢固。"
      }));
    }

    // 已结识的新 NPC 动向与委托记录
    var mpNpcs = v.mpNpcs || {};
    var npcJournalDefs = [
      { key: "sera", name: "塞拉", schedule: "每日白昼至晚间 · 08:00 - 21:00在高街钟表旧货铺或购物中心坐镇，可替你鉴定古物并折算古董收益。", questTitle: "雾月钟楼与失落发条圣物" },
      { key: "vesper", name: "维斯", schedule: "每日黄昏至次日清晨 · 17:00 - 06:00在码头、梅尔街或麋鹿街暗巷出没，可安全接手封存的暗市货包。", questTitle: "暗潮走私船与沉没金库" },
      { key: "noel", name: "诺艾尔", schedule: "白昼与傍晚 · 07:00 - 20:00在学校图书馆、走廊或公园玻璃花房整理标本，可为你调配舒缓草药茶。", questTitle: "标本室秘药与温室夜谈" },
      { key: "lin", name: "林恩", schedule: "傍晚至次日清晨 · 16:00 - 07:00在宅邸街、倒钩街、孤儿院外围或酒馆巡夜，可指导你防身格斗步法。", questTitle: "地下铁笼与孤儿院守夜人" },
      { key: "monet", name: "莫奈", schedule: "上午至深夜 · 10:00 - 23:00在康努达图斯街、峭壁街或海风咖啡馆写生，可替你修补破损衣物。", questTitle: "天鹅绒画室与午夜缪斯" },
      { key: "ash", name: "阿什", schedule: "清晨至深夜 · 06:00 - 23:00在森林、神殿石径或下水道巡视，可带你避开林间泥沼并拓印古碑。", questTitle: "古墓迷雾与森林古祭坛" }
    ];
    npcJournalDefs.forEach(function (nd) {
      var st = mpNpcs[nd.key];
      if (!st) return;
      var hasMet = st.hasMet || (st.love || 0) > 0 || (st.trust || 0) > 0 || (st.stage || 0) > 0;
      if (!hasMet) return;
      var lineTxt = nd.name + "：" + nd.schedule;
      if ((st.stage || 0) > 0 && (st.stage || 0) < 10) {
        lineTxt += " · 当前正在共同推进『" + nd.questTitle + "』第 " + st.stage + "/10 阶段";
      } else if ((st.stage || 0) >= 10) {
        lineTxt += " · 已与你共同完成了『" + nd.questTitle + "』的全部委托";
      }
      ulComp.appendChild(el("li", { text: lineTxt }));
    });
    wrap.appendChild(ulComp);

    // 1.2 节日倒计时：只在最近 7 天内出现
    var fest = nextModFestival(v);
    if (fest && fest.days <= 7) {
      wrap.appendChild(el("hr"));
      wrap.appendChild(el("h1", { class: "header gold bold", text: "节日与日程" }));
      var ulFest = el("ul", { class: "journal" });
      var whenFest = fest.days === 0 ? "今天就是" : fest.days === 1 ? "明天是" : ("还有 " + fest.days + " 天是");
      ulFest.appendChild(el("li", {
        text: whenFest + "『" + fest.name + "』，地点在" + fest.loc + "。" + fest.hint
      }));
      wrap.appendChild(ulFest);
    }

    // 1.3 零工进度与日常约定
    var jobLines = [];
    MOD_JOB_JOURNAL.forEach(function (j) {
      var lv = Number(v[j.lv]) || 0;
      if (j.countVar && Array.isArray(j.thresholds)) {
        var cnt = Number(v[j.countVar]) || 0;
        lv = cnt >= j.thresholds[3] ? 4 : cnt >= j.thresholds[2] ? 3 : cnt >= j.thresholds[1] ? 2 : cnt >= j.thresholds[0] ? 1 : 0;
      }
      var strike = Number(v[j.strike]) || 0;
      var susp = Number(v[j.susp]) || 0;
      if (!lv && !strike && !susp) return;
      var rank = j.ranks[Math.min(lv, j.ranks.length - 1)];
      var line = j.name + "：" + rank + "。";
      if (susp) {
        line += "东家让你先歇几天，得去把话说清楚。";
      } else if (v.daily && v.daily[j.day]) {
        line += "今天已经上过工。";
      } else {
        line += "今天还能上工。";
      }
      if (!susp && strike >= 2) line += "东家最近对你不太满意。";
      else if (!susp && strike >= 1) line += "东家提醒过你一次。";
      jobLines.push(line);
    });
    var dailyDefs = [
      ["mpDailyWhitney", "惠特尼"], ["mpDailyKylar", "凯拉尔"], ["mpDailySydney", "西德尼"],
      ["mpDailyMason", "梅森"], ["mpDailyLeighton", "莱顿"], ["mpDailyBailey", "贝利"]
    ];
    dailyDefs.forEach(function (dd) {
      var st = Number(v[dd[0]]) || 0;
      if (st > 0 && st < 3) {
        jobLines.push("你答应过再去看看" + dd[1] + "，那边还有一件小事没了结。");
      } else if (st >= 3) {
        jobLines.push("你和" + dd[1] + "最近走得近了些。");
      }
    });
    if (jobLines.length > 0) {
      wrap.appendChild(el("hr"));
      wrap.appendChild(el("h1", { class: "header gold bold", text: "零工与日常" }));
      var ulJobs = el("ul", { class: "journal" });
      jobLines.forEach(function (line) { ulJobs.appendChild(el("li", { text: line })); });
      wrap.appendChild(ulJobs);
    }

    // 1.5 孤儿院旧账与贝利（新手第一次出门不显示）
    if (Number(v.tutorial) === 1) {
      var curDayJ = (window.Time && Number.isFinite(Time.days)) ? Time.days : 0;
      if (v.mpBaileyBiweeklyNextDay === undefined) v.mpBaileyBiweeklyNextDay = curDayJ + 14;
      var daysLeft = Math.max(0, v.mpBaileyBiweeklyNextDay - curDayJ);
      var rebStg = Number(v.mpQuestBaileyRebellion) || 0;
      var curTribute = Math.max(0, 1500 - rebStg * 180);
      wrap.appendChild(el("hr"));
      wrap.appendChild(el("h1", { class: "header gold bold", text: "孤儿院旧账与贝利" }));
      var ulBailey = el("ul", { class: "journal" });
      if (rebStg >= 8) {
        ulBailey.appendChild(el("li", {
          text: "你们已经把贝利的旧账备份到几处可靠的人手里，他不再按月来收那笔钱。"
        }));
      } else {
        ulBailey.appendChild(el("li", {
          text: daysLeft === 0
            ? ("贝利来查账了。这一期要交 £" + curTribute + "，或者先去把办公室外的旧账翻清楚。")
            : ("距离贝利下一次查账还有 " + daysLeft + " 天 · 这一期的账是 £" + curTribute + "。")
        }));
        if (rebStg > 0) {
          ulBailey.appendChild(el("li", {
            text: "你正在整理贝利办公室外的旧账 · 当前进度 " + rebStg + "/8，已经让他少收 £" + (rebStg * 180) + "。"
          }));
        }
      }
      wrap.appendChild(ulBailey);
    }

    // 2. 随身待处理古物与暗市货包记录
    var unappraised = Number(v.mpAntiquesUnappraised) || 0;
    var contraband = Number(v.mpContrabandSealed) || 0;
    if (unappraised > 0 || contraband > 0) {
      wrap.appendChild(el("hr"));
      wrap.appendChild(el("h1", { class: "header gold bold", text: "待鉴定的古物与暗市货包" }));
      var ulItems = el("ul", { class: "journal" });
      if (unappraised > 0) {
        ulItems.appendChild(el("li", {
          text: "你随身携带着 " + unappraised + " 件尚未鉴定的古物，可前往高街钟表旧货铺请塞拉鉴定并折算为博物馆古董款项。"
        }));
      }
      if (contraband > 0) {
        ulItems.appendChild(el("li", {
          text: "你手里藏有 " + contraband + " 份封存的暗市货包，可在傍晚或夜间前往码头、麋鹿街后巷交予维斯或暗桩安全脱手。"
        }));
      }
      wrap.appendChild(ulItems);
    }

    // 3. 正在追查的城镇线索与秘闻（仅展示已触发/进行中的调查，绝不剧透未发现的暗线）
    var activeQuestNotes = [];
    var mainStg = Number(v.mpMainStoryEclipse) || 0;
    if (mainStg > 0 && mainStg < 12) {
      var mainHints = [
        "",
        "你在孤儿院旧储物室发现了缺页的早年收养账册，线索指向高街钟表旧货铺的密文音筒。",
        "塞拉协助你破译了黄铜音筒上的星象刻度，下一步需前往牛津街学园旧天文翼楼核对星轨图。",
        "天文翼楼的星轨指向了圣堂地下古修道院，那里似乎封存着雾月教团的石碑。",
        "地下修道院的石碑拓片提及了多瑙河街秘密温室庄园的午夜集会。",
        "温室庄园截获的货单指向麋鹿街黑铁货运站的三号装甲货车。",
        "黑铁货运站的铅封账册记载着深林古德鲁伊石环的月泉祭礼。",
        "深林石环的线索指向峭壁天鹅绒暗层即将举行的假面私密拍卖会。",
        "你在天鹅绒暗层取得了关键拍品，需深入旧钟塔地下机括城重启核心齿轮。",
        "地下机括城的压力阀已经就位，还需在旧港区与下水道截断暗潮走私网。",
        "全镇的线索已串联成形，风暴前夕的异动正汇聚向海礁外的雾角灯塔岛。",
        "雾角灯塔岛顶层的铜门已经松动，只需登顶即可揭开『潮汐与雾月之蚀』的最终真相。"
      ];
      activeQuestNotes.push("『潮汐与雾月之蚀』" + (mainHints[mainStg] || ("正在追查第 " + mainStg + "/12 章的线索。")));
    } else if (mainStg >= 12) {
      activeQuestNotes.push("『潮汐与雾月之蚀』你已彻底查明雾角灯塔岛与孤儿院早年账册背后的真相，平息了席卷全镇的暗流。");
    }

    var subQuestDefs = [
      { varName: "mpQuestCellar", max: 7, title: "孤儿院旧储物室暗门", loc: "孤儿院走廊" },
      { varName: "mpQuestAttic", max: 7, title: "卧室阁楼尘封旧箱", loc: "孤儿院卧室" },
      { varName: "mpQuestClocktower", max: 7, title: "高街钟表铺的停摆怀表", loc: "高街" },
      { varName: "mpQuestSmuggler", max: 7, title: "港区集装箱后的暗哨", loc: "码头与麋鹿街" },
      { varName: "mpQuestLibrary", max: 7, title: "图书馆无编号皮革卷宗", loc: "学校图书馆" },
      { varName: "mpQuestCatacomb", max: 7, title: "神殿侧廊转动过的烛台", loc: "狼街神殿" },
      { varName: "mpQuestShipwreck", max: 7, title: "退潮暗礁间的沉船肋木", loc: "海礁" },
      { varName: "mpQuestManorRuins", max: 7, title: "深林荆棘后的坍塌石拱门", loc: "森林与深林" },
      { varName: "mpQuestGreenhouse", max: 7, title: "公园旧玻璃花房的奇异甜香", loc: "公园" },
      { varName: "mpQuestVelvet", max: 7, title: "康努达图斯街的天鹅绒侧门", loc: "康努达图斯街" },
      { varName: "mpQuestMill", max: 7, title: "荒废旧风车磨坊的齿轮声", loc: "农场" },
      { varName: "mpQuestUnderground", max: 7, title: "下水道拱顶的三岔粉笔记号", loc: "下水道" },
      { varName: "mpQuestDanubeSalon", max: 7, title: "多瑙河街白公馆的弦音", loc: "多瑙河街" },
      { varName: "mpQuestBarbEvidence", max: 7, title: "倒钩街证物室的旧封条", loc: "倒钩街" },
      { varName: "mpQuestCliffLighthouse", max: 7, title: "峭壁旧雾角塔的湿脚印", loc: "峭壁街" },
      { varName: "mpQuestArcadeBasement", max: 7, title: "星鱼街黑屏街机后的暗门", loc: "星鱼街游戏厅" },
      { varName: "mpQuestHospitalWing", max: 7, title: "夜莺街旧病房走廊的滴答声", loc: "医院" },
      { varName: "mpQuestSchoolBell", max: 7, title: "牛津街学园旧钟塔的铜锁", loc: "学校前院" },
      { varName: "mpQuestPoolDrain", max: 7, title: "泳池温水阀室的回响", loc: "学校泳池" },
      { varName: "mpQuestMerDrydock", max: 7, title: "梅尔街三号干船坞的无旗帆船", loc: "码头与梅尔街" },
      { varName: "mpQuestElkWorkshop", max: 7, title: "麋鹿街地下工坊的铁门", loc: "麋鹿街" },
      { varName: "mpQuestHarvestCellar", max: 7, title: "丰收街酒馆橡木桶下的铁环", loc: "丰收街酒吧" },
      { varName: "mpQuestAlleyShelter", max: 7, title: "住宅区砖墙夹缝的避风棚", loc: "住宅区小巷" },
      { varName: "mpQuestFoundry", max: 7, title: "工业区旧铸造厂的余烬", loc: "工业区小巷" },
      { varName: "mpQuestGardenWell", max: 7, title: "孤儿院花园常春藤枯井", loc: "孤儿院花园" },
      { varName: "mpQuestBathPipe", max: 7, title: "浴室黄铜蒸汽管后的夹墙", loc: "孤儿院浴室" },
      { varName: "mpQuestGrottoPearl", max: 7, title: "海蚀洞深潭的幽蓝磷光", loc: "海滩洞穴" },
      { varName: "mpQuestMoonAltar", max: 7, title: "深林古树间的月牙石台", loc: "深林" }
    ];

    subQuestDefs.forEach(function (sq) {
      var val = Number(v[sq.varName]) || 0;
      if (val > 0 && val < sq.max) {
        activeQuestNotes.push("正在调查『" + sq.title + "』 · 位于" + sq.loc + "，当前阶段 " + val + "/" + (sq.max - 1) + "。");
      } else if (val >= sq.max) {
        activeQuestNotes.push("已查明『" + sq.title + "』的始末。");
      }
    });

    var fragDefs = [
      { varName: "mpFragCrownGear", name: "失落王冠的黄铜齿轮" },
      { varName: "mpFragAbyssPage", name: "深渊古教团的羊皮残页" },
      { varName: "mpFragSmugglerRing", name: "旧港走私王的火漆印戒" },
      { varName: "mpFragBrideFlower", name: "雾月花嫁的银丝花标本" },
      { varName: "mpFragVelvetCrest", name: "天鹅绒假面舞会的暗金徽章" },
      { varName: "mpFragLedgerKey", name: "孤儿院早期账册的黄铜密匙" }
    ];
    fragDefs.forEach(function (fd) {
      var cnt = Number(v[fd.varName]) || 0;
      if (cnt > 0 && cnt < 3) {
        activeQuestNotes.push("已搜集『" + fd.name + "』线索残片 · " + cnt + "/3。");
      } else if (cnt >= 3) {
        activeQuestNotes.push("已集齐『" + fd.name + "』的全部残片。");
      }
    });

    if (activeQuestNotes.length > 0) {
      wrap.appendChild(el("hr"));
      wrap.appendChild(el("h1", { class: "header gold bold", text: "小镇暗流与调查笔记" }));
      var ulQuests = el("ul", { class: "journal" });
      activeQuestNotes.forEach(function (note) {
        ulQuests.appendChild(el("li", { text: note }));
      });
      wrap.appendChild(ulQuests);
    }

    overlayContent.appendChild(wrap);
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
      send({ t: "hello", name: S.name, playerUid: S.playerUid });
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
            if (S.syncMode && p.weatherPack && (p.isHost || p.passage === ((window.State && State.passage) || ""))) {
              var sameSceneNow = (p.passage === ((window.State && State.passage) || ""));
              applyWeatherPack(p.weatherPack, sameSceneNow);
            }
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
        S.currentEventKey = msg.eventKey || "";
        var badPas = ["Start", "Start2", "Orphanage Intro", MP_COMBAT_PASSAGE, "MP Native Combat Finish", "MP Native Combat Aftermath"];
        if (badPas.indexOf(targetPas) >= 0 || targetPas.indexOf("MP Player Interact") === 0 || targetPas.indexOf("MP Companion") === 0) break;

        var curPas = (window.State && State.passage) || "";
        if (curPas === MP_COMBAT_PASSAGE || (curPas === "MP Native Combat Finish" || curPas === "MP Native Combat Aftermath") || (vj && vj.combat === 1 && !msg.inCombat)) {
          cleanupNativeCombatState();
        }
        if (msg.weatherPack) {
          applyWeatherPack(msg.weatherPack, true);
        }
        if (msg.eventContext) {
          applyEventContext(msg.eventContext);
        }
        if (msg.name || msg.content) {
          vj.eventPoolOverride = msg.name || "inline_event";
          vj.eventPoolOverrideContent = msg.content || "";
          vj.eventPoolOverridePrng = msg.prng || S.prng;
        }
        if (msg.reason === "host_move" && isSafePassage(targetPas) && vj) {
          vj.eventskip = 1;
        }
        S.myVotedIndex = -1;
        S.currentVotes = [];
        if (curPas !== targetPas || msg.reason === "phase_change" || msg.forceEvent) {
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
        S.currentEventKey = msg.eventKey || currentEventKey();
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
          renderLinkProposal();
        }
        break;

      case "link_cancel":
        S.currentVotes = [];
        S.myVotedIndex = -1;
        clearLinkProposalBox();
        renderLinkVoteBadges();
        S.lastChannelTip = "队友不同意，本次同步取消";
        renderChannelBar();
        toast("队友不同意，本次同步取消", "mp-wait");
        break;

      case "host_moved":
        S.lastChannelTip = (msg.fromName || "房主") + " 去了 " + (msg.passage || "别处") + "，先汇合再同步";
        renderChannelBar();
        toast(S.lastChannelTip, "mp-wait");
        break;

      case "link_commit":
        if (window.State && State.passage === msg.passage) {
          executeCommittedLink(msg);
        } else if (msg.targetPassage) {
          S._syncJumpPassage = msg.targetPassage;
          enginePlay(msg.targetPassage);
        } else {
          send({ t: "event_resync" });
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
        delete v.mpWasTutorial;
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
        if (msg.hostPlayerId === S.id && msg.sharedEnemy && msg.sharedEnemy.wasTutorial && !vc.mpTutorialSprayClaimed && (Number(vc.spraymax) || 0) <= 0 && canClaimUniqueReward("tutorial_first_spray")) {
          vc.mpWasTutorial = 1;
        } else {
          delete vc.mpWasTutorial;
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
      wasTutorial: !!(curPas === "Tutorial" && !v.mpTutorialSprayClaimed && (Number(v.spraymax) || 0) <= 0 && canClaimUniqueReward("tutorial_first_spray"))
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
      playerUid: S.playerUid,
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
      weatherPack: extractWeatherPack(),
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
      '<div class="mp-head"><b>联机设置 · v1.0.0</b><span id="mp-status" class="mp-status">未连接</span>',
      '<button id="mp-close" class="mp-x">×</button></div>',
      '<div class="mp-row"><label>昵称<input id="mp-name" class="mp-input" maxlength="24"></label></div>',
      '<div class="mp-row" style="background:rgba(30,65,50,0.45);padding:6px;border-radius:4px;border:1px solid #4fd07a;">',
      '<div style="width:100%;font-size:0.88em;color:#8ff0a4;margin-bottom:4px;">⚡ 端到端 P2P 免云服务器直连 · 手机APK与电脑通用</div>',
      '<input id="mp-p2p-code" class="mp-input" style="width:82px;" maxlength="8" placeholder="4位房码">',
      '<button id="mp-p2p-host" class="mp-mini mp-ok">免服建房</button>',
      '<button id="mp-p2p-join" class="mp-mini mp-ok">免服进房</button>',
      '<button id="mp-p2p-sdp" class="mp-mini" title="生成或粘贴纯离线端到端WebRTC直连码">离线直连码</button>',
      '</div>',
      '<div id="mp-sdp-box" class="mp-row mp-hide" style="flex-direction:column;align-items:stretch;gap:4px;">',
      '<textarea id="mp-sdp-text" class="mp-input" style="height:48px;font-size:11px;" placeholder="可生成本机直连码发给好友，或粘贴好友发来的直连码"></textarea>',
      '<div class="mp-row"><button id="mp-sdp-gen" class="mp-mini mp-ok">生成直连邀请码</button><button id="mp-sdp-apply" class="mp-mini">粘贴并连接</button></div>',
      '</div>',
      '<div class="mp-row"><label>局域网/云服<input id="mp-server" class="mp-input" placeholder="ws://127.0.0.1:8787"></label></div>',
      '<div class="mp-row"><button id="mp-connect" class="mp-mini">连接服务器</button>',
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
    document.getElementById("mp-p2p-host").onclick = function () {
      S.name = document.getElementById("mp-name").value.trim().slice(0, 24) || S.name;
      saveSettings();
      var cVal = document.getElementById("mp-p2p-code").value.trim();
      startP2PRoom(true, cVal);
      document.getElementById("mp-p2p-code").value = P2P.roomCode;
    };
    document.getElementById("mp-p2p-join").onclick = function () {
      S.name = document.getElementById("mp-name").value.trim().slice(0, 24) || S.name;
      saveSettings();
      var cVal = document.getElementById("mp-p2p-code").value.trim();
      if (!cVal) { toast("请输入好友的 4 位房间码", "mp-bad"); return; }
      startP2PRoom(false, cVal);
    };
    document.getElementById("mp-p2p-sdp").onclick = function () {
      var sbox = document.getElementById("mp-sdp-box");
      if (sbox) sbox.classList.toggle("mp-hide");
    };
    document.getElementById("mp-sdp-gen").onclick = function () {
      if (!P2P.active) startP2PRoom(true, document.getElementById("mp-p2p-code").value.trim());
      toast("正在生成端到端 WebRTC 直连码…", "mp-wait");
      createManualWebRTCOffer(function (code) {
        var ta = document.getElementById("mp-sdp-text");
        if (ta) ta.value = code;
        try { navigator.clipboard.writeText(code); toast("端到端直连码已生成并复制！发给好友粘贴即可", "mp-ok"); }
        catch (e) { toast("直连码已生成，请全选复制发给好友", "mp-ok"); }
      });
    };
    document.getElementById("mp-sdp-apply").onclick = function () {
      var ta = document.getElementById("mp-sdp-text");
      if (!ta || !ta.value.trim()) { toast("请先粘贴好友发来的直连码", "mp-bad"); return; }
      acceptManualWebRTCCode(ta.value.trim(), function (ansCode) {
        ta.value = ansCode;
        try { navigator.clipboard.writeText(ansCode); toast("已生成应答码并复制！发回给房主即可完成直连", "mp-ok"); }
        catch (e) { toast("应答码已生成，请复制发回给房主", "mp-ok"); }
      });
    };
    document.getElementById("mp-connect").onclick = function () {
      P2P.active = false;
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
        if (document.getElementById("divmap") && !document.getElementById("mp-native-journal-section")) {
          renderJournalEntries();
        }
        var relDisp = document.getElementById("relation-display");
        if (relDisp && !relDisp.querySelector(".mp-native-relation-box")) {
          renderSocialRelations();
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
    installCustomIconMacros();
    syncCompanionToVariables();
    S.myVotedIndex = -1;
    S.currentVotes = [];

    var curPasNow = (window.State && State.passage) || "";
    var vNow = V();

    // 若玩家正在离线伴侣页面，而同一个玩家恰巧上线进入房间，无缝切换为实时在线玩家互动界面
    if ((curPasNow === "MP Companion Hub" || curPasNow === "MP Companion Room") && findOnlineCompanionPeer()) {
      var livePeer = findOnlineCompanionPeer();
      S.interactTarget = livePeer;
      if (vNow) {
        vNow.mpInteractTargetId = livePeer.id;
        vNow.mpInteractTargetName = livePeer.name || "同伴";
      }
      setTimeout(function () {
        openNativeInteract(livePeer);
      }, 20);
    }

    // 严格记录新手教程首次出门遭遇战状态：仅在真正进入 Tutorial 通道且从未拿过防狼喷雾时标记一次
    if (vNow) {
      if ((Number(vNow.spraymax) || 0) >= 1 || curPasNow === "Tutorial Flirt" || curPasNow === "Tutorial Thank") {
        vNow.mpTutorialSprayClaimed = 1;
        if (!vNow.mpUniqueRewards) vNow.mpUniqueRewards = {};
        vNow.mpUniqueRewards["tutorial_first_spray"] = 1;
        delete vNow.mpWasTutorial;
      } else if (curPasNow === "Tutorial" && !vNow.mpTutorialSprayClaimed && canClaimUniqueReward("tutorial_first_spray")) {
        vNow.mpWasTutorial = 1;
        if (!vNow.tutorialExit) vNow.tutorialExit = "Domus Street";
      } else if (curPasNow !== MP_COMBAT_PASSAGE && curPasNow !== "MP Native Combat Finish" && curPasNow !== "MP Native Combat Aftermath") {
        delete vNow.mpWasTutorial;
      }
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

    var isSafePas = isSafePassage(curPasNow);
    var isEventPas = !!curPasNow && !isSafePas &&
      curPasNow !== MP_COMBAT_PASSAGE && curPasNow !== "MP Native Combat Finish" && curPasNow !== "MP Native Combat Aftermath" &&
      curPasNow !== "Start" && curPasNow !== "Start2" && curPasNow !== "Orphanage Intro" &&
      curPasNow.indexOf("MP ") !== 0;
    var reportKey = curPasNow + "#" + (vNow && vNow.phase !== undefined ? vNow.phase : "");
    if (isEventPas && !replayedAfterMp && S.connected && S.room && S.syncMode && S._syncJumpPassage !== curPasNow) {
      if (S._lastEventReport !== reportKey) {
        S._lastEventReport = reportKey;
        send({
          t: "event_trigger",
          passage: curPasNow,
          eventKey: currentEventKey(),
          prng: S.prng,
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

    var isHumanEncounter = !vNow.enemytype || vNow.enemytype === "man";
    var isSingleEnemy = !vNow.enemynomax || vNow.enemynomax <= 1;
    if (nowInCombat && isHumanEncounter && isSingleEnemy && curPasNow !== "Tutorial" && !replayedAfterMp && !S._lastInCombat && S.connected && S.room && !S.combatId && curPasNow !== MP_COMBAT_PASSAGE) {
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
    S.currentVotes = [];
    S.myVotedIndex = -1;
    clearLinkProposalBox();
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
    installCustomIconMacros();
    syncCompanionToVariables();
    connect();
    onPassageDisplay();
    var _mpLastInjectHour = (window.Time && Number.isFinite(Time.hour)) ? Time.hour : null;
    setInterval(function () {
      if (!S.syncMode && S.clock.running && window.Time && typeof Time.pass === "function") {
        var v = V();
        if (v && v.combat !== 1) {
          Time.pass(60 * (S.clock.speed || 1));
          refreshSidebar();
        }
      }
      // 时钟跨小时时刷新注入区（NPC 行、任务入口），并在 NPC Hub 上重渲染以切换在场/不在场分支。
      try {
        var _hNow = (window.Time && Number.isFinite(Time.hour)) ? Time.hour : null;
        if (_hNow !== null && _hNow !== _mpLastInjectHour) {
          _mpLastInjectHour = _hNow;
          injectInlinePassageSections();
          var _pasNow = (window.State && State.passage) || "";
          var _vNow = V();
          if (/^MP NPC .+ Hub$/.test(_pasNow) && _vNow && _vNow.combat !== 1) enginePlay(_pasNow);
        }
      } catch (e) {}
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
  S.canClaimUniqueReward = canClaimUniqueReward;
  S.claimUniqueReward = claimUniqueReward;
  S.takeVirginityByPlayer = takeVirginityByPlayer;
  S.syncCompanionToVariables = syncCompanionToVariables;
  S.findOnlineCompanionPeer = findOnlineCompanionPeer;
  S.renderSocialRelations = renderSocialRelations;
  S.renderJournalEntries = renderJournalEntries;
  S.onEventPicked = onEventPicked;
  S.installEventPoolHook = installEventPoolHook;
  window.dolmp = S;
  setTimeout(function () { try { installEventPoolHook(); installPersonNameHook();
    installCustomIconMacros(); } catch (e) {} }, 0);
})();